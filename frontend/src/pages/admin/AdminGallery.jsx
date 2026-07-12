import React from "react";
import CrudManager from "@/components/admin/CrudManager";

const DEFAULT_ITEM = { title: "", image: "", caption: "", category: "store", display_order: 0, active: true };

const CATEGORY_OPTIONS = [
  { value: "store", label: "Store" },
  { value: "event", label: "Event" },
  { value: "product", label: "Product" },
];

const FIELDS = [
  { key: "title", label: "Title", colSpan: 4 },
  { key: "category", label: "Category", type: "select", options: CATEGORY_OPTIONS, colSpan: 2 },
  { key: "image", label: "Image URL", colSpan: 6 },
  { key: "caption", label: "Caption", colSpan: 6 },
  { key: "display_order", label: "Order", type: "number", colSpan: 3 },
  { key: "active", label: "Active", type: "checkbox", colSpan: 3 },
];

const COLUMNS = [
  { key: "image", label: "", render: (c) => c.image ? <img src={c.image} alt="" className="w-14 h-14 object-cover" /> : null },
  { key: "title", label: "Title" },
  { key: "category", label: "Category" },
  { key: "active", label: "Active", render: (c) => c.active ? "Yes" : "No" },
];

export default function AdminGallery() {
  return (
    <CrudManager
      title="Gallery"
      eyebrow="Imagery"
      endpoint="/gallery"
      itemLabel="image"
      testIdPrefix="admin-gallery"
      defaultItem={DEFAULT_ITEM}
      fields={FIELDS}
      columns={COLUMNS}
    />
  );
}
