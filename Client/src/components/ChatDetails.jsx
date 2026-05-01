import {useContext, useEffect, useState, useRef} from 'react'
import {GlobalContext} from '../context/context'
import {assets} from '../assets/assets'
import Message from './Message'
import PromptInput from './PromptInput'
import { useParams } from 'react-router-dom'
import { sendMessageApi, fetchChatApi } from '../services/api_services'

function ChatDetails() {
  const {theme, chats, setChats} = useContext(GlobalContext)
  const [selectedChat, setSelectedChat] = useState(null)
  const [loading, setLoading] = useState(false)
  const { id } = useParams()
  const containerRef = useRef(null)

  useEffect(() => {
    const loadFullChat = async () => {
      if (id) {
        try {
          const response = await fetchChatApi(id);
          if (response?.success) {
            setSelectedChat(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch full chat:", error);
          // Fallback to global state
          if (chats.length > 0) {
            const chat = chats.find(c => c.id === Number(id));
            if (chat) setSelectedChat(chat);
          }
        }
      }
    };
    loadFullChat();
  }, [id]);

  useEffect(()=>{
    if(containerRef.current){
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  },[selectedChat?.messages])

  return (
    <div className='px-3 py-3 flex-1 flex flex-col justify-between m-5 md:m-10 x1:mx-30 max-md:mt-14 2xl:pr-40'>
      {/* Chat header */}
      <div className='flex items-center gap-3 mb-4 pb-3 border-b border-[#D4C5E2] dark:border-[#80609F]/30'>
        <img src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark} alt="" className='h-8'/>
      </div>

      {/* Messages */}
      <div ref={containerRef} className='flex-1 mb-5 overflow-y-scroll'>
        {selectedChat?.messages?.length === 0 && (
          <div className='h-full flex flex-col items-center justify-center gap-2 text-primary'>
            <p className='text-4xl sm:text-6xl text-center text-gray-400 dark:text-white'>Ask me anything</p>
          </div>
        )}
        {selectedChat?.messages?.map((message,index)=>(
          <Message key={index} message={message}/>
        ))}
        {/* Three dot while loading */}
        {loading && 
        <div className='loader flex items-center gap-1.5'>
          <p className='text-primary text-lg'>Researching</p>
          <div className='flex gap-1'>
            <div className='w-2 h-2 rounded-full bg-primary animate-bounce'></div>
            <div className='w-2 h-2 rounded-full bg-primary animate-bounce' style={{animationDelay: '0.2s'}}></div>
            <div className='w-2 h-2 rounded-full bg-primary animate-bounce' style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
        }
      </div>

      <PromptInput loading={loading} onSend={async (prompt) => {
        if (!id || !prompt.trim()) return;

        // Optimistically add user message to UI
        const newUserMessage = { role: "user", content: prompt, timestamp: new Date() };
        setSelectedChat(prev => ({
          ...prev,
          messages: [...(prev.messages || []), newUserMessage]
        }));
        setLoading(true);

        try {
          // Call backend
          const response = await sendMessageApi(id, prompt);
          
          if (response.success) {
            // Update chat with assistant's response and replace optimistic user message
            setSelectedChat(prev => {
              // Remove the optimistic message we added at the end
              const updatedMessages = prev.messages.slice(0, -1);
              return {
                ...prev,
                messages: [...updatedMessages, response.userMessage, response.assistantMessage]
              };
            });
            
            // Update the global chats state
            setChats(prevChats => prevChats.map(c => 
              c.id === Number(id) ? { 
                ...c, 
                messages: [...(c.messages || []), response.userMessage, response.assistantMessage] 
              } : c
            ));
          }
        } catch (error) {
          console.error("Failed to send message:", error);
        } finally {
          setLoading(false);
        }
      }}/>
    </div>
  )
}

export default ChatDetails