import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  adminChecked: boolean;
};

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!session?.user) {
      setIsAdmin(false);
      // Do not mark the initial anonymous render as checked. getSession() may
      // resolve immediately afterwards with a signed-in user; marking it ready
      // here lets the admin route reject that user before the role query runs.
      if (!loading) setAdminChecked(true);
      return;
    }

    setAdminChecked(false);
    setIsAdmin(false);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setIsAdmin(Boolean(data));
        setAdminChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [loading, session?.user?.id, session?.user?.email]);

  return {
    session,
    user: session?.user ?? null,
    loading,
    isAdmin,
    adminChecked,
  };
}
