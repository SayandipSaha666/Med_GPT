import React, { useEffect } from 'react'
import moment from 'moment'
import { assets } from '../assets/assets'
import Markdown from "react-markdown"
import Prism from 'prismjs'
const Message = ({message})=>{
  // console.log(message)
  useEffect(()=>{
    Prism.highlightAll()
  },[message.content])
  return (
    <div>
      {message?.role === 'user' ? (
        <div className='flex items-start justify-end my-4 gap-2'>
          <div className='flex flex-col gap-2 p-2 px-4 bg-slate-50 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md max-w-2xl'>
            <div className='text-sm dark:text-primary prose prose-sm dark:prose-invert max-w-none'><Markdown>{message.content}</Markdown></div>
            <span className='text-xs text-gray-400 dark:text-[#B1A6C0]'>{moment(message.timestamp).fromNow()}</span>
          </div>
          <img src={assets.user_icon} alt="" className='w-8 h-8 rounded-full'/>
        </div>
      ) 
      : (
        <div className='inline-flex flex-col gap-2 p-2 px-4 max-w-2xl bg-primary/20 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md my-4'>
          {message.isImage ? 
            <img src={message.content} alt="" className='w-full max-w-96 rounded-md'/>
          : 
            <div className='text-sm dark:text-primary prose prose-sm dark:prose-invert max-w-none'><Markdown>{message.content}</Markdown></div>
          }
          <span className='text-xs text-gray-400 dark:text-[#B1A6C0]'>{moment(message.timestamp).fromNow()}</span>
        </div>
      )}
    </div>
  )
}

export default Message