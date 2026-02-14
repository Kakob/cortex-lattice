import React, { useState } from 'react';
import type { Confidence } from '../../types';

interface ReflectionData {
  content: string;
  coldHint?: string;
  confidence?: Confidence;
}

interface ReflectionModalProps {
  isMultiAttempt: boolean;
  onClose: () => void;
  onSave: (data: ReflectionData) => void;
}

const CONFIDENCE_OPTIONS: { value: Confidence; icon: string; label: string; desc: string }[] = [
  { value: 'easy', icon: '😎', label: 'Easy', desc: 'I could do this in my sleep' },
  { value: 'moderate', icon: '🤔', label: 'Moderate', desc: 'Had to think, but got it' },
  { value: 'lucky', icon: '🍀', label: 'Lucky', desc: 'Not sure I could do it again' },
];

export default function ReflectionModal({ isMultiAttempt, onClose, onSave }: ReflectionModalProps) {
  const [issue, setIssue] = useState('');
  const [coldHint, setColdHint] = useState('');
  const [confidence, setConfidence] = useState<Confidence | undefined>();

  function handleSave() {
    if (isMultiAttempt) {
      onSave({
        content: issue.trim() || 'No reflection provided',
        coldHint: coldHint.trim() || undefined,
      });
    } else {
      onSave({
        content: `Confidence: ${confidence}`,
        confidence,
      });
    }
    onClose();
  }

  function handleSkip() {
    onSave({
      content: 'Skipped',
      confidence: 'moderate',
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999999]">
      <div className="bg-cortex-surface rounded-xl border border-cortex-border shadow-2xl w-full max-w-md mx-4 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cortex-border">
          <h2 className="text-lg font-semibold text-cortex-text">
            {isMultiAttempt ? 'Nice! You solved it!' : 'First try! How did it feel?'}
          </h2>
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
          {isMultiAttempt ? (
            <>
              {/* Multi-attempt questions */}
              <div>
                <label className="block text-sm font-medium text-cortex-text mb-2">
                  What was the issue?
                </label>
                <textarea
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="What tripped you up? What did you miss initially?"
                  className="input h-24 resize-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cortex-text mb-2">
                  What hint would have helped?
                </label>
                <textarea
                  value={coldHint}
                  onChange={(e) => setColdHint(e.target.value)}
                  placeholder="Write a hint that would help you next time (no spoilers)"
                  className="input h-20 resize-none"
                />
                <p className="text-xs text-cortex-muted mt-1">
                  This hint will show during your next review
                </p>
              </div>
            </>
          ) : (
            <>
              {/* First-try confidence selection */}
              <label className="block text-sm font-medium text-cortex-text mb-3">
                How confident are you?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {CONFIDENCE_OPTIONS.map(({ value, icon, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setConfidence(value);
                      // Auto-save on selection for first-try
                      onSave({
                        content: `Confidence: ${value}`,
                        confidence: value,
                      });
                      onClose();
                    }}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      confidence === value
                        ? 'border-cortex-primary bg-cortex-primary/10'
                        : 'border-cortex-border hover:border-cortex-muted'
                    }`}
                  >
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="text-sm font-medium text-cortex-text">{label}</div>
                    <div className="text-xs text-cortex-muted mt-1">{desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-cortex-border">
          <button onClick={handleSkip} className="btn btn-secondary">
            Skip
          </button>
          {isMultiAttempt && (
            <button onClick={handleSave} className="btn btn-primary">
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
