from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsAdmissionUserRole, IsAdminUserRole, IsDoctorUserRole
from .models import Patient
from .serializers import PatientSerializer


class PatientViewSet(viewsets.ModelViewSet):
    """
    CRUD de Pacientes con apertura automática de expediente.
    Permitido para Personal de Admisión, Médicos y Administrador de TI.
    """
    queryset = Patient.objects.select_related('medical_record').filter(is_active=True).order_by('-created_at')
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]  # Ajustar a permisos RBAC pertinentes