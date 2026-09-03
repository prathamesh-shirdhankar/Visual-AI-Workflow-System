import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
  }

  const res = await fetch(
    `http://localhost:8288/v1/events/${eventId}/runs`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Could not fetch run status" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}