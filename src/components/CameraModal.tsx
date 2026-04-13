import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Student } from "@/types/student";

interface CameraModalProps {
  isOpen: boolean;
  student: Student | null;
  currentUser: string | null;
  onClose: () => void;
  onUploadCommitted: () => Promise<void>;
  onUploadSuccess: (
    matricula: string,
    imageUrl: string,
    userTakePhoto: string | null
  ) => void;
}

export function CameraModal({
  isOpen,
  student,
  currentUser,
  onClose,
  onUploadCommitted,
  onUploadSuccess,
}: CameraModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      alert(
        "Não foi possível acessar a câmera. Verifique as permissões do navegador."
      );
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  const addCacheBuster = (url: string): string => {
    try {
      const parsedUrl = new URL(url);
      const isSignedUrl =
        parsedUrl.searchParams.has("X-Amz-Signature") ||
        parsedUrl.searchParams.has("X-Amz-Algorithm");

      if (isSignedUrl) {
        return url;
      }

      parsedUrl.searchParams.set("t", `${Date.now()}`);
      return parsedUrl.toString();
    } catch {
      return url;
    }
  };

  const captureAndUpload = async () => {
    if (!videoRef.current || !canvasRef.current || !student) return;

    setIsUploading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const MAX_WIDTH = 600;
    let newWidth = video.videoWidth;
    let newHeight = video.videoHeight;

    if (newWidth > MAX_WIDTH) {
      newHeight = Math.floor((newHeight * MAX_WIDTH) / newWidth);
      newWidth = MAX_WIDTH;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, newWidth, newHeight);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          alert("Erro ao gerar a imagem.");
          setIsUploading(false);
          return;
        }

        try {
          const localPreviewUrl = URL.createObjectURL(blob);
          const formData = new FormData();
          formData.append("image", blob, `${student.matricula}.jpg`);

          const uploadResponse = await fetch(
            `/api/students/${student.matricula}/photo-upload`,
            {
              method: "POST",
              body: formData,
            },
          );

          if (!uploadResponse.ok) {
            throw new Error("Falha ao salvar foto.");
          }

          const { imageUrl } = (await uploadResponse.json()) as {
            imageUrl: string | null;
          };

          const persistedUrl = imageUrl
            ? addCacheBuster(imageUrl)
            : (student.link_image ?? "");

          onUploadSuccess(
            student.matricula,
            localPreviewUrl,
            currentUser,
          );

          if (persistedUrl) {
            onUploadSuccess(student.matricula, persistedUrl, currentUser);
          }

          await onUploadCommitted();
          URL.revokeObjectURL(localPreviewUrl);

          onClose();
        } catch (error: unknown) {
          console.error("Erro no processo de upload:", error);
          alert("Falha ao salvar a foto. Tente novamente.");
        } finally {
          setIsUploading(false);
        }
      },
      "image/jpeg",
      0.6
    );
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between p-4 text-white bg-linear-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
        <div>
          <p className="font-semibold line-clamp-1 drop-shadow-md">
            {student.nome}
          </p>
          <p className="text-xs text-gray-200 drop-shadow-md">
            Turma: {student.turmaNome}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-10 w-10 p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md transition-colors border border-white/20 text-white disabled:opacity-50 hover:text-white [&_svg]:h-6 [&_svg]:w-6"
          disabled={isUploading}
        >
          <X />
        </Button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden mt-16 md:mt-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="p-6 pb-12 bg-linear-to-t from-black via-black/90 to-transparent flex justify-center absolute bottom-0 w-full">
        <Button
          onClick={captureAndUpload}
          disabled={isUploading}
          size="lg"
          className="w-full max-w-sm h-16 rounded-full bg-[#68B42D] hover:bg-[#5a9c27] text-white font-bold text-lg shadow-[0_0_20px_rgba(104,180,45,0.4)] flex items-center gap-2 border-2 border-white/10 transition-all active:scale-95"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" /> Processando...
            </>
          ) : (
            <>
              <Camera className="h-6 w-6" /> Capturar Agora
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
