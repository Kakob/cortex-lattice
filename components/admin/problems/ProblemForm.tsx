"use client";

/**
 * Problem Form Component
 *
 * Two-panel layout for creating new problems:
 * - Left (60%): Form sections with React Hook Form
 * - Right (40%): Live YAML preview (sticky)
 */

import { useState, useMemo, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  ChevronRight,
  Save,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  problemSchema,
  ProblemFormData,
  defaultProblemValues,
} from "@/lib/schemas/problemSchema";
import { formDataToYaml } from "@/lib/admin/problemWriter";
import { CodeEditorField } from "./CodeEditorField";
import { DynamicArrayField, StringArrayField } from "./DynamicArrayField";
import { YamlPreview } from "./YamlPreview";

interface ProblemFormProps {
  onSubmit?: (data: ProblemFormData) => Promise<void>;
}

export function ProblemForm({ onSubmit }: ProblemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    basic: true,
    description: true,
    examples: true,
    constraints: true,
    hints: true,
    starterCode: true,
    testCases: true,
    advanced: false,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProblemFormData>({
    resolver: zodResolver(problemSchema),
    defaultValues: defaultProblemValues,
  });

  // Field arrays
  const {
    fields: exampleFields,
    append: appendExample,
    remove: removeExample,
  } = useFieldArray({ control, name: "examples" });

  const {
    fields: hintFields,
    append: appendHint,
    remove: removeHint,
  } = useFieldArray({ control, name: "hints" });

  const {
    fields: testCaseFields,
    append: appendTestCase,
    remove: removeTestCase,
  } = useFieldArray({ control, name: "testCases" });

  const {
    fields: edgeCaseFields,
    append: appendEdgeCase,
    remove: removeEdgeCase,
  } = useFieldArray({ control, name: "edgeCases" });

  // Watch all form values for YAML preview
  const formValues = watch();

  // Generate YAML preview data
  const yamlPreviewData = useMemo(() => {
    try {
      return formDataToYaml(formValues as ProblemFormData);
    } catch {
      return {};
    }
  }, [formValues]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Auto-generate ID from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("id", id);
  };

  // Handle form submission
  const handleFormSubmit = async (data: ProblemFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Default: POST to API
        const response = await fetch("/api/admin/problems", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create problem");
        }
      }

      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Section header component
  const SectionHeader = ({
    title,
    section,
    required = false,
  }: {
    title: string;
    section: string;
    required?: boolean;
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="flex w-full items-center justify-between rounded-lg bg-surface-dark px-4 py-3 text-left hover:bg-gray-800/50"
    >
      <span className="font-medium text-white">
        {title}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      {expandedSections[section] ? (
        <ChevronDown className="h-5 w-5 text-gray-400" />
      ) : (
        <ChevronRight className="h-5 w-5 text-gray-400" />
      )}
    </button>
  );

  // Parse JSON input safely
  const parseJsonInput = useCallback((value: string): unknown => {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }, []);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="h-full">
      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel - Form */}
        <div className="w-3/5 space-y-4 overflow-y-auto pr-4">
          {/* Basic Info Section */}
          <div className="rounded-lg border border-gray-700 bg-surface">
            <SectionHeader title="Basic Info" section="basic" required />
            {expandedSections.basic && (
              <div className="space-y-4 p-4">
                {/* Title */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register("title", {
                      onChange: handleTitleChange,
                    })}
                    type="text"
                    placeholder="e.g., Asteroid Belt Navigation"
                    className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* ID (auto-generated) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    ID <span className="text-red-400">*</span>
                    <span className="ml-2 text-xs text-gray-500">
                      (auto-generated from title)
                    </span>
                  </label>
                  <input
                    {...register("id")}
                    type="text"
                    placeholder="asteroid-belt-navigation"
                    className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                  {errors.id && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.id.message}
                    </p>
                  )}
                </div>

                {/* Difficulty */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Difficulty <span className="text-red-400">*</span>
                  </label>
                  <select
                    {...register("difficulty")}
                    className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  {errors.difficulty && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.difficulty.message}
                    </p>
                  )}
                </div>

                {/* Pattern */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Pattern <span className="text-red-400">*</span>
                    <span className="ml-2 text-xs text-gray-500">
                      (e.g., two-pointers, sliding-window)
                    </span>
                  </label>
                  <input
                    {...register("pattern")}
                    type="text"
                    placeholder="two-pointers"
                    className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                  {errors.pattern && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.pattern.message}
                    </p>
                  )}
                </div>

                {/* Theme (optional) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Theme
                    <span className="ml-2 text-xs text-gray-500">(optional)</span>
                  </label>
                  <input
                    {...register("theme")}
                    type="text"
                    placeholder="e.g., software-engineering, ai-safety"
                    className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Estimated Time (optional) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Estimated Time
                    <span className="ml-2 text-xs text-gray-500">(optional)</span>
                  </label>
                  <input
                    {...register("estimatedTime")}
                    type="text"
                    placeholder="e.g., 20-30 minutes"
                    className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="rounded-lg border border-gray-700 bg-surface">
            <SectionHeader title="Description" section="description" required />
            {expandedSections.description && (
              <div className="space-y-4 p-4">
                {/* Description */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Problem Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    {...register("description")}
                    rows={6}
                    placeholder="Describe the problem clearly..."
                    className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Story Context (optional) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Story Context
                    <span className="ml-2 text-xs text-gray-500">(optional)</span>
                  </label>
                  <textarea
                    {...register("storyContext")}
                    rows={3}
                    placeholder="Add narrative context to make the problem more engaging..."
                    className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Examples Section */}
          <div className="rounded-lg border border-gray-700 bg-surface">
            <SectionHeader title="Examples" section="examples" required />
            {expandedSections.examples && (
              <div className="p-4">
                <DynamicArrayField
                  label=""
                  items={exampleFields}
                  onAdd={() =>
                    appendExample({ input: {}, output: null, explanation: "" })
                  }
                  onRemove={removeExample}
                  minItems={1}
                  addLabel="Add Example"
                  error={errors.examples?.message}
                  renderItem={(_, index) => (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">
                          Input (JSON)
                        </label>
                        <Controller
                          control={control}
                          name={`examples.${index}.input`}
                          render={({ field }) => (
                            <textarea
                              value={JSON.stringify(field.value, null, 2)}
                              onChange={(e) =>
                                field.onChange(parseJsonInput(e.target.value))
                              }
                              rows={3}
                              placeholder='{"positions": [1, 2, 3], "target": 5}'
                              className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 font-mono text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">
                          Output (JSON)
                        </label>
                        <Controller
                          control={control}
                          name={`examples.${index}.output`}
                          render={({ field }) => (
                            <input
                              type="text"
                              value={JSON.stringify(field.value)}
                              onChange={(e) =>
                                field.onChange(parseJsonInput(e.target.value))
                              }
                              placeholder="[1, 3] or null"
                              className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 font-mono text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">
                          Explanation
                        </label>
                        <textarea
                          {...register(`examples.${index}.explanation`)}
                          rows={2}
                          placeholder="Explain why this is the expected output..."
                          className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                />
              </div>
            )}
          </div>

          {/* Constraints Section */}
          <div className="rounded-lg border border-gray-700 bg-surface">
            <SectionHeader title="Constraints" section="constraints" required />
            {expandedSections.constraints && (
              <div className="p-4">
                <Controller
                  control={control}
                  name="constraints"
                  render={({ field }) => (
                    <StringArrayField
                      label=""
                      values={field.value}
                      onChange={field.onChange}
                      placeholder="e.g., 2 <= arr.length <= 100,000"
                      minItems={1}
                      error={errors.constraints?.message}
                    />
                  )}
                />
              </div>
            )}
          </div>

          {/* Hints Section */}
          <div className="rounded-lg border border-gray-700 bg-surface">
            <SectionHeader title="Hints" section="hints" required />
            {expandedSections.hints && (
              <div className="p-4">
                <DynamicArrayField
                  label=""
                  items={hintFields}
                  onAdd={() =>
                    appendHint({ level: hintFields.length + 1, text: "" })
                  }
                  onRemove={removeHint}
                  minItems={1}
                  addLabel="Add Hint"
                  error={errors.hints?.message}
                  renderItem={(_, index) => (
                    <div className="space-y-3">
                      <div className="flex gap-4">
                        <div className="w-24">
                          <label className="mb-1 block text-xs font-medium text-gray-400">
                            Level
                          </label>
                          <input
                            type="number"
                            {...register(`hints.${index}.level`, {
                              valueAsNumber: true,
                            })}
                            min={1}
                            max={5}
                            className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-xs font-medium text-gray-400">
                            Hint Text
                          </label>
                          <textarea
                            {...register(`hints.${index}.text`)}
                            rows={2}
                            placeholder="Provide a helpful hint..."
                            className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
            )}
          </div>

          {/* Starter Code Section */}
          <div className="rounded-lg border border-gray-700 bg-surface">
            <SectionHeader
              title="Starter Code"
              section="starterCode"
              required
            />
            {expandedSections.starterCode && (
              <div className="space-y-4 p-4">
                <Controller
                  control={control}
                  name="starterCodePython"
                  render={({ field }) => (
                    <CodeEditorField
                      value={field.value}
                      onChange={field.onChange}
                      language="python"
                      label="Python Starter Code"
                      error={errors.starterCodePython?.message}
                      required
                      height="250px"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="starterCodeJavascript"
                  render={({ field }) => (
                    <CodeEditorField
                      value={field.value || ""}
                      onChange={field.onChange}
                      language="javascript"
                      label="JavaScript Starter Code (optional)"
                      height="200px"
                    />
                  )}
                />
              </div>
            )}
          </div>

          {/* Test Cases Section */}
          <div className="rounded-lg border border-gray-700 bg-surface">
            <SectionHeader title="Test Cases" section="testCases" required />
            {expandedSections.testCases && (
              <div className="p-4">
                <DynamicArrayField
                  label=""
                  items={testCaseFields}
                  onAdd={() =>
                    appendTestCase({
                      id: `test-${testCaseFields.length + 1}`,
                      input: {},
                      expected: null,
                      explanation: "",
                    })
                  }
                  onRemove={removeTestCase}
                  minItems={3}
                  addLabel="Add Test Case"
                  error={errors.testCases?.message}
                  renderItem={(_, index) => (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">
                          Test ID
                        </label>
                        <input
                          {...register(`testCases.${index}.id`)}
                          type="text"
                          placeholder="e.g., basic-example"
                          className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">
                          Input (JSON)
                        </label>
                        <Controller
                          control={control}
                          name={`testCases.${index}.input`}
                          render={({ field }) => (
                            <textarea
                              value={JSON.stringify(field.value, null, 2)}
                              onChange={(e) =>
                                field.onChange(parseJsonInput(e.target.value))
                              }
                              rows={3}
                              placeholder='{"positions": [1, 2, 3], "target": 5}'
                              className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 font-mono text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">
                          Expected Output (JSON)
                        </label>
                        <Controller
                          control={control}
                          name={`testCases.${index}.expected`}
                          render={({ field }) => (
                            <input
                              type="text"
                              value={JSON.stringify(field.value)}
                              onChange={(e) =>
                                field.onChange(parseJsonInput(e.target.value))
                              }
                              placeholder="[1, 3] or null"
                              className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 font-mono text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">
                          Explanation (optional)
                        </label>
                        <input
                          {...register(`testCases.${index}.explanation`)}
                          type="text"
                          placeholder="Brief description of what this test checks"
                          className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                />
              </div>
            )}
          </div>

          {/* Advanced Section (collapsible) */}
          <div className="rounded-lg border border-gray-700 bg-surface">
            <SectionHeader title="Advanced (Optional)" section="advanced" />
            {expandedSections.advanced && (
              <div className="space-y-6 p-4">
                {/* Edge Cases */}
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-300">
                    Edge Cases
                  </h4>
                  <DynamicArrayField
                    label=""
                    items={edgeCaseFields}
                    onAdd={() =>
                      appendEdgeCase({
                        case: "",
                        description: "",
                        testId: "",
                      })
                    }
                    onRemove={removeEdgeCase}
                    minItems={0}
                    addLabel="Add Edge Case"
                    renderItem={(_, index) => (
                      <div className="space-y-3">
                        <input
                          {...register(`edgeCases.${index}.case`)}
                          type="text"
                          placeholder="Case name"
                          className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                        <input
                          {...register(`edgeCases.${index}.description`)}
                          type="text"
                          placeholder="Description"
                          className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                        <input
                          {...register(`edgeCases.${index}.testId`)}
                          type="text"
                          placeholder="Test ID reference"
                          className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    )}
                  />
                </div>

                {/* Pattern Learning Objectives */}
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-300">
                    Pattern Learning Objectives
                  </h4>
                  <Controller
                    control={control}
                    name="patternLearningObjectives"
                    render={({ field }) => (
                      <StringArrayField
                        label=""
                        values={field.value || []}
                        onChange={field.onChange}
                        placeholder="Learning objective..."
                        minItems={0}
                      />
                    )}
                  />
                </div>

                {/* Real World Applications */}
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-300">
                    Real World Applications
                  </h4>
                  <Controller
                    control={control}
                    name="realWorldApplications"
                    render={({ field }) => (
                      <StringArrayField
                        label=""
                        values={field.value || []}
                        onChange={field.onChange}
                        placeholder="Real world application..."
                        minItems={0}
                      />
                    )}
                  />
                </div>

                {/* Complexity Analysis */}
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-300">
                    Complexity Analysis
                  </h4>
                  <div className="space-y-3 rounded-lg border border-gray-700 bg-surface-dark p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">
                          Naive Time Complexity
                        </label>
                        <input
                          {...register("complexityAnalysis.time.naive")}
                          type="text"
                          placeholder="O(n²)"
                          className="w-full rounded border border-gray-700 bg-surface px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">
                          Optimal Time Complexity
                        </label>
                        <input
                          {...register("complexityAnalysis.time.optimal")}
                          type="text"
                          placeholder="O(n)"
                          className="w-full rounded border border-gray-700 bg-surface px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-400">
                        Optimal Space Complexity
                      </label>
                      <input
                        {...register("complexityAnalysis.space.optimal")}
                        type="text"
                        placeholder="O(1)"
                        className="w-full rounded border border-gray-700 bg-surface px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Pattern Signature */}
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-300">
                    Pattern Signature
                  </h4>
                  <div className="space-y-3 rounded-lg border border-gray-700 bg-surface-dark p-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-400">
                        Pattern Name
                      </label>
                      <input
                        {...register("patternSignature.patternName")}
                        type="text"
                        placeholder="Two Pointers"
                        className="w-full rounded border border-gray-700 bg-surface px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-400">
                        Indicators
                      </label>
                      <Controller
                        control={control}
                        name="patternSignature.indicators"
                        render={({ field }) => (
                          <StringArrayField
                            label=""
                            values={field.value || []}
                            onChange={field.onChange}
                            placeholder="Pattern indicator..."
                            minItems={0}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-400">
                        When To Use
                      </label>
                      <Controller
                        control={control}
                        name="patternSignature.whenToUse"
                        render={({ field }) => (
                          <StringArrayField
                            label=""
                            values={field.value || []}
                            onChange={field.onChange}
                            placeholder="When to use this pattern..."
                            minItems={0}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-surface-dark py-4">
            {submitError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400">
                <AlertCircle className="h-5 w-5" />
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-green-400">
                Problem created successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Problem...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Problem
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel - YAML Preview */}
        <div className="w-2/5">
          <div className="sticky top-0 h-[calc(100vh-200px)]">
            <YamlPreview data={yamlPreviewData} className="h-full" />
          </div>
        </div>
      </div>
    </form>
  );
}
