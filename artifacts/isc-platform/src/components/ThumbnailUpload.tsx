import { useRef, useState } from "react";
import { Upload, Loader2, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThumbnailUploadProps {
  currentUrl?: string | null;
  onUploaded: (objectPath: string) => void;
  disabled?: boolean;
}

export function getThumbnailSrc(url: string | null | undefined, fallback = "/images/course-default.png"): string {
  if (!url) return fallback;
  if (url.startsWith("/objects/")) return `/api/storage/thumbnail?path=${encodeURIComponent(url)}`;
  return url;
}

export function ThumbnailUpload({ currentUrl, onUploaded, disabled }: ThumbnailUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displaySrc = previewUrl ?? getThumbnailSrc(currentUrl, "");

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
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
        setPreviewUrl(null);
        return;
      }

      const { uploadURL, objectPath } = await urlRes.json() as { uploadURL: string; objectPath: string };

      const gcsRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!gcsRes.ok) {
        setError("Échec de l'envoi de l'image vers le stockage.");
        setPreviewUrl(null);
        return;
      }

      onUploaded(objectPath);
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        className="relative w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 overflow-hidden cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors group"
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        {displaySrc ? (
          <>
            <img
              src={displaySrc}
              alt="Miniature"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium">
              <Upload className="h-4 w-4" />
              Changer l'image
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <ImageIcon className="h-8 w-8 opacity-40" />
            )}
            <span className="text-xs">{uploading ? "Upload en cours…" : "Cliquer pour choisir une image"}</span>
          </div>
        )}

        {uploading && displaySrc && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Upload en cours…" : displaySrc ? "Changer l'image" : "Choisir une image"}
        </Button>
        {displaySrc && !uploading && (
          <span className="text-xs text-muted-foreground">JPEG, PNG ou WebP — max 5 Mo</span>
        )}
      </div>

      {!displaySrc && !uploading && (
        <p className="text-xs text-muted-foreground">Formats acceptés : JPEG, PNG, WebP — max 5 Mo</p>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
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
    </div>
  );
}
