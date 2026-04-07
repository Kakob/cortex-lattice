/**
 * Problem Page - Dynamic route for individual problems
 *
 * - /problems/[id]              → Theme picker (choose a narrative theme)
 * - /problems/[id]?theme=<id>  → Workspace (code editor + tests)
 *
 * If only one theme exists, the picker is skipped via redirect.
 */

import { notFound, redirect } from "next/navigation";
import {
  loadProblem,
  buildLearningGuide,
  getAllProblems,
  getAvailableThemes,
} from "@/lib/problems";
import { ProblemWorkspace } from "@/components/ProblemWorkspace";

interface ProblemPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ theme?: string }>;
}

// Generate static params for all problems
export async function generateStaticParams() {
  const problems = await getAllProblems();
  return problems.map((problem) => ({
    id: problem.id,
  }));
}

// Generate metadata for the page
export async function generateMetadata({ params, searchParams }: ProblemPageProps) {
  const { id } = await params;
  const { theme } = await searchParams;
  const problem = await loadProblem(id, theme);

  if (!problem) {
    return { title: "Problem Not Found - Cortex Lattice" };
  }

  return {
    title: `${problem.title} - Cortex Lattice`,
    description: problem.description.slice(0, 160),
  };
}

export default async function ProblemPage({ params, searchParams }: ProblemPageProps) {
  const { id } = await params;
  const { theme } = await searchParams;

  // No theme specified — redirect to the first available theme
  if (!theme) {
    const themes = await getAvailableThemes(id);
    if (themes.length > 0) {
      redirect(`/problems/${id}?theme=${themes[0].themeId}`);
    }
    notFound();
  }

  const [problem, learningGuide] = await Promise.all([
    loadProblem(id, theme),
    buildLearningGuide(id, theme),
  ]);

  if (!problem || !learningGuide) {
    notFound();
  }

  return (
    <ProblemWorkspace
      problem={problem}
      learningGuide={learningGuide}
      themeId={problem.themeId}
    />
  );
}
