export default function FloatingIcons() {
  const icons = ["🍜", "🍱", "🍛", "🥘", "🍲", "🥟", "🍝"];

  return (
    <div className="floating-icons">
      {icons.map((icon, idx) => (
        <div
          key={idx}
          className="floating-icon"
          style={{
            animation: `float ${3 + idx * 0.5}s ease-in-out infinite`,
            animationDelay: `${idx * 0.3}s`,
            left: `${10 + idx * 12}%`,
            top: `${Math.random() * 20}%`,
          }}
        >
          {icon}
        </div>
      ))}
    </div>
  );
}
