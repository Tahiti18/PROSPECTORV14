import React, { useEffect, useState } from 'react';
import { AssetRecord, subscribeToAssets } from '../../services/geminiService';

const safeCleanup = (maybeCleanup: any) => {
  return () => {
    try {
      if (typeof maybeCleanup === 'function') maybeCleanup();
    } catch {
      // ignore
    }
  };
};

export default function SonicStudio() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);

  useEffect(() => {
    const unsub = subscribeToAssets((a) => setAssets(a));
    return safeCleanup(unsub);
  }, []);

  const audioAssets = assets.filter((a) => a.type === 'AUDIO');

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: '0 0 12px 0' }}>Sonic Studio</h2>

      {audioAssets.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No audio assets yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {audioAssets.map((a) => (
            <div
              key={a.id}
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                padding: 12
              }}
            >
              <div style={{ fontWeight: 700 }}>{a.title}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                {new Date(a.timestamp).toLocaleString()} {a.module ? `• ${a.module}` : ''}
              </div>

              {/* If your audio data is a URL, this will play it. If it’s base64, you can adjust later. */}
              <div style={{ marginTop: 10 }}>
                <audio controls style={{ width: '100%' }} src={a.data} />
              </div>

              <pre style={{ marginTop: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-word', opacity: 0.85 }}>
                {a.data}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
