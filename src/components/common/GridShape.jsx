import React from 'react'
import { GridIcon } from '@/components/icons'

export default function GridShape() {
  return (
    <>
      <div className="absolute right-0 top-0 -z-10 w-full max-w-[250px] xl:max-w-[450px]">
        <GridIcon className="place-content-center w-12 h-auto" />
      </div>
      <div className="absolute bottom-0 left-0 -z-10 w-full max-w-[250px] rotate-180 xl:max-w-[450px]">
        <img src="/images/shape/grid.svg" alt="grid" />
      </div>
    </>
  )
}
