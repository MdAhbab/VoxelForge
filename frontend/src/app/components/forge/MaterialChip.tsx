import type { Material } from "../../lib/materials";
import { Anno } from "./primitives";
import { Check } from "lucide-react";

// PBR-style swatch: a lit sphere conveying the material's surface.
export function MaterialSphere({ color, surface, size = 40 }: { color: string; surface: Material["surface"]; size?: number }) {
  const specular =
    surface === "glossy" || surface === "metallic" ? 0.9 : surface === "satin" ? 0.45 : 0.2;
  return (
    <span
      className="relative inline-block shrink-0 rounded-full"
      style={{
        width: size, height: size,
        background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${color} 60%, white) 0%, ${color} 42%, color-mix(in srgb, ${color} 60%, black) 100%)`,
        boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.35)",
      }}
    >
      <span
        className="absolute rounded-full bg-white"
        style={{ top: size * 0.18, left: size * 0.22, width: size * 0.22, height: size * 0.16, opacity: specular, filter: "blur(1px)" }}
      />
    </span>
  );
}

export function MaterialChip({
  material, selected, onClick,
}: { material: Material; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-[4px] border p-2.5 text-left transition-colors ${
        selected ? "border-signal bg-signal/10" : "border-hairline bg-bg-elev hover:border-signal/40"
      }`}
    >
      <MaterialSphere color={material.swatch} surface={material.surface} />
      <span className="min-w-0">
        <span className="block text-sm text-ink truncate">{material.name}</span>
        <Anno>{material.process} · {material.surface}</Anno>
      </span>
      {selected && (
        <span className="absolute right-2 top-2 text-signal"><Check size={14} /></span>
      )}
    </button>
  );
}
