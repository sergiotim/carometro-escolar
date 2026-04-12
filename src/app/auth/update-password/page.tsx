import { UpdatePasswordForm } from "@/components/update-password-form";

export default function UpdatePasswordPage() {
  return (
    // Garantimos o fundo claro (bg-slate-50) e a centralização do card
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 md:p-8">
      <div className="w-full max-w-md">
        <UpdatePasswordForm />
      </div>
    </main>
  );
}