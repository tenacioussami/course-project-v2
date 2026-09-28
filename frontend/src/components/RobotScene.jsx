/*
 * Animated top-down schematic of CarryBot following its user.
 * Pure SVG + SMIL animation — no images, no extra libraries.
 */
const RobotScene = ({ className = '' }) => (
  <svg viewBox="0 0 480 400" className={className} role="img" aria-label="CarryBot following a user carrying a smart token while sensing obstacles">
    <defs>
      <linearGradient id="rs-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#1c2640" />
        <stop offset="1" stopColor="#0d1322" />
      </linearGradient>
      <linearGradient id="rs-accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#22d3ee" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
      <radialGradient id="rs-cone" cx="0.5" cy="1" r="1">
        <stop offset="0" stopColor="#22d3ee" stopOpacity=".35" />
        <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="rs-cone-hit" cx="0.5" cy="1" r="1">
        <stop offset="0" stopColor="#fb7185" stopOpacity=".45" />
        <stop offset="1" stopColor="#fb7185" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="rs-glow" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#a3ff5c" stopOpacity=".9" />
        <stop offset="1" stopColor="#a3ff5c" stopOpacity="0" />
      </radialGradient>
      <pattern id="rs-grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M24 0H0V24" fill="none" stroke="rgba(148,163,184,.08)" />
      </pattern>
    </defs>

    <rect width="480" height="400" fill="url(#rs-grid)" />

    {/* Obstacle (front-left) */}
    <g>
      <rect x="92" y="150" width="54" height="40" rx="6" fill="#141c30" stroke="#fb7185" strokeOpacity=".6" strokeDasharray="4 4" />
      <text x="119" y="174" textAnchor="middle" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="9" fill="#fda4af">OBSTACLE</text>
    </g>

    {/* Follow path */}
    <path d="M240 262 C 240 200, 250 150, 262 104" fill="none" stroke="url(#rs-accent)" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round">
      <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
    </path>

    {/* Robot group (gentle drift) */}
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 0; 4 -6; 0 0" dur="5s" repeatCount="indefinite" />

      {/* Ultrasonic cones: left (hit), center, right */}
      <path d="M196 262 L150 170 A 100 100 0 0 1 206 160 Z" fill="url(#rs-cone-hit)">
        <animate attributeName="opacity" values=".6;1;.6" dur="1.6s" repeatCount="indefinite" />
      </path>
      <path d="M240 258 L210 150 A 110 110 0 0 1 270 150 Z" fill="url(#rs-cone)" />
      <path d="M284 262 L274 160 A 100 100 0 0 1 330 170 Z" fill="url(#rs-cone)" />

      {/* Wheels */}
      <rect x="170" y="276" width="14" height="40" rx="5" fill="#05070d" stroke="#334155" />
      <rect x="296" y="276" width="14" height="40" rx="5" fill="#05070d" stroke="#334155" />

      {/* Body + basket */}
      <rect x="182" y="258" width="116" height="92" rx="18" fill="url(#rs-body)" stroke="url(#rs-accent)" strokeWidth="1.5" />
      <rect x="198" y="282" width="84" height="54" rx="8" fill="none" stroke="rgba(148,163,184,.25)" />
      <path d="M212 282V336M226 282V336M240 282V336M254 282V336M268 282V336M198 300H282M198 318H282" stroke="rgba(148,163,184,.12)" />

      {/* Front sensor bar: US-L, camera, US-R + IR receivers */}
      <rect x="190" y="252" width="100" height="12" rx="6" fill="#0d1322" stroke="rgba(255,255,255,.12)" />
      <circle cx="200" cy="258" r="3.5" fill="#fb7185" />
      <circle cx="280" cy="258" r="3.5" fill="#22d3ee" />
      <circle cx="240" cy="258" r="5" fill="#05070d" stroke="#22d3ee" strokeWidth="1.5" />
      <circle cx="240" cy="258" r="1.8" fill="#22d3ee">
        <animate attributeName="opacity" values="1;.3;1" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="222" cy="258" r="2" fill="#a3ff5c" />
      <circle cx="258" cy="258" r="2" fill="#a3ff5c" />
    </g>

    {/* User with smart token */}
    <g transform="translate(266 86)">
      <circle r="44" fill="none" stroke="#a3ff5c" strokeOpacity=".5">
        <animate attributeName="r" values="10;52" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values=".7;0" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <circle r="44" fill="none" stroke="#a3ff5c" strokeOpacity=".5">
        <animate attributeName="r" values="10;52" dur="2.2s" begin="1.1s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values=".7;0" dur="2.2s" begin="1.1s" repeatCount="indefinite" />
      </circle>
      {/* shoulders + head (top-down) */}
      <ellipse rx="26" ry="14" fill="#1c2640" stroke="rgba(255,255,255,.15)" />
      <circle r="11" fill="#334155" stroke="rgba(255,255,255,.2)" />
      {/* token */}
      <circle cx="22" cy="10" r="12" fill="url(#rs-glow)" />
      <rect x="17" y="5" width="10" height="10" rx="3" fill="#a3ff5c" />
    </g>

    {/* HUD labels */}
    <g fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="10">
      <g transform="translate(310 60)">
        <rect width="118" height="44" rx="8" fill="rgba(13,19,34,.9)" stroke="rgba(163,255,92,.35)" />
        <text x="10" y="18" fill="#a3ff5c">● BLE ID  MATCH</text>
        <text x="10" y="34" fill="#94a3b8">IR  → CENTER</text>
      </g>
      <g transform="translate(20 232)">
        <rect width="112" height="44" rx="8" fill="rgba(13,19,34,.9)" stroke="rgba(251,113,133,.35)" />
        <text x="10" y="18" fill="#fda4af">US-L  0.42 m</text>
        <text x="10" y="34" fill="#94a3b8">→ steer right</text>
      </g>
      <g transform="translate(330 300)">
        <rect width="124" height="44" rx="8" fill="rgba(13,19,34,.9)" stroke="rgba(34,211,238,.35)" />
        <text x="10" y="18" fill="#67e8f9">FOLLOW  1.2 m</text>
        <text x="10" y="34" fill="#94a3b8">L 62%   R 71%</text>
      </g>
    </g>
  </svg>
);

export default RobotScene;
