import secrets
import string


def generate_jwt_secret(length=128):
    """
    Generate a secure JWT secret.

    Args:
        length (int): Desired secret length.

    Returns:
        str: Cryptographically secure random secret.
    """
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(characters) for _ in range(length))


if __name__ == "__main__":
    secret = generate_jwt_secret(128)

    print("=" * 60)
    print("Generated JWT Secret:")
    print(secret)
    print("=" * 60)
    print(f"Length: {len(secret)}")