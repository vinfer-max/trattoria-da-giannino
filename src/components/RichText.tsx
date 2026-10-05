import { useMemo } from "react";
import DOMPurify from "dompurify";

export default function RichText({ html, className = "" }: { html: string; className?: string }) {
  const clean = useMemo(() => (typeof window === "undefined" ? html : DOMPurify.sanitize(html)), [html]);
  return <div className={`rich-text ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}
