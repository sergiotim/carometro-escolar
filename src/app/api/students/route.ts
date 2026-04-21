import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { resolveStudentImageUrl } from "@/lib/r2";

function getShiftLabel(shift: "M" | "V"): string {
  return shift === "M" ? "Matutino" : "Vespertino";
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Servidor indisponivel. Configure DATABASE_URL." },
      { status: 503 },
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const students = await prisma.student.findMany({
      include: {
        schoolClass: {
          select: {
            classCode: true,
            name: true,
            shift: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const payload = await Promise.all(
      students.map(async (student) => {
        const linkImage = student.userTakePhoto
          ? await resolveStudentImageUrl(student.registration)
          : null;

        return {
          matricula: student.registration,
          nome: student.name,
          turma: student.schoolClass.classCode,
          turmaNome: student.schoolClass.name,
          turno: getShiftLabel(student.schoolClass.shift),
          link_image: linkImage,
          userTakePhoto: student.userTakePhoto,
        };
      }),
    );

    return NextResponse.json({ students: payload });
  } catch (error) {
    console.error("Erro ao buscar estudantes", error);
    return NextResponse.json(
      { error: "Falha ao carregar estudantes." },
      { status: 500 },
    );
  }
}
