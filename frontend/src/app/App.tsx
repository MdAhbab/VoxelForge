import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { Toaster } from "./components/ui/sonner";

import { ThemeProvider, CartProvider, AuthProvider, UploadProvider, DesignsProvider, AppDataProvider } from "./lib/store";
import { Nav } from "./components/forge/Nav";
import { TitleBlockFooter } from "./components/forge/TitleBlockFooter";
import { RequireRole } from "./components/forge/RequireRole";

// Landing is the LCP route — keep it eager. Every other page is code-split so
// heavy surfaces (configurator, operator console, materials) stay out of the
// initial bundle and load on demand.
import { Landing } from "./pages/Landing";
const Configurator = lazy(() => import("./pages/Configurator").then((m) => ({ default: m.Configurator })));
const Upload = lazy(() => import("./pages/Upload").then((m) => ({ default: m.Upload })));
const Preflight = lazy(() => import("./pages/Preflight").then((m) => ({ default: m.Preflight })));
const Materials = lazy(() => import("./pages/Materials").then((m) => ({ default: m.Materials })));
const Cart = lazy(() => import("./pages/Cart").then((m) => ({ default: m.Cart })));
const Checkout = lazy(() => import("./pages/Checkout").then((m) => ({ default: m.Checkout })));
const Track = lazy(() => import("./pages/Track").then((m) => ({ default: m.Track })));
const Operator = lazy(() => import("./pages/Operator").then((m) => ({ default: m.Operator })));
const Login = lazy(() => import("./pages/Auth").then((m) => ({ default: m.Login })));
const Signup = lazy(() => import("./pages/Auth").then((m) => ({ default: m.Signup })));
const Account = lazy(() => import("./pages/Account").then((m) => ({ default: m.Account })));
const NotFound = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFound })));

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center font-mono text-sm text-ink-dim">
      Loading…
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }, [pathname]);
  return null;
}

function Shell() {
  const { pathname } = useLocation();
  const bare = pathname === "/login" || pathname === "/signup";
  return (
    <div className="min-h-screen bg-bg text-ink">
      <ScrollToTop />
      <Nav />
      <main>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/configure" element={<Configurator />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/preflight" element={<Preflight />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/track" element={<Track />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/account" element={<RequireRole allow={["user", "admin"]}><Account /></RequireRole>} />
          <Route path="/operator" element={<RequireRole allow={["admin"]}><Operator /></RequireRole>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      {!bare && <TitleBlockFooter />}
      <Toaster position="bottom-right" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <AuthProvider>
          <UploadProvider>
            <DesignsProvider>
              <CartProvider>
                <BrowserRouter>
                  <Shell />
                </BrowserRouter>
              </CartProvider>
            </DesignsProvider>
          </UploadProvider>
        </AuthProvider>
      </AppDataProvider>
    </ThemeProvider>
  );
}
