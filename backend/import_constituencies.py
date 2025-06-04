# import_constituencies.py

import os
import django
import csv

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')  # <-- change to your project name
django.setup()

from core.models import Constituency

with open('core/constituencies.csv', newline='', encoding='utf-8') as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        name = row[0].strip()
        if name:
            obj, created = Constituency.objects.get_or_create(name=name)
            if created:
                print(f"Added: {name}")
            else:
                print(f"Skipped: {name}")
