import { Loader2, AlertCircle } from "lucide-react";
import { UserCard } from "./UserCard";
import { Student } from "@/types/student";

interface ResultsListProps {
  students: Student[];
  isLoading: boolean;
  errorMsg: string | null;
  onStudentClick: (student: Student) => void;
}

export function ResultsList({
  students,
  isLoading,
  errorMsg,
  onStudentClick,
}: ResultsListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#0E4194]" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-600 border border-red-100">
        <AlertCircle className="h-5 w-5" />
        <p>{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {students.map((student) => (
        <UserCard
          key={student.matricula}
          student={student}
          onClick={onStudentClick}
        />
      ))}

      {students.length === 0 && (
        <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          Nenhum estudante encontrado com esses filtros.
        </div>
      )}
    </div>
  );
}
