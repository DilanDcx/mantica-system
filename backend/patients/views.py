from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.contrib.auth import get_user_model
from .models import Consultation
from .models import Patient, MedicalRecord, Consultation
from .serializers import (
    PatientSerializer,
    MedicalRecordDetailSerializer,
    ConsultationSerializer,
    ClinicalAuditLogSerializer,
)
from users.permissions import IsAdminUserRole
from .models import ClinicalAuditLog

from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError


User = get_user_model()

class HomeDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Total de consultas médicas registradas
        total_consultations = Consultation.objects.count()

        # 2. Personal habilitado/activo en el sistema
        active_staff_count = User.objects.filter(is_active=True).count()

        # 3. Citas pendientes (placeholder mientras se crea el módulo)
        pending_appointments = 0

        return Response({
            'consultations_count': total_consultations,
            'active_staff_count': active_staff_count,
            'pending_appointments': pending_appointments,
        })
        
        
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
    queryset = Consultation.objects.filter(is_active=True).select_related('medical_record', 'doctor')
    serializer_class = ConsultationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Asignar automáticamente el médico autenticado si está disponible
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(doctor=user)

    def perform_update(self, serializer):
        serializer.instance._audit_actor = self.request.user
        serializer.save()

    def perform_destroy(self, instance):
        instance._audit_actor = self.request.user
        instance.is_active = False
        instance.save(update_fields=['is_active', 'updated_at'])

class ClinicalAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ClinicalAuditLog.objects.all()
    serializer_class = ClinicalAuditLogSerializer
    permission_classes = [IsAdminUserRole]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['record_number', 'performed_by', 'action']
    ordering_fields = ['timestamp', 'record_number', 'action']
    ordering = ['-timestamp']

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        fecha_desde_texto = params.get('fecha_desde')
        fecha_hasta_texto = params.get('fecha_hasta')
        usuario = params.get('usuario')
        modulo = params.get('modulo')

        fecha_desde = parse_date(fecha_desde_texto) if fecha_desde_texto else None
        fecha_hasta = parse_date(fecha_hasta_texto) if fecha_hasta_texto else None

        if fecha_desde_texto and fecha_desde is None:
            raise ValidationError({
                'fecha_desde': 'Usa el formato AAAA-MM-DD.'
            })

        if fecha_hasta_texto and fecha_hasta is None:
            raise ValidationError({
                'fecha_hasta': 'Usa el formato AAAA-MM-DD.'
            })

        if fecha_desde and fecha_hasta and fecha_hasta < fecha_desde:
            raise ValidationError({
                'fecha_hasta': 'Debe ser igual o posterior a fecha_desde.'
            })

        if fecha_desde:
            queryset = queryset.filter(timestamp__date__gte=fecha_desde)

        if fecha_hasta:
            queryset = queryset.filter(timestamp__date__lte=fecha_hasta)

        if usuario:
            queryset = queryset.filter(performed_by__icontains=usuario.strip())

        if modulo and modulo.strip().lower() != 'consultas':
            return queryset.none()

        return queryset