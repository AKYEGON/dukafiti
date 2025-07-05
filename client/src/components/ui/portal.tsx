import React from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: React.ReactNode
  container?: Element | null
}

export function Portal({ children, container }: PortalProps) {
  const portalRoot = container || document.getElementById('portal-root')
  
  if (!portalRoot) {
    console.warn('Portal root not found. Rendering in document body.')
    return createPortal(children, document.body)
  }
  
  return createPortal(children, portalRoot)
}