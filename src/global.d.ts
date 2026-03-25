/// <reference types="vite-plugin-svgr/client" />

// Para imports sin query: import { ReactComponent as Icon } from './icon.svg'
declare module '*.svg' {
  import * as React from 'react'
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
  const src: string
  export default src
}

// Para imports con query ?component: import Icon from './icon.svg?component'
declare module '*.svg?component' {
  import * as React from 'react'
  const Component: React.FC<React.SVGProps<SVGSVGElement>>
  export default Component
}

// (Opcional) Si usaras ?url para obtener solo la URL:
declare module '*.svg?url' {
  const src: string
  export default src
}
