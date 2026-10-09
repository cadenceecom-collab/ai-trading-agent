import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Saving scanner signals is not available because the scanner API is not implemented in this deployment." },
    { status: 501 },
  );
}
