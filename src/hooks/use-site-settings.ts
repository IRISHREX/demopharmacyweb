import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  id: string;
  site_name: string;
  tagline: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  theme: { mode?: "default" | "light" | "dark" | "pro"; primary?: string } | null;
  quote_text: string | null;
  quote_author: string | null;
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SiteSettings | null;
    },
    staleTime: 60_000,
  });
}
