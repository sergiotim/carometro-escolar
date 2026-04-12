import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Student } from "@/types/student";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro desconhecido";
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [turmas, setTurmas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // O hook precisa ser invocado dentro de um componente cliente, 
  // portanto createClient() funciona normalmente aqui
  const supabase = createClient();

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data: alunosData, error: alunosError } = await supabase
        .from("alunos")
        .select("*")
        .order("nome");

      if (alunosError) throw alunosError;

      if (alunosData && alunosData.length > 0) {
        const paths = alunosData.map((aluno) => `${aluno.matricula}.jpg`);

        const { data: urlsData, error: urlsError } = await supabase.storage
          .from("students_image")
          .createSignedUrls(paths, 3600);

        if (urlsError) {
          console.error("Erro ao gerar URLs assinadas:", urlsError);
        }

        const studentsWithImages = alunosData.map((aluno) => {
          const urlInfo = urlsData?.find(
            (u) => u.path === `${aluno.matricula}.jpg`,
          );

          return {
            ...aluno,
            link_image: urlInfo && !urlInfo.error ? urlInfo.signedUrl : null,
          };
        });

        setStudents(studentsWithImages);

        const uniqueTurmas = Array.from(
          new Set(alunosData.map((s) => s.turma)),
        ).sort();
        setTurmas(["Todas", ...uniqueTurmas]);
      } else {
        setStudents([]);
      }
    } catch (error: unknown) {
      console.error("Erro ao buscar estudantes:", getErrorMessage(error));
      setErrorMsg("Falha ao carregar a lista de estudantes.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const updateStudentImage = (
    matricula: string,
    imageUrl: string,
    userTakePhoto: string | null
  ) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.matricula === matricula
          ? { ...s, link_image: imageUrl, userTakePhoto }
          : s,
      ),
    );
  };

  return {
    students,
    turmas,
    isLoading,
    errorMsg,
    updateStudentImage,
    refreshStudents: fetchStudents,
  };
}
