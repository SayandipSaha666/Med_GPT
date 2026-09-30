import React, { useState, useContext } from 'react';
import { assets } from '../../assets/assets';
import moment from 'moment';
import { useNavigate, useLocation } from 'react-router-dom';
import { ApiService } from '../../api/api.service';
import { useChat } from '../../store/chatStore';
import { useAuth } from '../../store/authStore';
import { useTheme } from '../../store/themeStore';

interface SidebarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export function Sidebar({ isMenuOpen, setIsMenuOpen }: SidebarProps) {
  const { theme } = useTheme();
  const { chats, setChats } = useChat();
  const { user, setUser } = useAuth();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { useCreateChat, useDeleteChat, useUpdateChatTitle } = ApiService.chats;
  const createChatMutation = useCreateChat();
  const deleteChatMutation = useDeleteChat();
  const updateChatTitleMutation = useUpdateChatTitle();

  const handleDelete = (e: React.MouseEvent, chatId: number) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat?")) {
      deleteChatMutation.mutate(chatId, {
        onSuccess: () => {
          if (location.pathname === `/main/chat/${chatId}`) {
            navigate('/main/chat');
          }
        },
      });
    }
  };

  const handleEdit = (e: React.MouseEvent, chat: any, defaultTitle: string) => {
    e.stopPropagation();
    const newTitle = window.prompt("Enter new title for chat:", defaultTitle);
    if (newTitle && newTitle.trim() !== "" && newTitle !== defaultTitle) {
      updateChatTitleMutation.mutate({ chatId: chat.id, title: newTitle.trim() });
    }
  };

  const processedChats = (() => {
    let result = Array.isArray(chats) ? chats : [];

    if (search.trim() === "") {
      try {
        result = [...result].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      } catch (error) {
        result = [];
      }
    }

    try {
      const filtered = result.filter((chat) => {
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
      return filtered;
    } catch (error) {
      return [];
    }
  })();

  const handleNewChat = () => {
    createChatMutation.mutate(undefined, {
      onSuccess: (data) => {
        setChats((prevChats) => [data.chat, ...prevChats]);
        navigate(`/main/chat/${data.chat.id}`);
        setIsMenuOpen(false);
      },
    });
  };

  const handleLogout = () => {
    ApiService.auth.useLogout().mutate(undefined, {
      onSuccess: () => {
        setUser(null);
        navigate('/auth');
      },
    });
  };

  return (
    <div className={`px-3 py-3 flex flex-col h-screen min-w-72 p- bg-gradient-to-b from-purple-50/50 to-blue-50/50 dark:from-gray-900/30 dark:to-black/30 text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-800 backdrop-blur-3xl transition-all duration-500 max-md:absolute left-0 z-1 ${!isMenuOpen && 'max-md:-translate-x-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-start gap-3 mb-6 mt-2 pl-1">
        <img
          src={theme === 'light' ? assets.logo_full_dark : assets.logo_full}
          alt="MedGPT Logo"
          className="w-auto h-12 object-contain drop-shadow-md"
        />
        <span className="text-3xl font-bold text-black dark:text-white tracking-wide">MedGPT</span>
      </div>

      {/* New Chat Button */}
      <button
        onClick={handleNewChat}
        disabled={createChatMutation.isPending}
        className="flex justify-center items-center w-full py-2.5 text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:scale-[0.98] transition-all text-sm rounded-xl font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="mr-2 text-xl">+</span> New Chat
      </button>

      {/* Search Conversations */}
      <div className="flex items-center gap-2 p-3 mt-4 border border-gray-200 dark:border-gray-700 rounded-xl shrink-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <img src={assets.search_icon} alt="Search" className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none"
        />
      </div>

      {/* Chat History */}
      <div className="flex-1 mt-4 flex flex-col min-h-0 overflow-hidden">
        {Array.isArray(chats) && chats.length > 0 ? (
          <div className="flex flex-col h-full min-h-0 overflow-hidden">
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 shrink-0 font-medium">Recent Chats</p>
            <div className="flex-1 overflow-y-auto mt-3 space-y-3 pr-2 pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {processedChats.map((chat) => {
                let displayText = chat.title || 'New Chat';
                if (chat.title === 'New Chat' && chat.messages && chat.messages.length > 0) {
                  displayText = chat.messages[0].content.slice(0, 32);
                }
                return (
                  <div
                    key={chat.id}
                    onClick={() => { navigate(`/main/chat/${chat.id}`); setIsMenuOpen(false) }}
                    className="p-3 px-4 bg-white/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer flex items-center justify-between group hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all"
                  >
                    <div className="flex-1 truncate pr-2">
                      <p className="truncate w-full text-sm font-medium text-gray-900 dark:text-gray-100">
                        {displayText}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {chat.updatedAt ? moment(chat.updatedAt).fromNow() : 'No date'}
                      </p>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEdit(e, chat, displayText)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit chat"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, chat.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete chat"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 shrink-0">No Recent Chats</p>
        )}
      </div>

      {/* Credit Purchase */}
      <div
        onClick={() => { navigate('/main/credits'); setIsMenuOpen(false) }}
        className="flex items-center gap-3 p-3 mt-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
      >
        <img src={assets.credit_icon} alt="Credits" className="w-5 h-5" />
        <div className="flex flex-col text-sm">
          <p className="font-medium text-gray-900 dark:text-gray-100">Credits: {user?.credits || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Purchase credits to use MedGPT</p>
        </div>
      </div>

      {/* User Profile */}
      <div
        onClick={() => navigate(user ? '/main/profile' : '/auth')}
        className="flex items-center gap-3 p-3 mt-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
      >
        <img src={assets.user_icon} alt="User" className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700" />
        <p className="flex-1 text-sm font-medium dark:text-gray-200 truncate">
          {user ? user.name : 'Login to continue'}
        </p>
        {user && (
          <button
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
          </button>
        )}
      </div>

      {/* Sidebar Closing option */}
      <img
        src={assets.close_icon}
        alt="Close"
        className="absolute top-3 right-3 w-5 h-5 cursor-pointer md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={() => setIsMenuOpen(false)}
      />
    </div>
  );
}
