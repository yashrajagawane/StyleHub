import React from "react";
import CrudManager from "@/components/admin/CrudManager";

const DEFAULT_ITEM = { title: "", subtitle: "", image: "", cta_text: "", cta_link: "", position: "hero", display_order: 0, active: true };

const POSITION_OPTIONS = [
  { value: "hero", label: "Hero" },
  { value: "secondary", label: "Secondary" },
  { value: "promo", label: "Promo" },
];

const FIELDS = [
  { key: "title", label: "Title", colSpan: 6 },
  { key: "subtitle", label: "Subtitle", colSpan: 6 },
  { key: "image", label: "Image URL", colSpan: 6 },
  { key: "cta_text", label: "CTA Text", colSpan: 3 },
  { key: "cta_link", label: "CTA Link", colSpan: 3 },
  { key: "position", label: "Position", type: "select", options: POSITION_OPTIONS, colSpan: 3 },
  { key: "display_order", label: "Order", type: "number", colSpan: 3 },
  { key: "active", label: "Active", type: "checkbox", colSpan: 6 },
];

const COLUMNS = [
  { key: "image", label: "", render: (c) => c.image ? <img src={c.image} alt="" className="w-14 h-10 object-cover" /> : null },
  { key: "title", label: "Title" },
  { key: "position", label: "Position" },
  { key: "display_order", label: "Order" },
  { key: "active", label: "Active", render: (c) => c.active ? "Yes" : "No" },
];

export default function AdminBanners() {
  return (
    <CrudManager
      title="Homepage Banners"
      eyebrow="CMS"
      endpoint="/banners"
      itemLabel="banner"
      testIdPrefix="admin-banners"
      defaultItem={DEFAULT_ITEM}
      fields={FIELDS}
      columns={COLUMNS}
    />
  );
}
