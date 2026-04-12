import { User, X, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Student } from "@/types/student";

interface StudentDetailsModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onOpenCamera: () => void;
  onPreviousStudent: () => void;
  onNextStudent: () => void;
  hasPreviousStudent: boolean;
  hasNextStudent: boolean;
}

export function StudentDetailsModal({
  isOpen,
  student,
  onClose,
  onOpenCamera,
  onPreviousStudent,
  onNextStudent,
  hasPreviousStudent,
  hasNextStudent,
}: StudentDetailsModalProps) {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPreviousStudent}
          disabled={!hasPreviousStudent}
          className="absolute z-20 left-2 sm:-left-12 top-[42%] sm:top-1/2 -translate-y-1/2 h-11 w-11 sm:h-10 sm:w-10 bg-black/55 hover:bg-black/70 rounded-full text-white backdrop-blur-md transition-colors shadow-sm ring-1 ring-white/20 disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:h-5 [&_svg]:w-5"
          aria-label="Estudante anterior"
        >
          <ChevronLeft />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNextStudent}
          disabled={!hasNextStudent}
          className="absolute z-20 right-2 sm:-right-12 top-[42%] sm:top-1/2 -translate-y-1/2 h-11 w-11 sm:h-10 sm:w-10 bg-black/55 hover:bg-black/70 rounded-full text-white backdrop-blur-md transition-colors shadow-sm ring-1 ring-white/20 disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:h-5 [&_svg]:w-5"
          aria-label="Próximo estudante"
        >
          <ChevronRight />
        </Button>

        <div className="bg-white rounded-3xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
        {/* Topo do Card com a Foto */}
        <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center border-b border-slate-100">
          {student.link_image ? (
            <Image
              src={student.link_image}
              alt={student.nome}
              fill
              className="object-cover"
              unoptimized={true}
            />
          ) : (
            <div className="flex flex-col items-center text-slate-300">
              <User className="h-24 w-24 mb-2" />
              <span className="text-sm font-medium">Sem foto cadastrada</span>
            </div>
          )}
          {/* Botão de Fechar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 h-9 w-9 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-md transition-colors shadow-sm [&_svg]:h-5 [&_svg]:w-5"
          >
            <X />
          </Button>
        </div>

        {/* Dados do Estudante e Botão */}
        <div className="p-6 bg-white">
          <h2 className="text-xl font-extrabold text-[#0E4194] mb-4 leading-tight">
            {student.nome}
          </h2>

          <div className="flex flex-col gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            {/* Linha 1: Matrícula e Turma */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Matrícula
                </span>
                <span className="text-sm font-medium text-slate-800 font-mono">
                  {student.matricula}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Turma
                </span>
                <Badge
                  variant="secondary"
                  className="text-sm font-extrabold text-[#0E4194] bg-[#0E4194]/10 hover:bg-[#0E4194]/20 px-2 py-0.5 rounded-md border-0"
                >
                  {student.turma}
                </Badge>
              </div>
            </div>

            {/* Linha 2: Turno e Autor da Foto */}
            <div className="flex justify-between items-center border-t border-slate-200 pt-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Turno
                </span>
                <span className="text-sm font-medium text-slate-800">
                  {student.turno || "Não informado"}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Foto capturada por
                </span>
                <span className="text-xs font-medium text-slate-600 flex items-center gap-1 mt-0.5">
                  {student.userTakePhoto ? (
                    <>
                      <User className="h-3 w-3" />
                      {/* Mostra apenas a parte do email antes do @ para não quebrar o layout */}
                      {student.userTakePhoto.split("@")[0]}
                    </>
                  ) : (
                    "Nenhuma foto"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Botão para abrir a câmera (Verde SESI como destaque primário) */}
          <Button
            onClick={onOpenCamera}
            className="w-full h-14 bg-[#68B42D] hover:bg-[#5a9c27] text-white text-base font-bold shadow-md transition-all rounded-xl"
          >
            <Camera className="mr-2 h-5 w-5" />
            {student.link_image
              ? "Capturar Nova Foto"
              : "Tirar Foto do Estudante"}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
