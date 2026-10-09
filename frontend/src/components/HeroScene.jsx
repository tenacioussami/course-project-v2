import { useEffect, useRef, useState } from 'react';

/*
 * Animated story: CarryBot following its user (pure SVG, no images).
 *
 *  1. Identify   – the token's BLE ID matches
 *  2. Follow     – CarryBot follows at ~1.2 m, IR keeps the user centred
 *  3. Obstacle   – ultrasonic sensors spot a cone ahead
 *  4. Avoid      – CarryBot steers around it
 *  5. Re-acquire – it finds the same token again and keeps following
 *
 * Coordinates use a 914 × 679 canvas (same size as the old hero photo),
 * so it drops into the Home page without any layout change.
 * Background colours use theme classes, so it follows the site palette.
 */

const LOOP = 14; // seconds
const PHASES = [0, 2, 5.5, 7, 9.5, 12.5, LOOP];

const STEPS = [
  { title: 'Identify', text: "The token's BLE ID matches — this is the right user." },
  { title: 'Follow', text: 'Coded IR keeps the user centred; CarryBot follows at about 1.2 m.' },
  { title: 'Obstacle', text: 'Ultrasonic sensors and the camera spot a cone ahead.' },
  { title: 'Avoid', text: 'CarryBot slows down and steers safely around it.' },
  { title: 'Re-acquire', text: 'It finds the same token again and keeps following.' },
];

const PERSON_LANE = 470; // feet y (further back)
const ROBOT_LANE = 528; // wheels y (closer)
const CONE_X = 565;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

/** Everything about the scene at time t (0…LOOP). */
const sceneAt = (t) => {
  const phase = PHASES.findIndex((p, i) => t >= p && t < PHASES[i + 1]);
  const walking = t >= 2 && t < 12.5;
  const personX = t < 2 ? 470 : lerp(470, 865, prog(t, 2, 12.5));

  let robotX;
  let lane = 0; // extra y when swerving toward the viewer
  if (t < 2) robotX = 300;
  else if (t < 5.5) robotX = personX - 170;
  else if (t < 7) robotX = lerp(432, 468, ease(prog(t, 5.5, 6.4))); // brake before the cone
  else if (t < 9.5) {
    const k = prog(t, 7, 9.5);
    robotX = lerp(468, 650, ease(k));
    lane = Math.sin(Math.PI * k) * 46;
  } else if (t < 10.3) robotX = 650;
  else robotX = lerp(650, 695, ease(prog(t, 10.3, 12.5)));

  const locked = (t > 1 && t < 7) || t > 10.3;
  const alert = phase === 2;
  const fade = t < 0.4 ? t / 0.4 : t > LOOP - 0.8 ? (LOOP - t) / 0.8 : 1;

  let status;
  if (phase === 0) status = t < 1 ? { text: 'Scanning BLE…', tone: 'scan' } : { text: 'BLE ID  MATCH ✓', tone: 'ok' };
  else if (phase === 1) status = { text: 'Following · 1.2 m', tone: 'ok' };
  else if (phase === 2) status = { text: 'Obstacle · 0.4 m', tone: 'alert' };
  else if (phase === 3) status = { text: 'Avoiding  →', tone: 'warn' };
  else status = t < 10.3 ? { text: 'Searching user…', tone: 'scan' } : { text: 'Re-locked ✓', tone: 'ok' };

  // IR direction readout
  const dx = personX - robotX;
  const ir = phase === 3 ? (lane > 20 ? 'L' : 'C') : dx > 200 ? 'R' : 'C';

  return { phase: Math.min(phase, 4), walking, personX, robotX, lane, locked, alert, fade, status, ir };
};

const toneColor = { ok: '#16a34a', alert: '#dc2626', warn: '#d97706', scan: '#0284c7' };

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

/* ───────────── Characters ───────────── */

const Person = ({ x, t, walking }) => {
  const swing = walking ? Math.sin(t * 7.5) * 24 : 0;
  const bob = walking ? -Math.abs(Math.sin(t * 7.5)) * 3 : 0;
  return (
    <g transform={`translate(${x} ${PERSON_LANE + bob})`}>
      <ellipse cx="0" cy="2" rx="34" ry="6" fill="#000" opacity="0.12" />
      {/* back leg + arm */}
      <g transform={`rotate(${-swing} 0 -82)`}>
        <rect x="-7" y="-84" width="14" height="84" rx="7" fill="#33415e" />
        <ellipse cx="6" cy="-2" rx="13" ry="6" fill="#1f2937" />
      </g>
      <g transform={`rotate(${swing * 0.8} 0 -140)`}>
        <rect x="-6" y="-142" width="12" height="62" rx="6" fill="#2b3a52" />
      </g>
      {/* backpack with token */}
      <rect x="-40" y="-150" width="22" height="58" rx="8" fill="#1f2937" />
      <circle cx="-29" cy="-120" r="11" fill="#38bdf8" opacity="0.25">
        <animate attributeName="r" values="9;15;9" dur="1.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="-29" cy="-120" r="5" fill="#7dd3fc" />
      {/* torso */}
      <rect x="-24" y="-158" width="46" height="84" rx="16" fill="#3b4f6e" />
      {/* front leg + arm */}
      <g transform={`rotate(${swing} 0 -82)`}>
        <rect x="-7" y="-84" width="14" height="84" rx="7" fill="#3f5279" />
        <ellipse cx="6" cy="-2" rx="13" ry="6" fill="#111827" />
      </g>
      <g transform={`rotate(${-swing * 0.8} 0 -140)`}>
        <rect x="-6" y="-142" width="12" height="62" rx="6" fill="#4a6189" />
        <circle cx="0" cy="-80" r="6" fill="#e0ac7e" />
      </g>
      {/* head */}
      <circle cx="4" cy="-176" r="17" fill="#e0ac7e" />
      <path d="M -13 -178 Q -10 -198 8 -196 Q 22 -194 21 -180 Q 12 -188 -2 -186 Z" fill="#2a1d14" />
    </g>
  );
};

const Robot = ({ x, lane, t, alert, locked, scanning }) => {
  const s = 1 + lane / 600; // a bit bigger when closer
  const wheelDeg = (x / 18) * 57.3;
  const blink = t % 4 > 3.85;
  return (
    <g transform={`translate(${x} ${ROBOT_LANE + lane}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="78" ry="9" fill="#000" opacity="0.14" />

      {/* ultrasonic arcs in front */}
      {[26, 46, 66].map((r, i) => (
        <path
          key={r}
          d={`M ${70 + r * Math.cos(-0.45)} ${-46 + r * Math.sin(-0.45)} A ${r} ${r} 0 0 1 ${70 + r * Math.cos(0.45)} ${-46 + r * Math.sin(0.45)}`}
          fill="none"
          stroke={alert ? '#ef4444' : '#38bdf8'}
          strokeWidth="3"
          strokeLinecap="round"
          opacity={alert ? (Math.sin(t * 14 + i) > 0 ? 0.95 : 0.25) : 0.25 + 0.5 * ((Math.sin(t * 5 - i) + 1) / 2)}
        />
      ))}

      {/* scanning wedge while searching for the user */}
      {scanning && (
        <path d="M 58 -92 L 240 -170 L 240 -40 Z" fill="#38bdf8" opacity="0.18" transform={`rotate(${Math.sin(t * 3) * 14} 58 -92)`} />
      )}

      {/* wheels */}
      {[-44, 44].map((wx) => (
        <g key={wx} transform={`translate(${wx} -19)`}>
          <circle r="19" fill="#1f2937" />
          <circle r="9" fill="#94a3b8" />
          <g transform={`rotate(${wheelDeg})`}>
            <rect x="-1.5" y="-15" width="3" height="30" fill="#475569" />
            <rect x="-15" y="-1.5" width="30" height="3" fill="#475569" />
          </g>
        </g>
      ))}

      {/* luggage in the basket */}
      <rect x="-58" y="-146" width="34" height="66" rx="6" fill="#e8792f" />
      <rect x="-54" y="-152" width="26" height="8" rx="3" fill="#b45309" />
      <rect x="-20" y="-134" width="34" height="54" rx="6" fill="#3b6fb6" />
      <path d="M 16 -80 L 18 -112 L 40 -112 L 42 -80 Z" fill="#c8a06a" />
      <path d="M 22 -112 q 4 -16 10 -2 M 30 -112 q 8 -18 10 0" stroke="#4d7c0f" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* basket frame */}
      <rect x="-64" y="-104" width="112" height="26" rx="4" fill="none" stroke="#94a3b8" strokeWidth="3" />
      <path d="M -40 -104 V -78 M -16 -104 V -78 M 8 -104 V -78 M 32 -104 V -78" stroke="#94a3b8" strokeWidth="2" />

      {/* body */}
      <rect x="-70" y="-80" width="140" height="52" rx="14" fill="#eef2f7" stroke="#94a3b8" strokeWidth="2" />
      <rect x="-70" y="-44" width="140" height="6" fill="#38bdf8" opacity="0.8" />
      <text x="-40" y="-56" fontSize="13" fontWeight="700" fill="#334155" fontFamily="inherit">CarryBot</text>

      {/* face */}
      <rect x="30" y="-74" width="36" height="24" rx="7" fill="#0f172a" />
      {blink ? (
        <path d="M 38 -62 h 8 M 52 -62 h 8" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="42" cy="-62" r="4.5" fill="none" stroke="#22d3ee" strokeWidth="2.2" />
          <circle cx="56" cy="-62" r="4.5" fill="none" stroke="#22d3ee" strokeWidth="2.2" />
        </>
      )}

      {/* mast, camera and LiDAR */}
      <rect x="52" y="-128" width="5" height="50" fill="#64748b" />
      <circle cx="58" cy="-92" r="6" fill="#0f172a" stroke={locked ? '#22c55e' : '#38bdf8'} strokeWidth="2" />
      <ellipse cx="54" cy="-132" rx="18" ry="6" fill="#1e293b" />
      <ellipse cx="54" cy="-134" rx="18" ry="4" fill="none" stroke="#38bdf8" strokeWidth="2" />
      <circle cx={54 + 16 * Math.cos(t * 6)} cy={-134 + 3.5 * Math.sin(t * 6)} r="3" fill="#e0f2fe" />
    </g>
  );
};

const Cone = ({ alert, t }) => (
  <g transform={`translate(${CONE_X} ${ROBOT_LANE})`}>
    {alert && (
      <ellipse cx="0" cy="-2" rx={40 + (t * 60) % 40} ry={10 + ((t * 60) % 40) / 4} fill="none" stroke="#ef4444" strokeWidth="2.5" opacity={1 - ((t * 60) % 40) / 40} />
    )}
    <ellipse cx="0" cy="2" rx="30" ry="6" fill="#000" opacity="0.14" />
    <rect x="-28" y="-8" width="56" height="10" rx="3" fill="#c2410c" />
    <path d="M -20 -8 L -6 -78 L 6 -78 L 20 -8 Z" fill="#f97316" />
    <path d="M -14 -36 L 14 -36 L 11 -50 L -11 -50 Z" fill="#fff7ed" />
    <path d="M -18 -18 L 18 -18 L 16 -28 L -16 -28 Z" fill="#fff7ed" />
  </g>
);

/* ───────────── Scene ───────────── */

const HeroScene = () => {
  const reduce = useReducedMotion();
  const [t, setT] = useState(3.5);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (reduce) {
      setT(3.5);
      return undefined;
    }
    let raf;
    let visible = true;
    let last = performance.now();
    let clock = 0;
    const obs = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    if (wrapRef.current) obs.observe(wrapRef.current);
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible && document.visibilityState === 'visible') {
        clock = (clock + dt) % LOOP;
        setT(clock);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [reduce]);

  const sc = sceneAt(t);
  const tokenX = sc.personX - 29;
  const tokenY = PERSON_LANE - 120;
  const camX = sc.robotX + 58 * (1 + sc.lane / 600);
  const camY = ROBOT_LANE + sc.lane - 92 * (1 + sc.lane / 600);
  const step = STEPS[sc.phase];

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <svg viewBox="0 0 914 679" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" role="img"
        aria-label="Animation: CarryBot identifies its user, follows, detects a cone, steers around it and re-locks onto the user">
        {/* ── Mall background (theme colours) ── */}
        <rect width="914" height="679" className="fill-ink-800" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} transform={`translate(${60 + i * 190} 90)`}>
            <rect width="150" height="240" rx="10" className="fill-ink-900 stroke-indigo-200" strokeWidth="2" />
            <rect x="14" y="40" width="122" height="150" rx="6" className="fill-indigo-100" opacity="0.8" />
            <rect x="14" y="14" width="80" height="12" rx="4" className="fill-indigo-300" opacity="0.7" />
            <rect x="0" y="240" width="150" height="10" className="fill-ink-700" />
          </g>
        ))}
        {[160, 400, 640, 880].map((lx) => (
          <g key={lx}>
            <line x1={lx} y1="0" x2={lx} y2="40" className="stroke-indigo-200" strokeWidth="2" />
            <circle cx={lx} cy="46" r="9" className="fill-amber-400" opacity="0.8" />
          </g>
        ))}
        {/* floor */}
        <path d="M 0 360 L 914 360 L 914 679 L 0 679 Z" className="fill-ink-700" />
        {[-400, -250, -100, 50, 200, 350, 500, 650, 800, 950, 1100, 1250].map((fx) => (
          <line key={fx} x1={fx * 0.55 + 205} y1="360" x2={fx} y2="679" className="stroke-indigo-200" strokeWidth="1.5" opacity="0.7" />
        ))}
        {[400, 455, 525, 610].map((fy) => (
          <line key={fy} x1="0" y1={fy} x2="914" y2={fy} className="stroke-indigo-200" strokeWidth="1.5" opacity="0.6" />
        ))}
        {/* plants */}
        {[40, 870].map((px) => (
          <g key={px} transform={`translate(${px} 380)`}>
            <rect x="-16" y="-10" width="32" height="34" rx="6" className="fill-indigo-400" />
            <path d="M 0 -10 q -26 -40 -6 -70 M 0 -10 q 6 -50 24 -64 M 0 -10 q -4 -46 -30 -50" stroke="#4d7c0f" strokeWidth="7" fill="none" strokeLinecap="round" />
          </g>
        ))}

        <g opacity={sc.fade}>
          {/* path trail behind the robot */}
          <path d={`M 260 ${ROBOT_LANE} L ${sc.robotX - 60} ${ROBOT_LANE + sc.lane}`} stroke="#38bdf8" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" opacity="0.35" />

          <Person x={sc.personX} t={t} walking={sc.walking} />

          {/* BLE ping from the token */}
          {(sc.phase === 0 || (sc.phase === 4 && !sc.locked)) && (
            <circle cx={tokenX} cy={tokenY} r={10 + ((t * 40) % 50)} fill="none" stroke="#38bdf8" strokeWidth="2.5" opacity={1 - ((t * 40) % 50) / 50} />
          )}

          <Cone alert={sc.alert} t={t} />

          {/* signal: robot camera → user's token */}
          {sc.locked && (
            <line x1={camX} y1={camY} x2={tokenX} y2={tokenY} stroke={sc.alert ? '#f59e0b' : '#22c55e'} strokeWidth="2.5" strokeDasharray="6 8" strokeDashoffset={-t * 40} opacity="0.85" />
          )}

          <Robot x={sc.robotX} lane={sc.lane} t={t} alert={sc.alert} locked={sc.locked} scanning={sc.phase === 4 && !sc.locked} />

          {/* status chip above the robot */}
          <g transform={`translate(${sc.robotX - 80} ${ROBOT_LANE + sc.lane - 210})`}>
            <rect width="160" height="30" rx="15" fill="#0f172a" opacity="0.88" />
            <circle cx="16" cy="15" r="5" fill={toneColor[sc.status.tone]} />
            <text x="28" y="20" fontSize="13" fontWeight="700" fill="#f8fafc" fontFamily="ui-monospace, monospace">{sc.status.text}</text>
          </g>
          {/* IR L/C/R readout */}
          <g transform={`translate(${sc.robotX - 48} ${ROBOT_LANE + sc.lane - 172})`}>
            {['L', 'C', 'R'].map((d, i) => (
              <g key={d} transform={`translate(${i * 33} 0)`}>
                <rect width="30" height="18" rx="5" fill={d === sc.ir && sc.locked ? '#0ea5e9' : '#0f172a'} opacity={d === sc.ir && sc.locked ? 0.95 : 0.55} />
                <text x="15" y="13" textAnchor="middle" fontSize="10" fontWeight="700" fill="#f8fafc" fontFamily="ui-monospace, monospace">{d}</text>
              </g>
            ))}
          </g>
        </g>
      </svg>

      {/* ── Story caption (top-right, stays out of the faded edges) ── */}
      <div className="absolute right-[3%] top-[4%] w-[min(360px,46%)] rounded-xl border border-indigo-200 bg-ink-900/95 p-2 shadow-lg sm:w-[min(360px,62%)] sm:rounded-2xl sm:p-4">
        <div className="mb-2 flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <span key={s.title} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= sc.phase ? 'bg-flame-500' : 'bg-indigo-100'}`} />
          ))}
        </div>
        <p className="font-mono text-[9px] font-semibold uppercase tracking-widest text-cyan-300 sm:text-[11px]">
          Step {sc.phase + 1} / 5 · {step.title}
        </p>
        <p className="mt-1 hidden text-xs leading-snug text-slate-200 sm:block sm:text-sm">{step.text}</p>
      </div>
    </div>
  );
};

export default HeroScene;