import { createClient } from "@/lib/supabase/server";
import {
  PDFDocument,
  PDFFont,
  PDFImage,
  StandardFonts,
  clip,
  closePath,
  endPath,
  lineTo,
  moveTo,
  popGraphicsState,
  pushGraphicsState,
  rgb,
} from "pdf-lib";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

type ExportPayload = {
  selectedTurma?: string;
  searchTerm?: string;
};

type StudentRow = {
  matricula: string;
  nome: string;
  turma: string;
  turno: string | null;
};

const PAGE_CONFIG = {
  columns: 5,
  rows: 7,
  cardsPerPage: 35,
};

function normalizeText(value: string | undefined): string {
  return (value ?? "").trim();
}

function wrapTextToWidth(
  text: string,
  maxWidth: number,
  maxLines: number,
  font: PDFFont,
  fontSize: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let currentLine = "";
  let truncated = false;

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const candidateWidth = font.widthOfTextAtSize(candidate, fontSize);

    if (candidateWidth <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      let partial = "";
      for (const char of word) {
        const test = `${partial}${char}`;
        if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
          partial = test;
        } else {
          break;
        }
      }
      lines.push(partial || word.slice(0, 1));
      currentLine = word.slice((partial || word.slice(0, 1)).length);
    }

    if (lines.length >= maxLines) {
      truncated = true;
      break;
    }
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  } else if (currentLine) {
    truncated = true;
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  if (truncated && lines.length === maxLines) {
    const lastIndex = maxLines - 1;
    let lastLine = lines[lastIndex];
    while (
      font.widthOfTextAtSize(`${lastLine}...`, fontSize) > maxWidth &&
      lastLine.length > 0
    ) {
      lastLine = lastLine.slice(0, -1);
    }
    lines[lastIndex] = `${lastLine}...`;
  }

  return lines;
}

async function buildStudentsPdf(
  students: StudentRow[],
  filters: { turma: string; searchTerm: string },
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let logoImage: PDFImage | null = null;
  try {
    const logoBytes = await readFile(join(process.cwd(), "public", "logo.png"));
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (error) {
    console.warn("Logo nao encontrada para o PDF:", error);
  }

  const imagePaths = students.map((student) => `${student.matricula}.jpg`);
  const supabase = await createClient();
  const { data: signedUrls } = await supabase.storage
    .from("students_image")
    .createSignedUrls(imagePaths, 1200);

  const imageMap = new Map<string, Uint8Array>();

  await Promise.all(
    students.map(async (student) => {
      const path = `${student.matricula}.jpg`;
      const signedInfo = signedUrls?.find((item) => item.path === path);

      if (!signedInfo || signedInfo.error || !signedInfo.signedUrl) {
        return;
      }

      try {
        const imageResponse = await fetch(signedInfo.signedUrl);
        if (!imageResponse.ok) return;

        const contentType = imageResponse.headers.get("content-type") || "";
        if (
          !contentType.includes("jpeg") &&
          !contentType.includes("jpg") &&
          !contentType.includes("png")
        ) {
          return;
        }

        const arrayBuffer = await imageResponse.arrayBuffer();
        imageMap.set(student.matricula, new Uint8Array(arrayBuffer));
      } catch {
        // Ignore image failures and fallback to placeholder.
      }
    }),
  );

  const totalPages = Math.ceil(students.length / PAGE_CONFIG.cardsPerPage) || 1;
  const generatedAt = new Date().toLocaleString("pt-BR");

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const margin = 24;
    const headerHeight = 54;
    const footerHeight = 16;
    const gridTop = height - margin - headerHeight;
    const gridBottom = margin + footerHeight;
    const gridHeight = gridTop - gridBottom;
    const gridWidth = width - margin * 2;

    const colGap = 6;
    const rowGap = 4;
    const cardWidth =
      (gridWidth - colGap * (PAGE_CONFIG.columns - 1)) / PAGE_CONFIG.columns;
    const cardHeight =
      (gridHeight - rowGap * (PAGE_CONFIG.rows - 1)) / PAGE_CONFIG.rows;

    const headerTopY = height - margin;
    const headerTitle = "Relatorio de Estudantes";
    const headerTitleSize = 12.5;
    const headerMetaSize = 9;
    const headerRowTopY = headerTopY - 11;
    const headerRowBottomY = headerTopY - 30;

    if (logoImage) {
      const logoDims = logoImage.scale(0.1);
      page.drawImage(logoImage, {
        x: margin,
        y: headerRowTopY - logoDims.height / 2,
        width: logoDims.width,
        height: logoDims.height,
      });
    }

    const headerTitleWidth = fontBold.widthOfTextAtSize(
      headerTitle,
      headerTitleSize,
    );
    page.drawText(headerTitle, {
      x: (width - headerTitleWidth) / 2,
      y: headerRowTopY - 3,
      size: headerTitleSize,
      font: fontBold,
      color: rgb(0.05, 0.25, 0.58),
    });

    const turmaLabel =
      filters.turma === "Todas" ? "Todas as turmas" : filters.turma;
    const searchLabel = filters.searchTerm
      ? `Filtro nome: ${filters.searchTerm}`
      : "Filtro nome: Sem filtro";
    const generatedLabel = `Gerado em: ${generatedAt}`;
    const pageLabel = `Pagina ${pageIndex + 1} de ${totalPages}`;
    const headerColumnWidth = (width - margin * 2) / 4;

    page.drawText(`Turma: ${turmaLabel}`, {
      x: margin,
      y: headerRowBottomY - 3,
      size: headerMetaSize,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(searchLabel, {
      x: margin + headerColumnWidth,
      y: headerRowBottomY - 3,
      size: headerMetaSize,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(`Total de estudantes: ${students.length}`, {
      x: margin + headerColumnWidth * 2,
      y: headerRowBottomY - 3,
      size: headerMetaSize,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    const generatedWidth = fontRegular.widthOfTextAtSize(
      generatedLabel,
      headerMetaSize,
    );
    page.drawText(generatedLabel, {
      x: width - margin - generatedWidth,
      y: headerRowTopY - 3,
      size: headerMetaSize,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    const pageLabelWidth = fontRegular.widthOfTextAtSize(
      pageLabel,
      headerMetaSize,
    );
    page.drawText(pageLabel, {
      x: width - margin - pageLabelWidth,
      y: headerRowBottomY - 3,
      size: headerMetaSize,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    const studentsOnPage = students.slice(
      pageIndex * PAGE_CONFIG.cardsPerPage,
      (pageIndex + 1) * PAGE_CONFIG.cardsPerPage,
    );

    for (const [index, student] of studentsOnPage.entries()) {
      const row = Math.floor(index / PAGE_CONFIG.columns);
      const col = index % PAGE_CONFIG.columns;

      const cardX = margin + col * (cardWidth + colGap);
      const cardY = gridTop - (row + 1) * cardHeight - row * rowGap;

      page.drawRectangle({
        x: cardX,
        y: cardY,
        width: cardWidth,
        height: cardHeight,
        borderColor: rgb(0.86, 0.9, 0.95),
        borderWidth: 0.8,
      });

      const cardPadding = 3;
      const infoBlockHeight = 11;
      const nameBlockHeight = 13;
      const imageHeight =
        cardHeight - cardPadding * 2 - infoBlockHeight - nameBlockHeight - 1;
      const imageWidth = cardWidth - cardPadding * 2;
      const imageX = cardX + cardPadding;
      const infoY = cardY + cardPadding;
      const nameBaseY = infoY + infoBlockHeight + 1;
      const imageY = nameBaseY + nameBlockHeight + 1;

      const imageBytes = imageMap.get(student.matricula);

      if (imageBytes) {
        try {
          const embedded = await (imageBytes[0] === 0x89
            ? pdfDoc.embedPng(imageBytes)
            : pdfDoc.embedJpg(imageBytes));

          const imageAspectRatio = embedded.width / embedded.height;
          const boxAspectRatio = imageWidth / imageHeight;

          let drawWidth = imageWidth;
          let drawHeight = imageHeight;

          if (imageAspectRatio > boxAspectRatio) {
            drawWidth = imageHeight * imageAspectRatio;
          } else {
            drawHeight = imageWidth / imageAspectRatio;
          }

          const drawX = imageX + (imageWidth - drawWidth) / 2;
          const verticalOverflow = Math.max(0, drawHeight - imageHeight);
          const drawY =
            imageY + (imageHeight - drawHeight) / 2 - verticalOverflow * 0.22;

          page.drawRectangle({
            x: imageX,
            y: imageY,
            width: imageWidth,
            height: imageHeight,
            color: rgb(0.97, 0.98, 0.99),
          });

          page.pushOperators(
            pushGraphicsState(),
            moveTo(imageX, imageY),
            lineTo(imageX, imageY + imageHeight),
            lineTo(imageX + imageWidth, imageY + imageHeight),
            lineTo(imageX + imageWidth, imageY),
            closePath(),
            clip(),
            endPath(),
          );

          page.drawImage(embedded, {
            x: drawX,
            y: drawY,
            width: drawWidth,
            height: drawHeight,
          });

          page.pushOperators(popGraphicsState());
        } catch {
          page.drawRectangle({
            x: imageX,
            y: imageY,
            width: imageWidth,
            height: imageHeight,
            color: rgb(0.94, 0.95, 0.97),
          });
          page.drawText("Sem foto", {
            x: imageX + 10,
            y: imageY + imageHeight / 2,
            size: 8,
            font: fontRegular,
            color: rgb(0.42, 0.45, 0.5),
          });
        }
      } else {
        page.drawRectangle({
          x: imageX,
          y: imageY,
          width: imageWidth,
          height: imageHeight,
          color: rgb(0.94, 0.95, 0.97),
        });
        page.drawText("Sem foto", {
          x: imageX + 10,
          y: imageY + imageHeight / 2,
          size: 8,
          font: fontRegular,
          color: rgb(0.42, 0.45, 0.5),
        });
      }

      const textX = cardX + 5;
      const textMaxWidth = cardWidth - 10;
      const nameFontSize = 6.3;
      const nameLines = wrapTextToWidth(
        student.nome,
        textMaxWidth,
        2,
        fontBold,
        nameFontSize,
      );
      const nameTopY = nameBaseY + nameBlockHeight - nameFontSize;

      for (const [lineIndex, line] of nameLines.entries()) {
        page.drawText(line, {
          x: textX,
          y: nameTopY - lineIndex * 6,
          size: nameFontSize,
          font: fontBold,
          color: rgb(0.08, 0.18, 0.35),
        });
      }

      page.drawText(`Mat: ${student.matricula}`, {
        x: textX,
        y: infoY + 5,
        size: 6.7,
        font: fontRegular,
        color: rgb(0.25, 0.28, 0.33),
      });

      const classInfo = `${student.turma} | ${student.turno || "Nao inf."}`;
      page.drawText(classInfo, {
        x: textX,
        y: infoY - 2,
        size: 6.7,
        font: fontRegular,
        color: rgb(0.25, 0.28, 0.33),
      });
    }
  }

  return pdfDoc.save();
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ExportPayload;
    const turma = normalizeText(payload.selectedTurma) || "Todas";
    const searchTerm = normalizeText(payload.searchTerm);

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
    }

    let query = supabase
      .from("alunos")
      .select("matricula, nome, turma, turno")
      .order("nome");

    if (turma !== "Todas") {
      query = query.eq("turma", turma);
    }

    if (searchTerm) {
      query = query.ilike("nome", `%${searchTerm}%`);
    }

    const { data: studentsData, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Falha ao buscar estudantes." },
        { status: 500 },
      );
    }

    const students = (studentsData || []) as StudentRow[];

    if (students.length === 0) {
      return NextResponse.json(
        { error: "Nao ha estudantes para exportar." },
        { status: 400 },
      );
    }

    const pdfBytes = await buildStudentsPdf(students, {
      turma,
      searchTerm,
    });

    const datePart = new Date().toISOString().slice(0, 10);
    const turmaPart =
      turma === "Todas"
        ? "todas-as-turmas"
        : turma.replace(/\s+/g, "-").toLowerCase();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="identifica-sesi-${turmaPart}-${datePart}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar PDF." },
      { status: 500 },
    );
  }
}
