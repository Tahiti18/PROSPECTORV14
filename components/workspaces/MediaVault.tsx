import React, { useEffect, useMemo, useState } from 'react';
import { AssetRecord, subscribeToAssets, deleteAsset, clearVault, importVault } from '../../services/geminiService';

const safeCleanup = (maybeCleanup: any) => {
  return () => {
    try {
      if (typeof maybeCleanup === 'function') maybeCleanup();
    } catch {
      // ignore cleanup errors
    }
  };
};

export default function MediaVault() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [importText, setImportText] = useState<string>('');

  useEffect(() => {
    const unsub = subscribeToAssets((a) => setAssets(a));
    return safeCleanup(unsub);
  }, []);

  const grouped = useMemo(() => {
    const byType: Record<string, AssetRecord[]> = {};
    for (const a of assets) {
      const k = a.type || 'TEXT';
      if (!byType[k]) byType[k] = [];
      byType[k].push(a);
    }
    return byType;
  }, [assets]);

  const onExport = async () => {
    const payload = JSON.stringify(assets, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      alert('Vault copied to clipboard.');
    } catch {
      setImportText(payload);
      alert('Clipboard not available. The JSON is placed in the box below.');
    }
  };

  const onImport = () => {
    try {
      const parsed = JSON.parse(importText || '[]');
      if (!Array.isArray(parsed)) throw new Error('Import must be a JSON array.');
      importVault(parsed);
      alert('Vault imported.');
    } catch (e: any) {
      alert(`Import failed: ${e?.message || 'Invalid JSON'}`);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: '0 0 12px 0' }}>Media Vault</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={onExport}>Export Vault</button>
        <button onClick={() => clearVault()}>Clear Vault</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste vault JSON here to import (or export will appear here if clipboard blocked)."
          style={{ width: '100%', minHeight: 120 }}
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={onImport}>Import Vault</button>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ opacity: 0.7 }}>No assets yet.</div>
      ) : (
        Object.entries(grouped).map(([type, list]) => (
          <div key={type} style={{ marginBottom: 18 }}>
            <h3 style={{ margin: '10px 0' }}>{type}</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {list.map((a) => (
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
                      <div style={{ fontWeight: 700 }}>{a.title}</div>
                      <div style={{ opacity: 0.7, fontSize: 12 }}>
                        {new Date(a.timestamp).toLocaleString()} {a.module ? `• ${a.module}` : ''}
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
          </div>
        ))
      )}
    </div>
  );
}
