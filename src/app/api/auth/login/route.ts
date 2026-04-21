import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { checkLoginRateLimit } from "@/lib/middleware/rate-limit";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Servidor indisponivel. Configure DATABASE_URL." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Credenciais invalidas." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  try {
    // SEC-004: Rate limit login attempts to prevent brute force
    const rateLimitCheck = checkLoginRateLimit(email);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas de login. Tente novamente mais tarde." },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitCheck.retryAfter?.toString() || "900",
          },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        active: true,
        passwordHash: true,
      },
    });

    if (!user?.active) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    const isValid = await verifyPassword(user.passwordHash, password);

    if (!isValid) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 },
      );
    }

    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erro ao autenticar usuario", error);
    return NextResponse.json(
      { error: "Falha ao autenticar no servidor." },
      { status: 500 },
    );
  }
}
