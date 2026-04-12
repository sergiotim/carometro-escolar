import { NextResponse } from "next/server";

import { clearSession } from "@/lib/auth/session";

export async function POST() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Servidor indisponivel. Configure DATABASE_URL." },
      { status: 503 },
    );
  }

  try {
    await clearSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao encerrar sessao", error);
    return NextResponse.json({ error: "Falha ao encerrar sessao." }, { status: 500 });
  }
}
