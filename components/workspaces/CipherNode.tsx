
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
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">CIPHER <span className="text-indigo-600 not-italic">MATRIX</span></h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic