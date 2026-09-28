import { Radio } from 'lucide-react';

/*
 * Hero illustration: CarryBot following its user through a mall.
 * The image is ~55 KB WebP and preloaded from index.html.
 * The small HUD card on the right is live HTML (token lock status),
 * positioned in % so it scales with the image.
 */
const HeroScene = () => (
  <div className="relative h-full w-full">
    <img
      src="/hero-carrybot.webp"
      alt="CarryBot carrying luggage while following its user through a shopping mall and avoiding a cone"
      width="914"
      height="679"
      fetchpriority="high"
      decoding="async"
      className="h-full w-full object-cover"
    />
    <div className="absolute left-[73.6%] top-[15%] flex h-[29.5%] w-[23.6%] flex-col rounded-xl border border-sky-400/50 bg-ink-900 p-[1.4%] shadow-[0_0_30px_-6px_rgba(56,189,248,.6)]">
      <p className="flex items-center gap-1.5 text-[clamp(9px,1.1vw,15px)] font-semibold text-white">
        <Radio className="h-[1.1em] w-[1.1em] text-sky-400" /> Token locked
      </p>
      <div className="mt-auto space-y-[6%] font-mono text-[clamp(7px,0.8vw,11px)]">
        <div className="flex items-center justify-between rounded-md bg-white/[0.05] px-2 py-1">
          <span className="text-slate-400">BLE ID</span><span className="text-lime-300">● MATCH</span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-center">
          {['L', 'C', 'R'].map((d) => (
            <span key={d} className={`rounded-md py-1 ${d === 'C' ? 'bg-sky-500/25 text-sky-200 ring-1 ring-sky-400/60' : 'bg-white/[0.04] text-slate-500'}`}>IR {d}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default HeroScene;
