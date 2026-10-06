import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CodeBlock } from "@/components/CodeBlock";

export const runtime = "nodejs";

export default async function TemplatePage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServerClient();
  
  const { data: template } = await supabase
    .from("project_templates")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!template) {
    return notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();

  const isGuest = !user;

  return (
    <main className="min-h-dvh bg-[#f7faf8] px-5 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header>
          <Link href="/" className="text-sm font-bold text-coral hover:underline">
            &larr; Back to Home
          </Link>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-ink">{template.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-md bg-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-800">
              {template.level}
            </span>
            <span className="rounded-md bg-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-800">
              ~{template.time_minutes} mins
            </span>
            {template.free_tools.map((tool: string) => (
              <span key={tool} className="rounded-md bg-mint px-2 py-1 text-xs font-semibold text-ink">
                {tool}
              </span>
            ))}
          </div>
        </header>

        {isGuest ? (
          <section className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm text-center space-y-4">
            <h2 className="text-xl font-bold text-ink">Unlock the Starter Code</h2>
            <p className="text-neutral-600">
              Sign in to view the full step-by-step outline, run instructions, and complete starter code for this project.
            </p>
            <div className="pt-4">
              <Link href="/login" className="inline-flex rounded-md bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-neutral-800">
                Sign in to unlock
              </Link>
            </div>
          </section>
        ) : (
          <div className="space-y-8">
            <section className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-ink">Build Outline</h2>
              <ol className="mt-4 space-y-4">
                {(template.steps as any).steps?.map((step: string, idx: number) => (
                  <li key={idx} className="flex gap-3 text-sm leading-6 text-neutral-700">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-mint text-xs font-bold text-ink">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-md border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-ink">Run Instructions</h2>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                {template.run_instructions}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-ink">Starter Code</h2>
              
              <div>
                <h3 className="text-lg font-bold text-ink mb-2">Backend</h3>
                <CodeBlock 
                  code={(template.starter_code as any).backend.code} 
                  language="python" 
                  path={(template.starter_code as any).backend.path} 
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-ink mb-2">Frontend</h3>
                <CodeBlock 
                  code={(template.starter_code as any).frontend.code} 
                  language="html" 
                  path={(template.starter_code as any).frontend.path} 
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
