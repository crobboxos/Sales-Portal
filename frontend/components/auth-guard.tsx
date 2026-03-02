"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth-provider";

export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isLoading, isAuthenticated, login, configError } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !configError) {
      void login(pathname || "/accounts");
    }
  }, [isLoading, isAuthenticated, login, pathname, configError]);

  if (configError) {
    return (
      <div className="mx-auto mt-24 max-w-2xl rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-lg font-semibold">Okta Configuration Required</h2>
        <p className="mt-2 text-sm">{configError}</p>
      </div>
    );
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-600">Authenticating...</p>
      </div>
    );
  }

  return <>{children}</>;
}
