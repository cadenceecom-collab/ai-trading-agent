import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: "The crypto scanner API is not included in the current deployment. No trading action was taken." },
    { status: 501 },
  );
}
