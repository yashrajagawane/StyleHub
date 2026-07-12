"""StyleHub Backend E2E tests via public REACT_APP_BACKEND_URL."""
import os
import time
import pytest
import requests
from pathlib import Path

# Load frontend .env for REACT_APP_BACKEND_URL
FRONTEND_ENV = Path("/app/frontend/.env")
BASE_URL = None
for line in FRONTEND_ENV.read_text().splitlines():
    if line.startswith("REACT_APP_BACKEND_URL="):
        BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
        break
assert BASE_URL, "REACT_APP_BACKEND_URL not set"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@stylehub.com"
ADMIN_PASS = "Admin@12345"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["user"]["role"] == "admin"
    assert d["access_token"]
    return d["access_token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---- Auth ----
class TestAuth:
    def test_login_wrong(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_no_auth(self, s):
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_ok(self, s, auth_headers):
        r = s.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == ADMIN_EMAIL
        assert d["role"] == "admin"


# ---- Products ----
class TestProducts:
    def test_list_seeded(self, s):
        r = s.get(f"{API}/products?limit=50")
        assert r.status_code == 200
        d = r.json()
        assert d["total"] >= 12
        assert len(d["items"]) >= 12

    def test_filters(self, s):
        r = s.get(f"{API}/products?featured=true")
        assert r.status_code == 200
        for p in r.json()["items"]:
            assert p["featured"] is True

    def test_search(self, s):
        r = s.get(f"{API}/products?q=silk")
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_sort_price_asc(self, s):
        r = s.get(f"{API}/products?sort=price_asc&limit=50")
        prices = [p["price"] for p in r.json()["items"]]
        assert prices == sorted(prices)

    def test_price_range(self, s):
        r = s.get(f"{API}/products?min_price=300&max_price=500")
        for p in r.json()["items"]:
            assert 300 <= p["price"] <= 500

    def test_get_by_slug_and_views(self, s):
        r = s.get(f"{API}/products/ivory-cashmere-overcoat")
        assert r.status_code == 200
        d1 = r.json()
        v1 = d1.get("views", 0)
        # fetch again
        r2 = s.get(f"{API}/products/{d1['id']}")
        assert r2.status_code == 200
        assert r2.json().get("views", 0) >= v1 + 1

    def test_related(self, s):
        # get first product
        first = s.get(f"{API}/products?limit=1").json()["items"][0]
        r = s.get(f"{API}/products/{first['id']}/related")
        assert r.status_code == 200
        items = r.json()["items"]
        assert all(p["id"] != first["id"] for p in items)

    def test_create_requires_auth(self, s):
        r = s.post(f"{API}/products", json={"name": "x", "slug": "x", "sku": "x", "price": 1})
        assert r.status_code in (401, 403)

    def test_admin_crud_and_stock(self, s, auth_headers):
        payload = {
            "name": "TEST_ProductX", "slug": "test-product-x", "sku": "TEST-SKU-X",
            "price": 100, "stock": 10, "sizes": ["S"], "colors": ["Black"], "images": [],
        }
        r = s.post(f"{API}/products", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]
        # GET
        g = s.get(f"{API}/products/{pid}")
        assert g.status_code == 200
        assert g.json()["name"] == "TEST_ProductX"
        # Update
        payload["name"] = "TEST_ProductX2"
        u = s.put(f"{API}/products/{pid}", json=payload, headers=auth_headers)
        assert u.status_code == 200
        assert u.json()["name"] == "TEST_ProductX2"
        # Stock adjust
        st = s.post(f"{API}/products/{pid}/stock?delta=-2", headers=auth_headers)
        assert st.status_code == 200
        assert st.json()["stock"] == 8
        # Delete
        d = s.delete(f"{API}/products/{pid}", headers=auth_headers)
        assert d.status_code == 200
        # verify gone
        assert s.get(f"{API}/products/{pid}").status_code == 404


# ---- Categories, Brands, Offers, Gallery, Banners, Testimonials ----
class TestResources:
    @pytest.mark.parametrize("name,expected_min", [
        ("categories", 6), ("brands", 6), ("offers", 3),
        ("gallery", 6), ("banners", 3), ("testimonials", 3),
    ])
    def test_list(self, s, name, expected_min):
        r = s.get(f"{API}/{name}")
        assert r.status_code == 200
        assert r.json()["total"] >= expected_min

    def test_category_crud(self, s, auth_headers):
        payload = {"name": "TEST_Cat", "slug": "test-cat"}
        # unauth
        assert s.post(f"{API}/categories", json=payload).status_code in (401, 403)
        r = s.post(f"{API}/categories", json=payload, headers=auth_headers)
        assert r.status_code == 200
        cid = r.json()["id"]
        payload["name"] = "TEST_Cat2"
        u = s.put(f"{API}/categories/{cid}", json=payload, headers=auth_headers)
        assert u.status_code == 200 and u.json()["name"] == "TEST_Cat2"
        d = s.delete(f"{API}/categories/{cid}", headers=auth_headers)
        assert d.status_code == 200


# ---- Inquiries ----
class TestInquiries:
    def test_public_create_and_admin_list(self, s, auth_headers):
        payload = {"name": "TEST_Buyer", "email": "test_buyer@example.com", "message": "hello"}
        r = s.post(f"{API}/inquiries", json=payload)
        assert r.status_code == 200
        iid = r.json()["id"]
        # unauth list
        assert s.get(f"{API}/inquiries").status_code in (401, 403)
        lst = s.get(f"{API}/inquiries", headers=auth_headers)
        assert lst.status_code == 200
        assert any(i["id"] == iid for i in lst.json()["items"])
        # status update
        u = s.put(f"{API}/inquiries/{iid}?status_v=read", headers=auth_headers)
        assert u.status_code == 200
        # cleanup
        s.delete(f"{API}/inquiries/{iid}", headers=auth_headers)


# ---- Newsletter ----
class TestNewsletter:
    def test_subscribe(self, s):
        email = f"test_{int(time.time())}@example.com"
        r = s.post(f"{API}/newsletter", json={"email": email})
        assert r.status_code == 200 and r.json()["ok"] is True
        r2 = s.post(f"{API}/newsletter", json={"email": email})
        assert r2.status_code == 200
        assert "Already subscribed" in r2.json()["message"]


# ---- Settings ----
class TestSettings:
    def test_get_public(self, s):
        r = s.get(f"{API}/settings")
        assert r.status_code == 200
        assert "store_name" in r.json()

    def test_update_admin(self, s, auth_headers):
        cur = s.get(f"{API}/settings").json()
        original_tag = cur.get("tagline")
        cur["tagline"] = "TEST_TAGLINE"
        r = s.put(f"{API}/settings", json=cur, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["tagline"] == "TEST_TAGLINE"
        # restore
        cur["tagline"] = original_tag
        s.put(f"{API}/settings", json=cur, headers=auth_headers)


# ---- Analytics ----
class TestAnalytics:
    def test_summary_requires_auth(self, s):
        assert s.get(f"{API}/analytics/summary").status_code in (401, 403)

    def test_summary(self, s, auth_headers):
        r = s.get(f"{API}/analytics/summary", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ("total_products", "active_products", "low_stock", "by_category",
                  "top_products", "total_stock_value"):
            assert k in d
        assert d["total_products"] >= 12



# ---- WhatsApp Automation ----
class TestWhatsApp:
    def test_settings_has_whatsapp_defaults(self, s):
        d = s.get(f"{API}/settings").json()
        for k in ("whatsapp_enabled", "whatsapp_floating_enabled",
                  "whatsapp_floating_message", "whatsapp_inquiry_message",
                  "whatsapp_reserve_message"):
            assert k in d, f"Missing WA field: {k}"
        assert isinstance(d["whatsapp_enabled"], bool)
        assert isinstance(d["whatsapp_floating_enabled"], bool)

    def test_settings_update_wa_fields(self, s, auth_headers):
        cur = s.get(f"{API}/settings").json()
        original = {k: cur.get(k) for k in (
            "whatsapp_enabled", "whatsapp_floating_enabled",
            "whatsapp_floating_message", "whatsapp_inquiry_message",
            "whatsapp_reserve_message")}
        cur["whatsapp_enabled"] = True
        cur["whatsapp_floating_enabled"] = False
        cur["whatsapp_floating_message"] = "TEST_FLOAT"
        cur["whatsapp_inquiry_message"] = "TEST_INQ {product_name}"
        cur["whatsapp_reserve_message"] = "TEST_RES {sku}"
        r = s.put(f"{API}/settings", json=cur, headers=auth_headers)
        assert r.status_code == 200
        rd = r.json()
        assert rd["whatsapp_floating_enabled"] is False
        assert rd["whatsapp_floating_message"] == "TEST_FLOAT"
        # verify persistence
        after = s.get(f"{API}/settings").json()
        assert after["whatsapp_inquiry_message"] == "TEST_INQ {product_name}"
        assert after["whatsapp_reserve_message"] == "TEST_RES {sku}"
        # restore
        for k, v in original.items():
            cur[k] = v
        s.put(f"{API}/settings", json=cur, headers=auth_headers)

    def test_track_event(self, s):
        payload = {
            "event_type": "inquiry",
            "product_id": "test-prod-1",
            "product_name": "TEST_WA_Product",
            "product_sku": "TEST-WA-SKU",
            "size": "M",
            "color": "Black",
            "source_url": "https://example.com/products/x",
        }
        r = s.post(f"{API}/whatsapp/track", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert d["id"]

    def test_track_invalid_event_type(self, s):
        r = s.post(f"{API}/whatsapp/track", json={"event_type": "bogus"})
        assert r.status_code in (400, 422)

    def test_analytics_requires_admin(self, s):
        assert s.get(f"{API}/whatsapp/analytics").status_code in (401, 403)

    def test_analytics_and_counts_increment(self, s, auth_headers):
        # Baseline
        base = s.get(f"{API}/whatsapp/analytics", headers=auth_headers).json()
        b_total = base["total_clicks"]
        b_inq = base["inquiries"]
        b_res = base["reservations"]
        b_float = base["floating_clicks"]

        # Emit 3 events (1 each type)
        for ev in ("inquiry", "reserve", "floating"):
            r = s.post(f"{API}/whatsapp/track", json={
                "event_type": ev,
                "product_id": "wa-test-prod",
                "product_name": "TEST_WA_Analytics",
                "product_sku": "TEST-WA-AN",
            })
            assert r.status_code == 200

        after = s.get(f"{API}/whatsapp/analytics", headers=auth_headers).json()
        assert after["total_clicks"] >= b_total + 3
        assert after["inquiries"] >= b_inq + 1
        assert after["reservations"] >= b_res + 1
        assert after["floating_clicks"] >= b_float + 1
        assert isinstance(after["top_products"], list)
        assert isinstance(after["timeline"], list)
        # our product should be in top_products
        assert any(p["product_id"] == "wa-test-prod" for p in after["top_products"])

    def test_summary_includes_wa_fields(self, s, auth_headers):
        r = s.get(f"{API}/analytics/summary", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ("whatsapp_total", "whatsapp_inquiries", "whatsapp_reservations"):
            assert k in d, f"Missing {k} in summary"
            assert isinstance(d[k], int)
