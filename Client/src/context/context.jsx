import { createContext, useState, useEffect } from "react";
import { assets,dummyChats,dummyUserData,dummyPlans } from "../assets/assets";
export const GlobalContext = createContext(null)

function GlobalState({ children }){
    const [user,setUser] = useState(null)
    const [chats,setChats] = useState([])
    const [selectedChat,setSelectedChat] = useState(null)
    const [theme,setTheme] = useState(localStorage.getItem('theme') || 'light');

    // Replace all the fetchUser, fetchChats with api_services
    const fetchUser = async()=>{
        setUser(dummyUserData)
    }
    const fetchChats = async()=>{
        setChats(dummyChats)
        setSelectedChat()
    }
    useEffect(()=>{
        if(theme === 'dark'){
            document.documentElement.classList.add('dark')
        }else{
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('theme', theme);
    },[theme])
    useEffect(()=>{
        if(user){
            fetchChats()
        }else{
            setChats([])
            setSelectedChat(null)
        }
    },[user])
    useEffect(()=>{
        fetchUser();
    },[])
    // console.log(dummyUserData)
    return (
        <GlobalContext.Provider value={{user,setUser,chats,setChats,selectedChat,setSelectedChat, theme, setTheme}}>
            {children}
        </GlobalContext.Provider>
    )
}
export default GlobalState;