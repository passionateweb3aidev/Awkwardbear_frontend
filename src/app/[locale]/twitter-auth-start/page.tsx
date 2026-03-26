"use client";

import { Button } from "@/components/ui/button";
import { getTwitterOAuthAuthorizationUrl } from "@/utils/telegramLink";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function TwitterAuthStartPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const hasStartedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!callbackUrl || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    setIsStarting(true);

    getTwitterOAuthAuthorizationUrl(callbackUrl)
      .then((oauthUrl) => {
        window.location.replace(oauthUrl);
      })
      .catch((startError) => {
        const message = startError instanceof Error ? startError.message : String(startError);
        setError(message);
        setIsStarting(false);
        hasStartedRef.current = false;
      });
  }, [callbackUrl]);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto flex max-w-lg flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Telegram X Bind</div>
          <h1 className="mt-3 text-2xl font-semibold">Starting X authorization in browser</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            This page initializes NextAuth inside the external browser so the OAuth callback can
            keep its PKCE and state cookies.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-xs leading-6 text-slate-200">
          <div>callbackUrl: {callbackUrl || "-"}</div>
          <div>status: {error ? "failed" : isStarting ? "starting" : "idle"}</div>
          {error ? <div className="text-rose-300">error: {error}</div> : null}
        </div>

        {error ? (
          <Button
            type="button"
            className="h-11 rounded-xl text-sm font-semibold"
            onClick={() => {
              setError(null);
              setIsStarting(false);
              hasStartedRef.current = false;
            }}
          >
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
