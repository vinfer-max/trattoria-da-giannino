import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link2, Undo2, Redo2, Eraser, Heading1, Heading2, Quote,
} from "lucide-react";
import { useEffect } from "react";

const FONTS = [
  { label: "Predefinito", value: "" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "Lora", value: "Lora, serif" },
  { label: "Libre Baskerville", value: "'Libre Baskerville', serif" },
  { label: "Cinzel", value: "Cinzel, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Raleway", value: "Raleway, sans-serif" },
  { label: "Josefin Sans", value: "'Josefin Sans', sans-serif" },
  { label: "Oswald", value: "Oswald, sans-serif" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "Pacifico", value: "Pacifico, cursive" },
  { label: "Courier", value: "'Courier New', monospace" },
];
const PALETTE = ["#f5f5f4", "#a8a29e", "#57534e", "#0c0a09", "#fbbf24", "#f59e0b", "#b45309", "#78350f", "#dc2626", "#9f1239", "#16a34a", "#2563eb"];
const SIZES = ["", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px", "56px", "64px", "72px"];

export default function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextStyleKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "rich-text min-h-[140px] p-4 focus:outline-none" } },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  const st = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            color: (e.getAttributes("textStyle")["color"] as string) || "#e7e5e4",
            font: (e.getAttributes("textStyle")["fontFamily"] as string) || "",
            size: (e.getAttributes("textStyle")["fontSize"] as string) || "",
          }
        : { color: "#e7e5e4", font: "", size: "" },
  });

  if (!editor) return <div className="h-40 rounded-lg bg-stone-900 border border-stone-700" />;

  const btn = (active: boolean) =>
    `p-1.5 rounded ${active ? "bg-amber-500/20 text-amber-400" : "text-stone-300 hover:bg-stone-700"}`;
  const c = () => editor.chain().focus();

  return (
    <div className="rounded-lg border border-stone-700 bg-stone-900 overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-stone-700 bg-stone-800/60">
        <select title="Carattere" className="bg-stone-800 border border-stone-700 rounded text-xs px-1 py-1 text-stone-200"
          value={st?.font} onChange={(e) => (e.target.value ? c().setFontFamily(e.target.value).run() : c().unsetFontFamily().run())}>
          {FONTS.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
        </select>
        <select title="Dimensione" className="bg-stone-800 border border-stone-700 rounded text-xs px-1 py-1 text-stone-200"
          value={st?.size} onChange={(e) => (e.target.value ? c().setFontSize(e.target.value).run() : c().unsetFontSize().run())}>
          {SIZES.map((s) => <option key={s} value={s}>{s || "Dimensione"}</option>)}
        </select>
        <label title="Colore testo" className="flex items-center gap-1 text-xs text-stone-400 px-1">
          A<input type="color" value={st?.color.startsWith("#") ? st.color : "#e7e5e4"} onChange={(e) => c().setColor(e.target.value).run()} className="w-6 h-6 bg-transparent" />
        </label>
        <label title="Evidenziatore" className="flex items-center gap-1 text-xs text-stone-400 px-1">
          ▇<input type="color" defaultValue="#78350f" onChange={(e) => c().setBackgroundColor(e.target.value).run()} className="w-6 h-6 bg-transparent" />
        </label>
        <span className="flex gap-0.5">
          {PALETTE.map((col) => (
            <button key={col} type="button" title={col} onClick={() => c().setColor(col).run()}
              className="w-4 h-4 rounded-sm border border-stone-600" style={{ background: col }} />
          ))}
        </span>
        <span className="w-px h-5 bg-stone-700 mx-1" />
        <button type="button" className={btn(editor.isActive("bold"))} onClick={() => c().toggleBold().run()}><Bold className="w-4 h-4" /></button>
        <button type="button" className={btn(editor.isActive("italic"))} onClick={() => c().toggleItalic().run()}><Italic className="w-4 h-4" /></button>
        <button type="button" className={btn(editor.isActive("underline"))} onClick={() => c().toggleUnderline().run()}><Underline className="w-4 h-4" /></button>
        <button type="button" className={btn(editor.isActive("strike"))} onClick={() => c().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></button>
        <button type="button" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading1 className="w-4 h-4" /></button>
        <button type="button" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => c().toggleHeading({ level: 3 }).run()}><Heading2 className="w-4 h-4" /></button>
        <button type="button" className={btn(editor.isActive("blockquote"))} onClick={() => c().toggleBlockquote().run()}><Quote className="w-4 h-4" /></button>
        <button type="button" className={btn(editor.isActive("bulletList"))} onClick={() => c().toggleBulletList().run()}><List className="w-4 h-4" /></button>
        <button type="button" className={btn(editor.isActive("orderedList"))} onClick={() => c().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></button>
        <span className="w-px h-5 bg-stone-700 mx-1" />
        <button type="button" className={btn(editor.isActive({ textAlign: "left" }))} onClick={() => c().setTextAlign("left").run()}><AlignLeft className="w-4 h-4" /></button>
        <button type="button" className={btn(editor.isActive({ textAlign: "center" }))} onClick={() => c().setTextAlign("center").run()}><AlignCenter className="w-4 h-4" /></button>
        <button type="button" className={btn(editor.isActive({ textAlign: "right" }))} onClick={() => c().setTextAlign("right").run()}><AlignRight className="w-4 h-4" /></button>
        <button type="button" className={btn(editor.isActive({ textAlign: "justify" }))} onClick={() => c().setTextAlign("justify").run()}><AlignJustify className="w-4 h-4" /></button>
        <button type="button" className={btn(editor.isActive("link"))} onClick={() => {
          const url = window.prompt("Indirizzo del link (vuoto per rimuovere)", editor.getAttributes("link")["href"] || "https://");
          if (url === null) return;
          if (!url) c().unsetLink().run(); else c().setLink({ href: url }).run();
        }}><Link2 className="w-4 h-4" /></button>
        <button type="button" className={btn(false)} title="Rimuovi formattazione" onClick={() => c().unsetAllMarks().clearNodes().run()}><Eraser className="w-4 h-4" /></button>
        <button type="button" className={btn(false)} onClick={() => c().undo().run()}><Undo2 className="w-4 h-4" /></button>
        <button type="button" className={btn(false)} onClick={() => c().redo().run()}><Redo2 className="w-4 h-4" /></button>
      </div>
      <EditorContent editor={editor} className="text-stone-200" />
    </div>
  );
}
