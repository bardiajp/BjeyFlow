from django import forms
import django_filters

from core.models import Task


class TaskFilterForm(forms.Form):
    def clean(self):
        data = super().clean()
        start = data.get("due_date_after")
        end = data.get("due_date_before")
        if start and end and start > end:
            raise forms.ValidationError(
                "The start date must not be after the end date."
            )
        return data


class TaskFilter(django_filters.FilterSet):
    project = django_filters.UUIDFilter(field_name="project_id")
    due_date = django_filters.DateFilter()
    due_date_after = django_filters.DateFilter(field_name="due_date", lookup_expr="gte")
    due_date_before = django_filters.DateFilter(
        field_name="due_date", lookup_expr="lte"
    )

    class Meta:
        model = Task
        form = TaskFilterForm
        fields = ("project", "status", "priority", "due_date")
