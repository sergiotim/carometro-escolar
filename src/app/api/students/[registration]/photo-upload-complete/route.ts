import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { resolveStudentImageUrl } from "@/lib/r2";

const paramsSchema = z.object({
  registration: z.string().min(1),
});

const bodySchema = z.object({
  userTakePhoto: z.string().email().nullable(),
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

  const body = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  }

  const registration = parsedParams.data.registration;

  await prisma.student.update({
    where: { registration },
    data: {
      userTakePhoto: parsedBody.data.userTakePhoto,
    },
  });

  const imageUrl = await resolveStudentImageUrl(registration);

  return NextResponse.json({ imageUrl, registration });
}
