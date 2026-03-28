const loadingStages = [
  { icon: "�‍🍳", text: "Uncle is thinking lah..." },
  { icon: "🕷️", text: "Uncle's web crawlers searching..." },
  { icon: "🧠", text: "Uncle's AI brain ranking..." },
];

export default function LoadingStates() {
  return (
    <div className="loading-container">
      <div className="loading-card">
        <div className="loading-animation">
          <div className="loading-spinner"></div>
        </div>
        <div className="loading-text">
          {loadingStages.map((stage, idx) => (
            <div
              key={idx}
              className={`loading-stage ${
                idx === 0 ? "active" : ""
              }`}
              style={{
                animation: `slideIn 0.6s ease-out ${idx * 3}s both`,
              }}
            >
              <span className="stage-icon">{stage.icon}</span>
              <span className="stage-text">{stage.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
