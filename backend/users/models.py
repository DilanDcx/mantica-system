from django.db import models

class ActiveManager(models.Manager):
    """
    Manager personalizado que filtra automáticamente 
    solo los registros que no han sido borrados lógicamente.
    """
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

class BaseModel(models.Model):
    """
    Ninguna tabla se creará en la BD para este modelo,
    pero todos los demás modelos heredarán estos campos y comportamientos.
    """
    created_at = models.DateTimeField(auto_now_add=True, help_text="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, help_text="Última modificación")
    is_active = models.BooleanField(default=True, help_text="Estado de borrado lógico")

    # Managers
    objects = models.Manager()       
    active_objects = ActiveManager()   

    class Meta:
        abstract = True

    def soft_delete(self):
        """
        Método estándar para ejecutar el borrado lógico.
        """
        self.is_active = False
        self.save()
        
    def restore(self):
        """
        Método estándar para revertir el borrado lógico.
        """
        self.is_active = True
        self.save()

from django.contrib.auth.models import AbstractUser

class Role(BaseModel):
    """
    Modelo de Roles para RBAC (Administrador, Médico, Recepcionista).
    Hereda de BaseModel para soportar soft-delete si se inactiva un rol.
    """
    ADMIN = 'ADMIN'
    DOCTOR = 'DOCTOR'
    RECEPTIONIST = 'RECEPTIONIST'
    
    ROLE_CHOICES = [
        (ADMIN, 'Administrador'),
        (DOCTOR, 'Médico'),
        (RECEPTIONIST, 'Recepcionista'),
    ]
    
    name = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True)
    description = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.get_name_display()


class User(AbstractUser, BaseModel):
    """
    Modelo de Usuario Personalizado.
    Extiende de AbstractUser de Django y hereda BaseModel para auditoría y borrado lógico.
    """
    email = models.EmailField(unique=True, verbose_name="Correo Electrónico")
    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, blank=True, related_name="users")
    failed_login_attempts = models.PositiveIntegerField(default=0, help_text="Contador de intentos fallidos de inicio de sesión")
    lockout_until = models.DateTimeField(null=True, blank=True, help_text="Bloqueo temporal de cuenta")

    # Usaremos el email como identificador principal para el Login si es necesario, o el username por defecto
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return f"{self.username} ({self.role.name if self.role else 'Sin Rol'})"