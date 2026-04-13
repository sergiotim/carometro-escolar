import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth/dal";
import { resolveStudentImageUrl, uploadStudentImage } from "@/lib/r2";

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

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  }

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json(
      { error: "Imagem obrigatoria." },
      { status: 400 },
    );
  }

  const registration = parsedParams.data.registration;

  try {
    const imageArrayBuffer = await image.arrayBuffer();
    await uploadStudentImage(registration, new Uint8Array(imageArrayBuffer));

    const imageUrl = await resolveStudentImageUrl(registration);

    return NextResponse.json({ imageUrl, registration });
  } catch (error) {
    console.error("Erro ao salvar foto:", error);
    return NextResponse.json(
      { error: "Falha ao salvar foto." },
      { status: 500 },
    );
  }
}
