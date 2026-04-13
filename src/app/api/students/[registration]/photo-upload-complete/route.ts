import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth/dal";
import { resolveStudentImageUrl } from "@/lib/r2";

const paramsSchema = z.object({
  registration: z.string().min(1),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ registration: string }> },
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const params = await context.params;
  const parsedParams = paramsSchema.safeParse(params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Matricula invalida." }, { status: 400 });
  }

  await request.json().catch(() => null);

  const registration = parsedParams.data.registration;

  const imageUrl = await resolveStudentImageUrl(registration);

  return NextResponse.json({ imageUrl, registration });
}
