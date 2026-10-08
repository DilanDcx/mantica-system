from rest_framework import serializers
from .models import InstitutionalConfiguration


class InstitutionalConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstitutionalConfiguration
        fields = ['name', 'address', 'logo_url', 'updated_at']
        read_only_fields = ['updated_at']