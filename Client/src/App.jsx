import { useContext, useState } from 'react'
import './App.css'
import { useRoutes, Routes, Route, useLocation } from 'react-router-dom'
// import Login from './pages/Login.jsx'
import Loading from './pages/Loading.jsx'
import Sidebar from './components/Sidebar.jsx'
import Chatbox from './components/Chatbox.jsx'
import Credits from './pages/Credits.jsx'
import AuthPage from './pages/AuthPage.jsx'
import HomePage from './pages/HomePage.jsx'
import {assets} from './assets/assets.js'
import Layout from './pages/Layout.jsx'
import ChatDetails from './components/ChatDetails.jsx'
import Profile from './components/Profile.jsx'
import { GlobalContext } from './context/context.jsx'
import {Toaster} from 'react-hot-toast';
import { Analytics } from "@vercel/analytics/react"
import './assets/prism.css'
function App() {
  const {pathname} = useLocation()
  const [isMenuOpen,setIsMenuOpen] = useState(false)
  const {loading, user} = useContext(GlobalContext)
  if(pathname === '/loading' || loading) return <Loading/>
  function CustomRoutes(){
    const routes = useRoutes([
      {
        path: '/',
        element: <HomePage/>
      },
      {
        path: '/auth',
        element: <AuthPage/>
      },
      {
        path: '/main',
        element: <Layout/>,
        children: [
          {
            path: 'chat',
            children: [
              {
                index: true,
                element: <Chatbox/>
              },
              {
                path: ':id',
                element: <ChatDetails/>
              }
            ]
          },
          {
            path: 'credits',
            element: <Credits/>
          },
          {
            path: 'profile',
            element: <Profile/>
          }
        ]
      }
    ])
    return routes
  }
  return (
    <>
      <Analytics/>
      <Toaster/>
      {!isMenuOpen && <img src={assets.menu_icon} className='absolute top-3 left-3 w-8 h-8 cursor-pointer md:hidden not-dark: invert z-50' onClick={()=>setIsMenuOpen(true)}/>}
      <div  className='bg-linear-to-b from-[#F8F6FA] to-[#EDE8F2] text-[#2D2535] dark:from-[#242124] dark:to-[#000000] dark:text-white transition-colors duration-500'>
        <div className='flex h-screen w-screen'>
          {pathname !== '/' && pathname !== '/auth' && <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen}/>}
          <CustomRoutes/>
        </div>
      </div>
    </>
  )
}

export default App
