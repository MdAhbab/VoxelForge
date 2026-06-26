// VoxelForge — ⌘K command palette (cmdk). A premium quick-switcher for navigation,
// theme and jumping straight into a catalog part. Self-contained: renders its own
// trigger and listens for the ⌘K / Ctrl+K hotkey.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Search, Box, Upload as UploadIcon, Layers, ShoppingCart, User2, ShieldCheck, SunMoon, Home } from "lucide-react";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator,
} from "../ui/command";
import { CATALOG } from "../../lib/catalog";
import { useAuth, useTheme } from "../../lib/store";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { role } = useAuth();
  const { toggle } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => { setOpen(false); nav(to); };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 rounded-[4px] border border-hairline bg-bg-elev px-2.5 py-1.5 text-ink-dim hover:border-signal/50 hover:text-ink transition-colors"
        aria-label="Open command palette"
      >
        <Search size={14} />
        <span className="mono text-[0.72rem]">Search</span>
        <kbd className="mono text-[0.62rem] rounded-[3px] border border-hairline px-1 py-0.5 text-ink-dim">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Jump to a page or a part">
        <CommandInput placeholder="Type a page or a part…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Navigate">
            <CommandItem onSelect={() => go("/")}><Home size={14} className="mr-2" /> Home</CommandItem>
            <CommandItem onSelect={() => go("/configure")}><Layers size={14} className="mr-2" /> Configurator</CommandItem>
            <CommandItem onSelect={() => go("/upload")}><UploadIcon size={14} className="mr-2" /> Upload a model</CommandItem>
            <CommandItem onSelect={() => go("/materials")}><Box size={14} className="mr-2" /> Materials</CommandItem>
            <CommandItem onSelect={() => go("/cart")}><ShoppingCart size={14} className="mr-2" /> Cart</CommandItem>
            <CommandItem onSelect={() => go("/account")}><User2 size={14} className="mr-2" /> Account</CommandItem>
            {role === "admin" && (
              <CommandItem onSelect={() => go("/operator")}><ShieldCheck size={14} className="mr-2" /> Operator console</CommandItem>
            )}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Configure a part">
            {CATALOG.map((p) => (
              <CommandItem key={p.id} value={`part ${p.name}`} onSelect={() => go("/configure")}>
                <Box size={14} className="mr-2" /> {p.name}
                <span className="mono ml-auto text-[0.68rem] text-ink-dim">{p.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => { toggle(); setOpen(false); }}>
              <SunMoon size={14} className="mr-2" /> Toggle theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
