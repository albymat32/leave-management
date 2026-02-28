from cryptography.fernet import Fernet
import base64
import hashlib


def _fernet(secret: str) -> Fernet:
    # Ensure stable 32-byte key
    key = hashlib.sha256(secret.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt_text(value: str, secret: str) -> str:
    if not value:
        return ""
    f = _fernet(secret)
    return f.encrypt(value.encode()).decode()


def decrypt_text(value: str, secret: str) -> str:
    if not value:
        return ""
    f = _fernet(secret)
    return f.decrypt(value.encode()).decode()