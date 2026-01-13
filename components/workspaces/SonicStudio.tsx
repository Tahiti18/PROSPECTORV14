import React, { useEffect, useMemo, useState } from 'react';
import { Lead } from '../../types';
import { AssetRecord, subscribeToAssets, saveAsset } from '../../services/geminiService';

type Props = {
  lead?: Lead | null;
};

export const SonicStudio: React.FC<Props> = ({ lead }) => {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [note, setNote] = useState<string>('');

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

  const audioAssets = useMemo(() => assets.filter((a) => a.type === 'AUDIO'), [assets]);

  const addNote = () => {
    const title = lead ? `Sonic Note • ${lead.businessName}` : 'Sonic Note';
    const payload = note.trim();
    if (!payload) return;
    saveAsset('TEXT', title, payload, 'SONIC_STUDIO', lead?.id);
    setNote('');
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: 0 }}>Sonic Studio</h2>
      <div style={{ marginTop: 6, opacity: 0.7, fontSize: 12 }}>
        Target: {lead ? lead.businessName : 'No target locked'}
      </div>

      <div style={{ marginTop: 14 }}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Quick notes for audio direction, voice, tone, music style…"
          style={{ width: '100%', minHeight: 90 }}
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={addNote}>Save Note to Vault</button>
        </div>
      </div>

      <h3 style={{ marginTop: 18 }}>Audio Assets</h3>
      {audioAssets.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No audio assets yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          {audioAssets.map((a) => (
            <div
              key={a.id}
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: 12
              }}
            >
              <div style={{ fontWeight: 800 }}>{a.title}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                {new Date(a.timestamp).toLocaleString()}
                {a.module ? ` • ${a.module}` : ''}
              </div>

              {/* If a.data is a URL, audio will play. If it’s not, you’ll still see it below. */}
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
};

// IMPORTANT: export BOTH named + default to satisfy any import style
export default SonicStudio;
