import React from 'react';

const WEB_APP_URL = 'http://localhost:3001';

export default function ProblemList() {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4">📚</div>
      <h3 className="text-lg font-medium text-cortex-text mb-2">View Problems Online</h3>
      <p className="text-cortex-muted mb-4">
        Your problem data is now stored in the web app for better reliability and cross-device access.
      </p>
      <a
        href={`${WEB_APP_URL}/study-log/problems`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary inline-block"
      >
        Open Problems List
      </a>
    </div>
  );
}
