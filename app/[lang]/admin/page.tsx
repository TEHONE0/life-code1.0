"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Lang } from "@/lib/i18n";

export default function AdminRedirect() {
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as Lang) ?? "zh";

  useEffect(() => {
    router.replace(`/${lang}/account?view=admin`);
  }, [lang, router]);

  return null;
}
