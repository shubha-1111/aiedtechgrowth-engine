"use client";

import { useState } from "react";

export type StudentLeaderboardEntry = {
  id: string;
  name: string;
  college: string;
  branch: string;
  referrals_count: number;
};

export type CollegeLeaderboardEntry = {
  college: string;
  registrations_count: number;
};

export function LeaderboardView({
  students,
  colleges
}: {
  students: StudentLeaderboardEntry[];
  colleges: CollegeLeaderboardEntry[];
}) {
  const [activeTab, setActiveTab] = useState<"students" | "colleges">("students");

  return (
    <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">
            Growth Leaderboard
          </p>
          <h2 className="text-xl font-bold text-ink">Leaderboards</h2>
        </div>

        <div className="flex rounded-md bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "students"
                ? "bg-white text-ink shadow-sm"
                : "text-neutral-600 hover:text-ink"
            }`}
          >
            Top Students
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("colleges")}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "colleges"
                ? "bg-white text-ink shadow-sm"
                : "text-neutral-600 hover:text-ink"
            }`}
          >
            Top Colleges
          </button>
        </div>
      </div>

      {activeTab === "students" ? (
        <div className="space-y-2">
          {students.length === 0 ? (
            <p className="py-6 text-center text-xs text-neutral-500">
              No referral data yet. Share your referral link to reach the top!
            </p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {students.map((student, idx) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0
                          ? "bg-amber-100 text-amber-800"
                          : idx === 1
                          ? "bg-slate-200 text-slate-800"
                          : idx === 2
                          ? "bg-amber-700/10 text-amber-900"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-ink">{student.name}</p>
                      <p className="text-neutral-500">
                        {student.college} • {student.branch.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-ink">{student.referrals_count}</span>
                    <span className="text-neutral-500 ml-1">refs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {colleges.length === 0 ? (
            <p className="py-6 text-center text-xs text-neutral-500">
              No college registrations yet.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {colleges.map((col, idx) => (
                <div
                  key={col.college}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0
                          ? "bg-amber-100 text-amber-800"
                          : idx === 1
                          ? "bg-slate-200 text-slate-800"
                          : idx === 2
                          ? "bg-amber-700/10 text-amber-900"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <p className="font-bold text-ink">{col.college}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-ink">{col.registrations_count}</span>
                    <span className="text-neutral-500 ml-1">builders</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
