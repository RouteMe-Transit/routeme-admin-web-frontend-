import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const details = {
    r1: {
      id: "r1",
      title: "Kurunegala - Avissawella - Pambahinna",
      stops: [
        { name: "Kurunegala", time: "10:15 am" },
        { name: "Avissawella", time: "1:30 pm" },
        { name: "Pambahinna", time: "3:00 pm" },
      ],
    },
    r2: {
      id: "r2",
      title: "Kurunegala - Colombo - Badulla",
      stops: [
        { name: "Kurunegala", time: "9:00 am" },
        { name: "Colombo", time: "11:30 am" },
        { name: "Badulla", time: "5:00 pm" },
      ],
    },
    r3: {
      id: "r3",
      title: "Kurunegala - Rathnapura - Palmadulla",
      stops: [
        { name: "Kurunegala", time: "7:45 am" },
        { name: "Rathnapura", time: "10:15 am" },
        { name: "Palmadulla", time: "1:00 pm" },
      ],
    },
  } as Record<string, any>;

  const d = details[id] ?? { id, title: "Unknown route", stops: [] };

  return NextResponse.json(d);
}
