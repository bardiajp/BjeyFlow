def change_password(user, password: str) -> None:
    user.set_password(password)
    user.save(update_fields=["password"])
