import { useState } from 'react';
import { useApiKey } from '../hooks/useApiKey.js';
import { useAnalysisServices } from '../hooks/useAnalysisServices.js';

function maskKey(key) {
  if (!key) return '';
  if (key.length <= 8) return '*'.repeat(key.length);
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

function isGeminiApiKey(input) {
  const trimmed = input?.trim() || '';
  return trimmed.startsWith('AIzaSy') && trimmed.length === 39;
}

export default function ApiKeyBanner() {
  const { apiKey, apiKeySource, hasConfiguredKey, setApiKey, clearApiKey } = useApiKey();
  const [tempKey, setTempKey] = useState('');
  const [status, setStatus] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const input = tempKey.trim();

    if (!input) {
      setStatus('Please enter an access keyword or API key.');
      return;
    }

    setIsValidating(true);
    setStatus('Validating...');

    try {
      // Validate with backend (session managed by cookies)
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify({ keyword: input })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus(data.message || 'Invalid access keyword or API key');
        setIsValidating(false);
        return;
      }

      // Set API key in context (session is automatically managed by cookies)
      setApiKey(input, 'manual');

      if (data.auth_type === 'keyword') {
        setStatus('✓ Access granted via instructor key');
      } else {
        setStatus('✓ Using your own API key');
      }

      setTempKey('');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    clearApiKey();
    setStatus('API key cleared.');
  };

  return (
    <section className="rounded-xl border border-sky-700/60 bg-sky-900/30 p-4 text-sm text-sky-100">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-semibold">
            Access Key or API Key
            {hasConfiguredKey && (
              <span className="ml-2 rounded-full bg-sky-800 px-2 py-0.5 text-xs font-medium text-sky-100">
                {apiKeySource === 'env' ? 'Loaded from environment' : 'Validated'}
              </span>
            )}
          </p>
          <p className="text-sky-200/80">
            Enter your <strong>access keyword</strong> from your instructor, or use your own <strong>Gemini API key</strong> (starts with AIzaSy...). Auto-detected based on format.
          </p>
          {hasConfiguredKey && (
            <p className="text-xs text-sky-200/70">Active key: {maskKey(apiKey)}</p>
          )}
          {status && <p className="text-xs text-sky-200/80">{status}</p>}
        </div>
        <form className="flex w-full max-w-md flex-col gap-2 md:flex-row" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Access keyword or API key"
            value={tempKey}
            onChange={(event) => setTempKey(event.target.value)}
            disabled={isValidating}
            className="w-full rounded-lg border border-sky-700 bg-slate-950/60 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none disabled:opacity-50"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isValidating}
              className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-white shadow hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-slate-500 px-3 py-2 text-sm font-medium text-slate-100 hover:border-slate-400"
              disabled={!hasConfiguredKey || apiKeySource === 'env'}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
