interface SidebarToggleIconProps {
  className?: string;
  size?: number;
}

export function SidebarToggleIcon({ className = "", size = 20 }: SidebarToggleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer rectangle */}
      <rect x="3" y="6" width="18" height="12" rx="2" ry="2" />
      {/* Inner rectangle/square */}
      <rect x="6" y="9" width="6" height="6" rx="1" ry="1" />
    </svg>
  );
}