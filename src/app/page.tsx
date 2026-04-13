"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, LogOut, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { SearchForm } from "@/components/SearchForm";
import { ResultsList } from "@/components/ResultsList";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Student } from "@/types/student";
import { useStudents } from "@/hooks/useStudents";
import { StudentDetailsModal } from "@/components/StudentDetailsModal";
import { CameraModal } from "@/components/CameraModal";

export default function CarometroEscolarPage() {
  const router = useRouter();

  const { students, turmas, isLoading, errorMsg, updateStudentImage, refreshStudents } = useStudents();
  
  const [selectedTurma, setSelectedTurma] = useState<string>("Todas");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  };

  useEffect(() => {
    const getUser = async () => {
      const response = await fetch("/api/auth/me", {
        method: "GET",
      });

      if (!response.ok) {
        router.replace("/auth/login");
        return;
      }

      const payload = (await response.json()) as {
        user: { email: string } | null;
      };

      if (payload.user?.email) {
        setCurrentUser(payload.user.email);
      }
    };

    void getUser();
  }, []);

  const openDetailsModal = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsOpen(false);
    setSelectedStudent(null);
  };

  const openCameraFromDetails = () => {
    setIsDetailsOpen(false);
    setIsCameraOpen(true);
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
    setSelectedStudent(null);
  };

  const handleExportPdf = async () => {
    if (filteredStudents.length === 0 || isExportingPdf) return;

    setIsExportingPdf(true);

    try {
      const response = await fetch("/api/export-students-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedTurma,
          searchTerm,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao gerar PDF.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const turmaLabel = selectedTurma === "Todas" ? "todas-as-turmas" : selectedTurma;
      anchor.href = objectUrl;
      anchor.download = `carometro-escolar-${turmaLabel}-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error(error);
      alert("Nao foi possivel exportar o PDF. Tente novamente.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 7. Filtragem da Lista (Turma + Busca por Texto Apenas Nome)
  const filteredStudents = students.filter((s) => {
    const matchTurma = selectedTurma === "Todas" || s.turmaNome === selectedTurma;
    // O erro ocorria aqui. Agora filtramos APENAS pelo nome.
    const matchSearch = s.nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchTurma && matchSearch;
  });

  const selectedStudentIndex = selectedStudent
    ? filteredStudents.findIndex((student) => student.matricula === selectedStudent.matricula)
    : -1;

  const hasPreviousStudent = selectedStudentIndex > 0;
  const hasNextStudent =
    selectedStudentIndex >= 0 && selectedStudentIndex < filteredStudents.length - 1;

  const goToPreviousStudent = () => {
    if (!hasPreviousStudent) return;
    setSelectedStudent(filteredStudents[selectedStudentIndex - 1]);
  };

  const goToNextStudent = () => {
    if (!hasNextStudent) return;
    setSelectedStudent(filteredStudents[selectedStudentIndex + 1]);
  };

  return (
    // Removidas as classes dark: para garantir o contraste do Azul com Branco
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Cabeçalho */}
        <header className="mb-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <Image
                src={"/logo.svg"}
                width={240}
                height={80}
                alt="Logo Carometro Escolar"
                priority
              ></Image>

              <p className="text-sm text-slate-500">
                Gestão de fotos de estudantes
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Abrir menu de acoes"
                  className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 border-slate-200 bg-white text-slate-700 shadow-lg"
              >
                <DropdownMenuItem
                  onSelect={() => {
                    void handleExportPdf();
                  }}
                  disabled={isExportingPdf || filteredStudents.length === 0}
                  className="text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                >
                  {isExportingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>
                    {isExportingPdf
                      ? "Gerando PDF..."
                      : "Exportar PDF dos resultados"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200" />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="text-red-600 focus:bg-red-50 focus:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <SearchForm
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedTurma={selectedTurma}
            onTurmaChange={setSelectedTurma}
            turmas={turmas}
          />

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {filteredStudents.length} estudante(s) no resultado atual
            </p>
          </div>
        </header>

        <ResultsList
          students={filteredStudents}
          isLoading={isLoading}
          errorMsg={errorMsg}
          onStudentClick={openDetailsModal}
        />
      </div>

      <StudentDetailsModal
        isOpen={isDetailsOpen}
        student={selectedStudent}
        onClose={closeDetailsModal}
        onOpenCamera={openCameraFromDetails}
        onPreviousStudent={goToPreviousStudent}
        onNextStudent={goToNextStudent}
        hasPreviousStudent={hasPreviousStudent}
        hasNextStudent={hasNextStudent}
      />

      <CameraModal
        isOpen={isCameraOpen}
        student={selectedStudent}
        currentUser={currentUser}
        onClose={closeCamera}
        onUploadCommitted={refreshStudents}
        onUploadSuccess={updateStudentImage}
      />
    </main>
  );
}
