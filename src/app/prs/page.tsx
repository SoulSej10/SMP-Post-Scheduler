// app/prs/page.tsx
'use client';

import React, { useEffect, useState } from 'react';

type PR = {
  number: number;
  title: string;
  user: { login: string };
  state: string;
  html_url: string;
  created_at: string;
  merged_at: string | null;
};

export default function PullRequestsPage() {
  const [prs, setPrs] = useState<PR[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/github/prs')
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load PRs');
        return json;
      })
      .then((data: PR[]) => setPrs(data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!prs) return <div className="p-6">Loading pull requests…</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Repository Pull Requests</h1>
      <ul className="space-y-3">
        {prs.map((pr) => (
          <li key={pr.number} className="p-4 border rounded-md shadow-sm">
            <a href={pr.html_url} target="_blank" rel="noreferrer" className="text-lg font-semibold">
              #{pr.number} {pr.title}
            </a>
            <div className="text-sm text-gray-600">
              Author: {pr.user.login} — State: {pr.state} — Created: {new Date(pr.created_at).toLocaleString()}
            </div>
            {pr.merged_at && <div className="text-xs text-green-700">Merged: {new Date(pr.merged_at).toLocaleString()}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
