import logging

from django.db import DatabaseError, transaction


class AdministrationErrorHandler(logging.Handler):
    def emit(self, record):
        if record.name.startswith(("django.db", "administration")):
            return
        from .models import SystemEvent

        try:
            with transaction.atomic():
                SystemEvent.objects.create(
                    source=record.name[:150],
                    error_type=type(record.exc_info[1]).__name__[:150]
                    if record.exc_info
                    else "HTTPServerError",
                )
        except DatabaseError:
            self.handleError(record)
