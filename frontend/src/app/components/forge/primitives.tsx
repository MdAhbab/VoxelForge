import React, { useEffect, useRef, useState } from "react";

/* CAD-style annotation label */
export function Anno({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`anno ${className}`}>{children}</span>;
}

/* Section tag: numbered like a drawing callout */
export function SectionTag({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="mono text-signal text-[0.7rem] border border-signal/40 rounded-[3px] px-1.5 py-0.5">
        {index}
      </span>
      <Anno>{label}</Anno>
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}

/* Animated mono number that rolls to its target (the "instrument" price feel) */
export function NumberRoll({
  value, prefix = "", decimals = 0, className = "",
}: { value: number; prefix?: string; decimals?: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    const dur = 420;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      setDisplay(a + (value - a) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <span className={`mono ${className}`}>
      {prefix}
      {display.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}

/* Caliper bracket around a measured value */
export function CaliperBracket({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <span className="inline-flex flex-col items-center">
      <span className="flex items-center gap-1 text-blueprint">
        <span className="w-2 h-px bg-current" />
        <span className="w-px h-2 bg-current" />
        <span className="mono text-ink text-[0.78rem]">{children}</span>
        <span className="w-px h-2 bg-current" />
        <span className="w-2 h-px bg-current" />
      </span>
      {label && <Anno className="mt-0.5">{label}</Anno>}
    </span>
  );
}

/* Mono stat block */
export function MonoStat({ label, value, unit }: { label: string; value: React.ReactNode; unit?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Anno>{label}</Anno>
      <div className="mono text-ink">
        {value}
        {unit && <span className="text-ink-dim ml-1 text-[0.72rem]">{unit}</span>}
      </div>
    </div>
  );
}

/* Horizontal dimension line with arrowheads + label */
export function DimensionLine({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-1 text-blueprint ${className}`}>
      <span className="w-1.5 h-1.5 border-l border-b border-current rotate-45 -mr-1" />
      <span className="h-px flex-1 bg-current" />
      <span className="anno text-blueprint whitespace-nowrap px-1">{label}</span>
      <span className="h-px flex-1 bg-current" />
      <span className="w-1.5 h-1.5 border-r border-t border-current -rotate-45 -ml-1" />
    </div>
  );
}
