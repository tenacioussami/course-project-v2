import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';

/*
 * Hero illustration: CarryBot following its user through a mall.
 * The photo is a static WebP; an SVG layer on top (same 914×679 coordinate
 * space) brings the robot to life:
 *   – eyes glow and blink
 *   – LiDAR puck spins and sends radar waves
 *   – a scan beam + signal dots travel from the robot to the user's token
 *   – the token on the backpack pulses
 *   – an alert ring pulses around the obstacle cone
 * The whole scene also drifts slowly (Ken Burns), and the HUD card tracks IR L/C/R.
 */

const IR_SEQUENCE = ['C', 'C', 'L', 'C', 'C', 'R', 'C', 'C'];

const useReducedMotion = () => {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    setReduce(mq.matches);
    const onChange = (e) => setReduce(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduce;
};

// Pulsing ring (SVG/SMIL)
const Ring = ({ cx, cy, from, to, color, dur = 2.4, begin = 0, ry, width = 2 }) => (
  <ellipse cx={cx} cy={cy} rx={from} ry={ry ? ry[0] : from} fill="none" stroke={color} strokeWidth={width} opacity="0">
    <animate attributeName="rx" values={`${from};${to}`} dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
    <animate attributeName="ry" values={ry ? `${ry[0]};${ry[1]}` : `${from};${to}`} dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
    <animate attributeName="opacity" values="0.9;0" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
  </ellipse>
);

// Robot eye: glowing ring that breathes + an eyelid that blinks
const Eye = ({ cx, cy, delay = 0 }) => (
  <g>
    <circle cx={cx} cy={cy} r="11" fill="url(#hs-eye-glow)">
      <animate attributeName="opacity" values="0.35;0.9;0.35" dur="2.6s" begin={`${delay}s`} repeatCount="indefinite" />
    </circle>
    <circle cx={cx} cy={cy} r="7.5" fill="none" stroke="#7df3ff" strokeWidth="1.6">
      <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="2.6s" begin={`${delay}s`} repeatCount="indefinite" />
    </circle>
    {/* eyelid */}
    <rect x={cx - 12} y={cy - 12} width="24" height="0" rx="4" fill="#05080f">
      <animate attributeName="height" values="0;0;24;0;0;24;0" keyTimes="0;0.86;0.89;0.92;0.95;0.97;1" dur="5s" repeatCount="indefinite" />
    </rect>
  </g>
);

const HeroScene = () => {
  const reduce = useReducedMotion();
  const [irStep, setIrStep] = useState(0);
  const ir = IR_SEQUENCE[irStep % IR_SEQUENCE.length];

  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => setIrStep((s) => s + 1), 900);
    return () => clearInterval(id);
  }, [reduce]);

  // signal path: robot camera → token on the backpack
  const signal = 'M 390 292 C 440 258, 495 226, 568 237';

  return (
    <div className="relative h-full w-full overflow-hidden">
      <style>{`
        @keyframes hs-kenburns { from { transform: scale(1) translate(0,0); } to { transform: scale(1.06) translate(-1.2%, -1%); } }
        .hs-stage { animation: hs-kenburns 16s ease-in-out infinite alternate; transform-origin: 40% 60%; will-change: transform; }
        @keyframes hs-blink-dot { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
        .hs-blink { animation: hs-blink-dot 1.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .hs-stage, .hs-blink { animation: none; } }
      `}</style>

      {/* Photo + animated overlay move together */}
      <div className="hs-stage absolute inset-0">
        <img
          src="/hero-carrybot.webp"
          alt="CarryBot carrying luggage while following its user through a shopping mall and avoiding a cone"
          width="914"
          height="679"
          fetchpriority="high"
          decoding="async"
          className="h-full w-full object-cover"
        />

        {!reduce && (
          <svg viewBox="0 0 914 679" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <radialGradient id="hs-eye-glow">
                <stop offset="0" stopColor="#7df3ff" stopOpacity="0.9" />
                <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="hs-token-glow">
                <stop offset="0" stopColor="#bff6ff" stopOpacity="1" />
                <stop offset="0.4" stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="hs-beam" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#38bdf8" stopOpacity="0.35" />
                <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>
              <filter id="hs-blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            {/* Scan beam sweeping toward the user */}
            <g style={{ mixBlendMode: 'screen' }}>
              <path d="M 392 292 L 600 200 L 600 330 Z" fill="url(#hs-beam)">
                <animateTransform attributeName="transform" type="rotate" values="-7 392 292; 5 392 292; -7 392 292" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.35;0.8;0.35" dur="4s" repeatCount="indefinite" />
              </path>
            </g>

            {/* LiDAR: radar waves + a light spinning around the puck */}
            <Ring cx={230} cy={249} from={40} to={120} ry={[8, 26]} color="#38bdf8" dur={2.6} />
            <Ring cx={230} cy={249} from={40} to={120} ry={[8, 26]} color="#38bdf8" dur={2.6} begin={1.3} />
            <circle r="4" fill="#bff6ff" filter="url(#hs-blur)">
              <animateMotion dur="1.4s" repeatCount="indefinite" path="M 190 249 A 40 8 0 1 0 270 249 A 40 8 0 1 0 190 249" />
            </circle>
            <circle r="2.2" fill="#ffffff">
              <animateMotion dur="1.4s" repeatCount="indefinite" path="M 190 249 A 40 8 0 1 0 270 249 A 40 8 0 1 0 190 249" />
            </circle>

            {/* Eyes */}
            <Eye cx={334} cy={423} />
            <Eye cx={366} cy={422} delay={0.15} />

            {/* Signal: flowing line + data packets travelling to the token */}
            <path d={signal} fill="none" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="4 10" strokeLinecap="round" opacity="0.8">
              <animate attributeName="stroke-dashoffset" values="28;0" dur="0.8s" repeatCount="indefinite" />
            </path>
            {[0, 0.55, 1.1].map((b) => (
              <g key={b}>
                <circle r="7" fill="#38bdf8" opacity="0.5" filter="url(#hs-blur)">
                  <animateMotion dur="1.65s" begin={`${b}s`} repeatCount="indefinite" path={signal} />
                </circle>
                <circle r="3" fill="#e0fbff">
                  <animateMotion dur="1.65s" begin={`${b}s`} repeatCount="indefinite" path={signal} />
                </circle>
              </g>
            ))}

            {/* Token on the backpack */}
            <circle cx={573} cy={239} r="22" fill="url(#hs-token-glow)">
              <animate attributeName="r" values="16;26;16" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <Ring cx={573} cy={239} from={12} to={58} color="#7dd3fc" dur={2} />
            <Ring cx={573} cy={239} from={12} to={58} color="#7dd3fc" dur={2} begin={1} />

            {/* Obstacle alert around the cone */}
            <Ring cx={710} cy={598} from={36} to={95} ry={[9, 24]} color="#fb923c" dur={1.8} width={2.5} />
            <Ring cx={710} cy={598} from={36} to={95} ry={[9, 24]} color="#f43f5e" dur={1.8} begin={0.9} width={2} />
          </svg>
        )}

      {/* Live HUD card (covers the old panel in the photo; moves with it) */}
      <div className="absolute left-[73.6%] top-[15%] flex h-[29.5%] w-[23.6%] flex-col rounded-xl border border-sky-400/50 bg-ink-900 p-[1.4%] shadow-[0_0_30px_-6px_rgba(56,189,248,.6)]">
        <p className="flex items-center gap-1.5 text-[clamp(9px,1.1vw,15px)] font-semibold text-white">
          <Radio className="hs-blink h-[1.1em] w-[1.1em] text-sky-400" /> Token locked
        </p>
        {/* signal strength bars */}
        <div className="mt-[6%] flex h-[22%] items-end gap-[4%] px-[2%]">
          {[0.35, 0.55, 0.75, 1].map((h, i) => (
            <span
              key={i}
              className="hs-blink flex-1 rounded-sm bg-gradient-to-t from-sky-500 to-cyan-300"
              style={{ height: `${h * 100}%`, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <div className="mt-auto space-y-[6%] font-mono text-[clamp(7px,0.8vw,11px)]">
          <div className="flex items-center justify-between rounded-md bg-white/[0.05] px-2 py-1">
            <span className="text-slate-400">BLE ID</span>
            <span className="text-lime-300"><span className="hs-blink inline-block">●</span> MATCH</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center">
            {['L', 'C', 'R'].map((d) => (
              <span
                key={d}
                className={`rounded-md py-1 transition-all duration-300 ${
                  d === ir ? 'bg-sky-500/25 text-sky-200 ring-1 ring-sky-400/60' : 'bg-white/[0.04] text-slate-500'
                }`}
              >
                IR {d}
              </span>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default HeroScene;