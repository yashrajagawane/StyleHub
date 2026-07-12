import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-x py-32 text-center" data-testid="not-found-page">
      <div className="font-display text-8xl md:text-9xl">404</div>
      <p className="mt-4 text-foreground/70">The page you're looking for is not in the collection.</p>
      <Link to="/" className="btn-primary mt-8 inline-flex">Return home</Link>
    </div>
  );
}
