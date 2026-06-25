import { useMemo } from "react";
import { Link } from "react-router";
import { partById } from "../lib/catalog";
import { Viewport3D } from "../components/forge/Viewport3D";
import { Anno } from "../components/forge/primitives";
import { Button } from "../components/ui/button";

export function NotFound() {
  const mesh = useMemo(() => partById("planter").build({}), []);
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-[1100px] place-items-center px-6">
      <div className="grid w-full items-center gap-8 lg:grid-cols-2">
        <div className="relative h-[320px] rounded-[6px] border border-hairline bg-bg-elev blueprint-dots">
          <Viewport3D mesh={mesh} mode="solid" tint="#cfd6df" printProgress={0.46} interactive autoRotate={false} />
          <div className="pointer-events-none absolute right-3 top-3"><Anno>print aborted · 46%</Anno></div>
        </div>
        <div>
          <div className="font-display text-signal" style={{ fontSize: "4rem", fontWeight: 600 }}>404</div>
          <h2 className="mt-2">This part never finished printing.</h2>
          <p className="mt-3 max-w-md text-ink-dim">The page you asked for isn't on the build plate. Let's get you back to a finished surface.</p>
          <div className="mt-6 flex gap-3">
            <Link to="/"><Button className="bg-signal text-bg hover:bg-signal/90">Back home</Button></Link>
            <Link to="/configure"><Button variant="outline">Open configurator</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
