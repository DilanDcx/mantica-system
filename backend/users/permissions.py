from rest_framework.permissions import BasePermission
from .models import Role


class IsAdminUserRole(BasePermission):
    """
    Permite acceso exclusivo al Administrador de TI (ADMIN).
    Utilizado para gestión de usuarios, auditoría y configuraciones.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role and 
            request.user.role.name == Role.ADMIN
        )


class IsDoctorUserRole(BasePermission):
    """
    Permite acceso exclusivo al Personal Médico (DOCTOR).
    Utilizado para consultas, atenciones y diagnósticos clínicos.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role and 
            request.user.role.name == Role.DOCTOR
        )


class IsAdmissionUserRole(BasePermission):
    """
    Permite acceso exclusivo al Personal de Admisión (ADMISSION).
    Utilizado para registro demográfico de pacientes y control de citas.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role and 
            request.user.role.name == Role.ADMISSION
        )


class IsDirectorUserRole(BasePermission):
    """
    Permite acceso exclusivo a la Dirección del Centro (DIRECTOR).
    Utilizado para dashboards estadísticos y reportes oficiales.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role and 
            request.user.role.name == Role.DIRECTOR
        )


class IsDirectorOrAdmin(BasePermission):
    """
    Permite acceso conjunto a Dirección y Administrador de TI.
    Útil para reportes generales o métricas del sistema.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role and 
            request.user.role.name in [Role.ADMIN, Role.DIRECTOR]
        )