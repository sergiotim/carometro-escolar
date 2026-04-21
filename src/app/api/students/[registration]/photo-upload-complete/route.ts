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
  const parsedParams = registrationSchema.safeParse(params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Matricula invalida." }, { status: 400 });
  }

  const registration = parsedParams.data.registration;

  return NextResponse.json(
    {
      error: DEMO_UPLOAD_BLOCKED_MESSAGE,
      registration,
      demoMode: true,
    },
    { status: 403 },
  );
}
