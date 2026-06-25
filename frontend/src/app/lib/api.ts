// Optional backend integration. The app is fully functional on its built-in
// catalogue/pricing engine; when a backend is reachable these calls hydrate the
// materials + parametric catalogue with operator-managed data.
const API_BASE = "http://localhost:8000/api";

export async function getMaterials() {
  const res = await fetch(`${API_BASE}/materials`);
  if (!res.ok) throw new Error("Failed to fetch materials");
  return res.json();
}

export async function getCatalog() {
  const res = await fetch(`${API_BASE}/catalog`);
  if (!res.ok) throw new Error("Failed to fetch catalog");
  return res.json();
}
