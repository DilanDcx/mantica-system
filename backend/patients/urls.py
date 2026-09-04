from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PatientViewSet, 
    MedicalRecordViewSet, 
    ConsultationViewSet, 
    HomeDashboardStatsView,
    MedicalAttachmentViewSet,
)

router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'medical-records', MedicalRecordViewSet, basename='medical-record')
router.register(r'consultations', ConsultationViewSet, basename='consultation')
router.register(r'attachments', MedicalAttachmentViewSet, basename='attachment')

urlpatterns = [
    path('dashboard-stats/', HomeDashboardStatsView.as_view(), name='home-dashboard-stats'),
    path('', include(router.urls)),
]