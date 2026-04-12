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
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocorreu um erro ao tentar fazer login.";
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Personalizando mensagens de erro comuns do Supabase
        if (signInError.message.includes("Invalid login credentials")) {
          throw new Error("E-mail ou senha incorretos.");
        }
        throw signInError;
      }

      // -- NOVA LÓGICA DE VERIFICAÇÃO DE SENHA --
      // Busca os dados completos do utilizador recém-logado
      const { data: userData } = await supabase.auth.getUser();
      const metadata = userData.user?.user_metadata;

      // Verifica se a etiqueta existe e é verdadeira
      if (metadata?.precisa_trocar_senha === true) {
        router.push("/auth/update-password");
      } else {
        // Redireciona para a home caso não precise trocar a senha
        router.push("/");
      }
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
      <Card className="border-slate-200 bg-white shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="space-y-3 pb-6 text-center pt-8">
          <CardTitle className="flex justify-center items-center">
            <Image
              src="/logo.svg"
              alt="logo"
              width={220}
              height={64}
              priority
            />
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Acesso restrito. Insira suas credenciais para continuar.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label
                  htmlFor="email"
                  className="text-slate-700 font-semibold ml-1"
                >
                  E-mail
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

              <div className="grid gap-2">
                <div className="flex items-center justify-between ml-1">
                  <Label
                    htmlFor="password"
                    className="text-slate-700 font-semibold"
                  >
                    Senha
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="inline-block text-xs font-medium text-[#0E4194] hover:text-[#0E4194]/80 underline-offset-4 hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus-visible:ring-[#0E4194] shadow-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-red-600 border border-red-100 text-sm font-medium animate-in fade-in zoom-in-95 duration-200">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 bg-[#68B42D] hover:bg-[#5a9c27] text-white text-base font-bold shadow-md transition-all rounded-xl active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar no Sistema"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-500 mt-4">
        Sistema de uso exclusivo de gestores.
      </p>
    </div>
  );
}
