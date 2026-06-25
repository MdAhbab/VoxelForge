import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Anno } from "./primitives";
import { useCart, useAuth } from "../../lib/store";
import { Menu, X, ShoppingCart, ShieldCheck, User2, LogOut, Package2, Bookmark } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

const BASE_LINKS = [
  { to: "/configure", label: "Configurator" },
  { to: "/upload", label: "Upload" },
  { to: "/materials", label: "Materials" },
];

export function Nav() {
  const { count } = useCart();
  const { user, role, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();

  const links = role === "admin" ? [...BASE_LINKS, { to: "/operator", label: "Operator" }] : BASE_LINKS;
  const initials = user ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "";

  return (
    <header className="sticky top-0 z-50 hairline-b bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <Logo />
          <span className="font-display text-ink tracking-tight truncate" style={{ fontWeight: 600 }}>
            Voxel<span className="text-signal">Forge</span>
          </span>
          <Anno className="hidden lg:inline ml-2 border-l border-hairline pl-2">rev_A · 1:1</Anno>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) =>
                `mono text-[0.8rem] px-3 py-1.5 rounded-[3px] transition-colors ${isActive ? "text-signal bg-signal/10" : "text-ink-dim hover:text-ink"}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/cart" className="relative inline-flex items-center justify-center rounded-[4px] border border-hairline bg-bg-elev p-2 hover:border-signal/50 transition-colors" aria-label="Cart">
            <ShoppingCart size={16} className="text-ink" />
            {count > 0 && <span className="absolute -right-1.5 -top-1.5 mono text-[0.6rem] min-w-4 h-4 px-1 rounded-full bg-signal text-bg flex items-center justify-center">{count}</span>}
          </Link>

          {/* auth area (desktop) */}
          {user ? (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-[4px] border border-hairline bg-bg-elev px-1.5 py-1 hover:border-signal/50 transition-colors">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-signal/15 text-signal mono text-[0.7rem]">{initials}</span>
                    <Anno className="pr-1">{role}</Anno>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="truncate">{user.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => nav("/account")}><User2 size={14} className="mr-2" /> Account</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => nav("/account")}><Bookmark size={14} className="mr-2" /> Saved designs</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => nav("/account")}><Package2 size={14} className="mr-2" /> Orders</DropdownMenuItem>
                  {role === "admin" && <DropdownMenuItem onClick={() => nav("/operator")}><ShieldCheck size={14} className="mr-2" /> Operator console</DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { logout(); nav("/"); }}><LogOut size={14} className="mr-2" /> Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="mono text-[0.8rem] px-2 text-ink-dim hover:text-ink">Sign in</Link>
              <Link to="/signup"><Button size="sm" className="bg-signal text-bg hover:bg-signal/90">Get started</Button></Link>
            </div>
          )}

          <button className="md:hidden p-2 text-ink" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {open && (
        <nav className="md:hidden hairline-t bg-bg-elev px-4 py-2">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={({ isActive }) => `block mono text-sm px-2 py-3 hairline-b ${isActive ? "text-signal" : "text-ink"}`}>
              {l.label}
            </NavLink>
          ))}
          <Link to="/cart" onClick={() => setOpen(false)} className="block mono text-sm px-2 py-3 hairline-b text-ink">Cart ({count})</Link>
          {user ? (
            <>
              <Link to="/account" onClick={() => setOpen(false)} className="block mono text-sm px-2 py-3 hairline-b text-ink">Account · {role}</Link>
              <button onClick={() => { logout(); setOpen(false); nav("/"); }} className="block w-full text-left mono text-sm px-2 py-3 text-danger">Sign out</button>
            </>
          ) : (
            <div className="flex gap-2 px-2 py-3">
              <Link to="/login" onClick={() => setOpen(false)} className="flex-1"><Button variant="outline" className="w-full">Sign in</Button></Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="flex-1"><Button className="w-full bg-signal text-bg hover:bg-signal/90">Get started</Button></Link>
            </div>
          )}
        </nav>
      )}
      <div key={loc.pathname} className="h-px bg-gradient-to-r from-transparent via-signal/40 to-transparent" />
    </header>
  );
}
