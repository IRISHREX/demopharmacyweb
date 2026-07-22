import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Heart, Eye, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MediaPreview } from "@/components/site/media-upload";
import { getVisitorId } from "@/lib/visitor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogDetail,
});

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  published_at: string | null;
  likes_count: number;
  views_count: number;
};

function BlogDetail() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const visitor = typeof window !== "undefined" ? getVisitorId() : "";

  const post = useQuery({
    queryKey: ["blog", "detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, content, image_url, published_at, likes_count, views_count")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Post | null;
    },
  });

  const liked = useQuery({
    queryKey: ["blog", "liked", slug, visitor],
    enabled: !!post.data && !!visitor,
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_post_likes")
        .select("id")
        .eq("post_id", post.data!.id)
        .eq("visitor_id", visitor)
        .maybeSingle();
      return !!data;
    },
  });

  useEffect(() => {
    if (!post.data?.id) return;
    supabase.rpc("increment_blog_view", { _post_id: post.data.id }).then(() => {});
  }, [post.data?.id]);

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!post.data) throw new Error("Post not loaded");
      if (!visitor) throw new Error("Visitor id missing");
      if (liked.data) {
        const { error } = await supabase.from("blog_post_likes").delete()
          .eq("post_id", post.data.id).eq("visitor_id", visitor);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_post_likes").insert({ post_id: post.data.id, visitor_id: visitor });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog", "liked", slug, visitor] });
      qc.invalidateQueries({ queryKey: ["blog", "detail", slug] });
      qc.invalidateQueries({ queryKey: ["blog", "list"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update like"),
  });

  if (post.isLoading) return <div className="container-page py-16 text-sm text-muted-foreground">Loading…</div>;
  if (!post.data) return <div className="container-page py-16">Post not found. <Link to="/blog" className="text-primary">Back to blog</Link></div>;

  const p = post.data;
  return (
    <article className="container-page py-12 max-w-3xl">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All posts
      </Link>
      <h1 className="mt-4 text-4xl gradient-heading">{p.title}</h1>
      {p.published_at && <p className="mt-2 text-xs text-muted-foreground">{new Date(p.published_at).toLocaleDateString()}</p>}
      {p.image_url && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-muted">
          <MediaPreview url={p.image_url} className="w-full max-h-[480px] object-cover" />
        </div>
      )}
      {p.excerpt && <p className="mt-6 text-lg text-muted-foreground">{p.excerpt}</p>}
      {p.content && <div className="mt-6 whitespace-pre-wrap text-brand-ink leading-relaxed">{p.content}</div>}

      <div className="mt-10 flex items-center gap-3 border-t border-border/70 pt-6">
        <Button
          variant={liked.data ? "default" : "outline"}
          onClick={() => toggleLike.mutate()}
          disabled={toggleLike.isPending}
          className="rounded-full"
        >
          <Heart className={cn("mr-1.5 h-4 w-4", liked.data && "fill-current")} />
          {p.likes_count} {liked.data ? "Liked" : "Like"}
        </Button>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" /> {p.views_count} views
        </span>
      </div>
    </article>
  );
}
