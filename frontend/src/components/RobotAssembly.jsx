import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

/*
 * "What we build CarryBot with": an assembly animation, then a follow demo.
 *  0 – 8.4 s   parts fly in one by one and snap together, each with a label
 *  8.4 – 10 s  power on (eyes + LEDs light up)
 *  10 – 14 s   the user walks in, picks up the token, BLE pairs, luggage drops in
 *  14 – 20 s   CarryBot follows the user (treadmill-style, ground scrolls)
 *  then it fades out and starts again.  Pure SVG, no images.
 */

const LOOP = 21;
const T0 = 0.8;
const STEP = 1.1;
const FLY = 0.85;
const POWER = 8.4;
const WALK_IN = [10, 12.6];
const PAIR = 13.2;
const FOLLOW = 14.2;

const RX = 360;
const GY = 410;
const S = 1.5;
const TOKEN_HOME = { x: 830, y: 215 };
const PERSON_STOP = 700;
const PERSON_LANE = GY + 4;

const PARTS = [
  { id: 'chassis', title: 'Chassis', desc: 'Base that holds every part', from: { x: 0, y: 260, r: 0 }, anchor: [-30, -40], box: { x: 24, y: 292 } },
  { id: 'drive', title: 'Motors + wheels', desc: '2 DC gear motors, differential drive', from: { x: -440, y: 0, r: -40 }, anchor: [-44, -19], box: { x: 24, y: 372 } },
  { id: 'esp', title: 'ESP32-S3', desc: 'Main brain: sensors, BLE, motors', from: { x: -220, y: -380, r: 30 }, anchor: [-38, -63], box: { x: 24, y: 212 } },
  { id: 'sonar', title: 'Ultrasonic ×3', desc: 'Front, left & right obstacle check', from: { x: 480, y: 0, r: 20 }, anchor: [80, -55], box: { x: 560, y: 332 } },
  { id: 'camera', title: 'Camera', desc: 'Computer vision keeps the user in view', from: { x: 300, y: -360, r: -25 }, anchor: [64, -158], box: { x: 560, y: 132 } },
  { id: 'basket', title: 'Luggage basket', desc: "Carries the user's bags", from: { x: 0, y: -440, r: 0 }, anchor: [-30, -128], box: { x: 24, y: 120 } },
  { id: 'token', title: 'Token (ESP32-C3)', desc: 'User carries it: BLE + coded IR', from: { x: 320, y: -220, r: 120 }, box: { x: 755, y: 290 } },
];
const BOX_W = 180;
const BOX_H = 50;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const landAt = (i) => T0 + i * STEP + FLY;

const partAt = (i, t) => {
  const start = T0 + i * STEP;
  if (t < start) return { show: false };
  const k = prog(t, start, start + FLY);
  const e = easeOut(k);
  const { from } = PARTS[i];
  const bump = k === 1 ? Math.max(0, Math.sin(prog(t, start + FLY, start + FLY + 0.25) * Math.PI)) * 4 : 0;
  return { show: true, dx: from.x * (1 - e), dy: from.y * (1 - e) + bump, r: from.r * (1 - e), o: Math.min(1, k * 3) };
};

const useReducedMotion = () => {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    setReduce(mq.matches);
    const on = (e) => setReduce(e.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduce;
};

/* ───────────── Robot parts ───────────── */

const Part = ({ p, children }) =>
  p.show ? (
    <g transform={`translate(${p.dx} ${p.dy}) rotate(${p.r})`} opacity={p.o}>
      {children}
    </g>
  ) : null;

const Chassis = ({ powered, t }) => {
  const blink = t % 4 > 3.85;
  return (
    <g>
      <rect x="-78" y="-34" width="156" height="8" rx="4" fill="#64748b" />
      <rect x="-70" y="-80" width="140" height="50" rx="14" fill="#eef2f7" stroke="#94a3b8" strokeWidth="2" />
      <rect x="-70" y="-42" width="140" height="5" fill={powered ? '#E79738' : '#cbd5e1'} />
      <rect x="22" y="-74" width="38" height="24" rx="7" fill="#0f172a" />
      {powered &&
        (blink ? (
          <path d="M 30 -62 h 8 M 44 -62 h 8" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
        ) : (
          <>
            <circle cx="34" cy="-62" r="4.5" fill="none" stroke="#22d3ee" strokeWidth="2.2" />
            <circle cx="48" cy="-62" r="4.5" fill="none" stroke="#22d3ee" strokeWidth="2.2" />
          </>
        ))}
    </g>
  );
};

const Drive = ({ spin }) => (
  <g>
    {[-44, 44].map((wx) => (
      <g key={wx}>
        <rect x={wx - 14} y="-42" width="28" height="14" rx="3" fill="#475569" />
        <g transform={`translate(${wx} -19)`}>
          <circle r="19" fill="#1f2937" />
          <circle r="9" fill="#94a3b8" />
          <g transform={`rotate(${spin})`}>
            <rect x="-1.5" y="-15" width="3" height="30" fill="#475569" />
            <rect x="-15" y="-1.5" width="30" height="3" fill="#475569" />
          </g>
        </g>
      </g>
    ))}
  </g>
);

const Esp = ({ powered, t }) => (
  <g>
    <rect x="-62" y="-75" width="48" height="26" rx="3" fill="#1f7a4d" stroke="#14532d" strokeWidth="1.5" />
    <rect x="-56" y="-71" width="20" height="16" rx="2" fill="#cbd5e1" />
    <rect x="-33" y="-70" width="10" height="10" rx="1" fill="#111827" />
    {[-58, -52, -46, -40, -34, -28, -22].map((px) => (
      <circle key={px} cx={px} cy="-52" r="1.4" fill="#facc15" />
    ))}
    <circle cx="-19" cy="-71" r="2.4" fill={powered ? (Math.sin(t * 8) > 0 ? '#22c55e' : '#14532d') : '#14532d'} />
  </g>
);

const Sonar = () => (
  <g>
    <rect x="70" y="-74" width="10" height="40" rx="3" fill="#2563eb" />
    {[-66, -48].map((sy) => (
      <g key={sy}>
        <rect x="80" y={sy} width="9" height="13" rx="2" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.2" />
        <line x1="89" y1={sy + 3} x2="89" y2={sy + 10} stroke="#334155" strokeWidth="1.5" />
      </g>
    ))}
  </g>
);

const Camera = ({ powered }) => (
  <g>
    <rect x="50" y="-150" width="5" height="72" fill="#64748b" />
    <rect x="40" y="-170" width="32" height="22" rx="5" fill="#0f172a" />
    <circle cx="72" cy="-159" r="7" fill={powered ? '#38bdf8' : '#334155'} stroke="#94a3b8" strokeWidth="2" />
    <circle cx="74" cy="-161" r="2" fill="#e0f2fe" />
  </g>
);

const Basket = () => (
  <g>
    <path d="M -58 -80 V -96 M 28 -80 V -96" stroke="#94a3b8" strokeWidth="4" />
    <rect x="-68" y="-130" width="106" height="36" rx="4" fill="#A67C52" opacity="0.12" stroke="#8a6440" strokeWidth="3" />
    {[-46, -24, -2, 20].map((bx) => (
      <line key={bx} x1={bx} y1="-130" x2={bx} y2="-94" stroke="#8a6440" strokeWidth="2" />
    ))}
    <line x1="-68" y1="-112" x2="38" y2="-112" stroke="#8a6440" strokeWidth="2" />
  </g>
);

const Luggage = () => (
  <g>
    <rect x="-56" y="-162" width="38" height="66" rx="6" fill="#D3671B" />
    <rect x="-46" y="-170" width="18" height="9" rx="3" fill="none" stroke="#7c3a10" strokeWidth="3" />
    <rect x="-14" y="-146" width="36" height="50" rx="6" fill="#679873" />
    <line x1="-56" y1="-128" x2="-18" y2="-128" stroke="#7c3a10" strokeWidth="2" />
  </g>
);

const Token = ({ x, y, t, powered }) => (
  <g transform={`translate(${x} ${y})`}>
    {powered && (
      <circle r={10 + ((t * 30) % 30)} fill="none" stroke="#38bdf8" strokeWidth="2" opacity={1 - ((t * 30) % 30) / 30} />
    )}
    <rect x="-13" y="-17" width="26" height="34" rx="7" fill="#1f2937" stroke="#94a3b8" strokeWidth="1.5" />
    <rect x="-8" y="-11" width="16" height="12" rx="2" fill="#1f7a4d" />
    <circle cx="0" cy="9" r="3" fill={powered ? '#38bdf8' : '#475569'} />
  </g>
);

/* ───────────── Person ───────────── */

const Person = ({ x, t, walking }) => {
  const swing = walking ? Math.sin(t * 7.5) * 24 : 0;
  const bob = walking ? -Math.abs(Math.sin(t * 7.5)) * 3 : 0;
  return (
    <g transform={`translate(${x} ${PERSON_LANE + bob})`}>
      <ellipse cx="0" cy="2" rx="34" ry="6" fill="#000" opacity="0.12" />
      <g transform={`rotate(${-swing} 0 -82)`}>
        <rect x="-7" y="-84" width="14" height="84" rx="7" fill="#33415e" />
        <ellipse cx="6" cy="-2" rx="13" ry="6" fill="#1f2937" />
      </g>
      <g transform={`rotate(${swing * 0.8} 0 -140)`}>
        <rect x="-6" y="-142" width="12" height="62" rx="6" fill="#2b3a52" />
      </g>
      <rect x="-24" y="-158" width="46" height="84" rx="16" fill="#3b4f6e" />
      <g transform={`rotate(${swing} 0 -82)`}>
        <rect x="-7" y="-84" width="14" height="84" rx="7" fill="#3f5279" />
        <ellipse cx="6" cy="-2" rx="13" ry="6" fill="#111827" />
      </g>
      <g transform={`rotate(${-swing * 0.8} 0 -140)`}>
        <rect x="-6" y="-142" width="12" height="62" rx="6" fill="#4a6189" />
        <circle cx="0" cy="-80" r="6" fill="#e0ac7e" />
      </g>
      <circle cx="4" cy="-176" r="17" fill="#e0ac7e" />
      <path d="M -13 -178 Q -10 -198 8 -196 Q 22 -194 21 -180 Q 12 -188 -2 -186 Z" fill="#2a1d14" />
    </g>
  );
};

/* ───────────── Label callout ───────────── */

const Label = ({ part, tx, ty, o }) => {
  const { x, y } = part.box;
  const right = x > RX;
  const sx = right ? x : x + BOX_W;
  const sy = y + BOX_H / 2;
  return (
    <g opacity={o}>
      <path d={`M ${sx} ${sy} L ${tx} ${ty}`} className="stroke-flame-500" strokeWidth="2" strokeDasharray="4 4" fill="none" />
      <circle cx={tx} cy={ty} r="4.5" className="fill-flame-500" />
      <rect x={x} y={y} width={BOX_W} height={BOX_H} rx="10" className="fill-ink-900 stroke-indigo-200" strokeWidth="1.5" />
      <rect x={x} y={y + 10} width="4" height={BOX_H - 20} rx="2" className="fill-flame-500" />
      <text x={x + 14} y={y + 21} fontSize="14" fontWeight="700" className="fill-white" fontFamily="inherit">{part.title}</text>
      <text x={x + 14} y={y + 38} fontSize="10.5" className="fill-slate-400" fontFamily="inherit">{part.desc}</text>
    </g>
  );
};

/* ───────────── Scene ───────────── */

const caption = (t) => {
  if (t < T0) return { tag: 'Build', text: "Let's build CarryBot, part by part." };
  if (t < POWER) {
    const i = clamp(Math.floor((t - T0) / STEP), 0, PARTS.length - 1);
    return { tag: `Part ${i + 1} / ${PARTS.length}`, text: `Adding: ${PARTS[i].title}` };
  }
  if (t < WALK_IN[0]) return { tag: 'Power on', text: 'All parts joined. CarryBot boots up ✓' };
  if (t < PAIR) return { tag: 'User', text: 'The user picks up the token.' };
  if (t < FOLLOW) return { tag: 'Pairing', text: 'BLE ID matches. Luggage goes in the basket.' };
  return { tag: 'Follow', text: 'CarryBot follows the user at about 1.2 m.' };
};

const RobotAssembly = () => {
  const reduce = useReducedMotion();
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const wrapRef = useRef(null);
  const clockRef = useRef(0);
  const playRef = useRef(true);
  playRef.current = playing;

  useEffect(() => {
    if (reduce) {
      setT(POWER + 0.6);
      return undefined;
    }
    let raf;
    let visible = false;
    let last = performance.now();
    const obs = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.25 });
    if (wrapRef.current) obs.observe(wrapRef.current);
    const tick = (now) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (visible && playRef.current && document.visibilityState === 'visible') {
        clockRef.current = (clockRef.current + dt) % LOOP;
        setT(clockRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [reduce]);

  const replay = () => {
    clockRef.current = 0;
    setT(0);
    setPlaying(true);
  };

  const p = PARTS.map((_, i) => partAt(i, t));
  const powered = t >= POWER;
  const following = t >= FOLLOW;
  const fade = t < 0.3 ? t / 0.3 : t > LOOP - 0.8 ? (LOOP - t) / 0.8 : 1;
  const labelFade = 1 - prog(t, 9.6, 10.2);

  const robotX = following ? RX + 40 * easeInOut(prog(t, FOLLOW, FOLLOW + 1)) + Math.sin((t - FOLLOW) * 2) * 6 : RX;
  const spin = following ? (t - FOLLOW) * 320 : 0;

  const walkingIn = t >= WALK_IN[0] && t < WALK_IN[1];
  const personVisible = t >= WALK_IN[0];
  const personX = lerp(-80, PERSON_STOP, easeInOut(prog(t, WALK_IN[0], WALK_IN[1])));

  const tp = p[6];
  const belt = { x: personX - 26, y: PERSON_LANE - 118 };
  const pick = easeInOut(prog(t, WALK_IN[1], PAIR));
  const home = { x: TOKEN_HOME.x + (tp.dx || 0), y: TOKEN_HOME.y + (tp.dy || 0) + (powered ? Math.sin(t * 2.4) * 5 : 0) };
  const token = { x: lerp(home.x, belt.x, pick), y: lerp(home.y, belt.y, pick) };

  const lugK = prog(t, PAIR + 0.2, PAIR + 0.8);
  const lugY = -260 * (1 - easeOut(lugK));

  const scroll = following ? ((t - FOLLOW) * 150) % 60 : 0;

  const cam = { x: robotX + 72 * S, y: GY - 159 * S };
  const cap = caption(t);
  const builtCount = p.filter((_, i) => t >= landAt(i)).length;

  return (
    <div ref={wrapRef} className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-ink-800">
      <svg viewBox="0 0 960 500" className="block h-auto w-full" role="img"
        aria-label="Animation: CarryBot's parts fly in and join together with labels, then the robot powers on and follows its user">
        <rect width="960" height="500" className="fill-ink-800" />
        {Array.from({ length: 17 }, (_, i) => (
          <line key={i} x1={i * 60} y1="0" x2={i * 60} y2={GY} className="stroke-indigo-100" strokeWidth="1" opacity="0.6" />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line key={i} x1="0" y1={i * 60 + 50} x2="960" y2={i * 60 + 50} className="stroke-indigo-100" strokeWidth="1" opacity="0.6" />
        ))}
        <rect y={GY} width="960" height={500 - GY} className="fill-ink-700" />
        <line x1="0" y1={GY} x2="960" y2={GY} className="stroke-indigo-300" strokeWidth="2" />
        {Array.from({ length: 18 }, (_, i) => (
          <rect key={i} x={i * 60 - scroll} y={GY + 30} width="30" height="5" rx="2" className="fill-indigo-200" />
        ))}

        <g opacity={fade}>
          {t < PAIR && (
            <g opacity={tp.show ? 1 - pick : 0}>
              <ellipse cx={TOKEN_HOME.x} cy={TOKEN_HOME.y + 40} rx="26" ry="6" fill="#000" opacity="0.1" />
            </g>
          )}

          {labelFade > 0 &&
            PARTS.map((part, i) => {
              if (t < landAt(i)) return null;
              const o = prog(t, landAt(i), landAt(i) + 0.3) * labelFade;
              const tx = part.anchor ? RX + part.anchor[0] * S : home.x;
              const ty = part.anchor ? GY + part.anchor[1] * S : home.y;
              return <Label key={part.id} part={part} tx={tx} ty={ty} o={o} />;
            })}

          {personVisible && <Person x={personX} t={t} walking={walkingIn || following} />}

          {t >= PAIR && (
            <>
              <line x1={cam.x} y1={cam.y} x2={token.x} y2={token.y} stroke="#22c55e" strokeWidth="2.5"
                strokeDasharray="6 8" strokeDashoffset={-t * 40} opacity={prog(t, PAIR, PAIR + 0.4) * 0.85} />
              {following && (
                <g opacity={prog(t, FOLLOW, FOLLOW + 0.5)}>
                  <line x1={robotX + 95 * S} y1={GY + 52} x2={personX - 30} y2={GY + 52} className="stroke-flame-500" strokeWidth="2" />
                  <path d={`M ${robotX + 95 * S} ${GY + 46} v 12 M ${personX - 30} ${GY + 46} v 12`} className="stroke-flame-500" strokeWidth="2" />
                  <text x={(robotX + 95 * S + personX - 30) / 2} y={GY + 76} textAnchor="middle" fontSize="13" fontWeight="700" className="fill-flame-600" fontFamily="ui-monospace, monospace">1.2 m</text>
                </g>
              )}
            </>
          )}

          <g transform={`translate(${robotX} ${GY}) scale(${S})`}>
            {p[0].show && <ellipse cx="0" cy="2" rx="80" ry="8" fill="#000" opacity={0.14 * p[0].o} />}
            {following &&
              [26, 46, 66].map((r, i) => (
                <path key={r}
                  d={`M ${92 + r * Math.cos(-0.45)} ${-54 + r * Math.sin(-0.45)} A ${r} ${r} 0 0 1 ${92 + r * Math.cos(0.45)} ${-54 + r * Math.sin(0.45)}`}
                  fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"
                  opacity={0.2 + 0.5 * ((Math.sin(t * 5 - i) + 1) / 2)} />
              ))}
            {lugK > 0 && <g transform={`translate(0 ${lugY})`}><Luggage /></g>}
            <Part p={p[5]}><Basket /></Part>
            <Part p={p[0]}><Chassis powered={powered} t={t} /></Part>
            <Part p={p[1]}><Drive spin={spin} /></Part>
            <Part p={p[2]}><Esp powered={powered} t={t} /></Part>
            <Part p={p[3]}><Sonar /></Part>
            <Part p={p[4]}><Camera powered={powered} /></Part>
          </g>

          {PARTS.map((part, i) => {
            const k = prog(t, landAt(i), landAt(i) + 0.4);
            if (k <= 0 || k >= 1) return null;
            const cx = part.anchor ? RX + part.anchor[0] * S : TOKEN_HOME.x;
            const cy = part.anchor ? GY + part.anchor[1] * S : TOKEN_HOME.y;
            return (
              <g key={part.id} opacity={1 - k}>
                <circle cx={cx} cy={cy} r={8 + k * 34} fill="none" stroke="#E79738" strokeWidth="3" />
                {[0, 60, 120, 180, 240, 300].map((a) => {
                  const rad = (a * Math.PI) / 180;
                  return <line key={a} x1={cx + Math.cos(rad) * (10 + k * 20)} y1={cy + Math.sin(rad) * (10 + k * 20)}
                    x2={cx + Math.cos(rad) * (18 + k * 34)} y2={cy + Math.sin(rad) * (18 + k * 34)} stroke="#CFB153" strokeWidth="3" strokeLinecap="round" />;
                })}
              </g>
            );
          })}

          {t >= POWER && t < POWER + 1.2 && (
            <circle cx={RX} cy={GY - 90} r={60 + prog(t, POWER, POWER + 1.2) * 160} fill="none" stroke="#679873" strokeWidth="4" opacity={1 - prog(t, POWER, POWER + 1.2)} />
          )}

          {tp.show && (
            <g transform={pick < 1 ? `rotate(${tp.r || 0} ${token.x} ${token.y})` : undefined} opacity={tp.o}>
              <Token x={token.x} y={token.y} t={t} powered={powered} />
            </g>
          )}

          {t >= PAIR && (
            <g transform={`translate(${robotX - 85} ${GY - 300})`} opacity={prog(t, PAIR, PAIR + 0.3)}>
              <rect width="170" height="30" rx="15" fill="#0f172a" opacity="0.9" />
              <circle cx="16" cy="15" r="5" fill="#16a34a" />
              <text x="28" y="20" fontSize="13" fontWeight="700" fill="#f8fafc" fontFamily="ui-monospace, monospace">
                {following ? 'Following · 1.2 m' : 'BLE ID  MATCH ✓'}
              </text>
            </g>
          )}
        </g>
      </svg>

      {/* caption: below the picture on phones, floating on bigger screens */}
      <div className="flex items-start justify-between gap-3 border-t border-indigo-100 bg-ink-900 p-3 sm:pointer-events-none sm:absolute sm:left-5 sm:right-5 sm:top-5 sm:border-0 sm:bg-transparent sm:p-0">
        <div className="min-w-0 sm:max-w-sm sm:rounded-xl sm:border sm:border-indigo-200 sm:bg-ink-900/95 sm:px-4 sm:py-3 sm:shadow-lg">
          <div className="mb-1.5 flex gap-1">
            {PARTS.map((part, i) => (
              <span key={part.id} className={`h-1.5 w-5 rounded-full transition-colors duration-300 sm:w-7 ${i < builtCount ? 'bg-flame-500' : 'bg-indigo-100'}`} />
            ))}
          </div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-cyan-300 sm:text-[11px]">{cap.tag}</p>
          <p className="text-xs font-medium text-slate-200 sm:text-sm">{cap.text}</p>
        </div>
        {!reduce && (
          <div className="pointer-events-auto flex gap-1.5">
            <button type="button" onClick={() => setPlaying((v) => !v)} className="icon-btn bg-ink-900/90" aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button type="button" onClick={replay} className="icon-btn bg-ink-900/90" aria-label="Replay">
              <RotateCcw size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RobotAssembly;