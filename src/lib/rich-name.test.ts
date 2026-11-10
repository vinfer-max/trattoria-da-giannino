import { describe, expect, it } from "vitest";
import { nameEditorContent, plainName } from "./rich-name";

describe("catalog name handling", () => {
  it("extracts searchable names from formatted content", () => {
    expect(plainName('<p><strong>Caffè</strong> macchiato &amp; latte</p>')).toBe("Caffè macchiato & latte");
  });
  it("rejects an editor value containing no name", () => {
    expect(plainName("<p><br></p>")).toBe("");
  });
  it("preserves rich formatting for editing", () => {
    const html = '<p><span style="color: #dc2626">Caffè</span></p>';
    expect(nameEditorContent(html)).toBe(html);
  });
  it("escapes existing literal names instead of treating them as tags", () => {
    expect(nameEditorContent("Caffè & latte <speciale>")).toBe("Caffè &amp; latte &lt;speciale&gt;");
  });
});