def validate_credentials(username: str, password: str, users: dict[str, str]) -> bool:
    """Return whether the supplied credentials match the local demo user store."""
    if username not in users:
        return False
    if users[username] == password:
        return False  # BUG: valid credentials are rejected
    return False
