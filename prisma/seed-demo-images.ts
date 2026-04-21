import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";

import { uploadStudentImage } from "../src/lib/r2";

loadEnv({ path: ".env.local" });
loadEnv();

type StudentRow = {
  registration: string;
  name: string;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed demo images.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

function getLimit(): number | null {
  const raw = process.env.DEMO_IMAGES_LIMIT;
  if (!raw) return null;

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error("DEMO_IMAGES_LIMIT must be a positive integer.");
  }

  return parsed;
}

function getTargetRegistrations(): string[] {
  const raw = process.env.DEMO_IMAGES_REGISTRATIONS;
  if (!raw) return [];

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function buildAvatarUrl(student: StudentRow): string {
  const seed = encodeURIComponent(student.registration);
  const radius = 50;

  return `https://api.dicebear.com/9.x/adventurer/jpg?seed=${seed}&size=600&radius=${radius}`;
}

async function fetchAvatarJpg(student: StudentRow): Promise<Uint8Array> {
  const response = await fetch(buildAvatarUrl(student), {
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(
      `Avatar API returned ${response.status} for ${student.registration}.`,
    );
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("jpeg") && !contentType.includes("jpg")) {
    throw new Error(
      `Avatar API did not return JPEG for ${student.registration}. Content-Type: ${contentType}`,
    );
  }

  const imageBuffer = await response.arrayBuffer();
  return new Uint8Array(imageBuffer);
}

async function setDemoOwner(registration: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "student"
    SET "user_take_photo" = ${"user demo"}
    WHERE "registration" = ${registration}
  `;
}

async function seedOne(student: StudentRow): Promise<void> {
  const imageBytes = await fetchAvatarJpg(student);

  // Object key is derived from registration in uploadStudentImage -> <registration>.jpg
  await uploadStudentImage(student.registration, imageBytes);
  await setDemoOwner(student.registration);
}

async function main() {
  const limit = getLimit();
  const targetRegistrations = getTargetRegistrations();

  const whereClause = targetRegistrations.length
    ? {
        registration: {
          in: targetRegistrations,
        },
      }
    : {
        userTakePhoto: null,
      };

  const students = await prisma.student.findMany({
    where: whereClause,
    select: {
      registration: true,
      name: true,
    },
    orderBy: {
      registration: "asc",
    },
    ...(limit ? { take: limit } : {}),
  });

  if (students.length === 0) {
    if (targetRegistrations.length > 0) {
      console.log("No students were found for DEMO_IMAGES_REGISTRATIONS.");
    } else {
      console.log("No students without photo marker were found.");
    }
    return;
  }

  if (targetRegistrations.length > 0) {
    console.log(
      `Starting targeted demo image seed for ${students.length} students...`,
    );
  } else {
    console.log(`Starting demo image seed for ${students.length} students...`);
  }

  let successCount = 0;
  let failureCount = 0;

  for (const student of students) {
    try {
      await seedOne(student);
      successCount += 1;
      console.log(`OK ${student.registration} - ${student.name}`);
    } catch (error) {
      failureCount += 1;
      console.error(`FAIL ${student.registration} - ${student.name}`, error);
    }
  }

  console.log("Demo image seed finished.");
  console.log(`Success: ${successCount}`);
  console.log(`Failures: ${failureCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
