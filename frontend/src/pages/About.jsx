import React from "react";
import { useOutletContext } from "react-router-dom";

export default function About() {
  const { settings } = useOutletContext() || {};
  return (
    <div className="container-x py-12" data-testid="about-page">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <div className="eyebrow mb-3">Our story</div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">Founded in a<br/>quiet corner of<br/>SoHo, 2011.</h1>
        </div>
        <div className="lg:col-span-6 lg:col-start-7 pt-4">
          <p className="text-lg leading-relaxed text-foreground/80 whitespace-pre-line">{settings?.about}</p>
          <div className="mt-10 grid grid-cols-2 gap-6">
            <div>
              <div className="font-display text-4xl">14</div>
              <div className="text-xs uppercase tracking-widerest text-foreground/60 mt-1">Years curating</div>
            </div>
            <div>
              <div className="font-display text-4xl">32</div>
              <div className="text-xs uppercase tracking-widerest text-foreground/60 mt-1">Independent houses</div>
            </div>
            <div>
              <div className="font-display text-4xl">1</div>
              <div className="text-xs uppercase tracking-widerest text-foreground/60 mt-1">SoHo atelier</div>
            </div>
            <div>
              <div className="font-display text-4xl">0</div>
              <div className="text-xs uppercase tracking-widerest text-foreground/60 mt-1">Online orders (by design)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="image-zoom-wrap aspect-[3/4] bg-secondary">
          <img src="https://images.unsplash.com/photo-1621261027519-a71ac66d5a68?w=1200&q=80" alt="Interior" className="w-full h-full object-cover" />
        </div>
        <div className="image-zoom-wrap aspect-[3/4] bg-secondary md:mt-16">
          <img src="https://images.unsplash.com/photo-1769981653696-5ce5a59263bf?w=1200&q=80" alt="Interior" className="w-full h-full object-cover" />
        </div>
        <div className="image-zoom-wrap aspect-[3/4] bg-secondary">
          <img src="https://images.unsplash.com/photo-1508964801641-4b2410705b73?w=1200&q=80" alt="Editorial" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
