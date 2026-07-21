import { useEffect, useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ACCEPT = "image/*,video/mp4,video/webm,video/quicktime,image/gif,.glb,.gltf,model/gltf-binary,model/gltf+json";
const MAX_MB = 25;
const SIGN_EXPIRES = 60 * 60 * 24 * 365 * 10; // 10 years

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

/** Extract the storage path inside `media` bucket from a legacy public URL, if any. */
function extractLegacyMediaPath(url: string): string | null {
  const m = url.match(/\/storage\/v1\/object\/public\/media\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

const signedCache = new Map<string, string>();

async function resolveMediaUrl(url: string): Promise<string> {
  if (!url) return url;
  // Already a signed URL or an external URL — use as-is.
  if (url.includes("/object/sign/") || !url.includes("/storage/v1/object/public/media/")) return url;
  if (signedCache.has(url)) return signedCache.get(url)!;
  const path = extractLegacyMediaPath(url);
  if (!path) return url;
  const { data } = await supabase.storage.from("media").createSignedUrl(path, SIGN_EXPIRES);
  const signed = data?.signedUrl ?? url;
  signedCache.set(url, signed);
  return signed;
}

export function MediaPreview({ url, className = "" }: { url: string | null; className?: string }) {
  const [resolved, setResolved] = useState<string | null>(url);
  useEffect(() => {
    let cancelled = false;
    if (!url) return setResolved(null);
    resolveMediaUrl(url).then((r) => !cancelled && setResolved(r));
    return () => { cancelled = true; };
  }, [url]);

  if (!resolved) return null;
  const kind = detectMediaKind(resolved);
  if (kind === "video")
    return <video src={resolved} className={className} autoPlay muted loop playsInline />;
  if (kind === "3d")
    return (
      <div className={`flex items-center justify-center bg-muted text-xs text-muted-foreground ${className}`}>
        3D model · {resolved.split("/").pop()?.split("?")[0]}
      </div>
    );
  return <img src={resolved} alt="" className={className} />;
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
      const { data: signed, error: signErr } = await supabase.storage
        .from("media")
        .createSignedUrl(path, SIGN_EXPIRES);
      if (signErr || !signed?.signedUrl) throw signErr ?? new Error("Sign failed");
      onChange(signed.signedUrl, detectMediaKind(path));
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
