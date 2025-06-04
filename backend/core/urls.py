from django.urls import path
from .views import (
    allocation_summary,
    schools_view,
    courses_view,
    constituencies_view,
    schools_with_courses_view,
    run_auto_transfer_view,
    transfers_view,
    delete_school_view,
    daily_allocation_view,
    bulk_allocation_upload # Import your delete view here
)
from .views import user_signup_view


urlpatterns = [
    path('allocation/', allocation_summary, name='allocation-summary'),
    path('schools/', schools_view, name='schools'),       
    path('courses/', courses_view, name='courses'),       
    path('constituencies/', constituencies_view, name='constituencies'),  
    path('schools-with-courses/', schools_with_courses_view, name='schools-with-courses'),
    path('auto-transfer/', run_auto_transfer_view, name='auto_transfer'),
    path('transfers/', transfers_view, name='transfers'),  # existing url
    path('schools/<int:school_id>/delete/', delete_school_view, name='delete-school'),  
    path('daily-allocation/', daily_allocation_view),
    path('allocation/bulk/', bulk_allocation_upload),
    path('signup/', user_signup_view, name='user-signup'),
   # new delete url
]
