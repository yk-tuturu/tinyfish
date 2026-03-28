export default function AnimatedFood({ type = "bowl", className = "" }) {
  const foodItems = {
    bowl: (
      <svg viewBox="0 0 100 100" className={`animated-food ${className}`}>
        {/* Bowl */}
        <path
          d="M 20 40 Q 20 60 50 70 Q 80 60 80 40"
          fill="none"
          stroke="#ff9f43"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 25 42 Q 25 55 50 62 Q 75 55 75 42"
          fill="#ffe0b2"
          opacity="0.6"
        />

        {/* Noodles */}
        <path
          d="M 40 50 Q 45 48 50 50 T 60 50"
          stroke="#f4a460"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 35 55 Q 40 53 45 55 T 60 55"
          stroke="#f4a460"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Steam */}
        <path
          d="M 35 35 Q 35 30 38 30"
          stroke="#cbd5e0"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
          style={{ animation: "drift 2s ease-in-out infinite" }}
        />
        <path
          d="M 50 32 Q 50 27 53 27"
          stroke="#cbd5e0"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
          style={{ animation: "drift 2s ease-in-out 0.3s infinite" }}
        />
        <path
          d="M 65 35 Q 65 30 68 30"
          stroke="#cbd5e0"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
          style={{ animation: "drift 2s ease-in-out 0.6s infinite" }}
        />
      </svg>
    ),

    dumpling: (
      <svg viewBox="0 0 100 100" className={`animated-food ${className}`}>
        {/* Dumpling wrapper */}
        <ellipse cx="50" cy="45" rx="28" ry="32" fill="#f4e4c1" stroke="#d4a76a" strokeWidth="2" />

        {/* Dumpling pleats */}
        <path
          d="M 50 15 Q 55 25 58 40"
          stroke="#d4a76a"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M 50 15 Q 45 25 42 40"
          stroke="#d4a76a"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M 55 18 Q 62 28 65 40"
          stroke="#d4a76a"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M 45 18 Q 38 28 35 40"
          stroke="#d4a76a"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Filling peek */}
        <ellipse cx="50" cy="55" rx="15" ry="12" fill="#cd7f32" opacity="0.6" />

        {/* Shine */}
        <ellipse cx="45" cy="35" rx="8" ry="6" fill="#fff" opacity="0.4" />
      </svg>
    ),

    rice: (
      <svg viewBox="0 0 100 100" className={`animated-food ${className}`}>
        {/* Bowl */}
        <ellipse cx="50" cy="50" rx="30" ry="28" fill="#f4a76a" stroke="#d4a76a" strokeWidth="2" />

        {/* Rice grains */}
        <ellipse cx="35" cy="45" rx="3" ry="8" fill="#f5deb3" />
        <ellipse cx="40" cy="50" rx="3" ry="8" fill="#f5deb3" />
        <ellipse cx="50" cy="42" rx="3" ry="8" fill="#f5deb3" />
        <ellipse cx="60" cy="48" rx="3" ry="8" fill="#f5deb3" />
        <ellipse cx="65" cy="52" rx="3" ry="8" fill="#f5deb3" />
        <ellipse cx="55" cy="58" rx="3" ry="8" fill="#f5deb3" />
        <ellipse cx="45" cy="60" rx="3" ry="8" fill="#f5deb3" />

        <style>{`
          .rice-grain {
            animation: bounce 0.8s ease-in-out infinite;
          }
        `}</style>
      </svg>
    ),
  };

  return foodItems[type] || foodItems.bowl;
}
