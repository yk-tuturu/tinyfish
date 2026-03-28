export default function UncleBot({ size = "md", animated = false }) {
  const sizes = {
    sm: { width: "60px", height: "60px" },
    md: { width: "120px", height: "120px" },
    lg: { width: "180px", height: "180px" },
  };

  return (
    <svg
      viewBox="0 0 200 240"
      style={{
        ...sizes[size],
        ...(animated && { animation: "float 3s ease-in-out infinite" }),
      }}
    >
      {/* Body */}
      <ellipse cx="100" cy="140" rx="45" ry="55" fill="#ff9f43" />

      {/* Arms */}
      <ellipse cx="60" cy="120" rx="20" ry="40" fill="#ffb366" />
      <ellipse cx="140" cy="120" rx="20" ry="40" fill="#ffb366" />

      {/* Hands */}
      <circle cx="55" cy="165" r="18" fill="#f4a460" />
      <circle cx="145" cy="165" r="18" fill="#f4a460" />

      {/* Neck */}
      <rect x="90" y="95" width="20" height="25" fill="#f4a460" />

      {/* Head */}
      <circle cx="100" cy="70" r="40" fill="#ffb366" />

      {/* Ears */}
      <circle cx="65" cy="45" r="15" fill="#ffb366" />
      <circle cx="135" cy="45" r="15" fill="#ffb366" />
      <circle cx="65" cy="45" r="8" fill="#ff9f43" />
      <circle cx="135" cy="45" r="8" fill="#ff9f43" />

      {/* Hair/Head top */}
      <path
        d="M 70 35 Q 100 15 130 35"
        stroke="#cc7a2a"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Eyes */}
      <circle cx="85" cy="65" r="8" fill="#000" />
      <circle cx="115" cy="65" r="8" fill="#000" />
      <circle cx="86" cy="63" r="3" fill="#fff" />
      <circle cx="116" cy="63" r="3" fill="#fff" />

      {/* Eyebrows */}
      <path
        d="M 78 50 Q 85 45 92 50"
        stroke="#cc7a2a"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 108 50 Q 115 45 122 50"
        stroke="#cc7a2a"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Nose */}
      <path
        d="M 100 60 L 100 80"
        stroke="#cc7a2a"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Mouth - happy smile */}
      <path
        d="M 90 90 Q 100 100 110 90"
        stroke="#cc7a2a"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Mustache */}
      <path
        d="M 100 85 Q 85 82 75 85"
        stroke="#cc7a2a"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 100 85 Q 115 82 125 85"
        stroke="#cc7a2a"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Chest pocket */}
      <rect x="85" y="130" width="30" height="35" fill="#ff7f1f" rx="4" />

      {/* Thumbs up gesture - animated */}
      <g style={{ animation: "thumbsUp 1.5s ease-in-out infinite" }}>
        <rect x="120" y="150" width="15" height="45" fill="#f4a460" rx="7" />
        <circle cx="127.5" cy="145" r="12" fill="#f4a460" />
      </g>
    </svg>
  );
}
