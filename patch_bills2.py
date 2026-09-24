import sys

with open('server/app/services/bills.py', 'r') as f:
    content = f.read()

new_class = """
from app.providers.wallettopup_provider import WallettopupProvider

class WallettopupBillsProvider:
    def __init__(self):
        self.provider = WallettopupProvider()

    def purchase_airtime(self, network: str, phone_number: str, amount: float) -> ProviderResult:
        res = self.provider.purchase_airtime(network, phone_number, amount, "")
        if res["status"] in ("success", "pending"):
            return ProviderResult(True, external_reference=res.get("provider_reference"), message=res.get("error"), meta=res)
        return ProviderResult(False, message=res.get("error"), meta=res)

    def purchase_cable(self, provider: str, smartcard_number: str, package_code: str, amount: float, phone_number: str | None = None) -> ProviderResult:
        # Not implemented yet based on docs, but we provide stub returning False
        return ProviderResult(False, message="Wallettopup cable not implemented")

    def purchase_electricity(self, disco: str, meter_number: str, meter_type: str, amount: float, phone_number: str | None = None) -> ProviderResult:
        return ProviderResult(False, message="Wallettopup electricity not implemented")

    def purchase_exam_pin(self, exam: str, quantity: int, phone_number: str | None = None, exam_type: str | None = None) -> ProviderResult:
        return ProviderResult(False, message="Wallettopup exam not implemented")

    def purchase_data(self, network: str, phone_number: str, plan_code: str, amount: float | None = None, request_id: str | None = None) -> ProviderResult:
        res = self.provider.purchase_network_data(network, phone_number, plan_code, request_id or "")
        if res["status"] in ("success", "pending"):
            return ProviderResult(True, external_reference=res.get("provider_reference"), message=res.get("error"), meta=res)
        return ProviderResult(False, message=res.get("error"), meta=res)

    def fetch_exam_packages(self, exam: str) -> list[dict]:
        return []

    def fetch_cable_packages(self, provider: str) -> list[dict]:
        return []

    def verify_cable_customer(self, provider: str, smartcard_number: str) -> dict:
        return {"ok": False, "message": "Not implemented"}

    def fetch_electricity_discos(self) -> list[dict]:
        return []

    def verify_electricity_customer(self, disco: str, meter_number: str, meter_type: str) -> dict:
        return {"ok": False, "message": "Not implemented"}

"""

if "WallettopupBillsProvider" not in content:
    content += "\n" + new_class
    
    # Inject it into get_bills_provider
    import re
    content = re.sub(
        r'def get_bills_provider\(\):',
        r'def get_bills_provider():\n    choice = str(settings.bills_provider or "auto").strip().lower()\n    if choice == "wallettopup":\n        return WallettopupBillsProvider()\n    if choice == "brendysubs":\n        return BrendysubsBillsProvider()',
        content, count=1
    )
    # Since I might have already injected brendysubs in get_bills_provider previously, 
    # let's be careful. Let's just find `if choice == "brendysubs":` and insert before it.
    
    if 'choice == "brendysubs"' in content:
        content = content.replace(
            'if choice == "brendysubs":',
            'if choice == "wallettopup":\n        return WallettopupBillsProvider()\n    if choice == "brendysubs":'
        )
    else:
        # fallback
        content = re.sub(
            r'def get_bills_provider\(\):',
            r'def get_bills_provider():\n    choice = str(settings.bills_provider or "auto").strip().lower()\n    if choice == "wallettopup":\n        return WallettopupBillsProvider()',
            content, count=1
        )
        
    with open('server/app/services/bills.py', 'w') as f:
        f.write(content)
    print("Patched bills.py")
else:
    print("Already patched")
