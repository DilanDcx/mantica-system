from django.db import models
from django.contrib.auth.models import AbstractUser


class ActiveManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, help_text="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, help_text="Última modificación")
    is_active = models.BooleanField(default=True, help_text="Estado de borrado lógico")

    objects = models.Manager()       
    active_objects = ActiveManager()   

    class Meta:
        abstract = True

    def soft_delete(self):
        self.is_active = False
        self.save()
        
    def restore(self):
        self.is_active = True
        self.save()


class Role(BaseModel):
    ADMIN = 'ADMIN'
    DOCTOR = 'DOCTOR'
    ADMISSION = 'ADMISSION'
    DIRECTOR = 'DIRECTOR'
    
    ROLE_CHOICES = [
        (ADMIN, 'Administrador de TI'),
        (DOCTOR, 'Personal Médico'),
        (ADMISSION, 'Personal de Admisión'),
        (DIRECTOR, 'Dirección del Centro'),
    ]
    
    name = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True)
    description = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.get_name_display()


class User(AbstractUser, BaseModel):
    email = models.EmailField(unique=True, verbose_name="Correo Electrónico")
    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, blank=True, related_name="users")
    failed_login_attempts = models.PositiveIntegerField(default=0, help_text="Contador de intentos fallidos de inicio de sesión")
    lockout_until = models.DateTimeField(null=True, blank=True, help_text="Bloqueo temporal de cuenta")

    # 3 Preguntas y Respuestas de Seguridad para Recuperación
    security_question_1 = models.CharField(max_length=255, blank=True, null=True)
    security_answer_1 = models.CharField(max_length=255, blank=True, null=True)
    
    security_question_2 = models.CharField(max_length=255, blank=True, null=True)
    security_answer_2 = models.CharField(max_length=255, blank=True, null=True)
    
    security_question_3 = models.CharField(max_length=255, blank=True, null=True)
    security_answer_3 = models.CharField(max_length=255, blank=True, null=True)

    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return f"{self.username} ({self.role.name if self.role else 'Sin Rol'})"