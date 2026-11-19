from rest_framework import filters, generics, permissions, serializers
from rest_framework.pagination import PageNumberPagination
from rest_framework.throttling import UserRateThrottle

from users.permissions import HasAccountableRole
from .models import FeatureRecommendation


class RecommendationSerializer(serializers.ModelSerializer):
    title = serializers.CharField(max_length=160, trim_whitespace=True)
    description = serializers.CharField(max_length=2000, trim_whitespace=True)
    username = serializers.CharField(source="user.username", read_only=True, default=None)

    class Meta:
        model = FeatureRecommendation
        fields = ("id", "title", "description", "username", "created_at")
        read_only_fields = ("id", "username", "created_at")


class RecommendationThrottle(UserRateThrottle):
    scope = "recommendations"
    rate = "5/hour"


class SubmitRecommendationView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [RecommendationThrottle]
    serializer_class = RecommendationSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RecommendationPagination(PageNumberPagination):
    page_size = 20


class AdminRecommendationsView(generics.ListAPIView):
    permission_classes = [HasAccountableRole]
    serializer_class = RecommendationSerializer
    pagination_class = RecommendationPagination
    queryset = FeatureRecommendation.objects.select_related("user")
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "description", "user__username"]
