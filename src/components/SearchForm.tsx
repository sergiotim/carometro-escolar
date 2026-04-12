import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchFormProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedTurma: string;
  onTurmaChange: (value: string) => void;
  turmas: string[];
}

export function SearchForm({
  searchTerm,
  onSearchChange,
  selectedTurma,
  onTurmaChange,
  turmas,
}: SearchFormProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 w-full items-center">
      {/* Campo de Busca */}
      <div className="relative w-full md:flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar estudante por nome..."
          className="pl-9 h-11 rounded-xl bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#0E4194] shadow-sm"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Select de Turmas */}
      <div className="relative w-full md:w-64">
        <select
          value={selectedTurma}
          onChange={(e) => onTurmaChange(e.target.value)}
          className="w-full h-11 appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 py-2 text-sm font-semibold text-[#0E4194] focus:outline-none focus:ring-2 focus:ring-[#0E4194] focus:border-transparent shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
        >
          {turmas.map((turma) => (
            <option
              key={turma}
              value={turma}
              className="bg-white text-slate-800 font-medium"
            >
              {turma === "Todas" ? "Todas as Turmas" : turma}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0E4194] pointer-events-none" />
      </div>
    </div>
  );
}
