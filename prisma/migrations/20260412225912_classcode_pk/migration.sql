-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('M', 'V');

-- CreateTable
CREATE TABLE "class" (
    "class_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "class_pkey" PRIMARY KEY ("class_code")
);

-- CreateTable
CREATE TABLE "student" (
    "registration" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class_code" TEXT NOT NULL,
    "shift" "Shift" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_pkey" PRIMARY KEY ("registration")
);

-- CreateTable
CREATE TABLE "app_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_name_idx" ON "class"("name");

-- CreateIndex
CREATE INDEX "student_name_idx" ON "student"("name");

-- CreateIndex
CREATE INDEX "student_class_code_idx" ON "student"("class_code");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_hash_key" ON "session"("token_hash");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "session_expires_at_idx" ON "session"("expires_at");

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_class_code_fkey" FOREIGN KEY ("class_code") REFERENCES "class"("class_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
