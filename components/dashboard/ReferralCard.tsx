"use client";

import { useState } from "react";

export function ReferralCard({
  refCode,
  siteUrl,
  userReferralCount
}: {
  refCode: string;
  siteUrl: string;
  userReferralCount: number;
}) {
  const [copied, setCopied] = useState(false);
  const referralLink = `${siteUrl}?ref=${refCode}`;

  const whatsappMessage = encodeURIComponent(
    `Hey! Check out NxtWave's free workshop "Build Your First AI Project in 60 Minutes". Build a real project and boost your resume! Register here: ${referralLink}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  }

  return (
    <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">
            Referral Hub
          </p>
          <h2 className="text-xl font-bold text-ink">Invite Classmates</h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-ink">{userReferralCount}</p>
          <p className="text-xs text-neutral-500 font-medium">Successful Referrals</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-neutral-600">
          Your Unique Referral Link (Code: <span className="font-bold text-ink">{refCode}</span>)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-mono text-neutral-800 focus:outline-none select-all"
          />
          <button
            type="button"
            onClick={copyLink}
            className="rounded-md bg-ink px-4 py-2 text-xs font-bold text-white transition hover:bg-neutral-800"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="pt-1">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#20bd5a]"
        >
          <svg className="size-4 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
          </svg>
          Share on WhatsApp
        </a>
      </div>
    </div>
  );
}
