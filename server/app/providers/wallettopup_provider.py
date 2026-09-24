import logging
import httpx
from typing import Dict, Any, List
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class WallettopupProvider:
    def __init__(self):
        self.base_url = str(settings.wallettopup_base_url).rstrip("/")
        self.api_key = settings.wallettopup_api_key
        self.timeout = 30.0

    def _get_headers(self):
        token = self.api_key.strip() if self.api_key else ""
        headers = {
            "Authorization": f"Token {token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        return headers

    def _json_or_none(self, response: httpx.Response) -> Any:
        try:
            return response.json()
        except Exception:
            return None

    def _resolve_network_id(self, network: str) -> int:
        nw = network.lower().strip()
        if nw == "mtn": return 1
        if nw == "glo": return 2
        if nw in ("9mobile", "etisalat"): return 3
        if nw == "airtel": return 4
        return 1  # Default fallback

    def _handle_exception(self, exc: Exception) -> Dict[str, Any]:
        logger.error("Wallettopup provider exception: %s", exc)
        ambiguous_hints = (
            "timeout", "timed out", "connection error", "connection reset", 
            "non-json", "invalid json", "service unavailable", "remote protocol",
            "network error", "connecterror", "readerror", "transport", "http error"
        )
        msg = str(exc).lower()
        if any(hint in msg for hint in ambiguous_hints):
            return {"status": "pending", "error": f"Provider timeout/error: {str(exc)}"}
        return {"status": "failed", "error": str(exc)}

    def purchase_network_data(self, network: str, phone: str, plan_id: str, client_request_id: str) -> Dict[str, Any]:
        if not self.api_key:
            return {"status": "failed", "error": "Wallettopup API key is not configured"}
            
        endpoint = "/data/"
        url = f"{self.base_url}{endpoint}"
        
        clean_variation = plan_id.split(":")[-1] if ":" in plan_id else plan_id
        try:
            plan_id_int = int(clean_variation)
        except ValueError:
            plan_id_int = clean_variation
            
        network_id = self._resolve_network_id(network)
        
        payload = {
            "network": network_id,
            "mobile_number": phone,
            "plan": plan_id_int,
            "Ported_number": True
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, json=payload, headers=self._get_headers())
                logger.info("Wallettopup POST %s network=%s plan=%s phone=%s status=%d", 
                            endpoint, network, plan_id, phone, response.status_code)
                
                res_data = self._json_or_none(response) or {}
                
                status_value = str(res_data.get("Status") or res_data.get("status") or "").lower()
                provider_reference = str(res_data.get("ident") or res_data.get("id") or "")
                
                if status_value == "successful" or status_value == "success":
                    return {
                        "status": "success",
                        "provider_reference": provider_reference,
                        "error": "",
                        "raw": res_data
                    }
                elif status_value == "pending" or status_value == "processing":
                    return {
                        "status": "pending",
                        "provider_reference": provider_reference,
                        "error": "Transaction is pending",
                        "raw": res_data
                    }
                
                return {
                    "status": "failed",
                    "provider_reference": provider_reference,
                    "error": res_data.get("error", f"Purchase failed (HTTP {response.status_code})"),
                    "raw": res_data
                }
                
        except Exception as exc:
            return self._handle_exception(exc)

    def purchase_airtime(self, network: str, phone: str, amount: float, client_request_id: str) -> Dict[str, Any]:
        if not self.api_key:
            return {"status": "failed", "error": "Wallettopup API key is not configured"}
            
        endpoint = "/topup/"
        url = f"{self.base_url}{endpoint}"
        network_id = self._resolve_network_id(network)
        
        payload = {
            "network": network_id,
            "amount": int(amount),
            "mobile_number": phone,
            "Ported_number": True,
            "airtime_type": "VTU"
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, json=payload, headers=self._get_headers())
                logger.info("Wallettopup POST %s network=%s amount=%s phone=%s status=%d", 
                            endpoint, network, amount, phone, response.status_code)
                
                res_data = self._json_or_none(response) or {}
                status_value = str(res_data.get("Status") or res_data.get("status") or "").lower()
                provider_reference = str(res_data.get("ident") or res_data.get("id") or "")
                
                if status_value == "successful" or status_value == "success" or response.status_code in (200, 201):
                    # Sometimes standard VTU APIs return 201 for success with status=successful
                    # The example showed "Status": "failed" but status_code 201, which is strange.
                    # Usually, successful transactions have Status == successful
                    if status_value == "failed":
                        return {
                            "status": "failed",
                            "provider_reference": provider_reference,
                            "error": "Provider failed transaction",
                            "raw": res_data
                        }
                    return {
                        "status": "success",
                        "provider_reference": provider_reference,
                        "error": "",
                        "raw": res_data
                    }
                    
                if status_value == "pending":
                    return {
                        "status": "pending",
                        "provider_reference": provider_reference,
                        "error": "Pending",
                        "raw": res_data
                    }
                    
                return {
                    "status": "failed",
                    "provider_reference": provider_reference,
                    "error": res_data.get("error") or f"Purchase failed (HTTP {response.status_code})",
                    "raw": res_data
                }
        except Exception as exc:
            return self._handle_exception(exc)
