import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const demoColleges = [
  "JNTU Hyderabad",
  "VNR VJIET",
  "CBIT Hyderabad",
  "Osmania University College of Engineering",
  "Vasavi College of Engineering"
];

const demoStudents = [
  { name: "DEMO Priya Sharma", college: "JNTU Hyderabad", branch: "cse", year: 4, refCode: "NXT_PRIYA1" },
  { name: "DEMO Ananya Reddy", college: "JNTU Hyderabad", branch: "cse", year: 4, refCode: "NXT_ANANYA" },
  { name: "DEMO Karthik Verma", college: "VNR VJIET", branch: "ece", year: 4, refCode: "NXT_KARTHK" },
  { name: "DEMO Rohan Mehta", college: "VNR VJIET", branch: "cse", year: 4, refCode: "NXT_ROHAN" },
  { name: "DEMO Sneha Rao", college: "CBIT Hyderabad", branch: "it", year: 4, refCode: "NXT_SNEHA" },
  { name: "DEMO Vikram Singh", college: "CBIT Hyderabad", branch: "eee", year: 4, refCode: "NXT_VIKRAM" },
  { name: "DEMO Divya Teja", college: "Osmania University College of Engineering", branch: "cse", year: 4, refCode: "NXT_DIVYA" },
  { name: "DEMO Arjun Nair", college: "Vasavi College of Engineering", branch: "mechanical", year: 4, refCode: "NXT_ARJUN" }
];

async function seedDemoData() {
  console.log("Seeding DEMO growth data...");

  // Insert DEMO auth user placeholders & profiles
  const profilesToInsert = [];

  for (const s of demoStudents) {
    // Generate deterministic UUIDs for demo profiles
    const hex = Buffer.from(s.refCode.padEnd(16, "0")).toString("hex").slice(0, 32);
    const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;

    profilesToInsert.push({
      id: uuid,
      name: s.name,
      college: s.college,
      branch: s.branch,
      year: s.year,
      whatsapp_opt_in: true,
      ref_code: s.refCode,
      source_utm: { utm_source: "demo_seed", utm_campaign: "workshop_60min" }
    });
  }

  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert(profilesToInsert, { onConflict: "id" });

  if (profileErr) {
    console.error("Profile seed error:", profileErr);
    throw profileErr;
  }

  console.log(`Seeded ${profilesToInsert.length} DEMO student profiles.`);

  // Seed referrals (Priya referred 3 students, Karthik referred 2, Sneha referred 1)
  const priyaId = profilesToInsert[0].id;
  const karthikId = profilesToInsert[2].id;
  const snehaId = profilesToInsert[4].id;

  const demoReferrals = [
    { referrer_id: priyaId, referred_id: profilesToInsert[1].id, counted: true },
    { referrer_id: priyaId, referred_id: profilesToInsert[3].id, counted: true },
    { referrer_id: priyaId, referred_id: profilesToInsert[5].id, counted: true },
    { referrer_id: karthikId, referred_id: profilesToInsert[6].id, counted: true },
    { referrer_id: karthikId, referred_id: profilesToInsert[7].id, counted: true },
    { referrer_id: snehaId, referred_id: profilesToInsert[1].id, counted: true }
  ];

  const { error: refErr } = await supabase
    .from("referrals")
    .upsert(demoReferrals, { onConflict: "referred_id", ignoreDuplicates: true });

  if (refErr) {
    console.warn("Referral seed notice (some duplicates skipped):", refErr.message);
  } else {
    console.log(`Seeded DEMO referrals.`);
  }

  // Seed sample completed submission
  const demoSubmission = {
    user_id: priyaId,
    url: "https://github.com/nxtwave-demo/ai-study-buddy",
    status: "completed",
    score: {
      total_score: 92,
      breakdown: {
        code_quality: 24,
        completeness: 23,
        ai_integration: 23,
        presentation: 22
      },
      feedback: "DEMO Evaluation: Excellent project architecture with responsive AI prompts, clean Next.js state management, and clear documentation.",
      badge: "Workshop AI Champion",
      key_strengths: [
        "Interactive Q&A engine built with Groq SDK",
        "Clean mobile UI with zero runtime crashes",
        "Clear step-by-step resume explanation"
      ]
    }
  };

  await supabase.from("submissions").insert(demoSubmission);
  console.log("Seeded DEMO completed submission.");
  console.log("DEMO growth data seed complete!");
}

seedDemoData().catch((e) => {
  console.error("Seed script failed:", e);
  process.exit(1);
});
