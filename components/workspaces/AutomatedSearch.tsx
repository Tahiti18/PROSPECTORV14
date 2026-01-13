import React, { useMemo, useState } from 'react';
import { Lead } from '../../types';
import { groundedLeadSearch, pushLog } from '../../services/geminiService';
import { db } from '../../services/automation/db';

type Props = {
  market: string;
  onNewLeads?: (leads: Lead[]) => void;
};

export const AutomatedSearch: React.FC<Props> = ({ market, onNewLeads }) => {
  const [query, setQuery] = useState<string>('');
  const [count, setCount] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Lead[]>([]);

  const canRun = useMemo(() => query.trim().length > 0, [query]);

  const run = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await groundedLeadSearch(query.trim(), market, count);
      const leads = res.leads || [];
      setResults(leads);

      // Persist into local DB (so Prospect Database sees them)
      try {
        const existing = db.getLeads();
        const merged = [...leads, ...existing];

        // De-dupe by id if present
        const seen = new Set<string>();
        const deduped = merged.filter((l) => {
          const id = (l as any)?.id?.toString?.() || '';
          if (!id) return true;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });

        db.saveLeads(deduped);
      } catch {
        // ignore db issues
      }

      if (onNewLeads) onNewLeads(leads);
      pushLog(`AUTOMATED_SEARCH_OK query="${query.trim()}" count=${count}`);
    } catch (e: any) {
      const msg = e?.message || 'Automated search failed';
      setError(msg);
      pushLog(`AUTOMATED_SEARCH_ERR ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: 0 }}>Automated Search</h2>
      <div style={{ marginTop: 6, opacity: 0.7, fontSize: 12 }}>
        Market: {market}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search query (e.g., “Luxury landscaping companies”)"
          style={{ minWidth: 280 }}
        />

        <input
          type="number"
          value={count}
          min={3}
          max={30}
          onChange={(e) => setCount(Number(e.target.value || 10))}
          style={{ width: 90 }}
        />

        <button onClick={run} disabled={!canRun || loading}>
          {loading ? 'Running…' : 'Run Search'}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: '#ff6b6b', fontWeight: 700 }}>
          {error}
        </div>
      )}

      {results.length === 0 ? (
        <div style={{ marginTop: 14, opacity: 0.7 }}>No results yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
          {results.map((l) => (
            <div
              key={l.id}
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: 12
              }}
            >
              <div style={{ fontWeight: 800 }}>{l.businessName}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                {l.city} • {l.niche} • score: {l.leadScore}
              </div>
              {l.websiteUrl && (
                <div style={{ marginTop: 6 }}>
                  <a href={l.websiteUrl} target="_blank" rel="noreferrer">
                    {l.websiteUrl}
                  </a>
                </div>
              )}
              {l.socialGap && (
                <div style={{ marginTop: 6, opacity: 0.85 }}>
                  {l.socialGap}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// IMPORTANT: export BOTH named + default to satisfy any import style
export default AutomatedSearch;
