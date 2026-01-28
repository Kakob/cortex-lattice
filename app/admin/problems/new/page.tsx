/**
 * New Problem Page
 *
 * Admin page for creating new problems via the form interface.
 */

import { ProblemForm } from "@/components/admin/problems/ProblemForm";

export default function NewProblemPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create New Problem</h1>
        <p className="mt-1 text-gray-400">
          Fill out the form below to create a new problem. The YAML preview on
          the right updates in real-time.
        </p>
      </div>

      <ProblemForm />
    </div>
  );
}
