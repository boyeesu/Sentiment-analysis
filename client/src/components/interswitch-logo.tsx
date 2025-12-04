export function InterswitchLogo({ className = "h-8" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 200 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Interswitch text */}
      <text 
        x="0" 
        y="26" 
        style={{ 
          fontFamily: 'Inter, sans-serif', 
          fontSize: '20px', 
          fontWeight: 700,
          fill: '#1A5276'
        }}
      >
        Interswitch
      </text>
      
      {/* Red accent figure - stylized "i" person icon */}
      <circle cx="168" cy="8" r="5" fill="#C0392B"/>
      <path 
        d="M160 35 C165 20, 175 15, 180 30" 
        stroke="#C0392B" 
        strokeWidth="6" 
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
