import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ACCEPT = "image/*,video/mp4,video/webm,video/quicktime,image/gif,.glb,.gltf,model/gltf-binary,model/gltf+json";
const MAX_MB = 25;

export type MediaKind = "image" | "video" | "gif" | "3d" | "other";

export function detectMediaKind(url: string | null | undefined): MediaKind {
  if (!url) return "other";
  const u = url.toLowerCase().split("?")[0];
  if (u.endsWith(".gif")) return "gif";
  if (u.match(/\.(mp4|webm|mov|m4v)$/)) return "video";
  if (u.match(/\.(glb|gltf)$/)) return "3d";
  if (u.match(/\.(png|jpe?g|webp|avif|svg)$/)) return "image";
  return "other";
}

export function MediaPreview({ url, className = "" }: { url: string | null; className?: string }) {
  if (!url) return null;
  const kind = detectMediaKind(url);
  if (kind === "video")
    return <video src={url} className={className} autoPlay muted loop playsInline />;
  if (kind === "3d")
    return (
      <div className={`flex items-center justify-center bg-muted text-xs text-muted-foreground ${className}`}>
        3D model · {url.split("/").pop()}
      </div>
    );
  return <img src={url} alt="" className={className} />;
}

export function MediaUpload({
  value,
  onChange,
  folder = "uploads",
}: {
  value: string | null;
  onChange: (url: string | null, kind: MediaKind) => void;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Max ${MAX_MB}MB`);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl, detectMediaKind(data.publicUrl));
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-border/70">
          <MediaPreview url={value} className="max-h-48 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null, "other")}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow"
            aria-label="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
          {value ? "Replace" : "Upload"} (image / video / gif / 3D)
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Accepts images, short videos (mp4/webm, ~3–4s recommended), GIFs, and 3D models (.glb/.gltf). Max {MAX_MB}MB.
      </p>
    </div>
  );
}
