import React, { useState } from 'react'
import { assets } from '../assets/assets'

function PromptInput({ loading, onSend, mode, setMode }) {
  const [prompt, setPrompt] = useState('')
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    onSend(prompt, mode)
    setPrompt('')
  }

  return (
    <form onSubmit={handleSubmit} className='bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark: border-[#80609F]/30 rounded-full w-full max-w-2xl p-3 pl-4 mx-auto flex gap-4 items-center'>
      <select onChange={(e) => { setMode(e.target.value) }} value={mode} className='text-sm pl-3 pr-2 outline-none'>
        <option className='dark:bg-purple-900' value="text">Text</option>
        <option className='dark:bg-purple-900' value="image">Image</option>
      </select>
      <input type="text" value={prompt} onChange={(e) => { setPrompt(e.target.value) }} placeholder='Type your prompt here ...' className='flex-1 w-full text-sm outline-none' required />
      <button disabled={loading}>
        <img src={loading ? assets.stop_icon : assets.send_icon} alt="" className='w-8 cursor-pointer' />
      </button>
    </form>
  )
}

export default PromptInput
