// src/components/common/ScrollToTop.tsx
import React, { useEffect, type FC } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Reinicia la posición de scroll al tope
 * cada vez que cambia la ruta.
 */
const ScrollToTop: FC = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
  }, [pathname])

  return null
}

export default ScrollToTop
