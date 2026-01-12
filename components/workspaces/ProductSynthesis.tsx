
import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { synthesizeProduct } from '../../services/geminiService';

export const ProductSynthesis: React.FC<{ lead?: Lead }> = ({ lead }) => {
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    if (lead) synthesizeProduct(lead).then(setProduct);
  }, [lead]);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in duration-500">
      <h1 className="text-4xl font-black uppercase text-white">OFFER <span className="text-emerald-600">ARCHITECTURE</span></h1>
      <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-16 text-center">
         {product ? <h2 className="text-5xl font-black text-emerald-400">{product.productName}</h2> : "Processing..."}
      </div>
    </div>
  );
};
