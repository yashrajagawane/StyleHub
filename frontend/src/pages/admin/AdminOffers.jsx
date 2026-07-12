import React from "react";
import CrudManager from "@/components/admin/CrudManager";

export default function AdminOffers() {
  return (
    <CrudManager
      title="Offers"
      eyebrow="Promotions"
      endpoint="/offers"
      itemLabel="offer"
      testIdPrefix="admin-offers"
      defaultItem={{ title: "", description: "", image: "", discount_percent: 0, code: "", active: true, featured: false }}
      fields={[
        { key: "title", label: "Title", colSpan: 4 },
        { key: "code", label: "Code", colSpan: 2 },
        { key: "description", label: "Description", type: "textarea", colSpan: 6 },
        { key: "image", label: "Image URL", colSpan: 6 },
        { key: "discount_percent", label: "Discount %", type: "number", colSpan: 2 },
        { key: "featured", label: "Featured", type: "checkbox", colSpan: 2 },
        { key: "active", label: "Active", type: "checkbox", colSpan: 2 },
      ]}
      columns={[
        { key: "image", label: "", render: (c) => c.image ? <img src={c.image} alt="" className="w-14 h-10 object-cover" /> : null },
        { key: "title", label: "Title" },
        { key: "code", label: "Code" },
        { key: "discount_percent", label: "%" },
        { key: "active", label: "Active", render: (c) => c.active ? "Yes" : "No" },
      ]}
    />
  );
}
