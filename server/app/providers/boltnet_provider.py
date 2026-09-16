import logging
import httpx
from typing import Dict, Any, List
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class BoltnetProvider:
    def __init__(self):
        self.base_url = str(settings.boltnet_base_url).rstrip("/")
        self.api_key = settings.boltnet_api_key
        self.timeout = 30.0

    def _get_headers(self):
        token = self.api_key.strip() if self.api_key else ""
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def _json_or_none(self, response: httpx.Response) -> Any:
        try:
            return response.json()
        except Exception:
            return None

    def _resolve_network_id(self, network: str) -> int:
        nw = network.lower().strip()
        if nw == "mtn": return 1
        if nw == "airtel": return 2
        if nw == "glo": return 3
        if nw in ("9mobile", "etisalat"): return 4
        return 1  # Default fallback

    def purchase_network_data(self, network: str, phone: str, plan_id: str, client_request_id: str) -> Dict[str, Any]:
        """
        plan_id here is the specific plan ID from Boltnet.
        """
        if not self.api_key:
            return {"status": "failed", "error": "Boltnet API key is not configured"}
            
        endpoint = "/api/data/"
        url = f"{self.base_url}{endpoint}"
        
        # Clean the plan_id
        clean_variation = plan_id.split(":")[-1] if ":" in plan_id else plan_id
        
        # Convert to int if possible, some APIs are strict about types
        try:
            plan_id_int = int(clean_variation)
        except ValueError:
            plan_id_int = clean_variation
            
        network_id = self._resolve_network_id(network)
        
        payload = {
            "network": network_id,
            "mobile_number": phone,
            "plan": plan_id_int,
            "Ported_number": True,
            # Pass our unique ID just in case they support it, but docs didn't mention it
            "request_id": client_request_id
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, json=payload, headers=self._get_headers())
                logger.info("Boltnet POST %s network=%s plan=%s phone=%s status=%d", 
                            endpoint, network, plan_id, phone, response.status_code)
                
                res_data = self._json_or_none(response) or {}
                
                status_value = str(res_data.get("Status") or res_data.get("status") or "").lower()
                message = str(res_data.get("api_response") or res_data.get("message") or "")
                
                provider_reference = str(res_data.get("ident") or res_data.get("id") or "")
                
                if status_value == "successful":
                    return {
                        "status": "success",
                        "provider_reference": provider_reference,
                        "error": message
                    }
                elif status_value == "pending":
                    return {
                        "status": "pending",
                        "provider_reference": provider_reference,
                        "error": message
                    }
                
                return {
                    "status": "failed",
                    "provider_reference": provider_reference,
                    "error": message or f"Purchase failed (HTTP {response.status_code})"
                }
                
        except Exception as exc:
            logger.error("Boltnet purchase exception: %s", exc)
            ambiguous_hints = (
                "timeout", "timed out", "connection error", "connection reset", 
                "non-json", "invalid json", "service unavailable", "remote protocol",
                "network error", "connecterror", "readerror", "transport", "http error"
            )
            msg = str(exc).lower()
            if any(hint in msg for hint in ambiguous_hints):
                return {"status": "pending", "error": f"Provider timeout/error: {str(exc)}"}
            return {"status": "failed", "error": str(exc)}
