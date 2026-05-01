import {useContext, useEffect, useState} from 'react'
import {GlobalContext} from '../context/context'
import {assets} from '../assets/assets'
import Message from './Message'
import PromptInput from './PromptInput'
import { useParams } from 'react-router-dom'
import { sendMessageApi } from '../services/api_services'

function ChatDetails() {
  const {theme, chats} = useContext(GlobalContext)
  const [selectedChat, setSelectedChat] = useState(null)
  const { id } = useParams()

  useEffect(() => {
    if (id && chats.length > 0) {
      const chat = chats.find(c => c.id === id)
      if (chat) {
        setSelectedChat(chat)
      }
    }
  }, [id, chats])

  return (
    <div className='px-3 py-3 flex flex-col justify-between m-5 md:m-10 x1:mx-30 max-md:mt-14 2xl:pr-40'>
      {/* Chat header */}
      <div className='flex items-center gap-3 mb-4 pb-3 border-b border-[#D4C5E2] dark:border-[#80609F]/30'>
        <img src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark} alt="" className='h-8'/>
        <span className='font-semibold text-[#2D2535] dark:text-white'>
          {selectedChat?.messages?.[0]?.content?.slice(0, 30) || 'New Chat'}
        </span>
      </div>

      {/* Messages */}
      <div className='flex-1 mb-5 overflow-y-scroll'>
        {selectedChat?.messages?.length === 0 && (
          <div className='h-full flex flex-col items-center justify-center gap-2 text-primary'>
            <p className='text-4xl sm:text-6xl text-center text-gray-400 dark:text-white'>Ask me anything</p>
          </div>
        )}
        {selectedChat?.messages?.map((message,index)=>(
          <Message key={index} message={message}/>
        ))}
      </div>

      <PromptInput onSend={async (prompt, mode='text') => {
        // Handle sending - this would connect to your backend
        const response = await sendMessageApi(prompt, mode)
        console.log(prompt, mode)
      }}/>
    </div>
  )
}

export default ChatDetails