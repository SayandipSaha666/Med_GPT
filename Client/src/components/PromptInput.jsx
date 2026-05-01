import React, { useState } from 'react'
import { assets } from '../assets/assets'

function PromptInput({ loading, onSend }) {
  const [prompt, setPrompt] = useState('')
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    onSend(prompt)
    setPrompt('')
  }

  return (
    <form onSubmit={handleSubmit} className='bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30 rounded-full w-full max-w-2xl p-3 pl-4 mx-auto flex gap-4 items-center'>
      <input type="text" value={prompt} onChange={(e) => { setPrompt(e.target.value) }} placeholder='Type your prompt here ...' className='flex-1 w-full text-sm outline-none bg-transparent' required />
      <button disabled={loading}>
        <img src={loading ? assets.stop_icon : assets.send_icon} alt="" className='w-8 cursor-pointer' />
      </button>
    </form>
  )
}

export default PromptInput
