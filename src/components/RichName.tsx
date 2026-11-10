import RichText from "./RichText";
import { nameEditorContent } from "@/lib/rich-name";

export default function RichName({ value, className = "" }: { value: string; className?: string }) {
  return <RichText html={nameEditorContent(value)} className={`min-w-0 break-words [&_p]:m-0 [&_h2]:m-0 [&_h3]:m-0 ${className}`} />;
}