import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Servidor indisponivel. Configure DATABASE_URL.", user: null },
      { status: 503 },
    );
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Erro ao buscar sessao atual", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
