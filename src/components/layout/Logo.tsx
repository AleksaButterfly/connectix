import React from 'react'

interface ConnectixLogoProps {
  iconOnly?: boolean
  className?: string
  iconSize?: 'sm' | 'md' | 'lg'
}

const ConnectixLogo: React.FC<ConnectixLogoProps> = ({
  iconOnly = false,
  className = '',
  iconSize = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  const logoIcon = (
    <div
      className={`flex ${sizeClasses[iconSize]} items-center justify-center rounded-md bg-terminal-green`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        className="h-5 w-5"
        fill="#0a0a0a"
      >
        <g>
          <path d="M153.6 512h204.799L460.8 409.6l-408.978.623z" opacity="1" />
          <path d="M358.399 0H179.4v102.4h281.4z" opacity="1" />
          <path d="M153.6 0 51.2 102.4v282.022h102.4z" opacity="1" />
        </g>
      </svg>
    </div>
  )

  if (iconOnly) {
    return logoIcon
  }

  return (
    <div className={`group flex items-center gap-2 ${className}`}>
      {logoIcon}
      <span className="text-lg font-semibold text-foreground">Connectix</span>
      <span className="animate-terminal-blink text-terminal-green opacity-0 group-hover:opacity-100">
        _
      </span>
    </div>
  )
}

export default ConnectixLogo
