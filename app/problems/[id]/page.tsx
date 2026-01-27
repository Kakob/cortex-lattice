/**
 * Problem Page - Dynamic route for individual problems
 *
 * Server component that loads problem data and renders the workspace.
 */

import { notFound } from "next/navigation";
import { loadProblem, buildLearningGuide, getAllProblems } from "@/lib/problems";
import { ProblemWorkspace } from "@/components/ProblemWorkspace";

interface ProblemPageProps {
  params: Promise<{ id: string }>;
}

// Generate static params for all problems
export async function generateStaticParams() {
  const problems = await getAllProblems();
  return problems.map((problem) => ({
    id: problem.id,
  }));
}

// Generate metadata for the page
export async function generateMetadata({ params }: ProblemPageProps) {
  const { id } = await params;
  const problem = await loadProblem(id);

  if (!problem) {
    return {
      title: "Problem Not Found - Cortex Lattice",
    };
  }

  return {
    title: `${problem.title} - Cortex Lattice`,
    description: problem.description.slice(0, 160),
  };
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { id } = await params;

  // Load problem and learning guide
  const [problem, learningGuide] = await Promise.all([
    loadProblem(id),
    buildLearningGuide(id),
  ]);

  if (!problem || !learningGuide) {
    notFound();
  }

  return <ProblemWorkspace problem={problem} learningGuide={learningGuide} />;
}
