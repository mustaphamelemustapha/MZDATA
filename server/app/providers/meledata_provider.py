import logging
import httpx
from typing import Dict, Any
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class MeleDataProvider:
    def __init__(self):
        self.base_url = str(settings.meledata_base_url).rstrip("/")
        self.api_key = settings.meledata_api_key
        self.timeout = 30.0

    def _get_headers(self):
        return {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def _json_or_none(self, response: httpx.Response) -> Any:
        try:
            return response.json()
        except Exception:
            return None

    def get_balance(self) -> float:
        url = f"{self.base_url}/wallet/"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(url, headers=self._get_headers())
                data = self._json_or_none(response)
                
                # Check for structure: {"success": true, "data": {"balance": 14250.50}}
                if isinstance(data, dict):
                    if data.get("success") and "data" in data and isinstance(data["data"], dict) and "balance" in data["data"]:
                        return float(data["data"]["balance"])
            return 0.0
        except Exception as e:
            logger.error(f"MeleData get_balance error: {e}")
            return 0.0

    def fetch_plans(self) -> dict:
        url = f"{self.base_url}/data/plans"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(url, headers=self._get_headers())
                logger.info("MeleData GET /data/plans status=%d", response.status_code)
                data = self._json_or_none(response)
                if isinstance(data, dict):
                    return data
                return {"status": False, "msg": "Invalid response format"}
        except Exception as e:
            logger.error(f"MeleData fetch_plans error: {e}")
            return {"status": False, "msg": str(e)}

    def get_all_plans(self) -> list:
        data = self.fetch_plans()
        results = []
        if not data or "plans" not in data or not isinstance(data["plans"], list):
            logger.warning("MeleData fetch_plans returned unexpected structure: %s", data)
            return results

        # Expecting: {"plans": [{"plan_id": 1, "network": "MTN", "plan_name": "MTN SME 1GB", "price": 290.00}, ...]}
        for p in data["plans"]:
            if not isinstance(p, dict):
                continue
            nw_name = str(p.get("network", "")).lower()
            results.append({
                "network": nw_name,
                "plan_code": f"{nw_name}:{p.get('plan_id')}",
                "plan_name": p.get("plan_name"),
                "data_size": p.get("data_size") or p.get("plan_name"),
                "price": float(p.get("price") or 0),
                "provider": "meledata",
                "provider_plan_id": str(p.get("plan_id"))
            })
        return results

    def purchase_data(self, network: str, plan_id: str, phone: str, reference: str) -> dict:
        url = f"{self.base_url}/data/purchase"
        
        # MELE DATA expects plan_id as an integer.
        # If MZDATA passes a composite string like 'meledata:mtn:173', we extract the 173.
        clean_plan_id = str(plan_id)
        if ":" in clean_plan_id:
            clean_plan_id = clean_plan_id.split(":")[-1]
            
        payload = {
            "network": str(network).upper(),
            "plan_id": int(clean_plan_id) if clean_plan_id.isdigit() else clean_plan_id,
            "phone_number": str(phone),
            "reference": str(reference)
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, json=payload, headers=self._get_headers())
                logger.info("MeleData POST /data/purchase network=%s plan=%s phone=%s status=%d", 
                            network, plan_id, phone, response.status_code)
                
                if response.status_code != 200:
                    logger.error("MeleData purchase error: status=%d response=%s", response.status_code, response.text)
                
                res_data = self._json_or_none(response) or {}
                return res_data
        except Exception as e:
            logger.error(f"MeleData purchase_data error: {e}")
            return {"status": False, "msg": str(e)}

    def purchase_network_data(self, network: str, phone: str, plan_id: str, client_request_id: str) -> Dict[str, Any]:
        res = self.purchase_data(network=network, plan_id=plan_id, phone=phone, reference=client_request_id)
        
        top_level_status = res.get("status")
        nested_data = res.get("data", {})
        nested_status = nested_data.get("status", "")
        
        # Catch 422 validation errors or explicitly missing statuses
        if res.get("detail") and not top_level_status:
            # This is a FastAPI standard 422 validation error from MeleData
            err_msg = str(res.get("detail"))
            return {"status": "failed", "error": err_msg, "raw": res}

        if top_level_status in (True, "true", "success") and nested_status in ("success", "delivered", "successful"):
            return {"status": "success", "provider_reference": nested_data.get("reference", ""), "raw": res}
        elif nested_status in ("failed", "error") or top_level_status in (False, "false", "failed") or res.get("error"):
            err_msg = res.get("message") or res.get("msg") or res.get("error") or "failed"
            return {"status": "failed", "error": err_msg, "raw": res}
        else:
            # If we genuinely don't know, keep it pending, BUT if it was a 400+ error, we should probably fail it
            err_msg = res.get("message") or res.get("msg") or res.get("detail") or "pending or unknown"
            
            # If the response doesn't look like a success payload AND it's completely unparseable,
            # we should still err on the side of caution and leave it pending so it auto-refunds later
            # However, if it's explicitly an error message without a 'status' boolean, we can check.
            # But let's rely on pending_reconcile timeout for safety.
            return {"status": "pending", "error": err_msg, "raw": res}

    def query_transaction(self, reference: str) -> Dict[str, Any]:
        """Check status of an existing data transaction."""
        url = f"{self.base_url}/data/status/?ref={reference}"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(url, headers=self._get_headers())
                data = self._json_or_none(response) or {}
                
                if data.get("success"):
                    tx_status = str(data.get("data", {}).get("status", "")).lower()
                    if tx_status in ("delivered", "success", "successful"):
                        return {"status": "success", "raw": data}
                    elif tx_status in ("failed", "error"):
                        return {"status": "failed", "error": data.get("data", {}).get("message"), "raw": data}
                    else:
                        return {"status": "pending", "raw": data}
                else:
                    return {"status": "pending", "error": data.get("message"), "raw": data}
        except Exception as e:
            logger.error(f"MeleData query_transaction error: {e}")
            return {"status": "pending", "error": str(e)}

    def purchase_airtime(self, network: str, phone: str, amount: float, reference: str = "") -> Dict[str, Any]:
        """Purchase airtime via MELE DATA API."""
        url = f"{self.base_url}/airtime/purchase"
        payload = {
            "network": str(network).upper(),
            "phone_number": str(phone),
            "amount": float(amount),
            "reference": str(reference)
        }
        
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, json=payload, headers=self._get_headers())
                logger.info("MeleData POST /airtime/purchase network=%s phone=%s amount=%s status=%d", 
                            network, phone, amount, response.status_code)
                
                res = self._json_or_none(response) or {}
                
                top_level_status = res.get("status")
                nested_data = res.get("data", {})
                nested_status = nested_data.get("status", "")
                
                if top_level_status in (True, "true", "success") and nested_status in ("success", "delivered", "successful"):
                    return {"status": "success", "provider_reference": nested_data.get("reference", ""), "raw": res}
                elif nested_status in ("failed", "error") or top_level_status in (False, "false", "failed") or res.get("error"):
                    err_msg = res.get("message") or res.get("msg") or res.get("error") or "failed"
                    return {"status": "failed", "error": err_msg, "raw": res}
                else:
                    err_msg = res.get("message") or res.get("msg") or "pending or unknown"
                    return {"status": "pending", "error": err_msg, "raw": res}
        except Exception as e:
            logger.error(f"MeleData purchase_airtime error: {e}")
            return {"status": "pending", "error": str(e), "raw": {}}
