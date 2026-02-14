import React, { useEffect, useState } from 'react';
import type { ReviewQueueResponse, ReviewQueueItem } from '../../types/messages';
import { formatTimeUntilReview, formatInterval } from '../../utils/spaced-repetition';

export default function ReviewQueue() {
  const [reviews, setReviews] = useState<ReviewQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_REVIEW_QUEUE' });
      if (response) {
        setReviews(response as ReviewQueueResponse);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartReview(item: ReviewQueueItem) {
    // Open the problem in a new tab
    if (item.problem.url) {
      chrome.tabs.create({ url: item.problem.url });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-cortex-muted">Loading reviews...</div>
      </div>
    );
  }

  const hasReviews = (reviews?.dueNow?.length || 0) + (reviews?.dueToday?.length || 0) > 0;

  if (!hasReviews) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-lg font-medium text-cortex-text mb-2">All caught up!</h3>
        <p className="text-cortex-muted">No reviews due. Go solve some problems!</p>
        <button
          onClick={() => chrome.tabs.create({ url: 'https://leetcode.com/problemset/' })}
          className="btn btn-primary mt-4"
        >
          Open LeetCode
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Due Now */}
      {reviews?.dueNow && reviews.dueNow.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-cortex-text mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cortex-primary animate-pulse"></span>
            Due Now ({reviews.dueNow.length})
          </h3>
          <div className="space-y-2">
            {reviews.dueNow.map((item) => (
              <ReviewCard
                key={item.problem.id}
                item={item}
                onStart={() => handleStartReview(item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Due Later Today */}
      {reviews?.dueToday && reviews.dueToday.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-cortex-muted mb-3">
            Due Later Today ({reviews.dueToday.length})
          </h3>
          <div className="space-y-2">
            {reviews.dueToday.map((item) => (
              <ReviewCard
                key={item.problem.id}
                item={item}
                onStart={() => handleStartReview(item)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

interface ReviewCardProps {
  item: ReviewQueueItem;
  onStart: () => void;
}

function ReviewCard({ item, onStart }: ReviewCardProps) {
  const { problem, sr, isDueNow } = item;

  return (
    <div className={`card flex items-center justify-between ${isDueNow ? 'ring-1 ring-cortex-primary/50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-cortex-text truncate">{problem.title}</h4>
          {problem.difficulty && (
            <span className={`badge badge-${problem.difficulty}`}>
              {problem.difficulty}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-cortex-muted">
          <span className="capitalize">{problem.platform}</span>
          {problem.pattern && (
            <>
              <span>•</span>
              <span>{problem.pattern.replace(/-/g, ' ')}</span>
            </>
          )}
          <span>•</span>
          <span>Interval: {formatInterval(sr.intervalDays)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <span className={`text-sm ${isDueNow ? 'text-cortex-primary font-medium' : 'text-cortex-muted'}`}>
          {isDueNow ? 'Ready' : formatTimeUntilReview(sr.nextReview)}
        </span>
        <button
          onClick={onStart}
          className={`btn btn-sm ${isDueNow ? 'btn-primary' : 'btn-secondary'}`}
        >
          Review
        </button>
      </div>
    </div>
  );
}
