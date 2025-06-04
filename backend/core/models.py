from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


# Constituency model
class Constituency(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


# School model
class School(models.Model):
    name = models.CharField(max_length=100)
    location = models.ForeignKey(Constituency, on_delete=models.SET_NULL, null=True)
    courses = models.ManyToManyField('Course', related_name='schools')  # Many-to-many with courses

    def __str__(self):
        return self.name


# Course model
class Course(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


# ExamData model
class ExamData(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)

    grade1_students = models.IntegerField(default=0)
    grade2_students = models.IntegerField(default=0)
    grade3_students = models.IntegerField(default=0)

    number_of_assessors = models.IntegerField()

    # Exam duration and availability
    grade1_days = models.IntegerField(default=0)
    grade2_days = models.IntegerField(default=0)
    grade3_days = models.IntegerField(default=0)
    total_days_needed = models.IntegerField(default=0)
    total_days_available = models.IntegerField(default=0)

    status = models.CharField(max_length=50, default="pending")

    grade1_students_day1 = models.IntegerField(default=0)
    grade2_students_day1 = models.IntegerField(default=0)
    grade3_students_day1 = models.IntegerField(default=0)

    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Ensure the school has this course linked
        self.school.courses.add(self.course)

        total_students = self.grade1_students + self.grade2_students + self.grade3_students

        if total_students < 4:
            self.status = "pending"
        else:
            self.status = "Sufficient"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.school.name} - {self.course.name}"


# Transfer model for handling student transfers
class Transfer(models.Model):
    from_school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='transfers_out')
    to_school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='transfers_in')
    course = models.ForeignKey(Course, on_delete=models.CASCADE)

    grade1_students_transferred = models.IntegerField(default=0)
    grade2_students_transferred = models.IntegerField(default=0)
    grade3_students_transferred = models.IntegerField(default=0)

    timestamp = models.DateField(auto_now_add=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Transfer of {self.course.name} from {self.from_school.name} to {self.to_school.name} on {self.timestamp}"


# Custom user manager
class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("The Username must be set")
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, password, **extra_fields)


# Custom user model
class CustomUser(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'

    def __str__(self):
        return self.username
