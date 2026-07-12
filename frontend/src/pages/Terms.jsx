import React from "react";

export default function Terms() {
  return (
    <div className="container-x py-16 max-w-3xl" data-testid="terms-page">
      <div className="eyebrow mb-3">Terms</div>
      <h1 className="font-display text-5xl leading-[0.95]">Terms of use.</h1>
      <div className="mt-8 space-y-6 text-foreground/80 leading-relaxed text-sm">
        <p>This website is provided as a digital showroom for StyleHub Boutique. All product information — availability, sizing, pricing — is subject to change without notice. Please verify with the boutique before travelling to purchase.</p>
        <p>No sale is transacted online. All purchases are completed in-store at 221B Maison Avenue, SoHo.</p>
        <p>All imagery is copyright of its respective owners and may not be reproduced without permission.</p>
      </div>
    </div>
  );
}
