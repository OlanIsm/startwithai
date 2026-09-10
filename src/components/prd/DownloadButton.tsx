"use client";

import { Download } from "lucide-react";

interface DownloadButtonProps {
  markdown: string;
  className?: string;
}

export function DownloadButton({ markdown, className = "" }: DownloadButtonProps) {
  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prd.md";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" className={className} onClick={download} disabled={!markdown}>
      <Download size={16} /> Download prd.md
    </button>
  );
}
