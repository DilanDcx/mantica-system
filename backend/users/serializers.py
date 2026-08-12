from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone
from datetime import timedelta
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Autenticación mediante Código Único (username) y contraseña
        username = attrs.get("username")
        password = attrs.get("password")

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError({"detail": "Credenciales inválidas."})

        # 1. Validar Soft-Delete
        if not user.is_active:
            raise serializers.ValidationError({"detail": "Esta cuenta ha sido desactivada del sistema."})

        # 2. Validar Bloqueo Temporal (15 minutos)
        if user.lockout_until and timezone.now() < user.lockout_until:
            tiempo_restante = (user.lockout_until - timezone.now()).seconds // 60
            raise serializers.ValidationError({"detail": f"Cuenta bloqueada. Intente nuevamente en {tiempo_restante} minutos."})

        # 3. Validar Contraseña e Intentos Fallidos (3 intentos máximo)
        if not user.check_password(password):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 3:
                user.lockout_until = timezone.now() + timedelta(minutes=15)
                user.save()
                raise serializers.ValidationError({"detail": "Cuenta bloqueada por múltiples intentos fallidos. Intente en 15 minutos."})
            
            user.save()
            intentos_restantes = 3 - user.failed_login_attempts
            raise serializers.ValidationError({"detail": f"Credenciales inválidas. Le quedan {intentos_restantes} intentos."})

        # 4. Limpiar contadores en caso de éxito
        user.failed_login_attempts = 0
        user.lockout_until = None
        user.save()

        # 5. Generar los tokens JWT
        data = super().validate(attrs)

        # 6. Incluir perfil y rol para el Frontend
        data['user'] = {
            'id': user.id,
            'code': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role.name if user.role else None
        }

        return data