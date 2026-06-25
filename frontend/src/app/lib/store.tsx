import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ParsedModel } from "./meshio";
import * as api from "./api";
import { setMaterials } from "./materials";
import { setCatalog } from "./catalog";

/* ------------- Theme ------------- */
type Theme = "dark" | "light";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof localStorage !== "undefined") {
      const s = localStorage.getItem("vf-theme") as Theme | null;
      if (s) return s;
    }
    return "dark";
  });
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    localStorage.setItem("vf-theme", theme);
  }, [theme]);
  const value = useMemo(() => ({ theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }), [theme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
export const useTheme = () => useContext(ThemeCtx);

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

/* ------------- Cart ------------- */
export interface CartItem {
  id: string;
  partName: string;
  materialId: string;
  materialName: string;
  finish: string;
  infill: number;
  layerHeight: number;
  qty: number;
  unitPrice: number;
  bbox: [number, number, number];
  preflightScore: number;
}

interface CartState {
  items: CartItem[];
  add: (i: CartItem) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}
const CartCtx = createContext<CartState>({} as CartState);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(seedCart());
  const add = (i: CartItem) => setItems((p) => [...p, i]);
  const remove = (id: string) => setItems((p) => p.filter((x) => x.id !== id));
  const setQty = (id: string, qty: number) =>
    setItems((p) => p.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x)));
  const clear = () => setItems([]);
  const count = items.reduce((a, b) => a + b.qty, 0);
  const subtotal = items.reduce((a, b) => a + b.qty * b.unitPrice, 0);
  return (
    <CartCtx.Provider value={{ items, add, remove, setQty, clear, count, subtotal }}>
      {children}
    </CartCtx.Provider>
  );
}
export const useCart = () => useContext(CartCtx);

/* ------------- Auth (mock, frontend-only) ------------- */
export type Role = "guest" | "user" | "admin";
export interface User { name: string; email: string; role: Role; }

interface AuthState {
  user: User | null;
  role: Role;
  login: (email: string, password: string) => User;
  signup: (name: string, email: string, password: string) => User;
  logout: () => void;
}
const AuthCtx = createContext<AuthState>({} as AuthState);

function deriveRole(email: string): Role {
  return /admin|owner|operator|shop/i.test(email) ? "admin" : "user";
}

// Preview/demo: on the public Vercel deployment there is no backend, so start
// signed in as an operator (admin) — visitors land straight on the dashboards
// without a login. Only affects *.vercel.app; local/real deployments unchanged.
const IS_PREVIEW = typeof window !== "undefined" && /\.vercel\.app$/i.test(window.location.hostname);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { const s = localStorage.getItem("vf-user"); if (s) return JSON.parse(s); } catch { /* ignore */ }
    if (IS_PREVIEW) return { name: "Demo Operator", email: "operator@voxelforge.demo", role: "admin" };
    return null;
  });
  useEffect(() => {
    if (user) localStorage.setItem("vf-user", JSON.stringify(user));
    else localStorage.removeItem("vf-user");
  }, [user]);

  const login = (email: string, _password: string) => {
    const role = deriveRole(email);
    const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const u: User = { name: name || "Maker", email, role };
    setUser(u);
    return u;
  };
  const signup = (name: string, email: string, _password: string) => {
    const u: User = { name: name || "Maker", email, role: deriveRole(email) };
    setUser(u);
    return u;
  };
  const logout = () => setUser(null);

  const value = useMemo(() => ({ user, role: user?.role ?? "guest", login, signup, logout } as AuthState), [user]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

/* ------------- Uploaded model (parsed STL/OBJ shared into configurator) ------------- */
const UploadCtx = createContext<{ model: ParsedModel | null; setModel: (m: ParsedModel | null) => void }>(
  { model: null, setModel: () => {} }
);
export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = useState<ParsedModel | null>(null);
  return <UploadCtx.Provider value={{ model, setModel }}>{children}</UploadCtx.Provider>;
}
export const useUpload = () => useContext(UploadCtx);

/* ------------- Saved designs ------------- */
export interface SavedDesign {
  id: string;
  name: string;
  partName: string;
  source: "catalog" | "upload";
  materialId: string;
  materialName: string;
  finish: string;
  infill: number;
  layerHeight: number;
  params: Record<string, number>;
  unitPrice: number;
  bbox: [number, number, number];
  savedAt: number;
}
interface DesignsState {
  designs: SavedDesign[];
  save: (d: Omit<SavedDesign, "id" | "savedAt">) => void;
  remove: (id: string) => void;
}
const DesignsCtx = createContext<DesignsState>({} as DesignsState);
export function DesignsProvider({ children }: { children: React.ReactNode }) {
  const [designs, setDesigns] = useState<SavedDesign[]>(() => {
    try { const s = localStorage.getItem("vf-designs"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  useEffect(() => { localStorage.setItem("vf-designs", JSON.stringify(designs)); }, [designs]);
  const save = (d: Omit<SavedDesign, "id" | "savedAt">) =>
    setDesigns((p) => [{ ...d, id: crypto.randomUUID(), savedAt: Date.now() }, ...p]);
  const remove = (id: string) => setDesigns((p) => p.filter((x) => x.id !== id));
  return <DesignsCtx.Provider value={{ designs, save, remove }}>{children}</DesignsCtx.Provider>;
}
export const useDesigns = () => useContext(DesignsCtx);

function seedCart(): CartItem[] {
  return [
    {
      id: "seed-1", partName: "Adjustable Phone Stand", materialId: "pla", materialName: "Matte PLA",
      finish: "As printed", infill: 20, layerHeight: 0.2, qty: 1, unitPrice: 312, bbox: [92, 104, 70], preflightScore: 96,
    },
    {
      id: "seed-2", partName: "Replacement Knob", materialId: "abs", materialName: "ABS",
      finish: "Vapour smooth", infill: 40, layerHeight: 0.2, qty: 4, unitPrice: 148, bbox: [36, 22, 36], preflightScore: 88,
    },
  ];
}

const AppDataCtx = createContext<{ ready: boolean }>({ ready: false });
export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all([api.getMaterials(), api.getCatalog()]).then(([mats, cats]) => {
      setMaterials(mats);
      setCatalog(cats);
      setReady(true);
    }).catch(e => {
      console.error("Failed to load app data from backend", e);
      // Fallback: continue with static data
      setReady(true); 
    });
  }, []);
  if (!ready) return <div className="p-10 flex h-screen w-full items-center justify-center font-mono text-sm opacity-50">Initializing engine...</div>;
  return <AppDataCtx.Provider value={{ ready }}>{children}</AppDataCtx.Provider>;
}
export const useAppData = () => useContext(AppDataCtx);
