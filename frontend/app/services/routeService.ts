export type RouteSummary = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  note?: string;
  highlight?: boolean;
};

export type RouteDetails = {
  id: string;
  title: string;
  stops: { name: string; time: string }[];
};

export async function searchRoutes(payload: { from: string; to: string }) {
  const res = await fetch("/api/mock/routes/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data as RouteSummary[];
}

export async function getRouteDetails(id: string) {
  const res = await fetch(`/api/mock/routes/${id}`);
  if (!res.ok) throw new Error("Failed to fetch route details");
  const data = await res.json();
  return data as RouteDetails;
}
