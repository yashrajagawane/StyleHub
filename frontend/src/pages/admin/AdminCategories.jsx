import React from "react";
import CrudManager from "@/components/admin/CrudManager";

export default function AdminCategories() {
  return (
    <CrudManager
      title="Categories"
      eyebrow="Departments"
      endpoint="/categories"
      itemLabel="category"
      testIdPrefix="admin-categories"
      defaultItem={{ name: "", slug: "", description: "", image: "", display_order: 0, active: true }}
      fields={[
        { key: "name", label: "Name", colSpan: 3 },
        { key: "slug", label: "Slug", colSpan: 3 },
        { key: "description", label: "Description", type: "textarea", colSpan: 6 },
        { key: "image", label: "Image URL", colSpan: 6 },
        { key: "display_order", label: "Order", type: "number", colSpan: 2 },
        { key: "active", label: "Active", type: "checkbox", colSpan: 2 },
      ]}
      columns={[
        { key: "image", label: "", render: (c) => c.image ? <img src={c.image} alt="" className="w-10 h-10 object-cover" /> : null },
        { key: "name", label: "Name" },
        { key: "slug", label: "Slug" },
        { key: "display_order", label: "Order" },
        { key: "active", label: "Active", render: (c) => c.active ? "Yes" : "No" },
      ]}
    />
  );
}
