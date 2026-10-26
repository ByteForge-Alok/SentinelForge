
from app.engine import SentinelForgeEngine


def test_verified_matching_repair_is_relevant():
    memories = [
        {
            "text": (
                "Login regression: auth_logic.py returned False for valid "
                "credentials. Changed it to return True; all tests passed."
            )
        }
    ]

    relevant, other = SentinelForgeEngine._classify_memories(memories)

    assert len(relevant) == 1
    assert len(other) == 0


def test_unrelated_memory_is_not_relevant():
    memories = [
        {
            "text": (
                "The dashboard layout was updated and the frontend build "
                "completed successfully."
            )
        }
    ]

    relevant, other = SentinelForgeEngine._classify_memories(memories)

    assert len(relevant) == 0
    assert len(other) == 1


def test_root_cause_memory_is_not_misrepresented_as_verified():
    memories = [
        {
            "text": (
                "Login regression: the matching-password branch returned "
                "False for valid credentials."
            )
        }
    ]

    relevant, other = SentinelForgeEngine._classify_memories(memories)

    assert len(relevant) == 0
    assert len(other) == 1
