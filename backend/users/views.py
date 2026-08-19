from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    CustomTokenObtainPairSerializer,
    LogoutSerializer,
    GetSecurityQuestionsSerializer,
    ResetPasswordWithQuestionsSerializer,
    ChangePasswordSerializer
)


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
    """Retorna las 3 preguntas asociadas al username."""
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
    """Verifica respuestas y actualiza la contraseña."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordWithQuestionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Contraseña actualizada exitosamente. Ya puede iniciar sesión."}, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """Cambio de contraseña desde el perfil de usuario logueado."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Contraseña actualizada correctamente."}, status=status.HTTP_200_OK)