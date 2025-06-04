from rest_framework import serializers
from .models import School, Transfer, Course, ExamData, Constituency
from .models import CustomUser


# Constituency Serializer
class ConstituencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Constituency
        fields = '__all__'

# Course Serializer
class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

# Mini serializers (used for nested display in other serializers)
class SchoolMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['id', 'name']

class CourseMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name']

# Updated School Serializer
class SchoolSerializer(serializers.ModelSerializer):
    location = ConstituencySerializer(read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Constituency.objects.all(), source='location', write_only=True
    )
    courses_provided = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = ['id', 'name', 'location', 'location_id', 'courses_provided']

    def get_courses_provided(self, obj):
        courses = Course.objects.filter(examdata__school=obj).distinct()
        return CourseSerializer(courses, many=True).data

# ✅ Updated ExamData Serializer (with status and note)
class ExamDataSerializer(serializers.ModelSerializer):
    school = SchoolMiniSerializer(read_only=True)
    course = CourseMiniSerializer(read_only=True)
    school_id = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(), source='school', write_only=True
    )
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), source='course', write_only=True
    )
    number_of_assessors = serializers.IntegerField(read_only=True)

    class Meta:
        model = ExamData
        fields = [
            'id',
            'school',
            'course',
            'school_id',
            'course_id',
            'grade1_students',
            'grade2_students',
            'grade3_students',
            'number_of_assessors',
            'grade1_days',
            'grade2_days',
            'grade3_days',
            'total_days_needed',
            'total_days_available',
            'status',
            'note',
            'created_at'
        ]

# ✅ Transfer Serializer (to view transfers)
class TransferSerializer(serializers.ModelSerializer):
    from_school = SchoolMiniSerializer(read_only=True)
    to_school = SchoolMiniSerializer(read_only=True)
    course = CourseMiniSerializer(read_only=True)

    class Meta:
        model = Transfer
        fields = [
            'id',
            'from_school',
            'to_school',
            'course',
            'grade1_students_transferred',
            'grade2_students_transferred',
            'grade3_students_transferred',
            'note',
            'timestamp'
        ]

class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = CustomUser
        fields = ['username', 'password']

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user
