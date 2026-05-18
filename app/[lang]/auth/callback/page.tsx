"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallbackWrapper() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: "#050a05" }} />}>
      <AuthCallbackPage />
    </Suspense>
  );
}

function AuthCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = (params.lang as string) ?? "en";
  const next = searchParams.get("next") || `/${lang}/payment`;

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      router.replace(data.session ? next : `/${lang}/auth`);
    });
  }, [router, next, lang]);

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "#050a05" }}>
      <div className="text-sm" style={{ color: "#00ff88", fontFamily: "Courier New, monospace" }}>
        // Authenticating...
      </div>
    </main>
  );
}
