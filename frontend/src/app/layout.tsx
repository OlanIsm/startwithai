import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "CodeWithAI — From idea to build plan",
  description: "Clarify your product idea, map the work, and ship an agent-ready PRD.",
};

/**
 * Global Liquid Glass SVG filter.
 * Uses feTurbulence + feDisplacementMap for a visible frosted-glass
 * distortion effect on every element that references `url(#glass-distortion)`.
 */
function GlassDistortionFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.005 0.005"
            numOctaves={2}
            seed={92}
            result="noise"
          />
          <feGaussianBlur
            in="noise"
            stdDeviation={2}
            result="blurred"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurred"
            scale={65}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>
        <GlassDistortionFilter />
        {children}
      </body>
    </html>
  );
}
