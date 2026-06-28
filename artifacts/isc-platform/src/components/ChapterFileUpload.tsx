import { useRef, useState } from "react";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChapterFileUploadProps {
  currentUrl?: string | null;
  onUploaded: (objectPath: string) => void;
  disabled?: boolean;
}

function fileNameFromPath(path: string): string {
  try {
    const parts = path.split("/");
    return decodeURIComponent(parts[parts.length - 1] || path);
  } catch {
    return path;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function ChapterFileUpload({ currentUrl, onUploaded, disabled }: ChapterFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Demo-User-Id": localStorage.getItem("isc_demo_user_id") ?? "",
        },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      if (!urlRes.ok) {
        const body = await urlRes.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? "Impossible d'obtenir l'URL d'upload.");
        return;
      }

      const { uploadURL, objectPath } = await urlRes.json() as { uploadURL: string; objectPath: string };

      const gcsRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!gcsRes.ok) {
        setError("Échec de l'envoi du fichier vers le stockage.");
        return;
      }

      setUploadedFile({ name: file.name, size: file.size });
      onUploaded(objectPath);
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setUploading(false);
    }
  };

  const isStoredObject = currentUrl?.startsWith("/objects/");
  const displayName = uploadedFile
    ? uploadedFile.name
    : isStoredObject
    ? fileNameFromPath(currentUrl!)
    : currentUrl
    ? currentUrl
    : null;

  return (
    <div className="space-y-2">
      {displayName && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground flex-1">{displayName}</span>
          {uploadedFile && (
            <span className="shrink-0 text-xs text-muted-foreground">{formatSize(uploadedFile.size)}</span>
          )}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className="gap-2"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploading
          ? "Upload en cours…"
          : displayName
          ? "Remplacer le fichier"
          : "Choisir un fichier"}
      </Button>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="video/mp4,video/webm,video/ogg,.pdf,.doc,.docx"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <span className="shrink-0">⚠️</span>
          <span className="flex-1">{error}</span>
          <button
            type="button"
            className="ml-auto text-red-400 hover:text-red-600"
            onClick={() => setError(null)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Formats acceptés : PDF, DOC, DOCX, vidéo MP4/WebM — max 50 Mo vidéo, 20 Mo document
      </p>
    </div>
  );
}
