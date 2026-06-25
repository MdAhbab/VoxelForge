import { Slider } from "../ui/slider";
import type { ParamDef } from "../../lib/catalog";
import { Anno } from "./primitives";

// Parameter slider with live mono readout + unit + caliper-style track ticks.
export function ParamSlider({
  def, value, onChange, flagged,
}: { def: ParamDef; value: number; onChange: (v: number) => void; flagged?: boolean }) {
  return (
    <div className="group">
      <div className="flex items-baseline justify-between">
        <label className="text-sm text-ink" htmlFor={def.key}>{def.label}</label>
        <span className={`mono text-[0.82rem] ${flagged ? "text-danger" : "text-ink"}`}>
          {value.toFixed(def.step < 1 ? 1 : 0)}
          <span className="text-ink-dim ml-1 text-[0.7rem]">{def.unit}</span>
        </span>
      </div>
      <div className="mt-2.5">
        <Slider
          id={def.key}
          min={def.min}
          max={def.max}
          step={def.step}
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
        />
      </div>
      <div className="mt-1 flex justify-between">
        <Anno>{def.min}</Anno>
        {flagged && <Anno className="text-danger">below min wall</Anno>}
        <Anno>{def.max}</Anno>
      </div>
    </div>
  );
}
