from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .permissions import IsDirectorOrAdmin  # Permiso RBAC para Administrador
from .serializers import (
    CustomTokenObtainPairSerializer,
    LogoutSerializer,
    GetSecurityQuestionsSerializer,
    ResetPasswordWithQuestionsSerializer,
    ChangePasswordSerializer,
    UserSerializer
)

class UserViewSet(viewsets.ModelViewSet):
    """CRUD de usuarios exclusivo para Administradores de TI."""
    queryset = User.objects.all().order_by('-id')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]


class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Sesión cerrada exitosamente."}, status=status.HTTP_205_RESET_CONTENT)


class GetSecurityQuestionsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GetSecurityQuestionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user
        return Response({
            "question_1": user.security_question_1,
            "question_2": user.security_question_2,
            "question_3": user.security_question_3,
        }, status=status.HTTP_200_OK)


class ResetPasswordWithQuestionsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordWithQuestionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Contraseña actualizada exitosamente. Ya puede iniciar sesión."}, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Contraseña actualizada correctamente."}, status=status.HTTP_200_OK)
    
    