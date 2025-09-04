'use client';
import { useState } from 'react';

export default function Home() {
  const [provider, setProvider] = useState<'github' | 'gitlab'>('github');
  const [projectName, setProjectName] = useState('');
  const [namespace, setNamespace] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/boilerplate-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, projectName, namespace, visibility }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert('❌ Error: ' + (data.message || res.status));
    } else {
      window.open(data.webUrl, '_blank');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 p-6 border rounded-lg shadow-md w-full max-w-lg"
      >
        <h1 className="text-xl font-bold">🚀 Create New Project</h1>

        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as 'github' | 'gitlab')}
          className="p-2 border rounded"
        >
          <option value="github">GitHub</option>
          <option value="gitlab">GitLab</option>
        </select>

        <input
          type="text"
          placeholder="Project name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="p-2 border rounded"
          required
        />

        <input
          type="text"
          placeholder={provider === 'github' ? 'Org/User name' : 'Namespace ID'}
          value={namespace}
          onChange={(e) => setNamespace(e.target.value)}
          className="p-2 border rounded"
          required
        />

        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="private">Private</option>
          <option value="public">Public</option>
          {provider === 'gitlab' && <option value="internal">Internal</option>}
        </select>

        <button
          type="submit"
          disabled={loading}
          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create Repository'}
        </button>
      </form>
    </main>
  );
}
