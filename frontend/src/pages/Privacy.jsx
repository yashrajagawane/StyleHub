import React from "react";

export default function Privacy() {
  return (
    <div className="container-x py-16 max-w-3xl" data-testid="privacy-page">
      <div className="eyebrow mb-3">Privacy Policy</div>
      <h1 className="font-display text-5xl leading-[0.95]">A brief note on privacy.</h1>
      <div className="mt-8 space-y-6 text-foreground/80 leading-relaxed text-sm">
        <p>StyleHub Boutique is a physical retail experience. We collect only what we need to serve you: your name and contact details when you write to us or subscribe to the newsletter. We do not sell your data. We do not track you across the web. Session-level analytics help us improve the site — that's it.</p>
        <p>You may request deletion of your data at any time by writing to <a href="mailto:hello@stylehub.com" className="link-underline">hello@stylehub.com</a>.</p>
        <p>Cookies: we use minimum-necessary functional cookies (e.g., wishlist storage in your browser) and no marketing cookies.</p>
      </div>
    </div>
  );
}
