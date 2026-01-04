
import React, { useState } from 'react';

export const CipherNode: React.FC = () => {
  const [keys, setKeys] = useState<{ pub: string; priv: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateKeys = async () => {
    setIsGenerating(true);
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      const pubBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      const privBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

      const pubPem = btoa(String.fromCharCode(...new Uint8Array(pubBuffer)));
      const privPem = btoa(String.fromCharCode(...new Uint8Array(privBuffer)));

      setKeys({ pub: pubPem.slice(0, 50) + '...', priv: privPem.slice(0, 50) + '...' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">CIPHER <span className="text-indigo-600 not-italic">MATRIX</span></h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 italic italic">Security & Encryption Infrastructure</p>
      </div>

      <div className="bg-[#0b1021] border border-slate-800 rounded-[56px] p-20 shadow-2xl relative overflow-hidden flex flex-col items-center">
         <div className="w-40 h-40 bg-slate-950 border-4 border-indigo-500/20 rounded-full flex items-center justify-center relative z-10 mb-10 shadow-inner group transition-all">
            <span className="text-5xl group-hover:scale-110 transition-transform">🛡️</span>
            {isGenerating && <div className="absolute inset-0 rounded-full border border-indigo-500/60 animate-ping"></div>}
         </div>

         <div className="text-center space-y-4 relative z-10">
            <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none">{keys ? 'KEYS_GENERATED' : 'SYSTEM_LOCKED'}</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.5em]">RSA-OAEP 2048-BIT</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-16 relative z-10">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center space-y-2">
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">PUBLIC KEY FRAGMENT</span>
                 <p className="text-[10px] font-mono text-emerald-400 break-all">{keys?.pub || 'PENDING...'}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center space-y-2">
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">PRIVATE KEY FRAGMENT</span>
                 <p className="text-[10px] font-mono text-rose-400 break-all">{keys?.priv ? '******************' : 'PENDING...'}</p>
            </div>
         </div>

         <div className="w-full mt-10 pt-10 border-t border-slate-800 relative z-10">
            <button 
              onClick={generateKeys}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl"
            >
               {isGenerating ? 'ENCRYPTING...' : 'GENERATE NEW SESSION KEYS'}
            </button>
         </div>
      </div>
    </div>
  );
};
