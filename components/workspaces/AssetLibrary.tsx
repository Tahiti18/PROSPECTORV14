import React, { useEffect, useMemo, useState } from 'react';
import { AssetRecord, subscribeToAssets, deleteAsset } from '../../services/geminiService';

const safeCleanup = (maybeCleanup: any) => {
  return () => {
    try {
      if (typeof maybeCleanup === 'function') maybeCleanup();
    } catch {
      // ignore
    }
  };
};

export default function AssetLibrary() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [filter, setFilter] = useState<'ALL' | AssetRecord['type']>('ALL');

  useEffect(() => {
    const unsub = subscribeToAssets((a) => setAssets(a));
    return safeCleanup(unsub);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return assets;
    return assets.filter((a) => a.type === filter);
  }, [assets, filter]);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: '0 0 12px 0' }}>Asset Library</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('ALL')}>All</button>
        <button onClick={() => setFilter('TEXT')}>Text</button>
        <button onClick={() => setFilter('IMAGE')}>Image</button>
        <button onClick={() => setFilter('VIDEO')}>Video</button>
        <button onClick={() => setFilter('AUDIO')}>Audio</button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No assets found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map((a) => (
            <div
              key={a.id}
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                padding: 12
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    [{a.type}] {a.title}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>
                    {new Date(a.timestamp).toLocaleString()} {a.module ? `• ${a.module}` : ''}
                  </div>
                </div>
                <button onClick={() => deleteAsset(a.id)}>Delete</button>
              </div>

              <pre style={{ marginTop: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-word', opacity: 0.9 }}>
                {a.data}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
