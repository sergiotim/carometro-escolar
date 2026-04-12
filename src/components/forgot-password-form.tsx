"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import {
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocorreu um erro ao tentar enviar o e-mail.";
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // Dentro de components/forgot-password-form.tsx (na sua função de submit)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Isso garante que o usuário seja levado para a rota intermediária correta
        // e depois para a página de mudar a senha!
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn("flex flex-col gap-6 w-full max-w-md mx-auto", className)}
      {...props}
    >
      {success ? (
        <Card className="border-slate-200 bg-white shadow-xl rounded-3xl overflow-hidden text-center">
          <CardHeader className="space-y-4 pb-6 pt-10">
            <div className="mx-auto bg-green-50 p-3 rounded-full w-fit">
              <CheckCircle2 className="h-10 w-10 text-[#68B42D]" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-[#0E4194]">
              Verifique seu e-mail
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Instruções de recuperação enviadas com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <p className="text-sm text-slate-600 mb-8 leading-relaxed">
              Se o endereço <strong>{email}</strong> estiver cadastrado em nosso
              sistema, você receberá um link para criar uma nova senha.
            </p>
            <Link href="/auth/login" className="block w-full">
              {/* Botão de voltar corrigido para não usar o outline nativo do shadcn */}
              <Button
                variant="ghost"
                className="w-full h-12 rounded-xl border-2 border-[#0E4194]/20 bg-transparent text-[#0E4194] hover:bg-[#0E4194] hover:text-white font-bold transition-all"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Voltar para o Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 bg-white shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-3 pb-6 text-center pt-8">
            <CardTitle className="text-2xl font-extrabold text-[#0E4194]">
              Recuperar Senha
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium px-4">
              Digite seu e-mail e enviaremos um link seguro para redefinir sua
              senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-5">
                {/* Campo de E-mail */}
                <div className="grid gap-2">
                  <Label
                    htmlFor="email"
                    className="text-slate-700 font-semibold ml-1"
                  >
                    E-mail cadastrado
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="gestor@sesi.com.br"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#0E4194] shadow-sm"
                    />
                  </div>
                </div>

                {/* Mensagem de Erro */}
                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-red-600 border border-red-100 text-sm font-medium animate-in fade-in zoom-in-95 duration-200">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Botão de Envio (Verde SESI) */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 mt-2 bg-[#68B42D] hover:bg-[#5a9c27] text-white text-base font-bold shadow-md transition-all rounded-xl active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar link de recuperação"
                  )}
                </Button>

                {/* Link de Retorno */}
                <div className="mt-2 text-center text-sm font-medium text-slate-500">
                  Lembrou sua senha?{" "}
                  <Link
                    href="/auth/login"
                    className="text-[#0E4194] hover:text-[#0E4194]/80 underline-offset-4 hover:underline"
                  >
                    Fazer Login
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
