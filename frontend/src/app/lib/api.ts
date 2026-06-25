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

export async function createQuote(quoteInput: any) {
  const res = await fetch(`${API_BASE}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quoteInput)
  });
  if (!res.ok) throw new Error("Failed to create quote");
  return res.json();
}

export async function uploadModel(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/uploads`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) throw new Error("Failed to upload model");
  return res.json();
}

export async function runPreflight(quoteId: string) {
  const res = await fetch(`${API_BASE}/preflight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quote_id: quoteId })
  });
  if (!res.ok) throw new Error("Failed to run preflight");
  return res.json();
}
