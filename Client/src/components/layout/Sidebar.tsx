
import React, { useState } from 'react';
import moment from 'moment';
import { useLocation, useNavigate } from 'react-router-dom';

import { assets } from '../../assets/assets';
import { ApiService } from '../../api/api.service';
import { useAuth } from '../../store/authStore';
import { useTheme } from '../../store/themeStore';

import type { T_Chat } from '../../api/api.types';

interface SidebarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export function Sidebar({
  isMenuOpen,
  setIsMenuOpen,
}: SidebarProps) {
  const { theme } = useTheme();
  const { user, setUser } = useAuth();

  const [search, setSearch] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Chat hooks
  const {
    useCreateChat,
    useDeleteChat,
    useUpdateChatTitle,
    useFetchChats,
  } = ApiService.chats;

  const createChatMutation = useCreateChat();
  const deleteChatMutation = useDeleteChat();
  const updateChatTitleMutation = useUpdateChatTitle();

  // Logout hook must be called at component level.
  const logoutMutation = ApiService.auth.useLogout();

  // TanStack Query is the source of truth for chat data.
  const {
    data: chats = [],
    isPending: isChatsLoading,
    isError: isChatsError,
    error: chatsError,
    refetch: refetchChats,
  } = useFetchChats();

  /* -------------------- DELETE CHAT -------------------- */

  const handleDelete = (
    e: React.MouseEvent<HTMLButtonElement>,
    chatId: number
  ) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      'Are you sure you want to delete this chat?'
    );

    if (!confirmed) return;

    deleteChatMutation.mutate(chatId, {
      onSuccess: () => {
        if (location.pathname === `/main/chat/${chatId}`) {
          navigate('/main/chat');
        }
      },
    });
  };

  /* -------------------- EDIT CHAT TITLE -------------------- */

  const handleEdit = (
    e: React.MouseEvent<HTMLButtonElement>,
    chat: T_Chat
  ) => {
    e.stopPropagation();

    const newTitle = window.prompt(
      'Enter new title for chat:',
      chat.title
    );

    if (
      newTitle === null ||
      newTitle.trim() === '' ||
      newTitle.trim() === chat.title
    ) {
      return;
    }

    updateChatTitleMutation.mutate({
      chatId: chat.id,
      title: newTitle.trim(),
    });
  };

  /* -------------------- FILTER AND SORT CHATS -------------------- */

  const processedChats = [...chats]
    .filter((chat) => {
      const query = search.trim().toLowerCase();

      if (!query) return true;

      const titleMatches = chat.title
        ?.toLowerCase()
        .includes(query);

      const messageMatches = chat.messages?.some((message) =>
        message.content.toLowerCase().includes(query)
      );

      return titleMatches || messageMatches;
    })
    .sort((a, b) => {
      const dateA = Date.parse(a.updatedAt);
      const dateB = Date.parse(b.updatedAt);

      return (
        (Number.isNaN(dateB) ? 0 : dateB) -
        (Number.isNaN(dateA) ? 0 : dateA)
      );
    });

  /* -------------------- NEW CHAT -------------------- */

  const handleNewChat = () => {
    const chatTitle = window.prompt(
      'Enter a title for your new chat:',
      'New Chat'
    );

    // Cancel means do not create a chat.
    if (chatTitle === null) return;

    const title = chatTitle.trim() || 'New Chat';

    createChatMutation.mutate(
      { title },
      {
        onSuccess: (newChat) => {
          navigate(`/main/chat/${newChat.id}`);
          setIsMenuOpen(false);
        },
      }
    );

  };

  /* -------------------- LOGOUT -------------------- */

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setUser(null);
        navigate('/auth');
      },
    });
  };

  /* -------------------- CHAT DISPLAY TITLE -------------------- */

  const getDisplayTitle = (chat: T_Chat) => {
    if (!chat) return 'New Chat';
    if (chat.title && chat.title !== 'New Chat') {
      return chat.title;
    }

    const firstUserMessage = chat.messages?.find(
      (message) => message.role === 'user'
    );

    if (firstUserMessage?.content) {
      const content = firstUserMessage.content.trim();
      return content.length > 32
        ? `${content.slice(0, 32)}...`
        : content;
    }

    return chat.title || 'New Chat';
  };

  /* -------------------- RENDER -------------------- */

  return (
    <div
      className={`
        px-3 py-3 flex flex-col h-screen min-w-72
        bg-gradient-to-b from-purple-50/50 to-blue-50/50
        dark:from-gray-900/30 dark:to-black/30
        text-gray-900 dark:text-white
        border-r border-gray-200 dark:border-gray-800
        backdrop-blur-3xl transition-all duration-500
        max-md:absolute left-0 z-10
        ${!isMenuOpen ? 'max-md:-translate-x-full' : ''}
      `}
    >
      {/* Header */}

      <div className="flex items-center justify-start gap-3 mb-6 mt-2 pl-1">
        <img
          src={
            theme === 'light'
              ? assets.logo_full_dark
              : assets.logo_full
          }
          alt="MedGPT Logo"
          className="w-auto h-12 object-contain drop-shadow-md"
        />

        <span className="text-3xl font-bold text-black dark:text-white tracking-wide">
          MedGPT
        </span>
      </div>

      {/* New Chat Button */}

      <button
        onClick={handleNewChat}
        disabled={createChatMutation.isPending}
        className="
          flex justify-center items-center w-full py-2.5
          text-white bg-gradient-to-r from-purple-600 to-blue-600
          hover:from-purple-700 hover:to-blue-700
          active:scale-[0.98] transition-all text-sm
          rounded-xl font-medium shadow-lg shadow-purple-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <span className="mr-2 text-xl">+</span>
        {createChatMutation.isPending
          ? 'Creating...'
          : 'New Chat'}
      </button>

      {/* Search Conversations */}

      <div
        className="
          flex items-center gap-2 p-3 mt-4
          border border-gray-200 dark:border-gray-700
          rounded-xl shrink-0
          bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm
        "
      >
        <img
          src={assets.search_icon}
          alt="Search"
          className="w-4 h-4 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            flex-1 bg-transparent text-xs
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 outline-none
          "
        />
      </div>

      {/* Chat History */}

      <div className="flex-1 mt-4 flex flex-col min-h-0 overflow-hidden">
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 shrink-0 font-medium">
          Recent Chats
        </p>

        <div className="flex-1 overflow-y-auto mt-3 space-y-3 pr-2 pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {/* Loading */}

          {isChatsLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading chats...
            </p>
          )}

          {/* Error */}

          {isChatsError && (
            <div className="text-sm text-red-500 space-y-2">
              <p>
                {chatsError?.message ||
                  'Unable to load chats.'}
              </p>

              <button
                onClick={() => refetchChats()}
                className="
                  text-xs underline
                  hover:text-red-700 dark:hover:text-red-400
                "
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}

          {!isChatsLoading &&
            !isChatsError &&
            processedChats.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {search.trim()
                  ? 'No matching chats found.'
                  : 'No recent chats.'}
              </p>
            )}

          {/* Chat list */}

          {!isChatsLoading &&
            !isChatsError &&
            processedChats.map((chat) => {
              const displayTitle = getDisplayTitle(chat);
              const isActive =
                location.pathname === `/main/chat/${chat.id}`;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    navigate(`/main/chat/${chat.id}`);
                    setIsMenuOpen(false);
                  }}
                  className={`
                    p-3 px-4
                    border rounded-xl cursor-pointer
                    flex items-center justify-between group
                    transition-all
                    ${isActive
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700'
                      : 'bg-white/70 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                    }
                  `}
                >
                  <div className="flex-1 truncate pr-2">
                    <p className="truncate w-full text-sm font-medium text-gray-900 dark:text-gray-100">
                      {displayTitle}
                    </p>

                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {chat.updatedAt &&
                        !Number.isNaN(Date.parse(chat.updatedAt))
                        ? moment(chat.updatedAt).fromNow()
                        : 'No date'}
                    </p>
                  </div>

                  <div
                    className="
                      flex gap-1.5
                      opacity-100 md:opacity-0
                      md:group-hover:opacity-100
                      transition-opacity
                    "
                  >
                    {/* Edit */}

                    <button
                      onClick={(e) => handleEdit(e, chat)}
                      disabled={updateChatTitleMutation.isPending}
                      className="
                        p-1.5 text-gray-400
                        hover:text-blue-500
                        hover:bg-blue-50
                        dark:hover:bg-blue-900/20
                        rounded-lg transition-colors
                        disabled:opacity-50
                      "
                      title="Edit chat"
                      aria-label={`Edit ${displayTitle}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>

                    {/* Delete */}

                    <button
                      onClick={(e) => handleDelete(e, chat.id)}
                      disabled={deleteChatMutation.isPending}
                      className="
                        p-1.5 text-gray-400
                        hover:text-red-500
                        hover:bg-red-50
                        dark:hover:bg-red-900/20
                        rounded-lg transition-colors
                        disabled:opacity-50
                      "
                      title="Delete chat"
                      aria-label={`Delete ${displayTitle}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" x2="10" y1="11" y2="17" />
                        <line x1="14" x2="14" y1="11" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Credit Purchase */}

      <div
        onClick={() => {
          navigate('/main/credits');
          setIsMenuOpen(false);
        }}
        className="
          flex items-center gap-3 p-3 mt-4
          border border-gray-200 dark:border-gray-700
          rounded-xl cursor-pointer
          hover:bg-gray-50 dark:hover:bg-gray-800
          transition-all
        "
      >
        <img
          src={assets.credit_icon}
          alt="Credits"
          className="w-5 h-5"
        />

        <div className="flex flex-col text-sm">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            Credits: {user?.credits ?? 0}
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Purchase credits to use MedGPT
          </p>
        </div>
      </div>

      {/* User Profile */}

      <div
        onClick={() => navigate(user ? '/main/profile' : '/auth')}
        className="
          flex items-center gap-3 p-3 mt-4
          border border-gray-200 dark:border-gray-700
          rounded-xl cursor-pointer
          hover:bg-gray-50 dark:hover:bg-gray-800
          transition-all
        "
      >
        <img
          src={assets.user_icon}
          alt="User"
          className="
            w-8 h-8 rounded-full
            border border-gray-200 dark:border-gray-700
          "
        />

        <p className="flex-1 text-sm font-medium dark:text-gray-200 truncate">
          {user ? user.name : 'Login to continue'}
        </p>

        {user && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            disabled={logoutMutation.isPending}
            className="
              p-2 text-gray-400
              hover:text-red-500 transition-colors
              disabled:opacity-50
            "
            title="Logout"
            aria-label="Logout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {/* Sidebar Close Button */}

      <img
        src={assets.close_icon}
        alt="Close"
        className="
          absolute top-3 right-3 w-5 h-5
          cursor-pointer md:hidden
          text-gray-500 hover:text-gray-700
          dark:text-gray-400 dark:hover:text-gray-200
        "
        onClick={() => setIsMenuOpen(false)}
      />
    </div>
  );
}
