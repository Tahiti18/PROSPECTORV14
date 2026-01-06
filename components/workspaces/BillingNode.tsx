
import React, { useState, useEffect } from 'react';
import { subscribeToCompute, addCredits, getBalance, getUserTier, upgradeTier, Tier } from '../../services/computeTracker';
import { ComputeStats } from '../../types';

export const BillingNode: React.FC = () => {
  const [currentTier, setCurrentTier] = useState<Tier>('STARTER');
  const [balance, setBalance] = useState(0);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // holds ID of package being processed

  useEffect(() => {
    setCurrentTier(getUserTier());
    setBalance(getBalance());
    const unsubscribe = subscribeToCompute((s, user) => {
        setBalance(user.credits);
        setCurrentTier(user.tier);
    });
    return () => { unsubscribe(); };
  }, []);

  const handleUpgrade = (tier: Tier) => {
    setIsProcessing(tier);
    setTimeout(() => {
        upgradeTier(tier);
        addCredits(tier === 'GROWTH' ? 100 : 500); // Bonus credits on upgrade
        setIsProcessing(null);
    }, 2000);
  };

  const handleCreditTopUp = () => {
    setIsProcessing('CREDITS');
    setTimeout(() => {
        addCredits(50);
        setIsProcessing(null);
    }, 1500);
  }

  const TIERS: { id: Tier; price: string; color: string; features: string[]; best?: boolean }[] = [
    { 
      id: 'STARTER', 
      price: '$0', 
      color: 'slate', 
      features: ['Gemini Flash Access', 'Basic Lead Recon', 'Manual Export', 'Community Support'] 
    },
    { 
      id: 'GROWTH', 
      price: billingCycle === 'MONTHLY' ? '$99' : '$79', 
      color: 'emerald', 
      features: ['Gemini 3 Pro Access', 'Veo Video Engine (Limited)', 'Advanced Analytics', 'Priority Support', '100 Credits/mo'], 
      best: true 
    },
    { 
      id: 'EMPIRE', 
      price: billingCycle === 'MONTHLY' ? '$499' : '$399', 
      color: 'indigo', 
      features: ['Everything in Growth', 'Unlimited Veo Generation', 'White Label Reports', 'Bulk Hyper-Launch', 'Dedicated Success Manager', '500 Credits/mo'] 
    }
  ];

  return (
    <div className="max-w-[1400px] mx-auto py-12 space-y-16 animate-in fade-in duration-700 pb-40">
      
      {/* HEADER */}
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">AGENCY <span className="text-emerald-600 not-italic">PRICING</span></h1>
        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.4em] italic">Scale your intelligence infrastructure</p>
        
        {/* Toggle */}
        <div className="inline-flex bg-slate-900 border border-slate-800 rounded-full p-1 relative">
           <div className={`absolute top-1 bottom-1 w-[100px] bg-emerald-600 rounded-full transition-all duration-300 ${billingCycle === 'MONTHLY' ? 'left-1' : 'left-[108px]'}`}></div>
           <button onClick={() => setBillingCycle('MONTHLY')} className="relative z-10 w-[100px] py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors">MONTHLY</button>
           <button onClick={() => setBillingCycle('YEARLY')} className="relative z-10 w-[100px] py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors">YEARLY</button>
        </div>
      </div>

      {/* PRICING GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
         {TIERS.map((tier) => (
           <div key={tier.id} className={`relative p-8 rounded-[40px] border flex flex-col gap-6 transition-all duration-300 group hover:-translate-y-2 ${
             tier.id === currentTier 
               ? `bg-${tier.color}-900/10 border-${tier.color}-500/50 shadow-2xl shadow-${tier.color}-900/20` 
               : 'bg-[#0b1021] border-slate-800 hover:border-slate-700'
           }`}>
              {tier.best && (
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                    MOST POPULAR
                 </div>
              )}
              
              <div className="space-y-2 text-center border-b border-slate-800/50 pb-6">
                 <h3 className={`text-sm font-black uppercase tracking-[0.2em] text-${tier.color}-400`}>{tier.id}</h3>
                 <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black text-white">{tier.price}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">/MO</span>
                 </div>
              </div>

              <ul className="space-y-4 flex-1">
                 {tier.features.map((f, i) => (
                   <li key={i} className="flex items-start gap-3 text-xs font-medium text-slate-300">
                      <span className={`text-${tier.color}-500 font-bold`}>✓</span>
                      {f}
                   </li>
                 ))}
              </ul>

              <button 
                onClick={() => handleUpgrade(tier.id)}
                disabled={tier.id === currentTier || !!isProcessing}
                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  tier.id === currentTier 
                    ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                    : `bg-${tier.color}-600 hover:bg-${tier.color}-500 text-white`
                }`}
              >
                {isProcessing === tier.id ? 'PROCESSING...' : (tier.id === currentTier ? 'CURRENT PLAN' : 'UPGRADE')}
              </button>
           </div>
         ))}
      </div>

      {/* WALLET SECTION */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-[48px] p-12 flex flex-col md:flex-row items-center justify-between gap-10">
         <div className="space-y-2">
            <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">NEURAL WALLET</h3>
            <p className="text-xs text-slate-400 max-w-md">Pay-as-you-go credits for additional compute beyond your subscription limits. Required for excessive 4K rendering and deep research tasks.</p>
         </div>
         <div className="flex items-center gap-8">
            <div className="text-right">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BALANCE</p>
               <p className="text-4xl font-black text-emerald-400 tracking-tighter">${(typeof balance === 'number' ? balance : 0).toFixed(2)}</p>
            </div>
            <button 
              onClick={handleCreditTopUp}
              disabled={!!isProcessing}
              className="h-16 w-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-600/20 active:scale-90 transition-all text-2xl"
            >
              +
            </button>
         </div>
      </div>

    </div>
  );
};
