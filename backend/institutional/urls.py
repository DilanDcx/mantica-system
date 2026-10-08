from django.urls import path
from .views import InstitutionalConfigurationView


urlpatterns = [
    path('', InstitutionalConfigurationView.as_view(), name='institutional-configuration'),
]