"use client";

import React from "react";
import RuixenMoonChat from "@/components/ui/ruixen-moon-chat";

export default function DemoPage() {
  return (
    <main className="min-h-screen w-full bg-[#050508] text-[#F0F0F5]">
      {/* Chat Component */}
      <section className="flex justify-center items-start w-full">
        <RuixenMoonChat />
      </section>

      {/* Footer */}
      <footer className="text-center text-[#55556A] py-2 mt-10 border-t border-white/[0.06] text-sm">
        © {new Date().getFullYear()} CodeWithAI Demo Page
      </footer>
    </main>
  );
}
