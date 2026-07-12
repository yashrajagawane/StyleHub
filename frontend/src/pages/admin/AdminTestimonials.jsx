import React from "react";
import CrudManager from "@/components/admin/CrudManager";

export default function AdminTestimonials() {
  return (
    <CrudManager
      title="Testimonials"
      eyebrow="Reviews"
      endpoint="/testimonials"
      itemLabel="testimonial"
      testIdPrefix="admin-testimonials"
      defaultItem={{ name: "", role: "", avatar: "", rating: 5, quote: "", active: true }}
      fields={[
        { key: "name", label: "Name", colSpan: 3 },
        { key: "role", label: "Role", colSpan: 3 },
        { key: "avatar", label: "Avatar URL", colSpan: 6 },
        { key: "rating", label: "Rating (1-5)", type: "number", colSpan: 2 },
        { key: "active", label: "Active", type: "checkbox", colSpan: 4 },
        { key: "quote", label: "Quote", type: "textarea", colSpan: 6 },
      ]}
      columns={[
        { key: "avatar", label: "", render: (c) => c.avatar ? <img src={c.avatar} alt="" className="w-10 h-10 object-cover rounded-full" /> : null },
        { key: "name", label: "Name" },
        { key: "role", label: "Role" },
        { key: "rating", label: "Rating" },
        { key: "active", label: "Active", render: (c) => c.active ? "Yes" : "No" },
      ]}
    />
  );
}
