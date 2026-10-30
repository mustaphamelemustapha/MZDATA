import json
import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models.integration import IntegrationProvider

settings = get_settings()
logger = logging.getLogger(__name__)

# Persistent connection pool with Keep-Alive to eliminate TLS/TCP handshake latency
_MELEDATA_CLIENT = httpx.Client(
    timeout=httpx.Timeout(connect=8.0, read=25.0, write=10.0, pool=10.0),
    limits=httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=60.0),
)


class MeleDataProvider:
    """
    Integration provider for MELE DATA developer API.
    Used for sending Airtime top-ups and Data bundles via Mele Data's developer docs.
    """
    def __init__(self, db=None, api_key: Optional[str] = None, base_url: Optional[str] = None):
        _db = db or SessionLocal()
        try:
            db_prov = _db.query(IntegrationProvider).filter(IntegrationProvider.identifier == "meledata").first()
            raw_url = str(base_url or (db_prov.base_url if db_prov else None) or settings.meledata_base_url or "https://api.meledata.ng/api/v1").strip().rstrip("/")
            if raw_url.endswith("/developer"):
                raw_url = raw_url[:-10].rstrip("/")
            if not raw_url.endswith("/api/v1"):
                raw_url = f"{raw_url}/api/v1"
            self.base_url = raw_url
            raw_key = (api_key or (db_prov.api_key if db_prov else None) or settings.meledata_api_key or "").strip()
            # Force live mode key when calling Mele Data as an upstream provider so customer orders never hit sandbox
            if raw_key.startswith("mele_test_pub_"):
                raw_key = "mele_pub_" + raw_key[len("mele_test_pub_"):]
            elif raw_key.startswith("mele_test_"):
                raw_key = "mele_live_" + raw_key[len("mele_test_"):]
            if db_prov and db_prov.api_key and db_prov.api_key.strip() != raw_key:
                try:
                    db_prov.api_key = raw_key
                    _db.commit()
                except Exception:
                    _db.rollback()
            self.api_key = raw_key
        finally:
            if db is None:
                _db.close()
        self.timeout = 25.0

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            headers["X-API-Key"] = self.api_key
        return headers

    def purchase_airtime(self, network: str, phone: str, amount: float, reference: str) -> Dict[str, Any]:
        """
        Connects to Mele Data Airtime API per Developer Docs:
        POST /api/v1/developer/airtime/purchase
        Payload: { "network": "mtn", "phone_number": "...", "amount": 500, "reference": "..." }
        """
        url = f"{self.base_url}/developer/airtime/purchase"
        payload = {
            "network": str(network).strip().lower(),
            "phone_number": str(phone).strip(),
            "amount": float(amount),
            "reference": str(reference).strip()
        }

        try:
            response = _MELEDATA_CLIENT.post(url, json=payload, headers=self._get_headers())
            if response.status_code == 404:
                alt_url = url.replace("/api/v1/developer", "/developer") if "/api/v1/developer" in url else url.replace("/developer", "/api/v1/developer")
                if alt_url != url:
                    logger.warning("MeleData airtime 404 on %s, trying %s", url, alt_url)
                    response = _MELEDATA_CLIENT.post(alt_url, json=payload, headers=self._get_headers())

            logger.info(
                "MeleData POST /developer/airtime/purchase network=%s phone=%s amount=%s status=%d",
                network, phone, amount, response.status_code
            )

            try:
                res_data = response.json()
            except Exception:
                return {
                    "status": False,
                    "message": f"Non-JSON response (Status {response.status_code}): {response.text[:200]}"
                }
            return res_data
        except Exception as e:
            logger.error("MeleData purchase_airtime error: %s", e)
            return {"status": False, "message": str(e)}

    def purchase_data(self, network_id: Any, plan_id: str, phone: str, reference: str) -> Dict[str, Any]:
        """
        Connects to Mele Data Data API per Developer Docs:
        POST /api/v1/developer/data/purchase
        """
        url = f"{self.base_url}/developer/data/purchase"

        network_map = {
            1: "mtn",
            2: "airtel",
            3: "glo",
            4: "9mobile"
        }
        if str(network_id).isdigit():
            network_str = network_map.get(int(network_id), str(network_id).lower())
        else:
            network_str = str(network_id).strip().lower()

        clean_plan_id = str(plan_id).strip()
        if ":" in clean_plan_id:
            clean_plan_id = clean_plan_id.split(":")[-1]
        elif clean_plan_id.startswith("meledata.") and clean_plan_id.count(".") >= 2:
            clean_plan_id = clean_plan_id.split(".")[-1]

        payload = {
            "network": network_str,
            "phone_number": str(phone),
            "plan_id": int(clean_plan_id) if clean_plan_id.isdigit() else clean_plan_id,
            "reference": str(reference)
        }

        try:
            response = _MELEDATA_CLIENT.post(url, json=payload, headers=self._get_headers())
            if response.status_code == 404:
                alt_url = url.replace("/api/v1/developer", "/developer") if "/api/v1/developer" in url else url.replace("/developer", "/api/v1/developer")
                if alt_url != url:
                    logger.warning("MeleData data 404 on %s, trying %s", url, alt_url)
                    response = _MELEDATA_CLIENT.post(alt_url, json=payload, headers=self._get_headers())

            logger.info(
                "MeleData POST /developer/data/purchase network=%s plan=%s phone=%s status=%d",
                network_str, clean_plan_id, phone, response.status_code
            )

            try:
                res_data = response.json()
            except Exception:
                return {
                    "status": False,
                    "message": f"Non-JSON response (Status {response.status_code}): {response.text[:200]}"
                }
            return res_data
        except Exception as e:
            logger.error("MeleData purchase_data error: %s", e)
            return {"status": False, "message": str(e)}

    def purchase_network_data(self, network_id: int, phone: str, plan_id: str, client_request_id: str) -> Dict[str, Any]:
        res = self.purchase_data(network_id=network_id, plan_id=plan_id, phone=phone, reference=client_request_id)
        is_success = res.get("status") is True
        message = str(res.get("message") or res.get("msg") or res.get("detail") or "")
        data_obj_check = res.get("data") if isinstance(res.get("data"), dict) else {}
        if "sandbox" in message.lower() or data_obj_check.get("livemode") is False or str(data_obj_check.get("mode") or "").lower() == "test":
            return {
                "status": "failed",
                "provider_reference": str(data_obj_check.get("reference") or client_request_id),
                "error": "Upstream provider returned a Sandbox/Test response instead of Live delivery"
            }

        if is_success:
            data_obj = res.get("data") or {}
            inner_status = str(data_obj.get("status") or "").strip().lower()
            provider_reference = str(data_obj.get("reference") or res.get("reference") or client_request_id)

            if inner_status in ("success", "successful", "delivered"):
                return {
                    "status": "success",
                    "provider_reference": provider_reference,
                    "error": message
                }
            elif inner_status in ("pending", "processing"):
                return {
                    "status": "pending",
                    "provider_reference": provider_reference,
                    "error": message
                }
            else:
                return {
                    "status": "failed",
                    "provider_reference": provider_reference,
                    "error": message or "Provider reported failure in data block"
                }

        status_value = str(res.get("status") or "").strip().lower()
        provider_reference = str(res.get("reference") or res.get("data", {}).get("reference") or client_request_id)
        if status_value == "success":
            return {
                "status": "success",
                "provider_reference": provider_reference,
                "error": message
            }

        ambiguous_hints = (
            "timeout", "timed out", "connection error", "connection reset",
            "service unavailable", "remote protocol", "network error"
        )
        lowered = message.lower()
        if status_value == "pending" or any(hint in lowered for hint in ambiguous_hints):
            return {
                "status": "pending",
                "provider_reference": provider_reference,
                "error": message
            }

        return {
            "status": "failed",
            "provider_reference": provider_reference,
            "error": message or f"Purchase failed: {json.dumps(res)}"
        }
