import React from "react";
import CrudManager from "@/components/admin/CrudManager";

const DEFAULT_ITEM = { name: "", slug: "", description: "", logo: "", featured: false, active: true };

const FIELDS = [
  { key: "name", label: "Name", colSpan: 3 },
  { key: "slug", label: "Slug", colSpan: 3 },
  { key: "description", label: "Description", type: "textarea", colSpan: 6 },
  { key: "logo", label: "Logo / Image URL", colSpan: 6 },
  { key: "featured", label: "Featured", type: "checkbox", colSpan: 3 },
  { key: "active", label: "Active", type: "checkbox", colSpan: 3 },
];

const COLUMNS = [
  { key: "logo", label: "", render: (c) => c.logo ? <img src={c.logo} alt="" className="w-10 h-10 object-cover" /> : null },
  { key: "name", label: "Name" },
  { key: "slug", label: "Slug" },
  { key: "featured", label: "Featured", render: (c) => c.featured ? "Yes" : "No" },
  { key: "active", label: "Active", render: (c) => c.active ? "Yes" : "No" },
];

export default function AdminBrands() {
  return (
    <CrudManager
      title="Brands"
      eyebrow="Houses"
      endpoint="/brands"
      itemLabel="brand"
      testIdPrefix="admin-brands"
      defaultItem={DEFAULT_ITEM}
      fields={FIELDS}
      columns={COLUMNS}
    />
  );
}
