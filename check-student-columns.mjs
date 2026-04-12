import dotenv from 'dotenv';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env.local' });
dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const rows = await prisma.$queryRawUnsafe(`
  select column_name
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'student'
  order by ordinal_position
`);

console.log(rows);
await prisma.$disconnect();
