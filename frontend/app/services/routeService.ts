const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";


export type RouteLeg = {
  routeId: number;
  routeName: string;
  direction: "forward" | "return";
  fromStopId: number;
  fromStopName: string;
  toStopId: number;
  toStopName: string;
  tripId: number | null;
  busRegistration?: string | null;
};

export type RouteSummary = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  note: string;
  highlight?: boolean;
  type?: "direct" | "transfer";
  transfers?: number;
  durationMinutes?: number;
  hasLiveTrip?: boolean;
  departureMinutes?: number | null;
  arrivalMinutes?: number | null;
  dayOffset?: number | null;
  legs?: RouteLeg[];
};

export type RouteStopDetail = {
  name: string;
  time: string;
};

export type RouteDetails = {
  title: string;
  stops: RouteStopDetail[];
  id?: string;
  subtitle?: string;
  routeId?: number;
  direction?: "forward" | "return";
  transfers?: number;
  hasLiveTrip?: boolean;
  transferStop?: { id: number; name: string } | null;
  legs?: Array<{ routeId: number; routeName: string; direction: "forward" | "return" }>;
};

type SearchRoutesParams = {
  from: string;
  to: string;
  date?: string;
  time?: string;
};

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

async function apiGet<T>(path: string): Promise<T> {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }

  return body.data as T;
}

export async function searchRoutes({ from, to, date, time }: SearchRoutesParams): Promise<RouteSummary[]> {
  const params = new URLSearchParams({ from, to });
  if (date) params.set("date", date);
  if (time) params.set("time", time);

  return apiGet<RouteSummary[]>(`/route-finder?${params.toString()}`);
}

export async function getRouteDetails(routeId: string): Promise<RouteDetails> {
  return apiGet<RouteDetails>(`/route-finder/${encodeURIComponent(routeId)}`);
}