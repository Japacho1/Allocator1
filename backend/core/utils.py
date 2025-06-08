import math
from django.db import transaction
from .models import ExamData, Transfer, School
from math import ceil
from collections import defaultdict


def calculate_allocation(grade1_students, grade2_students, grade3_students):
    # Constants
    min_students_per_day = 4
    max_students_per_day = 6
    days_per_assessor = 12

    def estimate_assessor_days(g1, g2, g3):
        g1_rounds = math.ceil(g1 / max_students_per_day)
        g2_rounds = math.ceil(g2 / max_students_per_day)
        g3_rounds = math.ceil(g3 / max_students_per_day)
        return (g1_rounds * 3) + (g2_rounds * 2) + (g3_rounds * 1)

    def day_one_allocation(g1, g2, g3, assessors):
        capacity = assessors * max_students_per_day
        allocation = {"Grade 1": 0, "Grade 2": 0, "Grade 3": 0}

        # Allocate Grade 1 first
        g1_to_allocate = min(g1, capacity)
        allocation["Grade 1"] = g1_to_allocate
        capacity -= g1_to_allocate

        # Then Grade 2
        g2_to_allocate = min(g2, capacity)
        allocation["Grade 2"] = g2_to_allocate
        capacity -= g2_to_allocate

        # Then Grade 3
        g3_to_allocate = min(g3, capacity)
        allocation["Grade 3"] = g3_to_allocate

        return allocation

    def allocate(g1, g2, g3, assessors):
        total_days_available = assessors * days_per_assessor
        day1_alloc = day_one_allocation(g1, g2, g3, assessors)

        remaining_g1 = g1 - day1_alloc["Grade 1"]
        remaining_g2 = g2 - day1_alloc["Grade 2"]
        remaining_g3 = g3 - day1_alloc["Grade 3"]

        grade1_days = ceil(day1_alloc["Grade 1"] / max_students_per_day) * 3
        grade2_days = ceil(day1_alloc["Grade 2"] / max_students_per_day) * 2
        grade3_days = ceil(day1_alloc["Grade 3"] / max_students_per_day) * 1

        used_assessor_days = grade1_days + grade2_days + grade3_days
        day = 2
        active_assessors = assessors

        while remaining_g1 > 0 or remaining_g2 > 0 or remaining_g3 > 0:
            day_capacity = active_assessors * max_students_per_day

            today_g1 = min(remaining_g1, day_capacity)
            g1_assessors = ceil(today_g1 / max_students_per_day)
            remaining_g1 -= today_g1
            grade1_days += g1_assessors * 3
            day_capacity -= today_g1

            today_g2 = min(remaining_g2, day_capacity)
            g2_assessors = ceil(today_g2 / max_students_per_day)
            remaining_g2 -= today_g2
            grade2_days += g2_assessors * 2
            day_capacity -= today_g2

            today_g3 = min(remaining_g3, day_capacity)
            g3_assessors = ceil(today_g3 / max_students_per_day)
            remaining_g3 -= today_g3
            grade3_days += g3_assessors * 1

            used_today = g1_assessors * 3 + g2_assessors * 2 + g3_assessors * 1
            used_assessor_days += used_today

            total_remaining_students = remaining_g1 + remaining_g2 + remaining_g3
            active_assessors = max(1, min(assessors, ceil(total_remaining_students / max_students_per_day)))

            day += 1

        total_days_needed = grade1_days + grade2_days + grade3_days
        status = "Sufficient" if used_assessor_days <= total_days_available else "Insufficient"

        return {
            "estimated_assessors": assessors,
            "grade1_days": grade1_days,
            "grade2_days": grade2_days,
            "grade3_days": grade3_days,
            "total_days_needed": total_days_needed,
            "total_days_available": total_days_available,
            "status": status,
            "grade1_students_day1": day1_alloc["Grade 1"],
            "grade2_students_day1": day1_alloc["Grade 2"],
            "grade3_students_day1": day1_alloc["Grade 3"],
            "note": (
                f"Each assessor can handle {min_students_per_day}-{max_students_per_day} students per day. "
                f"Day 1 prioritizes Grade 1, then Grade 2, then Grade 3."
            )
        }

    total_days_needed = estimate_assessor_days(grade1_students, grade2_students, grade3_students)
    assessors = ceil(total_days_needed / days_per_assessor)

    result = allocate(grade1_students, grade2_students, grade3_students, assessors)
    while result["status"] == "Insufficient":
        assessors += 1
        result = allocate(grade1_students, grade2_students, grade3_students, assessors)

    return result
from collections import defaultdict
from math import ceil

def generate_daily_allocation_dynamic(grade1_total, grade2_total, grade3_total, assessors):
    max_students_per_day = 6
    total_days = 12

    durations = {'grade1': 3, 'grade2': 2, 'grade3': 1}
    remaining = {'grade1': grade1_total, 'grade2': grade2_total, 'grade3': grade3_total}

    day_slots = defaultdict(int)  # students allocated per day slot
    ongoing_students_per_day = defaultdict(int)  # total students occupying each day (new + ongoing)
    allocations = []

    def can_allocate(day, students, duration):
        for d in range(day, day + duration):
            if d > total_days:
                return False
            # Check if adding these students exceeds assessor capacity on any day of the exam
            if day_slots[d] + students > assessors * max_students_per_day:
                return False
        return True

    def reserve(day, students, duration):
        for d in range(day, day + duration):
            day_slots[d] += students
            ongoing_students_per_day[d] += students

    day = 1
    while day <= total_days and sum(remaining.values()) > 0:
        today = {'day': day, 'grade1': 0, 'grade2': 0, 'grade3': 0}

        # Priority order: Grade 1, then Grade 2, then Grade 3
        for grade in ['grade1', 'grade2', 'grade3']:
            duration = durations[grade]
            while remaining[grade] > 0:
                allocated = False
                # Try largest batch possible down to 1
                for batch_size in range(min(max_students_per_day, remaining[grade]), 0, -1):
                    if can_allocate(day, batch_size, duration):
                        reserve(day, batch_size, duration)
                        today[grade] += batch_size
                        remaining[grade] -= batch_size
                        allocated = True
                        break
                if not allocated:
                    break  # Can't allocate more students of this grade on this day

        # Calculate total students occupying exams today (including ongoing ones)
        total_today = ongoing_students_per_day[day]
        today['assessors_needed'] = ceil(total_today / max_students_per_day) if total_today > 0 else 0
        allocations.append(today)
        day += 1

    # If any students are left unallocated after 12 days
    if sum(remaining.values()) > 0:
        allocations.append({
            'day': 'Not allocated',
            'grade1': remaining['grade1'],
            'grade2': remaining['grade2'],
            'grade3': remaining['grade3'],
            'assessors_needed': None,
            'note': 'Some students could not be allocated in 12 days.'
        })

    return allocations



@transaction.atomic
def auto_transfer_students():
    transfers_done = 0
    total_exam_entries = 0

    exam_entries = ExamData.objects.select_related('school', 'course', 'school__location').all()

    for exam in exam_entries:
        total_exam_entries += 1

        total_students = exam.grade1_students + exam.grade2_students + exam.grade3_students

        print(f"Checking Exam ID {exam.id} at school {exam.school.name}, total students: {total_students}, status: {exam.status}")

        # Transfer students only if total less than 4 and status not transferred
        if total_students < 4 and exam.status != "transferred":
            from_school = exam.school
            course = exam.course
            constituency = from_school.location

            # Find candidate schools in the same location offering the same course but exclude the current school
            available_schools = School.objects.filter(
                location=constituency,
                courses__id=course.id
            ).exclude(id=from_school.id)

            print(f"Found {available_schools.count()} available schools to transfer to in constituency {constituency.name}")

            for school in available_schools:
                print(f"✅ Candidate school: {school.name} | Courses: {[c.name for c in school.courses.all()]}")

            if available_schools.exists():
                to_school = available_schools.first()

                # Check if this transfer already exists before creating it
                existing_transfer = Transfer.objects.filter(
                    from_school=from_school,
                    to_school=to_school,
                    course=course
                ).exists()

                if not existing_transfer:
                    
                    # Increase students count in target school + course
                    to_exam, created = ExamData.objects.get_or_create(
                        school=to_school,
                        course=course,
                        defaults={
                            'grade1_students': 0,
                            'grade2_students': 0,
                            'grade3_students': 0,
                            'status': 'active'
                        }
                    )

                    to_exam.grade1_students += total_students if total_students == exam.grade1_students else exam.grade1_students
                    to_exam.grade2_students += exam.grade2_students
                    to_exam.grade3_students += exam.grade3_students
                    to_exam.save()

                    # Create Transfer record logging this move
                    Transfer.objects.create(
                        from_school=from_school,
                        to_school=to_school,
                        course=course,
                        grade1_students_transferred=exam.grade1_students,
                        grade2_students_transferred=exam.grade2_students,
                        grade3_students_transferred=exam.grade3_students,
                        note="Auto-transfer: insufficient students"
                    )


                    # Update ExamData: reduce students in source school
                    exam.grade1_students = 0
                    exam.grade2_students = 0
                    exam.grade3_students = 0
                    exam.status = "transferred"
                    exam.save()

                    transfers_done += 1

                    print(f"✅ Transfer done: {total_students} students from {from_school.name} to {to_school.name} for course {course.name}")
                else:
                    print(f"ℹ️ Transfer already exists from {from_school.name} to {to_school.name} for course {course.name}, skipping...")

            else:
                print(f"❌ No school found for transfer in constituency {constituency.name} for course {course.name}")

    print(f"\nSummary: Total exams checked: {total_exam_entries}")
    print(f"Total transfers made: {transfers_done}")

    return {
        "total_records_checked": total_exam_entries,
        "transfers_done": transfers_done
    }

from django.db import transaction
from django.utils import timezone
from .models import ExamData, Transfer
@transaction.atomic
def reverse_transfer(transfer_id):
    try:
        transfer = Transfer.objects.select_related('from_school', 'to_school', 'course').get(id=transfer_id)

        from_school = transfer.from_school
        to_school = transfer.to_school
        course = transfer.course

        # Get or create exam data records
        from_exam, _ = ExamData.objects.get_or_create(
            school=from_school,
            course=course,
            defaults={
                'grade1_students': 0,
                'grade2_students': 0,
                'grade3_students': 0,
                'status': 'active'
            }
        )

        to_exam = ExamData.objects.filter(school=to_school, course=course).first()

        if not to_exam:
            return {'error': 'No exam data found in target school for this course'}

        # Move students back
        from_exam.grade1_students += transfer.grade1_students_transferred
        from_exam.grade2_students += transfer.grade2_students_transferred
        from_exam.grade3_students += transfer.grade3_students_transferred
        from_exam.status = 'active'
        from_exam.save()

        to_exam.grade1_students -= transfer.grade1_students_transferred
        to_exam.grade2_students -= transfer.grade2_students_transferred
        to_exam.grade3_students -= transfer.grade3_students_transferred

        if to_exam.grade1_students + to_exam.grade2_students + to_exam.grade3_students == 0:
            to_exam.status = 'inactive'

        to_exam.save()

        # Create reverse transfer record
        Transfer.objects.create(
            from_school=to_school,
            to_school=from_school,
            course=course,
            grade1_students_transferred=transfer.grade1_students_transferred,
            grade2_students_transferred=transfer.grade2_students_transferred,
            grade3_students_transferred=transfer.grade3_students_transferred,
            note="Reverse-transfer: students returned to original school",
            timestamp=timezone.now()
        )

        # ✅ Delete the original transfer
        transfer.delete()

        return {'message': 'Reverse transfer successful'}

    except Transfer.DoesNotExist:
        return {'error': 'Transfer not found'}