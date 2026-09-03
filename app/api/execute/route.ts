import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { ids } = await inngest.send({
    name: "workflow/execute",
    data: { workflow: body.workflow },
  });

  return NextResponse.json({ eventId: ids[0] });
}