import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import Image from "next/image";
import { Student } from "@/types/student";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface UserCardProps {
  student: Student;
  onClick: (student: Student) => void;
}

export function UserCard({ student, onClick }: UserCardProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [student.matricula, student.link_image]);

  const showStudentPhoto = Boolean(student.link_image) && !imageError;

  return (
    <Card
      className="overflow-hidden border-slate-200 bg-white hover:border-[#0E4194]/30 transition-all hover:shadow-lg cursor-pointer group rounded-2xl"
      onClick={() => onClick(student)}
    >
      <div className="relative aspect-square w-full bg-slate-100 flex items-center justify-center">
        {showStudentPhoto ? (
          <Image
            src={student.link_image!}
            alt={`Foto de ${student.nome}`}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center text-slate-400 group-hover:text-[#0E4194] transition-colors">
            <User className="h-16 w-16 mb-2 opacity-30" />
            <span className="text-xs font-medium bg-slate-200 px-3 py-1 rounded-full group-hover:bg-[#0E4194]/10">
              Ver detalhes
            </span>
          </div>
        )}
      </div>
      <CardContent className="p-5 bg-white">
        <h3
          className="font-semibold text-slate-800 line-clamp-1"
          title={student.nome}
        >
          {student.nome}
        </h3>
        <div className="mt-2 flex justify-between items-center text-xs text-slate-500">
          <span className="font-mono">Mat: {student.matricula}</span>
          <Badge variant="secondary" className="bg-[#0E4194]/10 text-[#0E4194] hover:bg-[#0E4194]/20">
            {student.turmaNome}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
