from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import ExamData, School, Course, Constituency,Transfer
from .serializers import ExamDataSerializer, SchoolSerializer, CourseSerializer, ConstituencySerializer, TransferSerializer
from .utils import calculate_allocation, auto_transfer_students, generate_daily_allocation_dynamic, reverse_transfer
from .serializers import UserSignupSerializer
from django.db.models import Sum
from django.http import JsonResponse


@api_view(['POST'])
def user_signup_view(request):
    serializer = UserSignupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User created successfully."}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def allocation_summary(request):
    if request.method == 'GET':
        records = ExamData.objects.all()
        report = []

        for record in records:
            data = calculate_allocation(
                record.grade1_students,
                record.grade2_students,
                record.grade3_students,
            )

            report.append({
                "school": record.school.name,
                "course": record.course.name,
                "grade1_students_day1": data["grade1_students_day1"],
                "grade1_total_students": record.grade1_students,
                "grade2_students_day1": data["grade2_students_day1"],
                "grade2_total_students": record.grade2_students,
                "grade3_students_day1": data["grade3_students_day1"],
                "grade3_total_students": record.grade3_students,
                "grade1_days": data["grade1_days"],
                "grade2_days": data["grade2_days"],
                "grade3_days": data["grade3_days"],
                "total_students": record.grade1_students + record.grade2_students + record.grade3_students,
                "total_days_needed": data["total_days_needed"],
                "total_days_available": data["total_days_available"],
                "status": data["status"],
                "note": data.get("note", "")
            })

        return Response(report)

    elif request.method == 'POST':
        data = request.data.copy()

        if isinstance(data.get('school_id'), list):
            data['school_id'] = data['school_id'][0]

        if isinstance(data.get('course_id'), list):
            data['course_id'] = data['course_id'][0]

        serializer = ExamDataSerializer(data=data)

        if serializer.is_valid():
            calculated = calculate_allocation(
                int(data.get("grade1_students", 0)),
                int(data.get("grade2_students", 0)),
                int(data.get("grade3_students", 0)),
            )
            serializer.save(
                number_of_assessors=calculated["estimated_assessors"],
                grade1_days=calculated["grade1_days"],
                grade2_days=calculated["grade2_days"],
                grade3_days=calculated["grade3_days"],
                total_days_needed=calculated["total_days_needed"],
                total_days_available=calculated["total_days_available"],
                status=calculated["status"],
                grade1_students_day1=calculated["grade1_students_day1"],
                grade2_students_day1=calculated["grade2_students_day1"],
                grade3_students_day1=calculated["grade3_students_day1"],
                note=calculated["note"],
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
def schools_view(request):
    if request.method == 'GET':
        schools = School.objects.all()
        serializer = SchoolSerializer(schools, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = SchoolSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
def courses_view(request):
    if request.method == 'GET':
        courses = Course.objects.all()
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def constituencies_view(request):
    constituencies = Constituency.objects.all()
    serializer = ConstituencySerializer(constituencies, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def schools_with_courses_view(request):
    """
    Returns schools and the courses they offer.
    """
    schools = School.objects.prefetch_related('courses').all()
    result = []

    for school in schools:
        courses = school.courses.all()
        result.append({
            'id': school.id,
            'name': school.name,
            'location': school.location,
            'courses': [{'id': course.id, 'name': course.name} for course in courses]
        })

    return Response(result)

@api_view(['POST'])
def run_auto_transfer_view(request):
    result = auto_transfer_students()

    return Response({
        "message": "Auto transfer completed.",
        "total_exam_entries_checked": result["total_records_checked"],
        "transfers_done": result["transfers_done"]
    }, status=status.HTTP_200_OK)
@api_view(['GET', 'POST'])
def transfers_view(request):
    if request.method == 'GET':
        transfers = Transfer.objects.all()
        serializer = TransferSerializer(transfers, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data
        try:
            from_school_id = data.get('from_school_id')
            to_school_id = data.get('to_school_id')
            course_id = data.get('course_id')
            grade1 = int(data.get('grade1', 0))
            grade2 = int(data.get('grade2', 0))
            grade3 = int(data.get('grade3', 0))
            note = data.get('note', '')

            # Prevent transferring to self
            if from_school_id == to_school_id:
                return Response(
                    {'error': 'A school cannot transfer students to itself.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Fetch or raise error if exam data doesn't exist
            try:
                from_exam_data = ExamData.objects.get(school_id=from_school_id, course_id=course_id)
                to_exam_data, _ = ExamData.objects.get_or_create(school_id=to_school_id, course_id=course_id)
            except ExamData.DoesNotExist:
                return Response({'error': 'Exam data not found for one of the schools.'}, status=status.HTTP_400_BAD_REQUEST)

            # Check if from_school has enough students to transfer
            if (from_exam_data.grade1_students < grade1 or
                from_exam_data.grade2_students < grade2 or
                from_exam_data.grade3_students < grade3):
                return Response({'error': 'Not enough students to transfer from the source school.'}, status=status.HTTP_400_BAD_REQUEST)

            # Update exam data: subtract from source
            from_exam_data.grade1_students -= grade1
            from_exam_data.grade2_students -= grade2
            from_exam_data.grade3_students -= grade3
            from_exam_data.save()

            # Update exam data: add to destination
            to_exam_data.grade1_students += grade1
            to_exam_data.grade2_students += grade2
            to_exam_data.grade3_students += grade3
            to_exam_data.save()

            # Save transfer record
            transfer = Transfer.objects.create(
                from_school_id=from_school_id,
                to_school_id=to_school_id,
                course_id=course_id,
                grade1_students_transferred=grade1,
                grade2_students_transferred=grade2,
                grade3_students_transferred=grade3,
                note=note
            )
            serializer = TransferSerializer(transfer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

@api_view(['DELETE'])
def delete_school_view(request, school_id):
    try:
        school = School.objects.get(id=school_id)
        school.delete()
        return Response({"message": "School deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    except School.DoesNotExist:
        return Response({"error": "School not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def daily_allocation_view(request):
    try:
        school_id = request.query_params.get('school')
        course_id = request.query_params.get('course')

        if not school_id or not course_id:
            return Response({"error": "Missing 'school' or 'course' parameter."}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch the exam data for the selected school and course
        try:
            record = ExamData.objects.get(school_id=school_id, course_id=course_id)
        except ExamData.DoesNotExist:
            return Response({"error": "No exam data found for the given school and course."}, status=status.HTTP_404_NOT_FOUND)

        grade1_total = record.grade1_students
        grade2_total = record.grade2_students
        grade3_total = record.grade3_students
        assessors = record.number_of_assessors if record.number_of_assessors else 1  # default to 1 if not set

        print(f"Inputs received for allocation: Grade1={grade1_total}, Grade2={grade2_total}, Grade3={grade3_total}, Assessors={assessors}")

        result = generate_daily_allocation_dynamic(
            grade1_total,
            grade2_total,
            grade3_total,
            assessors
        )

        return Response(result, status=status.HTTP_200_OK)

    except (ValueError, TypeError) as e:
        return Response(
            {"error": f"Invalid parameters: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
@api_view(['GET'])
def dashboard_stats(request):
    total_schools = School.objects.count()

    courses_data = []

    courses = Course.objects.all()

    for course in courses:
        # Count schools offering this course - assuming 'schools' is a related_name for ManyToMany or ForeignKey in Course or School model
        school_count = course.schools.count() if hasattr(course, 'schools') else 0

        # Get all exam data for this course
        examdata = ExamData.objects.filter(course=course)

        # Sum students by grade
        grade1 = examdata.aggregate(total=Sum('grade1_students'))['total'] or 0
        grade2 = examdata.aggregate(total=Sum('grade2_students'))['total'] or 0
        grade3 = examdata.aggregate(total=Sum('grade3_students'))['total'] or 0

        total_students = grade1 + grade2 + grade3

        courses_data.append({
            "name": course.name,
            "schoolCount": school_count,
            "totalStudents": total_students,
            "grade1": grade1,
            "grade2": grade2,
            "grade3": grade3,
        })

    return Response({
        "totalSchools": total_schools,
        "courses": courses_data
    })

@api_view(['POST'])
def bulk_allocation_upload_view(request):
    """
    Accepts a list of exam data entries and performs allocation calculation for each.
    """
    entries = request.data  # expecting a list of dicts

    if not isinstance(entries, list):
        return Response({"error": "Data must be a list of exam entries."}, status=status.HTTP_400_BAD_REQUEST)

    created_records = []
    errors = []

    for idx, entry in enumerate(entries):
        try:
            # Handle cases where frontend might send school_id/course_id as a list
            if isinstance(entry.get('school_id'), list):
                entry['school_id'] = entry['school_id'][0]

            if isinstance(entry.get('course_id'), list):
                entry['course_id'] = entry['course_id'][0]

            # Prepare and validate the serializer
            serializer = ExamDataSerializer(data=entry)

            if serializer.is_valid():
                # Run allocation calculation
                calculated = calculate_allocation(
                    int(entry.get("grade1_students", 0)),
                    int(entry.get("grade2_students", 0)),
                    int(entry.get("grade3_students", 0)),
                )

                # Save with calculated fields
                exam_data = serializer.save(
                    number_of_assessors=calculated["estimated_assessors"],
                    grade1_days=calculated["grade1_days"],
                    grade2_days=calculated["grade2_days"],
                    grade3_days=calculated["grade3_days"],
                    total_days_needed=calculated["total_days_needed"],
                    total_days_available=calculated["total_days_available"],
                    status=calculated["status"],
                    grade1_students_day1=calculated["grade1_students_day1"],
                    grade2_students_day1=calculated["grade2_students_day1"],
                    grade3_students_day1=calculated["grade3_students_day1"],
                    note=calculated.get("note", "")
                )

                created_records.append(ExamDataSerializer(exam_data).data)

            else:
                errors.append({
                    "index": idx,
                    "errors": serializer.errors
                })

        except Exception as e:
            errors.append({
                "index": idx,
                "error": str(e)
            })

    return Response({
        "message": f"{len(created_records)} records created successfully.",
        "created": created_records,
        "errors": errors
    }, status=status.HTTP_201_CREATED if created_records else status.HTTP_400_BAD_REQUEST)

# views.py

@api_view(['POST'])
def reverse_transfer_view(request, transfer_id):
    result = reverse_transfer(transfer_id)
    return JsonResponse(result)
