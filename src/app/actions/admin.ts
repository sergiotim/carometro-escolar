"use server"

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createUser(email: string) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser()


        if (authError || !user) {
            return { success: false, error: "Usuário não encontrado" }
        }


        if (user.app_metadata.role !== "admin") {
            return {
                success: false,
                error: "Acesso negado: Apenas administradores podem executar esta ação."
            }
        }

        if (!email || !EMAIL_REGEX.test(email.trim())) {
            return { success: false, error: "Formato de e-mail inválido." };
        }

        const default_password = "sesi@123"

        const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim(),
            password: default_password,
            email_confirm: true,
            user_metadata: {
                precisa_trocar_senha: true
            }
        })

        if (createError) {
            console.error("Erro do Supabase ao criar usuário:", createError.message)

            if (createError.code === "email_exists") {
                return { success: false, error: "Este e-mail já está cadastrado no sistema." };
            }
            return { success: false, error: "Falha ao criar usuário no banco de dados." };
        }

        return {
            success: true,
            data: {
                email: newUserData.user.email,
                password: default_password
            }
        }


    } catch (error) {
        console.error("Erro inesperado na Action:", error);
        return { success: false, error: "Ocorreu um erro interno no servidor." };
    }
}