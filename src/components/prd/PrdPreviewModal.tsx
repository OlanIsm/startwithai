"use client";

import { Check, Clipboard, FileText, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { DownloadButton } from "./DownloadButton";

interface PrdPreviewModalProps {
  open: boolean;
  markdown: string;
  onClose: () => void;
}

export function PrdPreviewModal({ open, markdown, onClose }: PrdPreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  if (!open) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="prd-modal" role="dialog" aria-modal="true" aria-labelledby="prd-title">
        <header className="prd-modal-head">
          <div className="prd-file-mark"><FileText size={19} /></div>
          <div>
            <h2 id="prd-title">Product requirements</h2>
            <span>prd.md · ready for your coding agent</span>
          </div>
          <button ref={closeRef} className="icon-button" type="button" onClick={onClose} aria-label="Close PRD preview">
            <X size={18} />
          </button>
        </header>
        <div className="prd-document">
          {markdown ? <ReactMarkdown>{markdown}</ReactMarkdown> : <p>No PRD has been generated for this session yet.</p>}
        </div>
        <footer className="prd-modal-actions">
          <button className="secondary-button" type="button" onClick={copy} disabled={!markdown}>
            {copied ? <Check size={16} /> : <Clipboard size={16} />}
            {copied ? "Copied" : "Copy Markdown"}
          </button>
          <DownloadButton markdown={markdown} className="primary-button" />
        </footer>
      </div>
    </div>
  );
}
