import { Link } from "react-router";
import { Logo } from "./Logo";
import { Anno } from "./primitives";

// Footer styled as the title block of a technical drawing.
export function TitleBlockFooter() {
  const cells = [
    { k: "drawing", v: "VOXELFORGE / FRONT-END" },
    { k: "scale", v: "1:1" },
    { k: "revision", v: "A.04" },
    { k: "units", v: "MM · ৳ BDT" },
    { k: "author", v: "VF DESIGN" },
    { k: "date", v: "2026-06-25" },
  ];
  return (
    <footer className="mt-24 hairline-t bg-bg-elev">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo size={26} />
              <span className="font-display text-ink text-lg" style={{ fontWeight: 600 }}>
                Voxel<span className="text-signal">Forge</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-ink-dim">
              Design it in the browser. Price it in real time. Print it tomorrow.
            </p>
          </div>
          <FooterCol title="Product" links={[["Configurator", "/configure"], ["Upload", "/upload"], ["Materials", "/materials"], ["Pricing", "/configure"]]} />
          <FooterCol title="Shop" links={[["Cart", "/cart"], ["Checkout", "/checkout"], ["Track order", "/track"], ["Operator console", "/operator"]]} />
        </div>

        {/* drawing title block */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 border border-hairline">
          {cells.map((c) => (
            <div key={c.k} className="px-3 py-2.5 border-r border-b border-hairline last:border-r-0">
              <Anno>{c.k}</Anno>
              <div className="mono text-ink text-[0.78rem] mt-1">{c.v}</div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <Anno>{title}</Anno>
      <ul className="mt-3 space-y-2">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="text-sm text-ink-dim hover:text-signal transition-colors">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
