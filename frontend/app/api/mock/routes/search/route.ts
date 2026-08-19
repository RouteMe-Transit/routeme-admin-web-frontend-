import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const from = body.from || "";
  const to = body.to || "";

  // Simple mock logic: return three sample routes
  const data = [
    {
      id: "r1",
      title: "Kurunegala - Avissawella - Pambahinna",
      subtitle: "32 Mins · Direct · 4 Stops",
      time: "32 m",
      note: "3 min wait",
      highlight: true,
    },
    {
      id: "r2",
      title: "Kurunegala - Colombo - Badulla",
      subtitle: "41 Mins · 1 Change · 6 Stops",
      time: "41 m",
      note: "9 min wait",
    },
    {
      id: "r3",
      title: "Kurunegala - Rathnapura - Palmadulla",
      subtitle: "55 Mins · 2 Changes · 8 Stops",
      time: "55 m",
      note: "15 min wait",
    },
  ];

  // Optionally tailor response based on query
  const filtered = data.map((d) => ({ ...d, title: `${d.title}` }));

  return NextResponse.json(filtered);
}
