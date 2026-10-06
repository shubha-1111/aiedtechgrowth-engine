import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const PROMPT_VERSION = "quiz_idea_v1";

const branches = ["cse", "ece", "eee", "mechanical", "civil", "it", "other"];
const skills = ["beginner", "some_coding", "project_ready"];
const interests = ["ai_tools", "web_apps", "data", "automation", "career_prep"];
const timeBrackets = ["30_min", "1_hour", "2_hours", "weekend"];

const branchLabels = {
  cse: "CSE",
  ece: "ECE",
  eee: "EEE",
  mechanical: "Mechanical",
  civil: "Civil",
  it: "IT",
  other: "Engineering"
};

const skillLabels = {
  beginner: "starter",
  some_coding: "guided",
  project_ready: "polished"
};

const interestLabels = {
  ai_tools: "AI Study Buddy",
  web_apps: "Campus Event Web App",
  data: "Placement Readiness Dashboard",
  automation: "Smart Task Automator",
  career_prep: "Resume Match Coach"
};

const toolsByInterest = {
  ai_tools: ["Next.js", "Groq", "Supabase"],
  web_apps: ["Next.js", "Supabase", "Tailwind"],
  data: ["Next.js", "Supabase", "Charts"],
  automation: ["Next.js", "Supabase", "Webhooks"],
  career_prep: ["Next.js", "Groq", "Supabase"]
};

function buildIdea({ branch, skill, interest, time }) {
  const branchLabel = branchLabels[branch];
  const interestLabel = interestLabels[interest];
  const levelLabel = skillLabels[skill];
  const timeText = time.replace("_", " ");

  return {
    title: `DEMO ${branchLabel} ${interestLabel}`,
    description: `DEMO idea: a ${levelLabel} ${interestLabel.toLowerCase()} project for ${branchLabel} students that can be scoped for a ${timeText} build session. Includes complete frontend and backend examples.`,
    steps: [
      `Define one ${branchLabel} student problem and the exact input the app needs.`,
      `Build the frontend UI using Next.js and Tailwind CSS with free component libraries.`,
      `Set up the backend with Supabase (database + auth) and deploy on Vercel for free.`,
      `Build a small ${interestLabel.toLowerCase()} workflow with sample DEMO data.`,
      "Test the fullstack flow on mobile and write a two-line project summary."
    ],
    tools: [...toolsByInterest[interest], "Vercel", "Tailwind"],
    why_it_helps_resume: `DEMO resume angle: it shows you can build a complete frontend and backend product using modern free tools, connect data or AI to a workflow, and explain the outcome clearly.`
  };
}

function cacheKey({ branch, skill, interest, time }) {
  return createHash("sha256")
    .update(`${PROMPT_VERSION}${branch}${skill}${interest}${time}`)
    .digest("hex");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

if (!globalThis.WebSocket) {
  globalThis.WebSocket = class WebSocket {
    constructor() {}
    close() {}
    send() {}
  };
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const templates = branches.flatMap((branch) =>
  interests.flatMap((interest) =>
    skills.map((skill) => {
      const idea = buildIdea({ branch, skill, interest, time: "1_hour" });
      const slug = `demo-${branch}-${interest}-${skill}`.toLowerCase().replace(/_/g, '-');

      return {
        branches: [branch],
        interest,
        level: skill,
        title: idea.title,
        slug,
        steps: {
          description: idea.description,
          steps: idea.steps,
          tools: idea.tools,
          why_it_helps_resume: idea.why_it_helps_resume
        }
      };
    })
  )
);

const cacheRows = branches.flatMap((branch) =>
  skills.flatMap((skill) =>
    interests.flatMap((interest) =>
      timeBrackets.map((time) => ({
        cache_key: cacheKey({ branch, skill, interest, time }),
        idea: buildIdea({ branch, skill, interest, time }),
        prompt_version: PROMPT_VERSION
      }))
    )
  )
);

const templateResult = await supabase
  .from("project_templates")
  .upsert(templates, { onConflict: "slug" });

if (templateResult.error) {
  throw templateResult.error;
}

const cacheResult = await supabase.from("quiz_cache").upsert(cacheRows);

if (cacheResult.error) {
  throw cacheResult.error;
}

console.log(`Seeded ${templates.length} DEMO project templates.`);
console.log(`Seeded ${cacheRows.length} DEMO quiz cache rows.`);
