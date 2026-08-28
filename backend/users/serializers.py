from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.password_validation import validate_password

from .models import User, Role


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
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

        # 3. Validar Contraseña e Intentos Fallidos (3 intentos)
        if not user.check_password(password):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 3:
                user.lockout_until = timezone.now() + timedelta(minutes=15)
                user.save()
                raise serializers.ValidationError({"detail": "Cuenta bloqueada por múltiples intentos fallidos. Intente en 15 minutos."})
            
            user.save()
            intentos_restantes = 3 - user.failed_login_attempts
            raise serializers.ValidationError({"detail": f"Credenciales inválidas. Le quedan {intentos_restantes} intentos."})

        # 4. Limpiar contadores
        user.failed_login_attempts = 0
        user.lockout_until = None
        user.save()

        data = super().validate(attrs)
        data['user'] = {
            'id': user.id,
            'code': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role.name if user.role else None,
            'role_display': user.role.get_name_display() if user.role else None
        }
        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = attrs['refresh']
        return attrs

    def save(self, **kwargs):
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except Exception:
            raise serializers.ValidationError({"detail": "Token inválido o ya expirado."})


class GetSecurityQuestionsSerializer(serializers.Serializer):
    """Obtiene las 3 preguntas de seguridad para el usuario dado."""
    username = serializers.CharField()

    def validate_username(self, value):
        user = User.objects.filter(username=value, is_active=True).first()
        if not user or not (user.security_question_1 and user.security_question_2 and user.security_question_3):
            raise serializers.ValidationError("Usuario no encontrado o no tiene preguntas de seguridad configuradas.")
        self.user = user
        return value


class ResetPasswordWithQuestionsSerializer(serializers.Serializer):
    """Valida las respuestas a las 3 preguntas y cambia la clave."""
    username = serializers.CharField()
    answer_1 = serializers.CharField()
    answer_2 = serializers.CharField()
    answer_3 = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        user = User.objects.filter(username=attrs['username'], is_active=True).first()
        if not user:
            raise serializers.ValidationError({"detail": "Usuario no encontrado."})

        # Comprobar respuestas (insensible a mayúsculas/minúsculas y espacios en blanco)
        ans1_ok = check_password(attrs['answer_1'].strip().lower(), user.security_answer_1)
        ans2_ok = check_password(attrs['answer_2'].strip().lower(), user.security_answer_2)
        ans3_ok = check_password(attrs['answer_3'].strip().lower(), user.security_answer_3)

        if not (ans1_ok and ans2_ok and ans3_ok):
            raise serializers.ValidationError({"detail": "Una o más respuestas de seguridad son incorrectas."})

        self.user = user
        return attrs

    def save(self, **kwargs):
        self.user.set_password(self.validated_data['new_password'])
        self.user.failed_login_attempts = 0
        self.user.lockout_until = None
        self.user.save()
        return self.user


class ChangePasswordSerializer(serializers.Serializer):
    """Cambio de contraseña desde el perfil de usuario autenticado."""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer para el CRUD de usuarios sin requerir email."""
    password = serializers.CharField(write_only=True, required=False)
    role_name = serializers.CharField(source='role.name', read_only=True)
    role_display = serializers.CharField(source='role.get_name_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'role', 'role_name', 'role_display', 'is_active', 
            'last_login', 'created_at', 'password', 
            'security_question_1', 'security_answer_1',
            'security_question_2', 'security_answer_2',
            'security_question_3', 'security_answer_3'
        ]
        extra_kwargs = {
            'email': {'required': False, 'allow_blank': True},
            'security_answer_1': {'write_only': True, 'required': False},
            'security_answer_2': {'write_only': True, 'required': False},
            'security_answer_3': {'write_only': True, 'required': False},
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        
        # Generar correo interno automático para cumplir con el esquema relacional
        if not validated_data.get('email'):
            uname = validated_data.get('username', 'usr').strip().lower()
            validated_data['email'] = f"{uname}@mantica.local"

        for i in range(1, 4):
            ans_key = f'security_answer_{i}'
            if ans_key in validated_data and validated_data[ans_key]:
                validated_data[ans_key] = make_password(validated_data[ans_key].strip().lower())

        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        for i in range(1, 4):
            ans_key = f'security_answer_{i}'
            if ans_key in validated_data and validated_data[ans_key]:
                validated_data[ans_key] = make_password(validated_data[ans_key].strip().lower())

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        instance.save()
        return instance