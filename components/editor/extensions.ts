import { Extension } from "@tiptap/core";

// ---------------------------------------------------------------- font size
// TipTap has no official font-size mark. This adds a `fontSize` attribute onto
// the TextStyle mark (so it composes with color/font-family).
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
            renderHTML: (attrs) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

// ------------------------------------------------------------------- indent
// Block-level indent for paragraphs/headings via margin-left. (List nesting is
// handled separately by sink/lift list-item in the toolbar.)
const STEP = 28; // px per indent level
const MAX = 8;

export const Indent = Extension.create({
  name: "indent",
  addOptions() {
    return { types: ["paragraph", "heading"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => {
              const m = parseInt((el as HTMLElement).style.marginLeft || "0", 10);
              return m ? Math.round(m / STEP) : 0;
            },
            renderHTML: (attrs) =>
              attrs.indent ? { style: `margin-left: ${attrs.indent * STEP}px` } : {},
          },
        },
      },
    ];
  },
  addCommands() {
    const shift =
      (delta: number) =>
      ({ tr, state, dispatch }: { tr: any; state: any; dispatch: any }) => {
        const { from, to } = state.selection;
        let changed = false;
        state.doc.nodesBetween(from, to, (node: any, pos: number) => {
          if (this.options.types.includes(node.type.name)) {
            const cur = node.attrs.indent || 0;
            const next = Math.min(MAX, Math.max(0, cur + delta));
            if (next !== cur) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
              changed = true;
            }
          }
        });
        if (changed && dispatch) dispatch(tr);
        return changed;
      };
    return {
      indent: () => shift(1),
      outdent: () => shift(-1),
    };
  },
});
