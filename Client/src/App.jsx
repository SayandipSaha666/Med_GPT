import { useState } from 'react'
import './App.css'
import { useRoutes, Routes, Route, useLocation } from 'react-router-dom'
// import Login from './pages/Login.jsx'
import Loading from './pages/Loading.jsx'
import Sidebar from './components/Sidebar.jsx'
import Chatbox from './components/Chatbox.jsx'
import Credits from './pages/Credits.jsx'
import Community from './pages/Community.jsx'
import AuthPage from './pages/AuthPage.jsx'
import HomePage from './pages/HomePage.jsx'
import {assets} from './assets/assets.js'
import './assets/prism.css'
function App() {
  const {pathname} = useLocation()
  const [isMenuOpen,setIsMenuOpen] = useState(false)
  if(pathname === '/loading') return <Loading/>
  function CustomRoutes(){
    const routes = useRoutes([
      {
        path: '/',
        element: <HomePage/>
      },
      {
        path: '/chat',
        element: <Chatbox/>
      },
      {
        path: '/auth',
        element: <AuthPage/>
      },
      {
        path: '/credits',
        element: <Credits/>
      },
      {
        path: '/community',
        element: <Community/>
      }
    ])
    return routes
  }
  return (
    <>
      {!isMenuOpen && <img src={assets.menu_icon} className='absolute top-3 left-3 w-8 h-8 cursor-pointer md:hidden not-dark: invert' onClick={()=>setIsMenuOpen(true)}/>}
      <div  className='bg-linear-to-b from-[#F8F6FA] to-[#EDE8F2] text-[#2D2535] dark:from-[#242124] dark:to-[#000000] dark:text-white transition-colors duration-500'>
        <div className='flex h-screen w-screen'>
          <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen}/>
          <CustomRoutes/>
        </div>
      </div>
    </>
  )
}

export default App
