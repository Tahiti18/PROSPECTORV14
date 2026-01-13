import React, { useEffect, useMemo, useState } from 'react';
import { AssetRecord, subscribeToAssets, deleteAsset, clearVault } from '../../services/geminiService';

type FilterType = 'ALL' | AssetRecord['type'];

export const AssetLibrary: React.FC = () => {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [q, setQ] = useState<string>('');

  useEffect(() => {
    const unsub = subscribeToAssets((a) => setAssets(a));
    return () => {
      try {
        if (typeof unsub === 'function') unsub();
      } catch {
        // ignore
      }
    };
  }, []);

  const filtered = useMemo(() => {
    const base = filter === 'ALL' ? assets : assets.filter((a) => a.type === filter);
    if (!q.trim()) return base;
    const needle = q.toLowerCase();
    return base.filter((a) => {
      const hay = `${a.title || ''} ${a.module || ''} ${a.leadId || ''} ${a.data || ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [assets, filter, q]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Asset Library</h2>
        <button onClick={() => clearVault()} style={{ opacity: 0.9 }}>
          Clear Vault
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('ALL')}>All</button>
        <button onClick={() => setFilter('TEXT')}>Text</button>
        <button onClick={() => setFilter('IMAGE')}>Image</button>
        <button onClick={() => setFilter('VIDEO')}>Video</button>
        <button onClick={() => setFilter('AUDIO')}>Audio</button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search assets…"
          style={{ minWidth: 220 }}
        />
      </div>

      <div style={{ marginTop: 12, opacity: 0.75, fontSize: 12 }}>
        Total assets: {assets.length} • Showing: {filtered.length}
      </div>

      {filtered.length === 0 ? (
        <div style={{ marginTop: 14, opacity: 0.7 }}>No assets found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
          {filtered.map((a) => (
            <div
              key={a.id}
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: 12
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>
                    [{a.type}] {a.title}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>
                    {new Date(a.timestamp).toLocaleString()}
                    {a.module ? ` • ${a.module}` : ''}
                    {a.leadId ? ` • lead:${a.leadId}` : ''}
                  </div>
                </div>
                <button onClick={() => deleteAsset(a.id)}>Delete</button>
              </div>

              <pre
                style={{
                  marginTop: 10,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  opacity: 0.9
                }}
              >
                {a.data}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// IMPORTANT: export BOTH named + default to satisfy any import style
export default AssetLibrary;
