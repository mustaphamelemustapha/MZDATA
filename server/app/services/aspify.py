import hashlib
import httpx
import logging
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

def generate_aspify_virtual_account(*, email: str, reference: str, phone: str, first_name: str, last_name: str, webhook_url: str = "") -> dict:
    url = f"{settings.aspify_base_url.rstrip('/')}/reserve-paga/"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.aspify_secret_key}",
        "Accept": "application/json"
    }
    payload = {
        "email": email,
        "reference": reference,
        "firstName": first_name or "Customer",
        "lastName": last_name or "Customer",
        "webhookUrl": webhook_url,
        "phone": phone or "00000000000",
    }
    logger.info("Generating Aspify Paga account for %s. Ref: %s", email, reference)
    with httpx.Client(timeout=30) as client:
        resp = client.post(url, json=payload, headers=headers)
        if resp.status_code >= 400:
            try:
                detail = resp.json()
            except Exception:
                detail = {"message": resp.text}
            raise ValueError(f"Aspify generate account failed: {detail}")
        
        # Depending on Aspify response, we defensively parse it
        try:
            return resp.json()
        except Exception:
            return {}

def verify_aspify_signature(signature: str) -> bool:
    """
    Aspify sends x-wiaxy-signature in headers.
    It should match the MD5 of the ASPIFY_SECRET_KEY.
    """
    sig = (signature or "").strip().lower()
    if not sig:
        return False
    
    secret = (settings.aspify_secret_key or "").strip()
    expected_sig = hashlib.md5(secret.encode("utf-8")).hexdigest().lower()
    
    return sig == expected_sig
