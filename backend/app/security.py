import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _key_from_secret(secret: str) -> bytes:
    # Derive a 32-byte key from provided secret (simple hash-less stretch).
    # For MVP: pad/trim to 32 bytes. In production, use HKDF/PBKDF2.
    raw = secret.encode("utf-8")
    if len(raw) >= 32:
        return raw[:32]
    return raw.ljust(32, b"\0")


def encrypt_text(plaintext: str, secret: str) -> str:
    key = _key_from_secret(secret)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    blob = nonce + ct
    return base64.urlsafe_b64encode(blob).decode("utf-8")


def decrypt_text(ciphertext: str, secret: str) -> str:
    key = _key_from_secret(secret)
    data = base64.urlsafe_b64decode(ciphertext.encode("utf-8"))
    nonce, ct = data[:12], data[12:]
    aesgcm = AESGCM(key)
    pt = aesgcm.decrypt(nonce, ct, None)
    return pt.decode("utf-8")