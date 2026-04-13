import React, {useState, useContext} from 'react'
import { GlobalContext } from '../context/context.jsx'
import {assets} from '../assets/assets.js'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'

function Sidebar(props) {
  const {isMenuOpen, setIsMenuOpen} = props
  const {theme,setTheme, chats, setSelectedChat, selectedChat, user,setUser} = useContext(GlobalContext)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  // console.log(user)
  const processedChats = (() => {
    let result = chats;
    if (search.trim() === "") {
      result = [...result].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
    }

    return result.filter((chat) => {
      if (chat.messages[0]) {
        return chat.messages[0].content
          .toLowerCase()
          .includes(search.toLowerCase());
      } else {
        return chat.name
          .toLowerCase()
          .includes(search.toLowerCase());border-gray-300
      }
    });
  })();
  return (
    <div className={`px-3 py-3 flex flex-col h-screen min-w-72 p- bg-linear-to-b from-[#F3EEF8] to-[#E8E0F0] text-[#2D2535] border-r-2 border-[#D4C5E2] dark:from-[#242124]/30 dark:to-[#000000]/30 dark:text-white dark:border-[#80609F]/30 backdrop-blur-3xl transition-all duration-500 max-md:absolute left-0 z-1 ${!isMenuOpen && 'max-md:-translate-x-full'}`}>
      <img src={theme === 'light' ? assets.logo_full_dark : assets.logo_full} alt="" className='w-full max-w-48'/>
      <button className='flex justify-center items-center w-full py-2 mt-10 text-black dark:text-white bg-linear-to-r from=[#A456F7] to-[#3D81F6] text-sm rounded-md cursor-pointer'>
        <span className='mr-2 text-xl'>+</span> New Chat
      </button>
      {/* Search Conversations */}
      <div className='flex items-center gap-2 p-3 mt-4 border border-black-800 dark: border-white/20 rounded-md'>
        <img src={assets.search_icon} className='w-4 not-dark:invert' alt="" />
        <input type="text" placeholder='search conversations here' value={search} onChange={(e)=>setSearch(e.target.value)} className='text-xs placeholder: text-black dark:text-gray-400 outline-none'/>
      </div>
      {/* Chat History */}
      <div className='flex-1 mt-4'>
        {
          Array.isArray(chats) && chats.length > 0 ? 
          <div>
            <p className='text-sm mt-4'>Recent Chats</p>
            <div className='flex-1 overflow-y-scroll mt-3 text-sm space-y-3'>
              {
                // chats.filter((chat,index)=>{
                //   if(chat.messages[0]){
                //     return chat.messages[0].content.toLowerCase().includes(search.toLowerCase())
                //   }else{
                //     return chat.name.toLowerCase().includes(search.toLowerCase())
                //   }
                // })
                processedChats.map((chat,index)=>{
                  let displayText
                  if(chat.messages.length > 0){
                    displayText = chat.messages[0].content.slice(0,32);
                  }else{
                    displayText = chat.name;
                  }
                  return (
                    <div key={chat._id} onClick={()=>{navigate('/');setSelectedChat(chat);setIsMenuOpen(false)}} className='p-2 px-4 dark:bg-[#57317C]/10 border border-black-800 dark:border-[#80609F]/15 rounded-md cursor-pointer flex justify-between group'>
                      <div>
                        <p className='truncate w-full'>
                          {displayText}
                        </p>
                        <p className='text-xs text-gray-500 dark: text-[#B1A6C0]'>
                          {moment(chat.updatedAt).fromNow()}
                        </p>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </div>
          : 
            <p className='text-sm mt-4'>No Recent Chats</p>
        }
      </div>
      {/* Community Page */}
      <div onClick={()=>{navigate('/community');setIsMenuOpen(false)}} className='flex items-center gap-2 p-3 mt-4 border border-black-800 dark:border-white/15 rounded-md cursor-pointer hover:scale-103 transition-all'>
        <img src={assets.gallery_icon} className='w-4.5 not-dark:invert' alt="" />
        <div className='flex flex-col text-sm'>
          <p>Community Posts</p>
        </div>
      </div>
      {/* Credit purchase */}
      <div onClick={()=>{navigate('/credits');setIsMenuOpen(false)}} className='flex items-center gap-2 p-3 mt-4 border border-black-800 dark:border-white/15 rounded-md cursor-pointer hover:scale-103 transition-all'>
        <img src={assets.credit_icon} className='w-4.5 not-dark:invert' />
        <div className='flex flex-col text-sm'>
          <p>Credits : {user?.credits || 0}</p>
          <p className='text-xs text-gray-400'>Purchase credits to use Research_GPT</p>
        </div>
      </div>
      {/* Toggle Theme Mode */}
      <div className='flex items-center gap-2 p-3 mt-4 border border-black-800 dark:border-white/15 rounded-md'>
        <div className='flex items-center gap-2 text-sm'>
          <img src={assets.theme_icon} className='w-4 not-dark:invert' alt="" />
          <p className='text-sm'>{theme === 'light' ? 'Dark' : 'Light'} Mode</p>
        </div>
        <label className='relative inline-flex cursor-pointer'>
          <input type="checkbox" onChange={()=>setTheme(theme === 'light' ? 'dark' : 'light')} className='sr-only peer' checked={theme === 'dark'}/>
          <div className='w-9 h-5 bg-gray-400 rounded-full peer peer-checked:bg-purple-600 transition-all'></div>
          <span className='absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4'></span>
        </label>
      </div>
      {/* User Icon */}
      <div onClick={()=>navigate(user ? '/profile' : '/auth')} className='flex items-center gap-2 p-3 mt-4 border border-black-800 dark:border-white/15 rounded-md cursor-pointer group'>
        <img src={assets.user_icon} className='w-7 rounded-full' alt="" />
        <p className='flex-1 text-sm dark:text-primary truncate'>
          {user ? user.name : 'Login to continue'}
        </p>
        {user && <img src={assets.logout_icon} className='h-5 cursor-pointer hidden not-dark: invert group-hover: block' onClick={(e)=>{e.stopPropagation();setUser(null);}}/>}
      </div>
      {/* Sidebar Closing option */}
      <img src={assets.close_icon} className='absolute top-3 right-3 w-5 h-5 cursor-pointer md:hidden not-dark:invert' onClick={()=>setIsMenuOpen(false)} />
    </div>
  )
}

export default Sidebar 