import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth/dal";
import { getSignedPutImageUrl, getStudentImageKey } from "@/lib/r2";

const paramsSchema = z.object({
  registration: z.string().min(1),
});

export async function POST(
  _request: Request,
  context: { params: Promise<{ registration: string }> },
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const params = await context.params;
  const parsed = paramsSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Matricula invalida." }, { status: 400 });
  }

  const key = getStudentImageKey(parsed.data.registration);

  try {
    const putUrl = await getSignedPutImageUrl(key);
    return NextResponse.json({ putUrl, key });
  } catch {
    return NextResponse.json(
      { error: "Falha ao preparar upload." },
      { status: 500 },
    );
  }
}
