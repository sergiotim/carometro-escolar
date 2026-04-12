"use client";

import { useState } from "react";
import { createUser } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function AdminPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ email?: string, password?: string, error?: string } | null>(null);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        // Chama a Server Action passando o email
        const response = await createUser(email);

        if (!response.success) {
            setResult({ error: response.error });
        } else if (response.data) {
            setResult({
                email: response.data.email,
                password: response.data.password
            });
            setEmail(""); // Limpa o campo
        }

        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-lg">
                <header className="mb-8 flex items-center justify-between">
                    <div className="flex flex-col">
                        <Image
                            src={"/logo.svg"}
                            width={200}
                            height={60}
                            alt="Logo Identifica SESI"
                            priority
                            className="mb-2"
                        />
                         <p className="text-sm text-slate-500 font-medium ml-1">
                            Painel Administrativo
                        </p>
                    </div>
                    
                    <Link href="/" passHref>
                        <Button 
                            variant="ghost" 
                            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Button>
                    </Link>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 md:p-8">
                        <h1 className="text-xl font-bold text-slate-900 mb-2">Adicionar Novo Gestor</h1>
                        <p className="text-slate-500 text-sm mb-6">
                            Informe o e-mail para gerar as credenciais de acesso.
                        </p>

                        <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                            <div className="space-y-1">
                                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                                    E-mail Corporativo
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nome.sobrenome@sistemafieto.com.br"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-slate-400"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full h-12 mt-2 bg-[#68B42D] hover:bg-[#5a9c27] text-white text-base font-bold shadow-md transition-all rounded-xl active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Criando usuário...
                                    </>
                                ) : (
                                    "Gerar Acesso"
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Exibição do Resultado Seguro */}
                    {result?.error && (
                        <div className="bg-red-50 border-t border-red-100 p-4 md:p-6 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                <div className="text-sm text-red-800">
                                    <p className="font-medium">Erro ao criar usuário</p>
                                    <p className="mt-1 text-red-700">{result.error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {result?.password && (
                        <div className="bg-green-50 border-t border-green-100 p-4 md:p-6 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                <div className="text-sm w-full">
                                    <p className="font-medium text-green-900 mb-2">Usuário criado com sucesso!</p>
                                    
                                    <div className="bg-white/60 rounded-md p-3 border border-green-200 space-y-2 text-green-900">
                                        <div className="flex justify-between items-center border-b border-green-200 pb-2 mb-2">
                                            <span className="text-green-700">Login:</span>
                                            <span className="font-mono font-medium">{result.email}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-green-700">Senha Provisória:</span>
                                            <code className="bg-white px-2 py-1 rounded border border-green-200 font-mono font-bold text-green-800 select-all">
                                                {result.password}
                                            </code>
                                        </div>
                                    </div>
                                    
                                    <p className="text-xs text-green-700 mt-3">
                                        Copie e envie os dados para o gestor. O sistema solicitará a troca da senha no primeiro login.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
