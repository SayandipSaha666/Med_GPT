import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { assets } from '../../assets/assets';
import { ApiService } from '../../api/api.service';
import { useAuth } from '../../store/authStore';
import { useTheme } from '../../store/themeStore';
import { ChatModal, ModalMode } from '../modals/ChatModal';

import type { T_Chat } from '../../api/api.types';
import { chatKeys } from '../../api/chats/chats.service';
import { pinKeys } from '../../api/chatPins/chatPins.service';
import { folderKeys } from '../../api/chatFolders/chatFolders.service';
import broadcastChannel from '../../lib/broadcastChannel';

interface SidebarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export function Sidebar({
  isMenuOpen,
  setIsMenuOpen,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, setUser } = useAuth();

  const [search, setSearch] = useState('');
  
  // Modal state for New Chat, Edit Title, Delete Chat
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [activeChat, setActiveChat] = useState<{ id: number; title: string } | null>(null);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<number[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Chat API hooks
  const {
    useCreateChat,
    useDeleteChat,
    useUpdateChatTitle,
    useFetchChats,
  } = ApiService.chats;

  const createChatMutation = useCreateChat();
  const deleteChatMutation = useDeleteChat();
  const updateChatTitleMutation = useUpdateChatTitle();
  const { data: pins = [] } = ApiService.chatPins.usePins();
  const { data: folders = [] } = ApiService.chatFolders.useFolders();
  const pinChatMutation = ApiService.chatPins.usePinChat();
  const unpinChatMutation = ApiService.chatPins.useUnpinChat();
  const createFolderMutation = ApiService.chatFolders.useCreateFolder();
  const updateFolderMutation = ApiService.chatFolders.useUpdateFolder();
  const deleteFolderMutation = ApiService.chatFolders.useDeleteFolder();
  const addChatMutation = ApiService.chatFolders.useAddChat();
  const removeChatMutation = ApiService.chatFolders.useRemoveChat();

  useEffect(() => {
    const unsubscribers = [
      broadcastChannel.onChatDeleted((chatId) => {
        queryClient.setQueryData<T_Chat[]>(chatKeys.all, (old) => old?.filter((chat) => chat.id !== chatId));
        queryClient.removeQueries({ queryKey: chatKeys.detail(chatId), exact: true });
        void queryClient.invalidateQueries({ queryKey: chatKeys.all });
        void queryClient.invalidateQueries({ queryKey: pinKeys.all });
        void queryClient.invalidateQueries({ queryKey: folderKeys.all });
        if (window.location.pathname === `/main/chat/${chatId}`) navigate('/main/chat');
      }),
      broadcastChannel.onChatPinned(() => { void queryClient.invalidateQueries({ queryKey: pinKeys.all }); }),
      broadcastChannel.onChatUnpinned(() => { void queryClient.invalidateQueries({ queryKey: pinKeys.all }); }),
      broadcastChannel.onChatMovedToFolder(() => { void queryClient.invalidateQueries({ queryKey: folderKeys.all }); }),
      broadcastChannel.onFoldersChanged(() => { void queryClient.invalidateQueries({ queryKey: folderKeys.all }); }),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [navigate, queryClient]);

  // Logout hook
  const logoutMutation = ApiService.auth.useLogout();

  // TanStack Query source of truth
  const {
    data: chats = [],
    isPending: isChatsLoading,
    isError: isChatsError,
    error: chatsError,
    refetch: refetchChats,
  } = useFetchChats();

  /* -------------------- DELETE CHAT -------------------- */
  const openDeleteModal = (
    e: React.MouseEvent<HTMLButtonElement>,
    chat: T_Chat
  ) => {
    e.stopPropagation();
    setActiveChat({ id: chat.id, title: chat.title || 'Chat' });
    setModalMode('delete');
  };

  const handleConfirmDelete = (chatId: number) => {
    deleteChatMutation.mutate(chatId, {
      onSuccess: () => {
        toast.success('Chat deleted successfully.');
        setModalMode(null);
        setActiveChat(null);
        if (location.pathname === `/main/chat/${chatId}`) {
          navigate('/main/chat');
        }
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Failed to delete chat');
      },
    });
  };

  /* -------------------- EDIT CHAT TITLE -------------------- */
  const openEditModal = (
    e: React.MouseEvent<HTMLButtonElement>,
    chat: T_Chat
  ) => {
    e.stopPropagation();
    setActiveChat({ id: chat.id, title: chat.title || 'New Chat' });
    setModalMode('edit');
  };

  const handleSaveTitle = (title: string, chatId?: number) => {
    if (!chatId) return;
    updateChatTitleMutation.mutate(
      { chatId, title },
      {
        onSuccess: () => {
          toast.success('Chat title updated successfully! ✏️');
          setModalMode(null);
          setActiveChat(null);
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Failed to update title');
        },
      }
    );
  };

  /* -------------------- NEW CHAT -------------------- */
  const openNewChatModal = () => {
    setActiveChat(null);
    setModalMode('create');
  };

  const handleCreateChat = (title: string) => {
    createChatMutation.mutate(
      { title },
      {
        onSuccess: (newChat) => {
          toast.success(`Chat "${title}" created! 💬`);
          setModalMode(null);
          navigate(`/main/chat/${newChat.id}`);
          if (window.innerWidth < 768) {
            setIsMenuOpen(false);
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Failed to create new chat');
        },
      }
    );
  };

  /* -------------------- LOGOUT -------------------- */
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setUser(null);
        toast.success('Signed out successfully. See you soon! 👋');
        navigate('/auth');
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Error signing out');
      },
    });
  };

  /* -------------------- FILTER AND SORT CHATS -------------------- */
  const processedChats = [...chats]
    .filter((chat) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;

      const titleMatches = chat.title?.toLowerCase().includes(query);
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

  const pinnedIds = new Set(pins.map((pin) => pin.chatId));
  const pinnedChats = pins.map((pin) => processedChats.find((chat) => chat.id === pin.chatId)).filter((chat): chat is T_Chat => Boolean(chat));

  const openChat = (chatId: number) => {
    navigate(`/main/chat/${chatId}`);
    if (window.innerWidth < 768) setIsMenuOpen(false);
  };

  const saveFolder = (event: React.FormEvent) => {
    event.preventDefault();
    const name = folderName.trim();
    if (!name) return;
    const options = {
      onSuccess: () => {
        toast.success(editingFolderId ? 'Folder renamed' : 'Folder created');
        setFolderName('');
        setEditingFolderId(null);
        setShowFolderForm(false);
      },
      onError: (error: Error) => toast.error(error.message || 'Could not save folder'),
    };
    if (editingFolderId) updateFolderMutation.mutate({ folderId: editingFolderId, name }, options);
    else createFolderMutation.mutate({ name }, options);
  };

  const togglePin = (event: React.MouseEvent, chatId: number) => {
    event.stopPropagation();
    const mutation = pinnedIds.has(chatId) ? unpinChatMutation : pinChatMutation;
    mutation.mutate(chatId, { onError: (error) => toast.error(error.message || 'Could not update pin') });
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
      return content.length > 30
        ? `${content.slice(0, 30)}...`
        : content;
    }

    return chat.title || 'New Chat';
  };

  const isModalLoading =
    createChatMutation.isPending ||
    updateChatTitleMutation.isPending ||
    deleteChatMutation.isPending;

  /* -------------------- RENDER -------------------- */
  return (
    <>
      <div
        id="med-conversation-navigation"
        role="navigation"
        aria-label="Conversation navigation"
        inert={!isMenuOpen}
        className={`
          med-sidebar flex flex-col h-screen w-72 md:w-80 shrink-0
          bg-[#faf9fc]/90 dark:bg-[#14121e]/95
          text-gray-900 dark:text-white
          border-r border-purple-100 dark:border-purple-950/60
          backdrop-blur-2xl transition-transform duration-200 ease-out
          z-40 p-4 select-none
          max-md:fixed max-md:top-0 max-md:left-0 max-md:bottom-0 max-md:shadow-2xl
          ${!isMenuOpen ? 'max-md:-translate-x-full md:hidden' : 'translate-x-0'}
        `}
      >
        {/* Header: Logo, App Name & Close Sidebar Button */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-100/70 dark:border-purple-900/30">
          <div
            onClick={() => navigate('/main/chat')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 p-0.5 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[10px] flex items-center justify-center p-1">
                <img
                  src={
                    theme === 'light'
                      ? assets.logo_full_dark
                      : assets.logo_full
                  }
                  alt="MedGPT Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  MedGPT
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-none mt-0.5">
                Medical Companion
              </p>
            </div>
          </div>

          {/* Dedicated Close/Toggle Sidebar Button */}
          <button
            onClick={() => setIsMenuOpen(false)}
            title="Close sidebar"
            aria-label="Close sidebar"
            className="
              p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white
              hover:bg-purple-100/60 dark:hover:bg-purple-900/40
              active:scale-95 transition-all cursor-pointer
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" />
              <path d="m14 9-3 3 3 3" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="mt-4">
          <button
            onClick={openNewChatModal}
            disabled={createChatMutation.isPending}
            className="
              med-sidebar-new flex items-center justify-center gap-2.5 w-full py-2.5 px-4
              text-white font-semibold text-sm
              bg-teal-700 hover:bg-teal-800
              transition-colors duration-150
              rounded-xl shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40
              disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
            "
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-white/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Conversations */}
        <div
          className="
            med-sidebar-search flex items-center gap-2.5 px-3 py-2 mt-3
            border border-purple-100 dark:border-purple-900/40
            rounded-xl shrink-0
            bg-white/80 dark:bg-[#1c1929]/80 backdrop-blur-sm
            focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-400 dark:focus-within:border-purple-600
            transition-all
          "
        >
          <img
            src={assets.search_icon}
            alt="Search"
            className="w-4 h-4 opacity-50 dark:invert"
          />

          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              flex-1 bg-transparent text-xs
              text-gray-900 dark:text-gray-100
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              outline-none
            "
          />

          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Chat History Section */}
        <div className="flex-1 mt-3 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pb-2 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-900">
            {pinnedChats.length > 0 && (
              <section className="mb-4" aria-label="Pinned chats">
                <h3 className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pinned chats</h3>
                {pinnedChats.map((chat) => (
                  <div key={`pin-${chat.id}`} className="flex items-center gap-1 rounded-lg bg-purple-100/60 dark:bg-purple-950/40">
                    <button onClick={() => openChat(chat.id)} className="min-w-0 flex-1 truncate px-3 py-2 text-left text-xs font-medium text-purple-800 dark:text-purple-200" title={getDisplayTitle(chat)}>
                      <span aria-hidden="true">📌 </span>{getDisplayTitle(chat)}
                    </button>
                    <button onClick={(event) => togglePin(event, chat.id)} className="px-2 text-xs text-purple-700 dark:text-purple-300" aria-label={`Unpin ${getDisplayTitle(chat)}`} title="Unpin chat">×</button>
                  </div>
                ))}
              </section>
            )}

            <section className="mb-4" aria-label="Project folders">
              <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Projects</h3>
                <button onClick={() => { setEditingFolderId(null); setFolderName(''); setShowFolderForm(true); }} className="text-xs font-semibold text-purple-600 dark:text-purple-300" aria-label="Create project folder">+ New folder</button>
              </div>
              {showFolderForm && (
                <form onSubmit={saveFolder} className="flex gap-1 mb-2">
                  <input autoFocus value={folderName} onChange={(event) => setFolderName(event.target.value)} maxLength={80} placeholder="Folder name" aria-label="Folder name" className="min-w-0 flex-1 rounded-lg border border-purple-200 bg-white px-2 py-1.5 text-xs text-gray-900 dark:border-purple-800 dark:bg-[#201c30] dark:text-white" />
                  <button type="submit" disabled={!folderName.trim() || createFolderMutation.isPending || updateFolderMutation.isPending} className="rounded-lg bg-purple-600 px-2 text-xs text-white disabled:opacity-50">Save</button>
                  <button type="button" onClick={() => { setShowFolderForm(false); setEditingFolderId(null); }} className="px-1 text-xs text-gray-500" aria-label="Cancel folder edit">×</button>
                </form>
              )}
              {folders.map((folder) => {
                const folderChats = processedChats.filter((chat) => folder.chatIds.includes(chat.id));
                const collapsed = collapsedFolderIds.includes(folder.id);
                return (
                  <div key={folder.id} className="mb-1 rounded-lg border border-purple-100/60 dark:border-purple-900/40">
                    <div className="flex items-center gap-1 px-2 py-1.5">
                      <button onClick={() => setCollapsedFolderIds((old) => collapsed ? old.filter((id) => id !== folder.id) : [...old, folder.id])} className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-gray-700 dark:text-gray-200" aria-expanded={!collapsed}>
                        <span aria-hidden="true">{collapsed ? '▸' : '▾'} 📁 </span>{folder.name} <span className="text-gray-400">({folderChats.length})</span>
                      </button>
                      <button onClick={() => { setEditingFolderId(folder.id); setFolderName(folder.name); setShowFolderForm(true); }} className="text-[11px] text-gray-500 hover:text-purple-600" aria-label={`Rename ${folder.name}`}>Edit</button>
                      <button onClick={() => { if (window.confirm(`Delete folder "${folder.name}"? Chats will remain available.`)) deleteFolderMutation.mutate(folder.id, { onError: (error) => toast.error(error.message) }); }} className="text-[11px] text-gray-500 hover:text-red-600" aria-label={`Delete ${folder.name}`}>Delete</button>
                    </div>
                    {!collapsed && folderChats.map((chat) => (
                      <div key={`${folder.id}-${chat.id}`} className="flex items-center gap-1 border-t border-purple-100/40 pl-4 dark:border-purple-900/30">
                        <button onClick={() => openChat(chat.id)} className="min-w-0 flex-1 truncate py-1.5 text-left text-xs text-gray-600 dark:text-gray-300" title={getDisplayTitle(chat)}>{getDisplayTitle(chat)}</button>
                        <button onClick={() => removeChatMutation.mutate({ folderId: folder.id, chatId: chat.id }, { onError: (error) => toast.error(error.message) })} className="px-2 text-xs text-gray-400 hover:text-red-600" aria-label={`Remove ${getDisplayTitle(chat)} from ${folder.name}`} title="Remove from folder">×</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </section>
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Recent chats</h3>
              <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-100/60 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">{processedChats.length}</span>
            </div>
            {/* Loading */}
            {isChatsLoading && (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-12 rounded-xl bg-purple-100/50 dark:bg-purple-950/30 animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Error */}
            {isChatsError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 space-y-2">
                <p>{chatsError?.message || 'Unable to load chats.'}</p>
                <button
                  onClick={() => refetchChats()}
                  className="font-semibold underline hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Empty state */}
            {!isChatsLoading &&
              !isChatsError &&
              processedChats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-400 mb-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {search.trim() ? 'No matching chats found.' : 'No conversations yet.'}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    Click "+ New Chat" to begin
                  </p>
                </div>
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
                    role="link"
                    tabIndex={0}
                    aria-label={`Open ${displayTitle}`}
                    onClick={() => {
                      navigate(`/main/chat/${chat.id}`);
                      if (window.innerWidth < 768) {
                        setIsMenuOpen(false);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        openChat(chat.id);
                      }
                    }}
                    className={`
                      med-chat-row group relative p-2.5 px-3 rounded-xl cursor-pointer
                      flex items-center justify-between gap-2
                      border transition-all duration-200
                      ${isActive
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800'
                        : 'bg-white/60 dark:bg-[#1a1727]/60 border-purple-100/60 dark:border-purple-950/40 hover:bg-white dark:hover:bg-[#201c30] hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-sm'
                      }
                    `}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-teal-700 dark:bg-teal-300 rounded-r-full" />
                    )}

                    <div className="flex-1 min-w-0 pl-1">
                      <p
                        className={`truncate text-xs font-semibold ${
                          isActive
                            ? 'text-purple-700 dark:text-purple-300'
                            : 'text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                        }`}
                      >
                        {displayTitle}
                      </p>

                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                        {chat.updatedAt && !Number.isNaN(Date.parse(chat.updatedAt))
                          ? moment(chat.updatedAt).fromNow()
                          : 'Recent'}
                      </p>
                    </div>

                    {/* Action buttons on hover */}
                    <div
                      className="
                        flex items-center gap-1
                        opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                        transition-opacity shrink-0
                      "
                    >
                      <button
                        onClick={(event) => togglePin(event, chat.id)}
                        disabled={pinChatMutation.isPending || unpinChatMutation.isPending}
                        className={`p-1 text-xs rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950/50 ${pinnedIds.has(chat.id) ? 'text-purple-700 dark:text-purple-300' : 'text-gray-400'}`}
                        title={pinnedIds.has(chat.id) ? 'Unpin chat' : 'Pin chat'}
                        aria-label={`${pinnedIds.has(chat.id) ? 'Unpin' : 'Pin'} ${displayTitle}`}
                      >
                        {pinnedIds.has(chat.id) ? '📌' : 'Pin'}
                      </button>
                      {folders.length > 0 && (
                        <select
                          value=""
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            event.stopPropagation();
                            const folderId = Number(event.target.value);
                            if (folderId) addChatMutation.mutate({ folderId, chatId: chat.id }, { onError: (error) => toast.error(error.message) });
                          }}
                          disabled={addChatMutation.isPending}
                          aria-label={`Add ${displayTitle} to project folder`}
                          title="Add to project folder"
                          className="max-w-14 rounded-lg bg-transparent text-[10px] text-gray-500 dark:text-gray-400"
                        >
                          <option value="">Folder</option>
                          {folders.filter((folder) => !folder.chatIds.includes(chat.id)).map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                        </select>
                      )}
                      {/* Rename / Edit */}
                      <button
                        onClick={(e) => openEditModal(e, chat)}
                        disabled={updateChatTitleMutation.isPending}
                        className="
                          p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400
                          hover:bg-blue-50 dark:hover:bg-blue-950/50
                          rounded-lg transition-colors cursor-pointer
                        "
                        title="Rename chat"
                        aria-label={`Rename ${displayTitle}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5"
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
                        onClick={(e) => openDeleteModal(e, chat)}
                        disabled={deleteChatMutation.isPending}
                        className="
                          p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400
                          hover:bg-red-50 dark:hover:bg-red-950/50
                          rounded-lg transition-colors cursor-pointer
                        "
                        title="Delete chat"
                        aria-label={`Delete ${displayTitle}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5"
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
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Footer Area: Dark/Light Switch, Credits, User & Logout */}
        <div className="shrink-0 space-y-2.5 pt-3 border-t border-purple-100/70 dark:border-purple-900/30">
          {/* Dedicated Dark / Light Theme Toggle Switch */}
          <div className="med-sidebar-theme p-2.5 rounded-xl bg-white/70 dark:bg-[#1a1727]/70 border border-purple-100 dark:border-purple-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  Switch appearance
                </p>
              </div>
            </div>

            {/* Custom Interactive Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={toggleTheme}
              className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-[#14121e]
                ${theme === 'dark' ? 'bg-teal-600' : 'bg-gray-200'}
              `}
            >
              <span
                aria-hidden="true"
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md
                  ring-0 transition duration-200 ease-in-out flex items-center justify-center
                  ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}
                `}
              >
                {theme === 'dark' ? (
                  <svg className="w-2.5 h-2.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            </button>
          </div>

          {/* Credit Purchase Card */}
          <div
            onClick={() => {
              navigate('/main/credits');
              if (window.innerWidth < 768) {
                setIsMenuOpen(false);
              }
            }}
            className="
              med-sidebar-credits flex items-center justify-between p-2.5
              border border-purple-200/70 dark:border-purple-900/40
              rounded-xl cursor-pointer
              bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-950/60
              transition-all
            "
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <img
                  src={assets.credit_icon}
                  alt="Credits"
                  className="w-5 h-5 object-contain"
                />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {user?.credits ?? 0} Credits
                </p>
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                  Upgrade & Add Credits
                </p>
              </div>
            </div>

            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-purple-600 text-white shadow-sm shadow-purple-500/20">
              Get +
            </span>
          </div>

          {/* User Profile & Logout */}
          <div
            onClick={() => {
              navigate(user ? '/main/profile' : '/auth');
              if (window.innerWidth < 768) {
                setIsMenuOpen(false);
              }
            }}
            className="
              med-sidebar-account flex items-center gap-2.5 p-2
              border border-purple-100 dark:border-purple-950/60
              rounded-xl cursor-pointer
              bg-white/70 dark:bg-[#1a1727]/70
              hover:bg-white dark:hover:bg-[#221e33]
              transition-all
            "
          >
            <div className="relative">
              <img
                src={assets.user_icon}
                alt="User"
                className="w-8 h-8 rounded-full border border-purple-200 dark:border-purple-800 object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#1a1727] rounded-full" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                {user ? user.name : 'Login to continue'}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                {user ? user.email : 'Tap to sign in'}
              </p>
            </div>

            {user && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                disabled={logoutMutation.isPending}
                className="
                  p-1.5 text-gray-400
                  hover:text-red-600 dark:hover:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-950/40
                  rounded-lg transition-colors cursor-pointer
                  disabled:opacity-50
                "
                title="Sign out"
                aria-label="Sign out"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
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
        </div>
      </div>

      {/* Backdrop for Mobile */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Interactive Title / Rename / Delete Modal */}
      <ChatModal
        isOpen={modalMode !== null}
        mode={modalMode}
        initialTitle={activeChat?.title || ''}
        chatId={activeChat?.id ?? null}
        isLoading={isModalLoading}
        onClose={() => {
          if (!isModalLoading) {
            setModalMode(null);
            setActiveChat(null);
          }
        }}
        onSubmit={(title, chatId) => {
          if (modalMode === 'create') {
            handleCreateChat(title);
          } else if (modalMode === 'edit') {
            handleSaveTitle(title, chatId);
          }
        }}
        onConfirmDelete={(chatId) => {
          handleConfirmDelete(chatId);
        }}
      />
    </>
  );
}
