import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowRight, User2, ShieldCheck } from "lucide-react";

import { useAuth } from "../lib/store";
import { partById } from "../lib/catalog";
import { Viewport3D } from "../components/forge/Viewport3D";
import { Logo } from "../components/forge/Logo";
import { Anno, DimensionLine } from "../components/forge/primitives";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const { login, signup } = useAuth();
  const mesh = useMemo(() => partById("phone-stand").build({}), []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  function go(user: { role: string }) {
    const dest = loc.state?.from || (user.role === "admin" ? "/operator" : "/account");
    nav(dest, { replace: true });
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const u = mode === "login" ? login(email, pw) : signup(name, email, pw);
    toast.success(mode === "login" ? "Welcome back" : "Account created", { description: `Signed in as ${u.role}` });
    go(u);
  }
  function demo(kind: "user" | "admin") {
    const u = login(kind === "admin" ? "owner@voxelforge.shop" : "maker@studio.com", "demo");
    toast.success(`Signed in · demo ${kind}`);
    go(u);
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-[1400px] grid-cols-1 lg:grid-cols-2">
      {/* form */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2.5"><Logo /><span className="font-display text-ink" style={{ fontWeight: 600 }}>Voxel<span className="text-signal">Forge</span></span></Link>
          <h2 className="mt-8">{mode === "login" ? "Sign in" : "Create account"}</h2>
          <p className="mt-2 text-sm text-ink-dim">
            {mode === "login" ? "Access your designs, orders and quotes." : "Save designs, track orders, and re-order in a tap."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5"><Label>Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" /></div>
            )}
            <div className="space-y-1.5"><Label>Email</Label><Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" /></div>
            <div className="space-y-1.5"><Label>Password</Label><Input required type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" /></div>
            <Button type="submit" className="w-full bg-signal text-bg hover:bg-signal/90 gap-2">
              {mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={15} />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-hairline" /><Anno>or use a demo role</Anno><span className="h-px flex-1 bg-hairline" /></div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-1.5" onClick={() => demo("user")}><User2 size={14} /> Maker</Button>
            <Button variant="outline" className="gap-1.5" onClick={() => demo("admin")}><ShieldCheck size={14} /> Shop owner</Button>
          </div>

          <p className="mt-6 text-sm text-ink-dim">
            {mode === "login" ? <>No account? <Link to="/signup" className="text-signal hover:underline">Sign up</Link></> : <>Have an account? <Link to="/login" className="text-signal hover:underline">Sign in</Link></>}
          </p>
          <p className="mt-2 text-xs text-ink-dim">Dev mode · no real credentials stored. Emails with “admin/owner/shop” get the operator role.</p>
        </div>
      </div>

      {/* visual */}
      <div className="relative hidden overflow-hidden border-l border-hairline bg-bg-elev blueprint-grid lg:block">
        <Viewport3D mesh={mesh} mode="solid" tint="#cfd6df" interactive={false} autoRotate />
        <div className="pointer-events-none absolute left-8 top-8"><Anno>VoxelForge · {mode}</Anno></div>
        <div className="pointer-events-none absolute bottom-10 left-8 right-8"><DimensionLine label="DESIGN · PRICE · PRINT" /></div>
      </div>
    </div>
  );
}

export function Login() { return <AuthPage mode="login" />; }
export function Signup() { return <AuthPage mode="signup" />; }
