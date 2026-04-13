import React from 'react'
import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className='flex flex-1 h-full'>
        <Outlet/>
    </div>
  )
}

export default Layout