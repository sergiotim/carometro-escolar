import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/dal";
import { registrationSchema } from "@/lib/validation/registration";
import { DEMO_UPLOAD_BLOCKED_MESSAGE } from "@/lib/demo";

export async function POST(
  _request: Request,
  context: { params: Promise<{ registration: string }> },
) {
  if (!(await getAuthenticatedUser())) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const params = await context.params;
  const parsed = registrationSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Matricula invalida." }, { status: 400 });
  }

  return NextResponse.json(
    {
      error: DEMO_UPLOAD_BLOCKED_MESSAGE,
      registration: parsed.data.registration,
      demoMode: true,
    },
    { status: 403 },
  );
}
