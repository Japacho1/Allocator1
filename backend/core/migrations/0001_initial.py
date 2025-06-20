# Generated by Django 5.2.1 on 2025-06-03 18:00

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Constituency',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='CustomUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(max_length=150, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='School',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('courses', models.ManyToManyField(related_name='schools', to='core.course')),
                ('location', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.constituency')),
            ],
        ),
        migrations.CreateModel(
            name='ExamData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('grade1_students', models.IntegerField(default=0)),
                ('grade2_students', models.IntegerField(default=0)),
                ('grade3_students', models.IntegerField(default=0)),
                ('number_of_assessors', models.IntegerField()),
                ('grade1_days', models.IntegerField(default=0)),
                ('grade2_days', models.IntegerField(default=0)),
                ('grade3_days', models.IntegerField(default=0)),
                ('total_days_needed', models.IntegerField(default=0)),
                ('total_days_available', models.IntegerField(default=0)),
                ('status', models.CharField(default='pending', max_length=50)),
                ('grade1_students_day1', models.IntegerField(default=0)),
                ('grade2_students_day1', models.IntegerField(default=0)),
                ('grade3_students_day1', models.IntegerField(default=0)),
                ('note', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.course')),
                ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.school')),
            ],
        ),
        migrations.CreateModel(
            name='Transfer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('grade1_students_transferred', models.IntegerField(default=0)),
                ('grade2_students_transferred', models.IntegerField(default=0)),
                ('grade3_students_transferred', models.IntegerField(default=0)),
                ('timestamp', models.DateField(auto_now_add=True)),
                ('note', models.TextField(blank=True, null=True)),
                ('course', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.course')),
                ('from_school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transfers_out', to='core.school')),
                ('to_school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transfers_in', to='core.school')),
            ],
        ),
    ]
