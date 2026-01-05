
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { synthesizeProduct } from '../../services/geminiService';

interface ProductSynthProps {
  lead?: Lead;
}

export const ProductSynth: React.FC<ProductSynthProps> = ({ lead }) => {
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    const loadProduct = async () => {
      setIsLoading(true);
      try {
        const data = await synthesizeProduct(lead);
        setProduct(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadProduct();
  }, [lead]);

  if (!lead) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-[48px] border-dashed">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Target Locked Required for Product Synthesis</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-slate-800/50 pb-8">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">PRODUCT <span className="text-emerald-600 not-italic">SYNTH</span></h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 italic italic">Offer Architecture for {lead.businessName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-[#0b1021] border border-slate-800 rounded-[48px] p-16 shadow-2xl relative min-h-[500px] flex flex-col justify-center text-center">
           {isLoading ? (
             <div className="space-y-6">
                <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse">Calculating Market Lift Factors...</p>
             </div>
           ) : product && (
             <div className="space-y-8 animate-in zoom-in-95 duration-700">
                <div className="space-y-2">
                   <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">PROTOTYPE_ID: ALPHA_7</span>
                   <h2 className="text-5xl font-black italic text-white tracking-tighter uppercase leading-none">{product.productName}</h2>
                   <p className="text-emerald-400 text-lg font-bold italic tracking-tight">{product.tagline}</p>
                </div>
                <div className="py-8 border-y border-slate-800/50">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-2">TARGET PRICE POINT</p>
                   <p className="text-4xl font-black text-emerald-400 tracking-tighter">{product.pricePoint}</p>
                </div>
             </div>
           )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-12 space-y-8 shadow-xl">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Functional Matrix</h3>
           {isLoading ? (
             <div className="space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-950/50 rounded-2xl animate-pulse"></div>)}
             </div>
           ) : product?.features && (
             <div className="space-y-4">
                {product.features.map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-6 p-5 bg-slate-950 border border-slate-800 rounded-2xl group hover:border-emerald-500/40 transition-all">
                     <div className="w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center font-black text-emerald-400">0{i+1}</div>
                     <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{f}</p>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
