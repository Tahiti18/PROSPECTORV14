
import React, { useState, useEffect } from 'react';
import { subscribeToCompute, addCredits, getBalance, getUserTier, upgradeTier, Tier } from '../../services/computeTracker';

export const BillingNode: React.FC = () => {
  const [currentTier, setCurrentTier] = useState<Tier>('STARTER');
  const [balance, setBalance] = useState(0);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

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
        addCredits(tier === 'GROWTH' ? 100 : 500); 
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
      features: ['Agency Fundamentals', 'Basic Discovery', 'Manual Ledger Export', 'Standard Support'] 
    },
    { 
      id: 'GROWTH', 
      price: billingCycle === 'MONTHLY' ? '$99' : '$79', 
      color: 'emerald', 
      features: ['Full Campaign Orchestration', 'Unlimited Asset Storage', 'Priority Strategy Lab', '100 Monthly Credits'], 
      best: true 
    },
    { 
      id: 'EMPIRE', 
      price: billingCycle === 'MONTHLY' ? '$499' : '$399', 
      color: 'indigo', 
      features: ['White Label Deliverables', 'Bulk Hyper-Launch Enabled', 'Dedicated Account Manager', '500 Monthly Credits'] 
    }
  ];

  return (
    <div className="max-w-[1400px] mx-auto py-12 space-y-16 animate-in fade-in duration-700 pb-40">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">
          AGENCY <span className="text-emerald-500 not-italic">SUBSCRIPTIONS</span>
        </h1>
        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.4em] italic">Scalable Infrastructure via Stripe Gateway</p>
        
        <div className="inline-flex bg-slate-900 border border-slate-800 rounded-full p-1 relative shadow-2xl">
           <div className={`absolute top-1 bottom-1 w-[100px] bg-emerald-600 rounded-full transition-all duration-300 ${billingCycle === 'MONTHLY' ? 'left-1' : 'left-[108px]'}`}></div>
           <button onClick={() => setBillingCycle('MONTHLY')} className="relative z-10 w-[100px] py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors">MONTHLY</button>
           <button onClick={() => setBillingCycle('YEARLY')} className="relative z-10 w-[100px] py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors">YEARLY</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
         {TIERS.map((tier) => (
           <div key={tier.id} className={`relative p-8 rounded-[40px] border-2 flex flex-col gap-6 transition-all duration-300 group hover:-translate-y-2 ${
             tier.id === currentTier 
               ? `bg-emerald-900/10 border-emerald-500/50 shadow-2xl shadow-emerald-900/20` 
               : 'bg-[#0b1021] border-slate-800 hover:border-slate-700 shadow-xl'
           }`}>
              {tier.best && (
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg border border-emerald-400/50">
                    MOST POPULAR
                 </div>
              )}
              
              <div className="space-y-2 text-center border-b border-slate-800/50 pb-6">
                 <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${tier.id === currentTier ? 'text-emerald-400' : 'text-slate-500'}`}>{tier.id}</h3>
                 <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black text-white italic tracking-tighter">{tier.price}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">/MO</span>
                 </div>
              </div>

              <ul className="space-y-4 flex-1">
                 {tier.features.map((f, i) => (
                   <li key={i} className="flex items-start gap-3 text-[11px] font-bold text-slate-300 uppercase tracking-tight">
                      <span className={`text-emerald-500 font-bold`}>✓</span>
                      {f}
                   </li>
                 ))}
              </ul>

              <button 
                onClick={() => handleUpgrade(tier.id)}
                disabled={tier.id === currentTier || !!isProcessing}
                className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-b-4 ${
                  tier.id === currentTier 
                    ? 'bg-slate-800 text-slate-400 border-slate-900' 
                    : `bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800`
                }`}
              >
                {isProcessing === tier.id ? 'PROCESSING...' : (tier.id === currentTier ? 'CURRENT PLAN' : 'UPGRADE NODE')}
              </button>
           </div>
         ))}
      </div>

      <div className="bg-[#0b1021] border-2 border-slate-800 rounded-[56px] p-12 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
         <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
         <div className="space-y-4 max-w-md relative z-10">
            <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">AGENCY <span className="text-emerald-500">WALLET</span></h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Top up credits for specialized 4K rendering and high-frequency market scans. Powered by Stripe.</p>
         </div>
         <div className="flex items-center gap-10 relative z-10">
            <div className="text-right">
               <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">AVAILABLE BALANCE</p>
               <p className="text-5xl font-black italic text-emerald-400 tracking-tighter">${(typeof balance === 'number' ? balance : 0).toFixed(2)}</p>
            </div>
            <button 
              onClick={handleCreditTopUp}
              disabled={!!isProcessing}
              className="h-20 w-20 rounded-3xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/30 active:scale-90 transition-all text-3xl font-black border-b-4 border-emerald-800"
            >
              +
            </button>
         </div>
      </div>
    </div>
  );
};
