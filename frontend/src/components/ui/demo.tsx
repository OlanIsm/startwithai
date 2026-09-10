"use client";

import React from "react";
import RuixenMoonChat from "@/components/ui/ruixen-moon-chat";

export default function DemoPage() {
  return (
    <main className="w-screen h-screen max-h-screen overflow-hidden bg-[#F6F6F6] text-[#1A1A1A] flex flex-col justify-between select-none">
      {/* Chat Component Fullscreen */}
      <section className="flex-1 w-full h-full overflow-hidden">
        <RuixenMoonChat />
      </section>
    </main>
  );
}
