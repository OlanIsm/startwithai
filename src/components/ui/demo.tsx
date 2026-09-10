"use client";

import React from "react";
import RuixenMoonChat from "@/components/ui/ruixen-moon-chat";

export default function DemoPage() {
  return (
    <main className="min-h-screen w-full bg-black text-white flex flex-col justify-between">
      {/* Chat Component */}
      <section className="flex justify-center items-start w-full flex-1">
        <RuixenMoonChat />
      </section>

      {/* Footer */}
      <footer className="text-center text-neutral-500 py-4 border-t border-neutral-800 text-sm bg-black">
        © {new Date().getFullYear()} StartWithAI Demo Page
      </footer>
    </main>
  );
}
