import React from 'react'

function CommonInput({name,label,id,value,onChange,placeholder,type}) {
  return (
    <div className="space-y-1.5">
        <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-purple-200">{label}</label>
        <input
            type={type || "text"}
            name  = {name}
            id = {id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border border-black-800 dark:border-white/20 rounded-md bg-white dark:bg-[#242124]/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
        />
    </div>
  )
}

export default CommonInput