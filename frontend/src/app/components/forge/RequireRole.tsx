import { Navigate, useLocation } from "react-router";
import { useAuth, type Role } from "../../lib/store";

// Gate a route behind one or more roles. Guests are sent to /login (with return path);
// signed-in users lacking the role get a clear "no access" panel.
export function RequireRole({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const { role } = useAuth();
  const loc = useLocation();
  if (role === "guest") return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (!allow.includes(role)) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-6 text-center">
        <div>
          <div className="font-display text-warn" style={{ fontSize: "2.4rem", fontWeight: 600 }}>403</div>
          <h3 className="mt-2 text-ink">Operator access only</h3>
          <p className="mt-2 text-sm text-ink-dim">This console is for the shop owner. Your account doesn’t have operator permissions.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
