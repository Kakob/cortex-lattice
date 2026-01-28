"use client";

/**
 * Dynamic Array Field
 *
 * Reusable component for managing arrays of items in forms.
 * Used for examples, test cases, constraints, hints, etc.
 */

import { Plus, Trash2, GripVertical } from "lucide-react";
import { ReactNode } from "react";

interface DynamicArrayFieldProps<T> {
  label: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  minItems?: number;
  maxItems?: number;
  addLabel?: string;
  error?: string;
  required?: boolean;
}

export function DynamicArrayField<T>({
  label,
  items,
  onAdd,
  onRemove,
  renderItem,
  minItems = 1,
  maxItems,
  addLabel = "Add Item",
  error,
  required = false,
}: DynamicArrayFieldProps<T>) {
  const canRemove = items.length > minItems;
  const canAdd = maxItems === undefined || items.length < maxItems;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
          <span className="ml-2 text-xs text-gray-500">
            ({items.length} item{items.length !== 1 ? "s" : ""})
          </span>
        </label>
        {canAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 rounded px-2 py-1 text-sm text-purple-400 hover:bg-purple-600/20"
          >
            <Plus className="h-4 w-4" />
            {addLabel}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="group relative rounded-lg border border-gray-700 bg-surface p-4"
          >
            {/* Item header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <GripVertical className="h-4 w-4" />
                <span>#{index + 1}</span>
              </div>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="rounded p-1 text-gray-500 opacity-0 transition-opacity hover:bg-red-600/20 hover:text-red-400 group-hover:opacity-100"
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Item content */}
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Simple string array field
 */
interface StringArrayFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  minItems?: number;
  error?: string;
  required?: boolean;
}

export function StringArrayField({
  label,
  values,
  onChange,
  placeholder = "Enter value...",
  minItems = 1,
  error,
  required = false,
}: StringArrayFieldProps) {
  const handleAdd = () => {
    onChange([...values, ""]);
  };

  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  const handleChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  return (
    <DynamicArrayField
      label={label}
      items={values}
      onAdd={handleAdd}
      onRemove={handleRemove}
      minItems={minItems}
      error={error}
      required={required}
      renderItem={(_, index) => (
        <input
          type="text"
          value={values[index]}
          onChange={(e) => handleChange(index, e.target.value)}
          placeholder={placeholder}
          className="w-full rounded border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
        />
      )}
    />
  );
}
