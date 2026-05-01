import React, { useState, useContext } from 'react'
import { GlobalContext } from '../context/context.jsx'
import { assets } from '../assets/assets.js'
import moment from 'moment'
import { useNavigate, useLocation } from 'react-router-dom'
import { callLogoutUserApi, createChatApi, deleteChatApi, updateChatTitleApi } from '../services/api_services.js'

function Sidebar(props) {
  const { isMenuOpen, setIsMenuOpen } = props
  const { theme, setTheme, chats, setChats, user, setUser } = useContext(GlobalContext)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const handleDelete = async (e, chatId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        const response = await deleteChatApi(chatId);
        if (response.success) {
          setChats(prev => prev.filter(c => c.id !== chatId));
          if (location.pathname === `/main/chat/${chatId}`) {
            navigate('/main/chat');
          }
        }
      } catch (error) {
        console.error("Failed to delete chat:", error);
      }
    }
  }

  const handleEdit = async (e, chat, defaultTitle) => {
    e.stopPropagation();
    const newTitle = window.prompt("Enter new title for chat:", defaultTitle);
    if (newTitle && newTitle.trim() !== "" && newTitle !== defaultTitle) {
      try {
        const response = await updateChatTitleApi(chat.id, newTitle.trim());
        if (response.success) {
          setChats(prev => prev.map(c => c.id === chat.id ? { ...c, title: newTitle.trim() } : c));
        }
      } catch (error) {
        console.error("Failed to update chat title:", error);
      }
    }
  }

  // console.log(user)
  const processedChats = (() => {
    console.log('Processing chats:', chats);
    console.log('Chats type:', typeof chats);
    console.log('Is chats an array?', Array.isArray(chats));

    // Make sure chats is an array before processing
    let result = Array.isArray(chats) ? chats : [];
    console.log('Result after array check:', result);

    if (search.trim() === "") {
      try {
        result = [...result].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        console.log('Sorted result:', result);
      } catch (error) {
        console.error('Error sorting chats:', error);
        result = [];
      }
    }

    try {
      const filtered = result.filter((chat) => {
        console.log('Processing chat:', chat);
        if (chat.messages && chat.messages[0]) {
          return chat.messages[0].content
            .toLowerCase()
            .includes(search.toLowerCase());
        } else if (chat.title) {
          return chat.title
            .toLowerCase()
            .includes(search.toLowerCase());
        }
        return false;
      });
      console.log('Filtered chats:', filtered);
      return filtered;
    } catch (error) {
      console.error('Error filtering chats:', error);
      return [];
    }
  })();

  const handleNewChat = async () => {
    const response = await createChatApi();
    if (response.success) {
      setChats((prevChats) => [response.data, ...prevChats]);
      // setSelectedChat(response.data);
      navigate(`/main/chat/${response.data.id}`);
      setIsMenuOpen(false)
    }
  }

  const handleLogout = async () => {
    try {
      await callLogoutUserApi();
      setUser(null);
      // setSelectedChat(null);
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  return (
    <div className={`px-3 py-3 flex flex-col h-screen min-w-72 p- bg-linear-to-b from-[#F3EEF8] to-[#E8E0F0] text-[#2D2535] border-r-2 border-[#D4C5E2] dark:from-[#242124]/30 dark:to-[#000000]/30 dark:text-white dark:border-[#80609F]/30 backdrop-blur-3xl transition-all duration-500 max-md:absolute left-0 z-1 ${!isMenuOpen && 'max-md:-translate-x-full'}`}>
      <div className='flex items-center justify-start gap-3 mb-6 mt-2 pl-1'>
        <img src={theme === 'light' ? assets.logo_full_dark : assets.logo_full} alt="MedGPT Logo" className='w-auto h-12 object-contain drop-shadow-md' />
        <span className='text-3xl font-bold text-black dark:text-white tracking-wide'>MedGPT</span>
      </div>
      <button onClick={handleNewChat} className='flex justify-center items-center w-full py-2.5 text-black dark:text-white bg-linear-to-r from-[#A456F7] to-[#3D81F6] hover:from-[#933df5] hover:to-[#2b71ec] transition-all text-sm rounded-md cursor-pointer font-medium shadow-md'>
        <span className='mr-2 text-xl'>+</span> New Chat
      </button>
      {/* Search Conversations */}
      <div className='flex items-center gap-2 p-3 mt-4 border border-black-800 dark:border-white/20 rounded-md shrink-0'>
        <img src={assets.search_icon} className='w-4 not-dark:invert' alt="" />
        <input type="text" placeholder='search conversations here' value={search} onChange={(e) => setSearch(e.target.value)} className='flex-1 bg-transparent text-xs text-black dark:text-white placeholder:text-gray-500 outline-none' />
      </div>
      {/* Chat History */}
      <div className='flex-1 mt-4 flex flex-col min-h-0'>
        {
          Array.isArray(chats) && chats.length > 0 ?
            <div className='flex flex-col h-full min-h-0'>
              <p className='text-sm mt-4 shrink-0'>Recent Chats</p>
              <div className='flex-1 overflow-y-auto mt-3 text-sm space-y-3 pr-2 pb-2'>
                {
                  // chats.filter((chat,index)=>{
                  //   if(chat.messages[0]){
                  //     return chat.messages[0].content.toLowerCase().includes(search.toLowerCase())
                  //   }else{
                  //     return chat.name.toLowerCase().includes(search.toLowerCase())
                  //   }
                  // })
                  processedChats.map((chat) => {
                    // Handle both old and new chat structures
                    let displayText = chat.title || 'New Chat';
                    if (chat.title === 'New Chat' && chat.messages && chat.messages.length > 0) {
                      displayText = chat.messages[0].content.slice(0, 32);
                    }
                    return (
                      <div key={chat.id} onClick={() => { navigate(`/main/chat/${chat.id}`); setIsMenuOpen(false) }} className='p-2 px-4 dark:bg-[#57317C]/10 border border-black-800 dark:border-[#80609F]/15 rounded-md cursor-pointer flex items-center justify-between group'>
                        <div className='flex-1 truncate pr-2'>
                          <p className='truncate w-full'>
                            {displayText}
                          </p>
                          <p className='text-xs text-gray-500 dark:text-purple-300'>
                            {chat.updatedAt ? moment(chat.updatedAt).fromNow() : 'No date'}
                          </p>
                        </div>
                        <div className='flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity' onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => handleEdit(e, chat, displayText)} className='text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors' title="Edit chat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                          </button>
                          <button onClick={(e) => handleDelete(e, chat.id)} className='text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors' title="Delete chat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                          </button>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>
            :
            <p className='text-sm mt-4 shrink-0'>No Recent Chats</p>
        }
      </div>

      {/* Credit purchase */}
      <div onClick={() => { navigate('/main/credits'); setIsMenuOpen(false) }} className='flex items-center gap-2 p-3 mt-4 border border-black-800 dark:border-white/15 rounded-md cursor-pointer hover:scale-103 transition-all'>
        <img src={assets.credit_icon} className='w-4.5 not-dark:invert' />
        <div className='flex flex-col text-sm'>
          <p>Credits : {user?.credits || 0}</p>
          <p className='text-xs text-gray-400'>Purchase credits to use MedGPT</p>
        </div>
      </div>
      {/* Toggle Theme Mode */}
      <div className='flex items-center gap-2 p-3 mt-4 border border-black-800 dark:border-white/15 rounded-md'>
        <div className='flex items-center gap-2 text-sm'>
          <img src={assets.theme_icon} className='w-4 not-dark:invert' alt="" />
          <p className='text-sm'>{theme === 'light' ? 'Dark' : 'Light'} Mode</p>
        </div>
        <label className='relative inline-flex cursor-pointer'>
          <input type="checkbox" onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')} className='sr-only peer' checked={theme === 'dark'} />
          <div className='w-9 h-5 bg-gray-400 rounded-full peer peer-checked:bg-purple-600 transition-all'></div>
          <span className='absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4'></span>
        </label>
      </div>
      {/* User Icon */}
      <div onClick={() => navigate(user ? '/main/profile' : '/auth')} className='flex items-center gap-2 p-3 mt-4 border border-black-800 dark:border-white/15 rounded-md cursor-pointer group'>
        <img src={assets.user_icon} className='w-7 rounded-full' alt="" />
        <p className='flex-1 text-sm dark:text-primary truncate'>
          {user ? user.name : 'Login to continue'}
        </p>
        {user && <img src={assets.logout_icon} className='h-5 cursor-pointer group-hover:block hidden not-dark:invert' onClick={(e) => { handleLogout() }} />}
      </div>
      {/* Sidebar Closing option */}
      <img src={assets.close_icon} className='absolute top-3 right-3 w-5 h-5 cursor-pointer md:hidden not-dark:invert' onClick={() => setIsMenuOpen(false)} />
    </div>
  )
}

export default Sidebar 