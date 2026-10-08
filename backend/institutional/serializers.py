from rest_framework import serializers
from .models import InstitutionalConfiguration


class InstitutionalConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstitutionalConfiguration
        fields = [
            'name',
            'address',
            'logo_url',
            'hours_title',
            'weekday_label',
            'weekday_hours',
            'saturday_label',
            'saturday_hours',
            'emergency_label',
            'emergency_hours',
            'emergency_phone_label',
            'emergency_phone',
            'information_label',
            'information_phone',
            'campaign_title',
            'campaign_text',
            'mission_title',
            'mission_text',
            'certification_title',
            'certification_text',
            'updated_at',
        ]
        read_only_fields = ['updated_at']