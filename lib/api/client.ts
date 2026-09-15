const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.nollywin.example/api/v1";
// TODO: replace with real backend URL once your boss/backend team provides it

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}