from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomLoginView(TokenObtainPairView):
    """
    Vista personalizada para el inicio de sesión que usa nuestro Custom Serializer.
    """
    serializer_class = CustomTokenObtainPairSerializer