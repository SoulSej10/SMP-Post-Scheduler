// app/api/github/prs/route.ts
import { NextResponse } from 'next/server';

const GITHUB_API = 'https://api.github.com';

export async function GET() {
  const owner = process.env.GITHUB_OWNER || 'SoulSej10';
  const repo = process.env.GITHUB_REPO || 'SMP-Post-Scheduler';
  const token = process.env.GITHUB_TOKEN;

  const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=all`; // state=all to get open/closed/merged if wanted

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data?.message || 'GitHub API error' }, { status: res.status });
  }

  return NextResponse.json(data);
}
