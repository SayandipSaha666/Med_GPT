import { createContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate, useLocation } from "react-router";
import { callAuthUserApi,fetchChatsApi } from "../services/api_services";
export const GlobalContext = createContext(null)
import axios from "axios";

function GlobalState({ children }){
    const [user,setUser] = useState(null)
    const [chats,setChats] = useState([])
    // const [selectedChat,setSelectedChat] = useState(null)
    const [theme,setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [loading,setLoading] = useState(false)
    const [currentplan,setCurrentplan] = useState(null)

    const navigate = useNavigate();
    const location = useLocation();
    // Replace all the fetchUser, fetchChats with api_services
    const fetchUser = async()=>{
        try {
            const data = await callAuthUserApi();
            if(data?.success){
                setUser(data.data);
            }
            if(location.pathname === '/') return;
            if(data.success){
                if(location.pathname === '/auth'){
                    navigate('/main');
                }
            }
        } catch (error) {
            // 401 is expected when not logged in — not an error worth surfacing
            if(location.pathname !== '/' && location.pathname !== '/auth'){
                navigate('/auth');
            }
        }
    }
    const fetchChats = async()=>{
        try {
            console.log('Fetching chats from API...');
            const chats_res = await fetchChatsApi();
            console.log('Raw API response:', chats_res);
            
            if(chats_res?.success){
                console.log('Chats data received:', chats_res.data);
                console.log('Type of chats.data:', typeof chats_res.data);
                console.log('Is chats.data an array?', Array.isArray(chats_res.data));
                
                if(Array.isArray(chats_res.data)){
                    setChats(chats_res.data)
                    console.log('Setting chats to:', chats_res.data)
                    // setSelectedChat(chats_res.data[0])
                } else {
                    console.log('Warning: chats.data is not an array, got:', chats_res.data);
                    setChats([])
                    // setSelectedChat(null)
                }
            } else {
                console.log('API call failed:', chats_res?.message);
                setChats([])
                // setSelectedChat(null)
            }
        } catch (error) {
            console.error('Error fetching chats:', error)
            setChats([])
            // setSelectedChat(null)
        }
    }
    const fetchPlan = async () => {
        if(user?.plan){
            setCurrentplan(user.plan);
        }else{
            setCurrentplan(null)
        }
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
            fetchPlan()
        }else{
            setChats([])
            // setSelectedChat(null)
        }
        console.log(user);
    },[user])
    useEffect(()=>{
        if(!user && location.pathname !== '/auth'){
            fetchUser();
        }
    },[navigate,location.pathname])
    return (
        <GlobalContext.Provider value={{user,setUser,chats,setChats, theme, setTheme, loading, setLoading, currentplan, setCurrentplan}}>
            {children}
        </GlobalContext.Provider>
    )
}
export default GlobalState;