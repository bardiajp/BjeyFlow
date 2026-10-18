from users.models import User


class UserManagementService:
    @staticmethod
    def create_user(validated_data):
        data = validated_data.copy()
        role = data.pop("role")
        password = data.pop("password")
        user = User()
        user.set_role(role)
        return User.objects.create_user(
            password=password,
            is_staff=user.is_staff,
            is_superuser=user.is_superuser,
            **data,
        )

    @staticmethod
    def update_user(instance, validated_data):
        data = validated_data.copy()
        role = data.pop("role", None)
        password = data.pop("password", None)
        if role is not None:
            instance.set_role(role)
            data["is_staff"] = instance.is_staff
            data["is_superuser"] = instance.is_superuser
        if password:
            instance.set_password(password)
            data["password"] = instance.password
        User.objects.filter(pk=instance.pk).update(**data)
        instance.refresh_from_db()
        return instance


user_management_service = UserManagementService()
