export function InterswitchLogo({ className = "h-8" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 160 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M8 6L16 16L8 26" 
        stroke="#0D9488" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M16 6L24 16L16 26" 
        stroke="#EF4444" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <text 
        x="32" 
        y="21" 
        className="fill-foreground"
        style={{ 
          fontFamily: 'Inter, sans-serif', 
          fontSize: '16px', 
          fontWeight: 600 
        }}
      >
        Interswitch
      </text>
    </svg>
  );
}
