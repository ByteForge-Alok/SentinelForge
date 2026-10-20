from auth_logic import validate_credentials

USERS = {"demo-user": "correct-horse"}


def test_valid_credentials_are_accepted():
    assert validate_credentials("demo-user", "correct-horse", USERS) is True


def test_wrong_password_is_rejected():
    assert validate_credentials("demo-user", "wrong-password", USERS) is False


def test_unknown_user_is_rejected():
    assert validate_credentials("missing-user", "correct-horse", USERS) is False
