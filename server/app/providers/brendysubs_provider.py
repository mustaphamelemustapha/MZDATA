import logging
import httpx
from typing import Dict, Any, List
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class BrendysubsProvider:
    def __init__(self):
        self.base_url = str(settings.brendysubs_base_url).rstrip("/")
        self.api_key = settings.brendysubs_api_key
        self.timeout = 30.0

    def _get_headers(self, is_form: bool = False):
        token = self.api_key.strip() if self.api_key else ""
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }
        if is_form:
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            headers["Content-Type"] = "application/json"
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
        if nw == "smile": return 5
        return 1  # Default fallback

    def _handle_exception(self, exc: Exception) -> Dict[str, Any]:
        logger.error("Brendysubs provider exception: %s", exc)
        ambiguous_hints = (
            "timeout", "timed out", "connection error", "connection reset", 
            "non-json", "invalid json", "service unavailable", "remote protocol",
            "network error", "connecterror", "readerror", "transport", "http error"
        )
        msg = str(exc).lower()
        if any(hint in msg for hint in ambiguous_hints):
            return {"status": "pending", "error": f"Provider timeout/error: {str(exc)}"}
        return {"status": "failed", "error": str(exc)}

    def get_user_details(self) -> Dict[str, Any]:
        url = f"{self.base_url}/user/"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(url, headers=self._get_headers())
                res_data = self._json_or_none(response) or {}
                if res_data.get("status") == "success":
                    return {"status": "success", "data": res_data.get("data", {})}
                return {"status": "failed", "error": res_data.get("message", "Unknown error")}
        except Exception as exc:
            return self._handle_exception(exc)

    def purchase_network_data(self, network: str, phone: str, plan_id: str, client_request_id: str) -> Dict[str, Any]:
        if not self.api_key:
            return {"status": "failed", "error": "Brendysubs API key is not configured"}
            
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
            "Ported_number": False
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, json=payload, headers=self._get_headers(is_form=False))
                logger.info("Brendysubs POST %s network=%s plan=%s phone=%s status=%d", 
                            endpoint, network, plan_id, phone, response.status_code)
                
                res_data = self._json_or_none(response) or {}
                
                status_value = str(res_data.get("status") or res_data.get("api_status") or "").lower()
                success_flag = res_data.get("success")
                message = str(res_data.get("api_response") or res_data.get("message") or "")
                
                provider_reference = str(res_data.get("reference") or "")
                
                if status_value == "success" or status_value == "succcess" or success_flag is True:
                    return {
                        "status": "success",
                        "provider_reference": provider_reference,
                        "error": message,
                        "raw": res_data
                    }
                elif status_value == "pending" or status_value == "processing":
                    return {
                        "status": "pending",
                        "provider_reference": provider_reference,
                        "error": message,
                        "raw": res_data
                    }
                
                return {
                    "status": "failed",
                    "provider_reference": provider_reference,
                    "error": message or f"Purchase failed (HTTP {response.status_code})",
                    "raw": res_data
                }
                
        except Exception as exc:
            return self._handle_exception(exc)

    def purchase_airtime(self, network: str, phone: str, amount: float, client_request_id: str) -> Dict[str, Any]:
        if not self.api_key:
            return {"status": "failed", "error": "Brendysubs API key is not configured"}
            
        endpoint = "/airtime/"
        url = f"{self.base_url}{endpoint}"
        network_id = self._resolve_network_id(network)
        
        payload = {
            "network": str(network_id),
            "amount": str(int(amount)),
            "mobile_number": phone,
            "Ported_number": "false"
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, data=payload, headers=self._get_headers(is_form=True))
                logger.info("Brendysubs POST %s network=%s amount=%s phone=%s status=%d", 
                            endpoint, network, amount, phone, response.status_code)
                
                res_data = self._json_or_none(response) or {}
                status_value = str(res_data.get("status") or res_data.get("api_status") or "").lower()
                success_flag = res_data.get("success")
                error_msg = res_data.get("error")
                message = str(error_msg or res_data.get("api_response") or "")
                provider_reference = str(res_data.get("reference") or "")
                
                if success_flag is True or status_value == "success":
                    return {
                        "status": "success",
                        "provider_reference": provider_reference,
                        "error": message,
                        "raw": res_data
                    }
                return {
                    "status": "failed",
                    "provider_reference": provider_reference,
                    "error": message or f"Purchase failed (HTTP {response.status_code})",
                    "raw": res_data
                }
        except Exception as exc:
            return self._handle_exception(exc)

    def validate_cable(self, cable_id: str, smart_card_number: str) -> Dict[str, Any]:
        url = f"{self.base_url}/cable/validate/"
        
        payload = {
            "cable_id": cable_id,
            "smart_card_number": smart_card_number
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, data=payload, headers=self._get_headers(is_form=True))
                res_data = self._json_or_none(response) or {}
                
                if res_data.get("invalid") is False:
                    return {
                        "status": "success",
                        "name": res_data.get("name"),
                        "raw": res_data
                    }
                return {
                    "status": "failed",
                    "error": res_data.get("error", "Invalid smart card number"),
                    "raw": res_data
                }
        except Exception as exc:
            return self._handle_exception(exc)

    def purchase_cable(self, cable_name: str, cable_plan: str, smart_card_number: str, customer_name: str = "Customer") -> Dict[str, Any]:
        url = f"{self.base_url}/cable/"
        
        payload = {
            "cablename": cable_name,
            "cableplan": cable_plan,
            "smart_card_number": smart_card_number,
            "customer_name": customer_name
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, data=payload, headers=self._get_headers(is_form=True))
                res_data = self._json_or_none(response) or {}
                
                success_flag = res_data.get("success")
                status_value = str(res_data.get("status") or "").lower()
                provider_reference = str(res_data.get("reference") or "")
                error_msg = res_data.get("error") or ""
                
                if success_flag is True or status_value in ["processing", "success"]:
                    return {
                        "status": "success" if status_value == "success" else "pending",
                        "provider_reference": provider_reference,
                        "error": error_msg,
                        "raw": res_data
                    }
                return {
                    "status": "failed",
                    "provider_reference": provider_reference,
                    "error": error_msg or f"Purchase failed (HTTP {response.status_code})",
                    "raw": res_data
                }
        except Exception as exc:
            return self._handle_exception(exc)

    def validate_electricity(self, disco_id: str, meter_number: str, meter_type: str) -> Dict[str, Any]:
        url = f"{self.base_url}/electricity/validate.php"
        params = {
            "disco_id": disco_id,
            "meter_number": meter_number,
            "meter_type": meter_type
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(url, params=params, headers=self._get_headers(is_form=False))
                res_data = self._json_or_none(response) or {}
                
                if res_data.get("invalid") is False:
                    return {
                        "status": "success",
                        "name": res_data.get("name"),
                        "address": res_data.get("address"),
                        "raw": res_data
                    }
                return {
                    "status": "failed",
                    "error": res_data.get("error", "Invalid meter number"),
                    "raw": res_data
                }
        except Exception as exc:
            return self._handle_exception(exc)

    def purchase_electricity(self, disco_name: str, meter_number: str, meter_type: str, amount: float, customer_phone: str, customer_name: str = "Customer", customer_address: str = "Nigeria") -> Dict[str, Any]:
        url = f"{self.base_url}/electricity/"
        
        payload = {
            "disco_name": disco_name,
            "meter_number": meter_number,
            "MeterType": meter_type,
            "amount": str(int(amount)),
            "Customer_Phone": customer_phone,
            "customer_name": customer_name,
            "customer_address": customer_address
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, data=payload, headers=self._get_headers(is_form=True))
                res_data = self._json_or_none(response) or {}
                
                success_flag = res_data.get("success")
                status_value = str(res_data.get("status") or "").lower()
                provider_reference = str(res_data.get("reference") or "")
                error_msg = res_data.get("error") or ""
                token = res_data.get("token") or res_data.get("api_response", {}).get("token") or ""
                
                if success_flag is True or status_value in ["processing", "success"]:
                    # Return token in provider_reference or raw if needed
                    return {
                        "status": "success" if status_value == "success" else "pending",
                        "provider_reference": provider_reference,
                        "token": token,
                        "error": error_msg,
                        "raw": res_data
                    }
                return {
                    "status": "failed",
                    "provider_reference": provider_reference,
                    "error": error_msg or f"Purchase failed (HTTP {response.status_code})",
                    "raw": res_data
                }
        except Exception as exc:
            return self._handle_exception(exc)

    def purchase_recharge_pin(self, network: str, amount: int, quantity: int, name_on_card: str = "Customer") -> Dict[str, Any]:
        url = f"{self.base_url}/recharge_pin/"
        network_id = self._resolve_network_id(network)
        
        payload = {
            "network": str(network_id),
            "network_amount": str(amount),
            "quantity": str(quantity),
            "name_on_card": name_on_card
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, data=payload, headers=self._get_headers(is_form=True))
                res_data = self._json_or_none(response) or {}
                
                success_flag = res_data.get("success")
                error_msg = res_data.get("error") or ""
                
                if success_flag is True:
                    return {
                        "status": "success",
                        "pins": res_data.get("pins", []),
                        "raw": res_data
                    }
                return {
                    "status": "failed",
                    "error": error_msg or f"Purchase failed (HTTP {response.status_code})",
                    "raw": res_data
                }
        except Exception as exc:
            return self._handle_exception(exc)

    def purchase_result_checker(self, exam_name: str, quantity: int) -> Dict[str, Any]:
        url = f"{self.base_url}/result_checker/purchase.php"
        
        payload = {
            "exam_name": exam_name,
            "quantity": str(quantity)
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, data=payload, headers=self._get_headers(is_form=True))
                res_data = self._json_or_none(response) or {}
                
                success_flag = res_data.get("success")
                status_value = str(res_data.get("status") or "").lower()
                error_msg = res_data.get("error") or ""
                
                if success_flag is True or status_value == "success":
                    return {
                        "status": "success",
                        "pins": res_data.get("pins", []),
                        "raw": res_data
                    }
                return {
                    "status": "failed",
                    "error": error_msg or f"Purchase failed (HTTP {response.status_code})",
                    "raw": res_data
                }
        except Exception as exc:
            return self._handle_exception(exc)
