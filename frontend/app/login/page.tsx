"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";


export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, configError } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/accounts");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="mx-auto mt-24 max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Sales Management Portal</h1>
      <p className="mt-3 text-sm text-slate-600">Sign in with Okta to access internal sales data.</p>
      {configError ? <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-900">{configError}</p> : null}
      <button
        type="button"
        onClick={() => void login("/accounts")}
        disabled={Boolean(configError)}
        className="mt-6 w-full rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue with Okta
      </button>
    </div>
  );
}
