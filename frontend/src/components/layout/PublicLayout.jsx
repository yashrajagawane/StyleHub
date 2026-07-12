import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";

export default function PublicLayout() {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: publicApi.settings,
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-28" data-testid="public-main">
        <Outlet context={{ settings }} />
      </main>
      <Footer settings={settings} />
      <FloatingWhatsApp />
    </div>
  );
}
