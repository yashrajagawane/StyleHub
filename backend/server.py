"""StyleHub - Digital Clothing Shop Showcase & Inventory Management API."""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import jwt
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ---------- Setup ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'stylehub-dev-secret-change-in-prod')
JWT_ALG = 'HS256'
JWT_EXP_HOURS = 24 * 7  # 7 days

app = FastAPI(title="StyleHub API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("stylehub")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# ---------- Models ----------
class BaseDoc(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


# Auth
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str


# Category
class CategoryIn(BaseModel):
    name: str
    slug: str
    description: Optional[str] = ""
    image: Optional[str] = ""
    parent_id: Optional[str] = None
    display_order: int = 0
    active: bool = True


class Category(BaseDoc, CategoryIn):
    pass


# Brand
class BrandIn(BaseModel):
    name: str
    slug: str
    description: Optional[str] = ""
    logo: Optional[str] = ""
    featured: bool = False
    active: bool = True


class Brand(BaseDoc, BrandIn):
    pass


# Product
class ProductIn(BaseModel):
    name: str
    slug: str
    sku: str
    description: str = ""
    short_description: str = ""
    brand_id: Optional[str] = None
    category_id: Optional[str] = None
    subcategory_id: Optional[str] = None
    gender: Literal["men", "women", "unisex", "kids"] = "unisex"
    price: float
    discount_price: Optional[float] = None
    stock: int = 0
    low_stock_threshold: int = 5
    sizes: List[str] = []
    colors: List[str] = []
    material: str = ""
    pattern: str = ""
    fit: str = ""
    sleeve: str = ""
    washing_instructions: str = ""
    images: List[str] = []
    featured: bool = False
    trending: bool = False
    new_arrival: bool = False
    best_seller: bool = False
    on_offer: bool = False
    active: bool = True
    tags: List[str] = []


class Product(BaseDoc, ProductIn):
    views: int = 0


# Offer
class OfferIn(BaseModel):
    title: str
    description: str = ""
    image: str = ""
    discount_percent: Optional[float] = None
    code: Optional[str] = ""
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    active: bool = True
    featured: bool = False


class Offer(BaseDoc, OfferIn):
    pass


# Gallery
class GalleryIn(BaseModel):
    title: str
    image: str
    caption: str = ""
    category: str = "store"  # store, event, product
    display_order: int = 0
    active: bool = True


class Gallery(BaseDoc, GalleryIn):
    pass


# Banner / Homepage CMS
class BannerIn(BaseModel):
    title: str
    subtitle: str = ""
    image: str
    cta_text: str = ""
    cta_link: str = ""
    position: str = "hero"  # hero, secondary, promo
    display_order: int = 0
    active: bool = True


class Banner(BaseDoc, BannerIn):
    pass


# Testimonial
class TestimonialIn(BaseModel):
    name: str
    role: str = ""
    avatar: str = ""
    rating: int = 5
    quote: str
    active: bool = True


class Testimonial(BaseDoc, TestimonialIn):
    pass


# Inquiry (Contact)
class InquiryIn(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    subject: str = ""
    message: str
    product_id: Optional[str] = None


class Inquiry(BaseDoc, InquiryIn):
    status: str = "new"  # new, read, replied, archived


# Settings
class StoreSettings(BaseModel):
    store_name: str = "StyleHub Boutique"
    tagline: str = "Where fashion meets soul."
    about: str = ""
    email: str = "hello@stylehub.com"
    phone: str = "+1 (555) 010-2050"
    whatsapp: str = "15550102050"
    address: str = "221B Maison Avenue, SoHo, New York, NY 10012"
    city: str = "New York"
    country: str = "USA"
    map_lat: float = 40.7230
    map_lng: float = -74.0007
    business_hours: dict = Field(default_factory=lambda: {
        "Mon-Fri": "10:00 AM – 8:00 PM",
        "Saturday": "10:00 AM – 9:00 PM",
        "Sunday": "12:00 PM – 6:00 PM",
    })
    social: dict = Field(default_factory=lambda: {
        "instagram": "https://instagram.com/stylehub",
        "facebook": "https://facebook.com/stylehub",
        "twitter": "https://twitter.com/stylehub",
        "pinterest": "https://pinterest.com/stylehub",
    })


# ---------- Auth utilities ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(payload: dict) -> str:
    data = payload.copy()
    data['exp'] = datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS)
    return jwt.encode(data, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_admin(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------- Helpers ----------
async def upsert_settings(data: dict):
    await db.settings.update_one(
        {"_key": "main"},
        {"$set": {**data, "_key": "main", "updated_at": now_iso()}},
        upsert=True,
    )


async def get_settings() -> dict:
    doc = await db.settings.find_one({"_key": "main"}, {"_id": 0, "_key": 0})
    if not doc:
        default = StoreSettings().model_dump()
        default["updated_at"] = now_iso()
        await upsert_settings(default)
        return default
    return doc


def clean(doc: dict) -> dict:
    if doc:
        doc.pop("_id", None)
    return doc


# ---------- Auth Routes ----------
@api_router.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": user["id"], "role": user["role"]})
    return TokenResponse(
        access_token=token,
        user={"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]},
    )


@api_router.get("/auth/me", response_model=UserOut)
async def me(admin=Depends(get_current_admin)):
    return UserOut(id=admin["id"], email=admin["email"], name=admin["name"], role=admin["role"])


# ---------- Generic CRUD factory ----------
def crud_router(name: str, in_model, out_model, collection: str, admin_only_write=True):
    r = APIRouter(prefix=f"/{name}", tags=[name])

    @r.get("")
    async def list_items(
        active: Optional[bool] = None,
        featured: Optional[bool] = None,
        limit: int = Query(200, le=500),
        skip: int = 0,
        q: Optional[str] = None,
    ):
        query = {}
        if active is not None:
            query["active"] = active
        if featured is not None:
            query["featured"] = featured
        if q:
            query["name"] = {"$regex": q, "$options": "i"}
        cursor = db[collection].find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
        items = await cursor.to_list(limit)
        total = await db[collection].count_documents(query)
        return {"items": items, "total": total}

    @r.get("/{item_id}")
    async def get_item(item_id: str):
        doc = await db[collection].find_one({"id": item_id}, {"_id": 0})
        if not doc:
            raise HTTPException(404, "Not found")
        return doc

    @r.post("")
    async def create_item(payload: in_model, admin=Depends(get_current_admin) if admin_only_write else None):  # type: ignore
        obj = out_model(**payload.model_dump())
        doc = obj.model_dump()
        await db[collection].insert_one(doc)
        return clean(doc)

    @r.put("/{item_id}")
    async def update_item(item_id: str, payload: in_model, admin=Depends(get_current_admin)):
        data = payload.model_dump()
        data["updated_at"] = now_iso()
        res = await db[collection].update_one({"id": item_id}, {"$set": data})
        if res.matched_count == 0:
            raise HTTPException(404, "Not found")
        doc = await db[collection].find_one({"id": item_id}, {"_id": 0})
        return doc

    @r.delete("/{item_id}")
    async def delete_item(item_id: str, admin=Depends(get_current_admin)):
        res = await db[collection].delete_one({"id": item_id})
        if res.deleted_count == 0:
            raise HTTPException(404, "Not found")
        return {"ok": True}

    return r


# ---------- Categories ----------
categories_router = crud_router("categories", CategoryIn, Category, "categories")
api_router.include_router(categories_router)

# ---------- Brands ----------
brands_router = crud_router("brands", BrandIn, Brand, "brands")
api_router.include_router(brands_router)

# ---------- Offers ----------
offers_router = crud_router("offers", OfferIn, Offer, "offers")
api_router.include_router(offers_router)

# ---------- Gallery ----------
gallery_router = crud_router("gallery", GalleryIn, Gallery, "gallery")
api_router.include_router(gallery_router)

# ---------- Banners ----------
banners_router = crud_router("banners", BannerIn, Banner, "banners")
api_router.include_router(banners_router)

# ---------- Testimonials ----------
testimonials_router = crud_router("testimonials", TestimonialIn, Testimonial, "testimonials")
api_router.include_router(testimonials_router)


# ---------- Products (custom: richer filters) ----------
@api_router.get("/products")
async def list_products(
    q: Optional[str] = None,
    category_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    gender: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    size: Optional[str] = None,
    color: Optional[str] = None,
    featured: Optional[bool] = None,
    trending: Optional[bool] = None,
    new_arrival: Optional[bool] = None,
    best_seller: Optional[bool] = None,
    on_offer: Optional[bool] = None,
    active: Optional[bool] = True,
    sort: str = "newest",  # newest, price_asc, price_desc, name
    limit: int = Query(24, le=200),
    skip: int = 0,
):
    query = {}
    if active is not None:
        query["active"] = active
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"sku": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]
    if category_id:
        query["category_id"] = category_id
    if brand_id:
        query["brand_id"] = brand_id
    if gender:
        query["gender"] = gender
    if size:
        query["sizes"] = size
    if color:
        query["colors"] = color
    if featured is not None:
        query["featured"] = featured
    if trending is not None:
        query["trending"] = trending
    if new_arrival is not None:
        query["new_arrival"] = new_arrival
    if best_seller is not None:
        query["best_seller"] = best_seller
    if on_offer is not None:
        query["on_offer"] = on_offer
    price_q = {}
    if min_price is not None:
        price_q["$gte"] = min_price
    if max_price is not None:
        price_q["$lte"] = max_price
    if price_q:
        query["price"] = price_q

    sort_map = {
        "newest": [("created_at", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "name": [("name", 1)],
    }
    sort_spec = sort_map.get(sort, sort_map["newest"])

    total = await db.products.count_documents(query)
    cursor = db.products.find(query, {"_id": 0}).sort(sort_spec).skip(skip).limit(limit)
    items = await cursor.to_list(limit)
    return {"items": items, "total": total}


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        # try slug
        doc = await db.products.find_one({"slug": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product not found")
    # increment views (fire and forget)
    await db.products.update_one({"id": doc["id"]}, {"$inc": {"views": 1}})
    return doc


@api_router.post("/products")
async def create_product(payload: ProductIn, admin=Depends(get_current_admin)):
    obj = Product(**payload.model_dump())
    doc = obj.model_dump()
    await db.products.insert_one(doc)
    return clean(doc)


@api_router.put("/products/{product_id}")
async def update_product(product_id: str, payload: ProductIn, admin=Depends(get_current_admin)):
    data = payload.model_dump()
    data["updated_at"] = now_iso()
    res = await db.products.update_one({"id": product_id}, {"$set": data})
    if res.matched_count == 0:
        raise HTTPException(404, "Product not found")
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return doc


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin=Depends(get_current_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Product not found")
    return {"ok": True}


@api_router.post("/products/{product_id}/stock")
async def adjust_stock(product_id: str, delta: int, reason: str = "manual", admin=Depends(get_current_admin)):
    doc = await db.products.find_one({"id": product_id})
    if not doc:
        raise HTTPException(404, "Product not found")
    new_stock = max(0, doc.get("stock", 0) + delta)
    await db.products.update_one({"id": product_id}, {"$set": {"stock": new_stock, "updated_at": now_iso()}})
    await db.stock_history.insert_one({
        "id": new_id(),
        "product_id": product_id,
        "delta": delta,
        "resulting_stock": new_stock,
        "reason": reason,
        "created_at": now_iso(),
    })
    return {"id": product_id, "stock": new_stock}


@api_router.get("/products/{product_id}/related")
async def related_products(product_id: str, limit: int = 6):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    query = {"id": {"$ne": product_id}, "active": True}
    if doc.get("category_id"):
        query["category_id"] = doc["category_id"]
    items = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
    if len(items) < limit:
        extra = await db.products.find(
            {"id": {"$ne": product_id}, "active": True},
            {"_id": 0},
        ).limit(limit - len(items)).to_list(limit)
        ids = {i["id"] for i in items}
        items += [e for e in extra if e["id"] not in ids]
    return {"items": items[:limit]}


# ---------- Inquiries ----------
@api_router.post("/inquiries")
async def create_inquiry(payload: InquiryIn):
    obj = Inquiry(**payload.model_dump())
    await db.inquiries.insert_one(obj.model_dump())
    return {"ok": True, "id": obj.id}


@api_router.get("/inquiries")
async def list_inquiries(admin=Depends(get_current_admin), limit: int = 100, status_f: Optional[str] = None):
    query = {}
    if status_f:
        query["status"] = status_f
    items = await db.inquiries.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    total = await db.inquiries.count_documents(query)
    return {"items": items, "total": total}


@api_router.put("/inquiries/{inquiry_id}")
async def update_inquiry(inquiry_id: str, status_v: str, admin=Depends(get_current_admin)):
    res = await db.inquiries.update_one({"id": inquiry_id}, {"$set": {"status": status_v, "updated_at": now_iso()}})
    if res.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


@api_router.delete("/inquiries/{inquiry_id}")
async def delete_inquiry(inquiry_id: str, admin=Depends(get_current_admin)):
    res = await db.inquiries.delete_one({"id": inquiry_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


# ---------- Newsletter ----------
class NewsletterIn(BaseModel):
    email: EmailStr


@api_router.post("/newsletter")
async def newsletter_subscribe(payload: NewsletterIn):
    existing = await db.newsletter.find_one({"email": payload.email})
    if existing:
        return {"ok": True, "message": "Already subscribed"}
    await db.newsletter.insert_one({
        "id": new_id(),
        "email": payload.email,
        "created_at": now_iso(),
    })
    return {"ok": True, "message": "Subscribed successfully"}


# ---------- Settings ----------
@api_router.get("/settings")
async def get_settings_route():
    return await get_settings()


@api_router.put("/settings")
async def update_settings(payload: StoreSettings, admin=Depends(get_current_admin)):
    data = payload.model_dump()
    await upsert_settings(data)
    return await get_settings()


# ---------- Analytics ----------
@api_router.get("/analytics/summary")
async def analytics_summary(admin=Depends(get_current_admin)):
    total_products = await db.products.count_documents({})
    active_products = await db.products.count_documents({"active": True})
    low_stock = await db.products.count_documents({"$expr": {"$lte": ["$stock", "$low_stock_threshold"]}})
    total_categories = await db.categories.count_documents({})
    total_brands = await db.brands.count_documents({})
    total_offers = await db.offers.count_documents({"active": True})
    total_inquiries = await db.inquiries.count_documents({})
    new_inquiries = await db.inquiries.count_documents({"status": "new"})
    newsletter_subs = await db.newsletter.count_documents({})

    # top viewed
    top_products = await db.products.find({}, {"_id": 0}).sort("views", -1).limit(5).to_list(5)

    # By category
    pipeline = [
        {"$group": {"_id": "$category_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    by_cat = await db.products.aggregate(pipeline).to_list(20)
    cat_names = {c["id"]: c["name"] async for c in db.categories.find({}, {"_id": 0})}
    by_category = [{"name": cat_names.get(b["_id"], "Uncategorized"), "count": b["count"]} for b in by_cat]

    total_stock_value = 0.0
    async for p in db.products.find({}, {"_id": 0, "price": 1, "stock": 1}):
        total_stock_value += (p.get("price", 0) or 0) * (p.get("stock", 0) or 0)

    return {
        "total_products": total_products,
        "active_products": active_products,
        "low_stock": low_stock,
        "total_categories": total_categories,
        "total_brands": total_brands,
        "total_offers": total_offers,
        "total_inquiries": total_inquiries,
        "new_inquiries": new_inquiries,
        "newsletter_subs": newsletter_subs,
        "top_products": top_products,
        "by_category": by_category,
        "total_stock_value": round(total_stock_value, 2),
    }


# ---------- Health ----------
@api_router.get("/")
async def root():
    return {"service": "StyleHub API", "status": "ok", "time": now_iso()}


# ---------- Seed ----------
SEED_IMAGES = {
    "hero1": "https://images.unsplash.com/photo-1659522761084-79196b64abe4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHwzfHxmYXNoaW9uJTIwbW9kZWwlMjBlZGl0b3JpYWx8ZW58MHx8fHwxNzgzODM3NjU3fDA&ixlib=rb-4.1.0&q=85",
    "hero2": "https://images.unsplash.com/photo-1613915617430-8ab0fd7c6baf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBlZGl0b3JpYWx8ZW58MHx8fHwxNzgzODM3NjU3fDA&ixlib=rb-4.1.0&q=85",
    "hero3": "https://images.unsplash.com/photo-1508964801641-4b2410705b73?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHw0fHxmYXNoaW9uJTIwbW9kZWwlMjBlZGl0b3JpYWx8ZW58MHx8fHwxNzgzODM3NjU3fDA&ixlib=rb-4.1.0&q=85",
    "boutique1": "https://images.unsplash.com/photo-1621261027519-a71ac66d5a68?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjbG90aGluZyUyMGJvdXRpcXVlJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzgzODM3NjU3fDA&ixlib=rb-4.1.0&q=85",
    "boutique2": "https://images.unsplash.com/photo-1769981653696-5ce5a59263bf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjBjbG90aGluZyUyMGJvdXRpcXVlJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzgzODM3NjU3fDA&ixlib=rb-4.1.0&q=85",
    "flatlay": "https://images.unsplash.com/photo-1713929644020-1cdf48ca0d12?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHw0fHxwcmVtaXVtJTIwY2xvdGhpbmclMjBwcm9kdWN0JTIwc2hvdHxlbnwwfHx8fDE3ODM4Mzc2NTd8MA&ixlib=rb-4.1.0&q=85",
    # extra product-style images (Unsplash source)
    "p1": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
    "p2": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=80",
    "p3": "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1200&q=80",
    "p4": "https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&q=80",
    "p5": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1200&q=80",
    "p6": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=80",
    "p7": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1200&q=80",
    "p8": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&q=80",
    "p9": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=80",
    "p10": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80",
    "p11": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&q=80",
    "p12": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&q=80",
    "avatar1": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    "avatar2": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    "avatar3": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
}


async def seed_database():
    # Admin user
    existing_admin = await db.users.find_one({"email": "admin@stylehub.com"})
    if not existing_admin:
        await db.users.insert_one({
            "id": new_id(),
            "email": "admin@stylehub.com",
            "name": "Isabella Moreau",
            "role": "admin",
            "password_hash": hash_password("Admin@12345"),
            "created_at": now_iso(),
            "updated_at": now_iso(),
        })
        logger.info("Seeded admin user")

    # Settings
    settings_doc = await db.settings.find_one({"_key": "main"})
    if not settings_doc:
        default = StoreSettings(
            about=(
                "Founded in 2011 in the heart of SoHo, StyleHub Boutique curates timeless silhouettes "
                "for the modern minimalist. Every garment is hand-selected — a quiet study in fabric, "
                "form, and finish. Visit us in-store to experience the collection in full."
            )
        ).model_dump()
        await upsert_settings(default)
        logger.info("Seeded settings")

    # Categories
    if await db.categories.count_documents({}) == 0:
        cats = [
            {"name": "Outerwear", "slug": "outerwear", "description": "Coats, jackets, blazers.", "image": SEED_IMAGES["p2"], "display_order": 1},
            {"name": "Knitwear", "slug": "knitwear", "description": "Cashmere, wool, cotton knits.", "image": SEED_IMAGES["p5"], "display_order": 2},
            {"name": "Dresses", "slug": "dresses", "description": "Day to evening.", "image": SEED_IMAGES["hero1"], "display_order": 3},
            {"name": "Shirts", "slug": "shirts", "description": "Poplin, silk, linen.", "image": SEED_IMAGES["p3"], "display_order": 4},
            {"name": "Trousers", "slug": "trousers", "description": "Tailored & relaxed.", "image": SEED_IMAGES["p4"], "display_order": 5},
            {"name": "Accessories", "slug": "accessories", "description": "Bags, belts, scarves.", "image": SEED_IMAGES["p9"], "display_order": 6},
        ]
        for c in cats:
            obj = Category(**{**c, "active": True})
            await db.categories.insert_one(obj.model_dump())
        logger.info("Seeded categories")

    # Brands
    if await db.brands.count_documents({}) == 0:
        brands = [
            {"name": "Maison Vela", "slug": "maison-vela", "description": "Parisian slow-fashion house.", "logo": SEED_IMAGES["boutique1"], "featured": True},
            {"name": "Nord & Line", "slug": "nord-line", "description": "Scandinavian minimalist tailoring.", "logo": SEED_IMAGES["boutique2"], "featured": True},
            {"name": "Atelier Kōgei", "slug": "atelier-kogei", "description": "Kyoto craftsmanship, modern silhouettes.", "logo": SEED_IMAGES["flatlay"], "featured": True},
            {"name": "Ravello", "slug": "ravello", "description": "Italian resort essentials.", "logo": SEED_IMAGES["hero2"], "featured": True},
            {"name": "House of Ember", "slug": "house-of-ember", "description": "British heritage outerwear.", "logo": SEED_IMAGES["hero3"], "featured": False},
            {"name": "Studio Neuve", "slug": "studio-neuve", "description": "Contemporary Montréal knitwear.", "logo": SEED_IMAGES["p11"], "featured": False},
        ]
        for b in brands:
            obj = Brand(**{**b, "active": True})
            await db.brands.insert_one(obj.model_dump())
        logger.info("Seeded brands")

    # Fetch back
    cats = await db.categories.find({}, {"_id": 0}).to_list(50)
    brands = await db.brands.find({}, {"_id": 0}).to_list(50)
    cat_by_slug = {c["slug"]: c for c in cats}
    brand_by_slug = {b["slug"]: b for b in brands}

    # Products
    if await db.products.count_documents({}) == 0:
        products = [
            {
                "name": "Ivory Cashmere Overcoat",
                "slug": "ivory-cashmere-overcoat",
                "sku": "MV-OC-01",
                "cat": "outerwear", "brand": "maison-vela",
                "gender": "women",
                "price": 1290, "discount_price": 990,
                "stock": 8, "sizes": ["XS", "S", "M", "L"], "colors": ["Ivory", "Camel"],
                "material": "100% Cashmere", "pattern": "Solid", "fit": "Relaxed",
                "sleeve": "Long", "washing_instructions": "Dry clean only.",
                "images": [SEED_IMAGES["hero1"], SEED_IMAGES["p2"], SEED_IMAGES["p12"]],
                "featured": True, "trending": True, "new_arrival": True, "on_offer": True,
                "short_description": "A floor-grazing overcoat cut from featherlight Mongolian cashmere.",
                "description": "Cut from featherlight Mongolian cashmere in a floor-grazing silhouette, this overcoat is engineered for cold-weather elegance. Softly padded shoulders, patch pockets, and a self-tie belt let you dial the volume up or down.",
                "tags": ["luxury", "winter", "cashmere"],
            },
            {
                "name": "Onyx Wool Blazer",
                "slug": "onyx-wool-blazer",
                "sku": "NL-BZ-04",
                "cat": "outerwear", "brand": "nord-line",
                "gender": "women",
                "price": 690,
                "stock": 12, "sizes": ["XS", "S", "M", "L"], "colors": ["Black"],
                "material": "Virgin wool", "pattern": "Solid", "fit": "Tailored",
                "sleeve": "Long", "washing_instructions": "Dry clean.",
                "images": [SEED_IMAGES["hero2"], SEED_IMAGES["p3"]],
                "featured": True, "trending": True, "best_seller": True,
                "short_description": "Sharp shoulders, single button, a modern classic.",
                "description": "The blazer that anchors any wardrobe. Cut from Italian virgin wool, tailored through the waist with grosgrain-lined lapels.",
                "tags": ["tailoring", "workwear"],
            },
            {
                "name": "Kyoto Ribbed Turtleneck",
                "slug": "kyoto-ribbed-turtleneck",
                "sku": "AK-KN-08",
                "cat": "knitwear", "brand": "atelier-kogei",
                "gender": "unisex",
                "price": 320,
                "stock": 22, "sizes": ["S", "M", "L", "XL"], "colors": ["Charcoal", "Cream", "Wine"],
                "material": "Merino wool", "pattern": "Ribbed",
                "images": [SEED_IMAGES["p5"], SEED_IMAGES["p11"]],
                "trending": True, "new_arrival": True, "best_seller": True,
                "short_description": "The everyday layer, in soft Australian merino.",
                "description": "Fine-gauge merino turtleneck, ribbed throughout. Made in a Kyoto workshop with 3-generation knitters.",
                "tags": ["knitwear", "essentials"],
            },
            {
                "name": "Silk Slip Dress — Bordeaux",
                "slug": "silk-slip-dress-bordeaux",
                "sku": "RV-DR-11",
                "cat": "dresses", "brand": "ravello",
                "gender": "women",
                "price": 490, "discount_price": 390,
                "stock": 6, "sizes": ["XS", "S", "M"], "colors": ["Bordeaux", "Champagne"],
                "material": "100% Silk", "pattern": "Solid", "fit": "Bias cut",
                "images": [SEED_IMAGES["hero3"], SEED_IMAGES["p8"]],
                "featured": True, "on_offer": True, "trending": True,
                "short_description": "Bias-cut silk, cut to move with you.",
                "description": "A pared-back slip that will outlast every trend. Bias-cut in French silk with adjustable spaghetti straps.",
                "tags": ["silk", "eveningwear"],
            },
            {
                "name": "Poplin Sculpted Shirt",
                "slug": "poplin-sculpted-shirt",
                "sku": "NL-SH-02",
                "cat": "shirts", "brand": "nord-line",
                "gender": "women",
                "price": 245,
                "stock": 15, "sizes": ["XS", "S", "M", "L"], "colors": ["White", "Ecru"],
                "material": "Cotton poplin", "pattern": "Solid",
                "images": [SEED_IMAGES["p3"], SEED_IMAGES["p12"]],
                "new_arrival": True,
                "short_description": "A shirt that quietly rewrites the rules.",
                "description": "Architectural cotton poplin shirt with a sculpted back and mother-of-pearl buttons.",
                "tags": ["essentials", "shirting"],
            },
            {
                "name": "Wide-Leg Tailored Trouser",
                "slug": "wide-leg-tailored-trouser",
                "sku": "MV-TR-06",
                "cat": "trousers", "brand": "maison-vela",
                "gender": "women",
                "price": 380,
                "stock": 18, "sizes": ["XS", "S", "M", "L"], "colors": ["Black", "Sand", "Navy"],
                "material": "Wool blend", "pattern": "Solid", "fit": "Wide leg",
                "images": [SEED_IMAGES["p4"], SEED_IMAGES["p2"]],
                "best_seller": True, "featured": True,
                "short_description": "Fluid trousers, engineered for drape.",
                "description": "A high-rise, wide-leg trouser tailored to skim without clinging. Discreet side-pockets.",
                "tags": ["tailoring", "essentials"],
            },
            {
                "name": "House of Ember Trench",
                "slug": "house-of-ember-trench",
                "sku": "HE-TR-01",
                "cat": "outerwear", "brand": "house-of-ember",
                "gender": "unisex",
                "price": 1490,
                "stock": 4, "sizes": ["S", "M", "L", "XL"], "colors": ["Sand"],
                "material": "Waxed cotton", "pattern": "Solid",
                "images": [SEED_IMAGES["p1"], SEED_IMAGES["hero3"]],
                "featured": True, "new_arrival": True,
                "short_description": "The trench, quietly rebuilt.",
                "description": "British-made trench in waxed cotton with horn buttons and storm flaps. A garment for a lifetime.",
                "tags": ["heritage", "outerwear"],
            },
            {
                "name": "Boiled Wool Cardigan",
                "slug": "boiled-wool-cardigan",
                "sku": "SN-KN-14",
                "cat": "knitwear", "brand": "studio-neuve",
                "gender": "unisex",
                "price": 420,
                "stock": 10, "sizes": ["S", "M", "L"], "colors": ["Oat", "Slate"],
                "material": "Boiled wool", "pattern": "Solid",
                "images": [SEED_IMAGES["p11"], SEED_IMAGES["p5"]],
                "trending": True,
                "short_description": "Sculptural, warm, unbothered.",
                "description": "Cocooning boiled wool cardigan with dropped shoulders and horn toggles.",
                "tags": ["knitwear"],
            },
            {
                "name": "Structured Leather Tote",
                "slug": "structured-leather-tote",
                "sku": "RV-AC-05",
                "cat": "accessories", "brand": "ravello",
                "gender": "women",
                "price": 690,
                "stock": 9, "sizes": ["One Size"], "colors": ["Cognac", "Black"],
                "material": "Italian leather",
                "images": [SEED_IMAGES["p9"], SEED_IMAGES["p12"]],
                "featured": True, "best_seller": True,
                "short_description": "Everyday carry, elevated.",
                "description": "A structured tote in vegetable-tanned Italian leather. Interior slip pocket. Ages beautifully.",
                "tags": ["leather", "accessories"],
            },
            {
                "name": "Linen Camp Shirt",
                "slug": "linen-camp-shirt",
                "sku": "RV-SH-07",
                "cat": "shirts", "brand": "ravello",
                "gender": "men",
                "price": 260,
                "stock": 14, "sizes": ["S", "M", "L", "XL"], "colors": ["Sand", "Sea", "Rust"],
                "material": "100% Linen", "pattern": "Solid",
                "images": [SEED_IMAGES["p6"], SEED_IMAGES["p7"]],
                "new_arrival": True,
                "short_description": "For long summers by the sea.",
                "description": "Airy Italian linen camp shirt with an open collar and pearlescent buttons.",
                "tags": ["linen", "summer"],
            },
            {
                "name": "Pleated Midi Skirt",
                "slug": "pleated-midi-skirt",
                "sku": "MV-SK-03",
                "cat": "dresses", "brand": "maison-vela",
                "gender": "women",
                "price": 340, "discount_price": 260,
                "stock": 11, "sizes": ["XS", "S", "M", "L"], "colors": ["Ivory", "Black"],
                "material": "Recycled polyester", "pattern": "Pleated",
                "images": [SEED_IMAGES["p8"], SEED_IMAGES["hero1"]],
                "on_offer": True, "trending": True,
                "short_description": "Pleats that move like water.",
                "description": "An accordion-pleated midi skirt with a satin-finish hand.",
                "tags": ["skirt", "eveningwear"],
            },
            {
                "name": "Merino Crewneck Sweater",
                "slug": "merino-crewneck-sweater",
                "sku": "SN-KN-02",
                "cat": "knitwear", "brand": "studio-neuve",
                "gender": "men",
                "price": 285,
                "stock": 20, "sizes": ["S", "M", "L", "XL"], "colors": ["Navy", "Grey", "Bordeaux"],
                "material": "Merino wool", "pattern": "Solid",
                "images": [SEED_IMAGES["p10"], SEED_IMAGES["p11"]],
                "best_seller": True,
                "short_description": "The crewneck, done properly.",
                "description": "Fine-gauge merino crewneck with a clean rib and reinforced elbows.",
                "tags": ["knitwear", "essentials"],
            },
        ]
        for p in products:
            cat = cat_by_slug.get(p.pop("cat"))
            brand = brand_by_slug.get(p.pop("brand"))
            obj = Product(**{
                **p,
                "category_id": cat["id"] if cat else None,
                "brand_id": brand["id"] if brand else None,
            })
            await db.products.insert_one(obj.model_dump())
        logger.info("Seeded products")

    # Banners
    if await db.banners.count_documents({}) == 0:
        banners = [
            {"title": "Autumn Volume 01", "subtitle": "The Overcoat Edit — arriving now.", "image": SEED_IMAGES["hero1"], "cta_text": "See the Edit", "cta_link": "/products?trending=true", "position": "hero", "display_order": 1},
            {"title": "Made to Last", "subtitle": "Heritage tailoring, quietly rebuilt.", "image": SEED_IMAGES["hero2"], "cta_text": "Explore Tailoring", "cta_link": "/categories", "position": "hero", "display_order": 2},
            {"title": "Weekend Only — 20% off Silk", "subtitle": "In-store & by appointment.", "image": SEED_IMAGES["hero3"], "cta_text": "View Offers", "cta_link": "/offers", "position": "promo", "display_order": 3},
        ]
        for b in banners:
            await db.banners.insert_one(Banner(**{**b, "active": True}).model_dump())
        logger.info("Seeded banners")

    # Offers
    if await db.offers.count_documents({}) == 0:
        offers = [
            {"title": "Cashmere Week", "description": "Enjoy 20% off cashmere pieces, this weekend only, in-store.", "image": SEED_IMAGES["hero1"], "discount_percent": 20, "code": "CASHMERE20", "featured": True},
            {"title": "First-Look Program", "description": "Reserve new arrivals 48 hours before public release.", "image": SEED_IMAGES["hero2"], "code": "FIRSTLOOK", "featured": True},
            {"title": "Silk Slip Trio", "description": "Buy any two silk pieces, receive a third at 30% off.", "image": SEED_IMAGES["p8"], "discount_percent": 30, "code": "SILK3"},
        ]
        for o in offers:
            await db.offers.insert_one(Offer(**{**o, "active": True}).model_dump())
        logger.info("Seeded offers")

    # Gallery
    if await db.gallery.count_documents({}) == 0:
        items = [
            {"title": "The SoHo Atelier", "image": SEED_IMAGES["boutique1"], "caption": "Our flagship on Maison Avenue.", "category": "store", "display_order": 1},
            {"title": "Winter Preview", "image": SEED_IMAGES["boutique2"], "caption": "Behind the scenes.", "category": "event", "display_order": 2},
            {"title": "Studio Flatlay 01", "image": SEED_IMAGES["flatlay"], "caption": "Season textures.", "category": "product", "display_order": 3},
            {"title": "Editorial 02", "image": SEED_IMAGES["hero2"], "caption": "Volume 01 lookbook.", "category": "event", "display_order": 4},
            {"title": "Trench Detail", "image": SEED_IMAGES["p1"], "caption": "House of Ember.", "category": "product", "display_order": 5},
            {"title": "The Fitting Room", "image": SEED_IMAGES["p12"], "caption": "By appointment.", "category": "store", "display_order": 6},
        ]
        for g in items:
            await db.gallery.insert_one(Gallery(**{**g, "active": True}).model_dump())
        logger.info("Seeded gallery")

    # Testimonials
    if await db.testimonials.count_documents({}) == 0:
        items = [
            {"name": "Amelia Chen", "role": "Editor, Foundry Magazine", "avatar": SEED_IMAGES["avatar1"], "rating": 5, "quote": "The kind of store you can spend an entire afternoon in. Every piece has a soul."},
            {"name": "Marcus Delacroix", "role": "Architect", "avatar": SEED_IMAGES["avatar3"], "rating": 5, "quote": "Impeccable curation. I've been dressing here since 2016 and never once bought a thing I regretted."},
            {"name": "Priya Nair", "role": "Creative Director", "avatar": SEED_IMAGES["avatar2"], "rating": 5, "quote": "The staff know their fabrics. That alone is rare enough to make StyleHub my only stop."},
        ]
        for t in items:
            await db.testimonials.insert_one(Testimonial(**{**t, "active": True}).model_dump())
        logger.info("Seeded testimonials")

    logger.info("Seed complete.")


# ---------- Include router ----------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    try:
        await seed_database()
    except Exception as e:
        logger.exception("Seeding failed: %s", e)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
