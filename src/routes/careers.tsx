import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MapPin, Clock, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/careers")({
  component: Careers,
  head: () => ({
    meta: [
      { title: "Careers at Zaxia Healthcare - Join our team" },
      {
        name: "description",
        content:
          "Explore open roles at Zaxia Healthcare Pvt. Ltd. Sales, QC, R&D and operations positions across India.",
      },
      { property: "og:title", content: "Careers at Zaxia Healthcare" },
      { property: "og:description", content: "Grow with a purpose-driven pharmaceutical company." },
    ],
  }),
});

interface Vacancy {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  description: string | null;
  requirements: string | null;
  posted_at: string;
}

async function fetchVacancies(): Promise<Vacancy[]> {
  const { data, error } = await supabase
    .from("job_vacancies")
    .select(
      "id, slug, title, department, location, employment_type, description, requirements, posted_at",
    )
    .eq("is_open", true)
    .order("posted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function EmptyVacancies() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
      <Briefcase className="mx-auto h-8 w-8 text-primary" />
      <p className="mt-3 font-medium">No open positions right now</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Check back soon or email{" "}
        <a className="text-primary hover:underline" href="mailto:zaxiahealthcare@gmail.com">
          zaxiahealthcare@gmail.com
        </a>
        .
      </p>
    </div>
  );
}

function Careers() {
  const q = useQuery({ queryKey: ["careers"], queryFn: fetchVacancies });
  const vacancies = q.data ?? [];
  const shouldShowEmpty = (q.isSuccess && vacancies.length === 0) || q.isError;

  return (
    <>
      <section className="gradient-brand text-primary-foreground rounded-b-2xl md:rounded-2xl md:m-1">
        <div className="container-page py-16 md:py-20 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground mt-16">
            Careers
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold gradient-heading">
            Build a healthier tomorrow with us.
          </h1>
          <p className="mt-4 text-lg text-primary-foreground">
            Join Zaxia Healthcare - a growing pharma company where quality, science and people come
            first.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-page">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold gradient-heading">Open positions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {q.isLoading
                  ? "Loading..."
                  : q.isError
                    ? "No roles currently open"
                    : `${vacancies.length} role${vacancies.length === 1 ? "" : "s"} currently open`}
              </p>
            </div>
          </div>

          {q.isLoading && <p className="text-sm text-muted-foreground">Loading roles...</p>}
          {shouldShowEmpty && <EmptyVacancies />}

          <div className="grid gap-4">
            {vacancies.map((v) => (
              <article
                key={v.id}
                className="rounded-2xl border border-border/60 bg-card p-6 md:p-7 shadow-soft transition hover:border-primary/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">{v.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {v.department && (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-4 w-4" />
                          {v.department}
                        </span>
                      )}
                      {v.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {v.location}
                        </span>
                      )}
                      {v.employment_type && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {v.employment_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to="/careers/$slug/apply"
                    params={{ slug: v.slug }}
                    className="inline-flex items-center rounded-full gradient-brand px-5 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-95"
                  >
                    Apply
                  </Link>
                </div>
                {v.description && (
                  <p className="mt-4 text-sm leading-relaxed text-foreground/80">{v.description}</p>
                )}
                {v.requirements && (
                  <div className="mt-3 text-sm">
                    <span className="font-medium">Requirements: </span>
                    <span className="text-muted-foreground">{v.requirements}</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
