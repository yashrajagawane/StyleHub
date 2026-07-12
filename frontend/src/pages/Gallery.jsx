import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import { X } from "lucide-react";

const TABS = ["all", "store", "event", "product"];

export default function Gallery() {
  const { data } = useQuery({ queryKey: ["gallery"], queryFn: () => publicApi.gallery({ active: true }) });
  const [tab, setTab] = useState("all");
  const [zoom, setZoom] = useState(null);

  const items = (data?.items || []).filter((g) => tab === "all" || g.category === tab);

  return (
    <div className="container-x py-12" data-testid="gallery-page">
      <div className="max-w-2xl mb-10">
        <div className="eyebrow mb-3">Gallery</div>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">Inside the atelier</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs uppercase tracking-widerest border capitalize ${tab === t ? "bg-foreground text-background border-foreground" : "border-foreground/20"}`}
            data-testid={`gallery-tab-${t}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
        {items.map((g) => (
          <button
            key={g.id}
            onClick={() => setZoom(g)}
            className="block mb-4 image-zoom-wrap w-full bg-secondary break-inside-avoid"
            data-testid={`gallery-item-${g.id}`}
          >
            <img src={g.image} alt={g.title} className="w-full h-auto object-cover" />
          </button>
        ))}
      </div>

      {zoom && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6" onClick={() => setZoom(null)}>
          <button className="absolute top-6 right-6 text-background" aria-label="Close"><X /></button>
          <div className="max-w-5xl">
            <img src={zoom.image} alt={zoom.title} className="max-h-[85vh] w-auto mx-auto object-contain" />
            <div className="text-background text-center mt-4">
              <div className="font-display text-xl">{zoom.title}</div>
              <div className="text-xs opacity-70">{zoom.caption}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
