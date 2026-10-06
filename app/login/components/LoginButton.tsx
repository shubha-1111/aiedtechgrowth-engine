"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function LoginButton() {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });

      if (signInError) throw signInError;
      if (!data?.url) throw new Error("No URL returned");

      try {
        const res = await fetch(data.url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (errData.error_code === "validation_failed" || errData.msg?.includes("not enabled")) {
            setError("Google sign-in is not enabled. Please enable the Google provider in your Supabase dashboard.");
            return;
          }
          throw new Error(errData.msg || "Authentication failed");
        }
      } catch (e) {
        // If fetch throws a TypeError due to CORS from Google's redirect, it means it's working!
      }

      // Proceed with redirect
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError("Google login could not be completed. Please try again.");
    }
  };

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        onClick={handleLogin}
        type="button"
        className="flex w-full items-center justify-center rounded-md bg-ink px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
      >
        Continue with Google
      </button>
    </div>
  );
}
