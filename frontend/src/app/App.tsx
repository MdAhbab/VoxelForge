import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { Toaster } from "./components/ui/sonner";

import { ThemeProvider, CartProvider, AuthProvider, UploadProvider, DesignsProvider, AppDataProvider } from "./lib/store";
import { Nav } from "./components/forge/Nav";
import { TitleBlockFooter } from "./components/forge/TitleBlockFooter";
import { RequireRole } from "./components/forge/RequireRole";

import { Landing } from "./pages/Landing";
import { Configurator } from "./pages/Configurator";
import { Upload } from "./pages/Upload";
import { Preflight } from "./pages/Preflight";
import { Materials } from "./pages/Materials";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Track } from "./pages/Track";
import { Operator } from "./pages/Operator";
import { Login, Signup } from "./pages/Auth";
import { Account } from "./pages/Account";
import { NotFound } from "./pages/NotFound";

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
