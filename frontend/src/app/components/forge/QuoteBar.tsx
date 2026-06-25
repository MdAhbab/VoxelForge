import { motion } from "motion/react";
import type { Quote } from "../../lib/pricing";
import { fmt } from "../../lib/pricing";
import { Anno } from "./primitives";

// Glass-box itemised cost bar — segments grow into place; each labelled in mono.
export function QuoteBar({ quote, animateBuild = false }: { quote: Quote; animateBuild?: boolean }) {
  const total = quote.segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-[3px] border border-hairline bg-bg">
        {quote.segments.map((s, i) => (
          <motion.div
            key={s.key}
            initial={animateBuild ? { width: 0 } : false}
            animate={{ width: `${(s.value / total) * 100}%` }}
            transition={{ duration: 0.5, delay: animateBuild ? i * 0.12 : 0, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: s.color }}
            className="h-full"
            title={`${s.label}: ${fmt(s.value)}`}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {quote.segments.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="h-2 w-2 shrink-0 rounded-[1px]" style={{ background: s.color }} />
              <Anno className="truncate">{s.label}</Anno>
            </span>
            <span className="mono text-ink text-[0.78rem]">{fmt(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
