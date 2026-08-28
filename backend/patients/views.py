from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Patient, MedicalRecord, Consultation
from .serializers import (
    PatientSerializer,
    MedicalRecordDetailSerializer,
    ConsultationSerializer
)

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().select_related('medical_record').order_by('-created_at')
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'identification_card', 'phone_number', 'medical_record__record_number']
    ordering_fields = ['first_name', 'last_name', 'identification_card', 'created_at', 'is_active']
    ordering = ['-created_at']

    @action(detail=True, methods=['patch'], url_path='toggle-status')
    def toggle_status(self, request, pk=None):
        patient = self.get_object()
        patient.is_active = not patient.is_active
        patient.save(update_fields=['is_active'])
        return Response(
            {'id': patient.id, 'is_active': patient.is_active, 'detail': 'Estado actualizado.'},
            status=status.HTTP_200_OK
        )


class MedicalRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MedicalRecord.objects.all().select_related('patient').prefetch_related('consultations__doctor')
    serializer_class = MedicalRecordDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['record_number', 'patient__first_name', 'patient__last_name', 'patient__identification_card']


class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.all().select_related('medical_record', 'doctor')
    serializer_class = ConsultationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Asignar automáticamente el médico autenticado si está disponible
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(doctor=user)