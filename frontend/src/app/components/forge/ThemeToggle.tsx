import { useTheme } from "../../lib/store";

// Theme toggle styled as a "filled vs wireframe" / layer-height switch.
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${dark ? "light drafting" : "dark graphite"} theme`}
      title={dark ? "Graphite" : "Drafting"}
      className="group relative inline-flex items-center gap-2 rounded-[4px] border border-hairline bg-bg-elev px-2 py-1.5 hover:border-signal/50 transition-colors"
    >
      <span className="anno hidden sm:inline">{dark ? "wireframe" : "solid"}</span>
      <span className="relative flex h-4 w-8 items-center rounded-[2px] border border-hairline bg-bg">
        <span
          className="absolute h-3 w-3 bg-signal servo transition-all"
          style={{ left: dark ? 1 : "calc(100% - 13px)" }}
        />
      </span>
    </button>
  );
}
