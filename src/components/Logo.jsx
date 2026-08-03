export function Logo({ size = 36, withWordmark = true, className = "" }) {
  return (
    <div className={`logo ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-mark"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="38" height="38" rx="10" fill="var(--logo-bg)" stroke="var(--logo-border)" />
        <path
          d="M4 21 L10 21 L13 15 L16 27 L19 9 L22 31 L25 17 L28 23 L31 19 L36 21"
          stroke="var(--logo-accent)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="19" cy="9" r="2.2" fill="var(--logo-accent)" />
      </svg>
      {withWordmark && (
        <span className="logo-wordmark">
          Terre<span className="logo-wordmark-accent">Mentor</span>
        </span>
      )}
    </div>
  );
}
