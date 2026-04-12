import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";

export async function getAuthenticatedUser() {
  return getCurrentUser();
}

export async function requireUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}
