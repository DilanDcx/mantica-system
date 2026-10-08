from rest_framework.permissions import SAFE_METHODS, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsAdminUserRole
from .models import InstitutionalConfiguration
from .serializers import InstitutionalConfigurationSerializer


class InstitutionalConfigurationView(APIView):
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_configuration(self):
        configuration, _ = InstitutionalConfiguration.objects.get_or_create(
            pk=1,
            defaults={'name': 'Centro de Salud Pedro Arauz Palacios'},
        )
        return configuration

    def get(self, request):
        configuration = self.get_configuration()
        serializer = InstitutionalConfigurationSerializer(configuration)
        return Response(serializer.data)

    def put(self, request):
        return self.update_configuration(request, partial=False)

    def patch(self, request):
        return self.update_configuration(request, partial=True)

    def update_configuration(self, request, partial):
        configuration = self.get_configuration()
        serializer = InstitutionalConfigurationSerializer(
            configuration,
            data=request.data,
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)