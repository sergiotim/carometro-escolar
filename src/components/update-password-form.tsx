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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Loader2, AlertCircle } from "lucide-react";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocorreu um erro ao atualizar a senha.";
}

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // -- NOVA LÓGICA DE ATUALIZAÇÃO --
      // Além da password, enviamos o campo "data" para atualizar a metadata
      const { error } = await supabase.auth.updateUser({ 
        password: password,
        data: { precisa_trocar_senha: false } // Remove a obrigatoriedade
      });
      
      if (error) throw error;
      
      // Redireciona para a rota inicial. O usuário já estará com a sessão ativa.
      router.push("/");
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto", className)} {...props}>
      <Card className="border-slate-200 bg-white shadow-xl rounded-3xl overflow-hidden">
        
        <CardHeader className="space-y-3 pb-6 text-center pt-8">
          <CardTitle className="text-2xl font-extrabold text-[#0E4194]">
            Criar Nova Senha
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium px-4">
            Defina uma senha pessoal para garantir a segurança da sua conta.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleUpdatePassword}>
            <div className="flex flex-col gap-5">
              
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-slate-700 font-semibold ml-1">
                  Nova senha
                </Label>
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
                    Salvando...
                  </>
                ) : (
                  "Salvar nova senha"
                )}
              </Button>
              
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}