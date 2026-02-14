import React, { useState } from 'react';
import type { IntendedAction, ReflectionType } from '../../types';

interface HotkeyModalProps {
  onClose: () => void;
  onSave: (entry: {
    type: ReflectionType;
    content: string;
    intendedAction?: IntendedAction;
  }) => void;
}

const ENTRY_TYPES: { type: ReflectionType; label: string }[] = [
  { type: 'thought', label: 'Thought' },
  { type: 'stuck', label: 'Stuck' },
  { type: 'aha', label: 'Aha!' },
];

const INTENDED_ACTIONS: { action: IntendedAction; label: string; desc: string }[] = [
  { action: 'think_more', label: 'Think more', desc: 'Work through it myself' },
  { action: 'check_hint', label: 'Check hint', desc: 'Look at a small hint' },
  { action: 'ask_ai', label: 'Ask AI', desc: 'Get help from AI' },
  { action: 'view_solution', label: 'View solution', desc: 'Look at the answer' },
];

export default function HotkeyModal({ onClose, onSave }: HotkeyModalProps) {
  const [entryType, setEntryType] = useState<ReflectionType>('thought');
  const [content, setContent] = useState('');
  const [intendedAction, setIntendedAction] = useState<IntendedAction | undefined>();

  function handleSave() {
    if (!content.trim()) return;

    onSave({
      type: entryType,
      content: content.trim(),
      intendedAction: entryType === 'stuck' ? intendedAction : undefined,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999999]">
      <div className="bg-cortex-surface rounded-xl border border-cortex-border shadow-2xl w-full max-w-md mx-4 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cortex-border">
          <h2 className="text-lg font-semibold text-cortex-text">Quick Log</h2>
          <button
            onClick={onClose}
            className="text-cortex-muted hover:text-cortex-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Entry Type Selection */}
          <div className="flex gap-2">
            {ENTRY_TYPES.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => setEntryType(type)}
                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  entryType === type
                    ? 'border-cortex-primary bg-cortex-primary/10 text-cortex-text'
                    : 'border-cortex-border text-cortex-muted hover:border-cortex-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Content Input */}
          <div>
            <label className="block text-sm font-medium text-cortex-text mb-2">
              What's on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your thought, where you're stuck, or your breakthrough..."
              className="input h-24 resize-none"
              autoFocus
            />
          </div>

          {/* Intended Action (for stuck entries) */}
          {entryType === 'stuck' && (
            <div>
              <label className="block text-sm font-medium text-cortex-text mb-2">
                What will you try next?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INTENDED_ACTIONS.map(({ action, label, desc }) => (
                  <button
                    key={action}
                    onClick={() => setIntendedAction(action)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      intendedAction === action
                        ? 'border-cortex-primary bg-cortex-primary/10'
                        : 'border-cortex-border hover:border-cortex-muted'
                    }`}
                  >
                    <div className="text-sm font-medium text-cortex-text">{label}</div>
                    <div className="text-xs text-cortex-muted">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-cortex-border">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || (entryType === 'stuck' && !intendedAction)}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
