import sys

with open('server/app/services/bills.py', 'r') as f:
    content = f.read()

new_class = """
from app.providers.brendysubs_provider import BrendysubsProvider

class BrendysubsBillsProvider:
    def __init__(self):
        self.provider = BrendysubsProvider()

    def purchase_airtime(self, network: str, phone_number: str, amount: float) -> ProviderResult:
        res = self.provider.purchase_airtime(network, phone_number, amount, "")
        if res["status"] in ("success", "pending"):
            return ProviderResult(True, external_reference=res.get("provider_reference"), message=res.get("error"), meta=res)
        return ProviderResult(False, message=res.get("error"), meta=res)

    def purchase_cable(self, provider: str, smartcard_number: str, package_code: str, amount: float, phone_number: str | None = None) -> ProviderResult:
        res = self.provider.purchase_cable(provider, package_code, smartcard_number)
        if res["status"] in ("success", "pending"):
            return ProviderResult(True, external_reference=res.get("provider_reference"), message=res.get("error"), meta=res)
        return ProviderResult(False, message=res.get("error"), meta=res)

    def purchase_electricity(self, disco: str, meter_number: str, meter_type: str, amount: float, phone_number: str | None = None) -> ProviderResult:
        res = self.provider.purchase_electricity(disco, meter_number, meter_type, amount, phone_number or "08012345678")
        if res["status"] in ("success", "pending"):
            return ProviderResult(True, external_reference=res.get("provider_reference"), message=res.get("error"), meta=res)
        return ProviderResult(False, message=res.get("error"), meta=res)

    def purchase_exam_pin(self, exam: str, quantity: int, phone_number: str | None = None, exam_type: str | None = None) -> ProviderResult:
        res = self.provider.purchase_result_checker(exam.upper(), quantity)
        if res["status"] == "success":
            return ProviderResult(True, external_reference=res.get("provider_reference"), meta=res)
        return ProviderResult(False, message=res.get("error"), meta=res)

    def purchase_data(self, network: str, phone_number: str, plan_code: str, amount: float | None = None, request_id: str | None = None) -> ProviderResult:
        res = self.provider.purchase_network_data(network, phone_number, plan_code, request_id or "")
        if res["status"] in ("success", "pending"):
            return ProviderResult(True, external_reference=res.get("provider_reference"), message=res.get("error"), meta=res)
        return ProviderResult(False, message=res.get("error"), meta=res)

    def fetch_exam_packages(self, exam: str) -> list[dict]:
        exam_key = _normalize_exam_key(exam)
        defaults = {
            "waec": [{"code": "waecdirect", "name": "WAEC Result Checker PIN", "amount": 3500.0, "exam": "waec"}],
            "neco": [{"code": "neco", "name": "NECO Result Checker PIN", "amount": 1500.0, "exam": "neco"}],
            "nabteb": [{"code": "nabteb", "name": "NABTEB Result Checker PIN", "amount": 1500.0, "exam": "nabteb"}],
        }
        return defaults.get(exam_key, [])

    def fetch_cable_packages(self, provider: str) -> list[dict]:
        return []

    def verify_cable_customer(self, provider: str, smartcard_number: str) -> dict:
        # Brendysubs uses cablename/cableplan IDs for validation. 
        # Map provider to ID: DSTV=1, GOTV=2, STARTIMES=3
        provider_map = {"dstv": "1", "gotv": "2", "startimes": "3"}
        p_id = provider_map.get(str(provider).lower(), "1")
        res = self.provider.validate_cable(p_id, smartcard_number)
        if res["status"] == "success":
            return {"ok": True, "customer_name": res.get("name", "Verified")}
        return {"ok": False, "message": res.get("error")}

    def fetch_electricity_discos(self) -> list[dict]:
        return [
            {"code": "1", "id": "ikedc", "name": "Ikeja Electric"},
            {"code": "2", "id": "ekedc", "name": "Eko Electric"},
            {"code": "3", "id": "kedco", "name": "Kano Electric"},
            {"code": "4", "id": "phed", "name": "Port Harcourt Electric"},
            {"code": "5", "id": "jos", "name": "Jos Electric"},
            {"code": "6", "id": "ibedc", "name": "Ibadan Electric"},
            {"code": "7", "id": "kaedco", "name": "Kaduna Electric"},
            {"code": "8", "id": "aedc", "name": "Abuja Electric"},
            {"code": "9", "id": "eedc", "name": "Enugu Electric"},
            {"code": "10", "id": "bedc", "name": "Benin Electric"},
        ]

    def verify_electricity_customer(self, disco: str, meter_number: str, meter_type: str) -> dict:
        # disco maps to code in fetch_electricity_discos
        disco_map = {"ikedc": "1", "ekedc": "2", "kedco": "3", "phed": "4", "jos": "5", "ibedc": "6", "kaedco": "7", "aedc": "8", "eedc": "9", "bedc": "10"}
        d_id = disco_map.get(str(disco).lower(), "1")
        res = self.provider.validate_electricity(d_id, meter_number, meter_type)
        if res["status"] == "success":
            return {"ok": True, "customer_name": res.get("name", "Verified")}
        return {"ok": False, "message": res.get("error")}

"""

if "BrendysubsBillsProvider" not in content:
    content += "\n" + new_class
    
    # Also inject it into get_bills_provider
    import re
    content = re.sub(
        r'def get_bills_provider\(\):',
        r'def get_bills_provider():\n    choice = str(settings.bills_provider or "auto").strip().lower()\n    if choice == "brendysubs":\n        return BrendysubsBillsProvider()',
        content, count=1
    )
    with open('server/app/services/bills.py', 'w') as f:
        f.write(content)
    print("Patched bills.py")
else:
    print("Already patched")
