"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";


export default function LoginCallbackPage() {
  const { handleLoginCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        await handleLoginCallback();
      } catch (callbackError) {
        if (callbackError instanceof Error) {
          setError(callbackError.message);
          return;
        }
        setError("Login callback failed.");
      }
    };
    void run();
  }, [handleLoginCallback]);

  return (
    <div className="mx-auto mt-24 max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Completing login...</h1>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : <p className="mt-4 text-sm text-slate-600">Redirecting back to portal.</p>}
    </div>
  );
}
