import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MediaPreview } from "@/components/site/media-upload";
import { SectionHeading } from "@/components/site/section-heading";

export const Route = createFileRoute("/blog")({
  component: BlogList,
  head: () => ({
    meta: [
      { title: "Blog — Zaxia Healthcare" },
      { name: "description", content: "Product updates, health insights, and news from Zaxia Healthcare." },
    ],
  }),
});

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
  likes_count: number;
  views_count: number;
};

function BlogList() {
  const posts = useQuery({
    queryKey: ["blog", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, image_url, published_at, likes_count, views_count")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });

  return (
    <section className="container-page py-16">
      <SectionHeading eyebrow="Blog" title="Latest from Zaxia" description="Stories, science, and updates from our team." />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.data?.map((p) => (
          <Link
            key={p.id}
            to="/blog/$slug"
            params={{ slug: p.slug }}
            className="group relative flex flex-col rounded-2xl border border-border/70 bg-card overflow-hidden hover:border-primary/40 transition"
          >
            <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-primary/30 to-primary-glow/30">
              {p.image_url ? (
                <MediaPreview url={p.image_url} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-500" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-lg font-semibold text-white line-clamp-2 drop-shadow">{p.title}</h3>
                {p.excerpt && (
                  <p className="mt-1 text-sm text-white/85 line-clamp-2">{p.excerpt}</p>
                )}
              </div>
            </div>
            <div className="p-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {p.likes_count}</span>
              <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {p.views_count}</span>
              {p.published_at && <span className="ml-auto">{new Date(p.published_at).toLocaleDateString()}</span>}
            </div>
          </Link>
        ))}
        {posts.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        )}
      </div>
    </section>
  );
}
