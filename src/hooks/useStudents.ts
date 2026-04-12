import { useState, useCallback, useEffect } from "react";
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
  
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/students", { cache: "no-store" });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Falha ao carregar estudantes.");
      }

      const payload = (await response.json()) as {
        students: Student[];
      };

      const studentsData = payload.students || [];
      setStudents(studentsData);

      const uniqueTurmas = Array.from(new Set(studentsData.map((s) => s.turmaNome))).sort();
      setTurmas(["Todas", ...uniqueTurmas]);
    } catch (error: unknown) {
      console.error("Erro ao buscar estudantes:", getErrorMessage(error));
      setErrorMsg(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

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
