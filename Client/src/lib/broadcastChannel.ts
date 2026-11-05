/**
 * BroadcastChannel wrapper for cross-tab synchronization.
 *
 * This provides a type-safe wrapper around the BroadcastChannel API
 * for syncing data across browser tabs.
 */

type ChannelPayload =
  | { type: 'credit-update'; credits: number }
  | { type: 'chat-deleted'; chatId: number }
  | { type: 'chat-pinned'; chatId: number }
  | { type: 'chat-unpinned'; chatId: number }
  | { type: 'chat-moved-to-folder'; chatId: number; folderId: number }
  | { type: 'folders-changed' };
type ChannelMessage = ChannelPayload & { userId: string };

class BroadcastChannelWrapper {
  private channel: BroadcastChannel;
  private callbacks: Set<(data: ChannelMessage) => void> = new Set();
  private userId: string | null = null;

  constructor(channelName: string) {
    this.channel = new BroadcastChannel(channelName);
    this.setupMessageHandler();
  }

  private setupMessageHandler() {
    this.channel.onmessage = (event: MessageEvent) => {
      const data: ChannelMessage = event.data;
      if (!data || typeof data !== 'object' || !('type' in data) || !this.userId || data.userId !== this.userId) return;
      this.callbacks.forEach((callback) => callback(data));
    };
  }

  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  private post(message: ChannelPayload): void {
    if (this.userId) this.channel.postMessage({ ...message, userId: this.userId });
  }

  /**
   * Update credits across all tabs
   */
  sendCreditUpdate(credits: number): void {
    this.post({ type: 'credit-update', credits });
  }

  /**
   * Notify other tabs that a chat was deleted
   */
  sendChatDeleted(chatId: number): void {
    this.post({ type: 'chat-deleted', chatId });
  }

  /**
   * Notify other tabs that a chat was pinned
   */
  sendChatPinned(chatId: number): void {
    this.post({ type: 'chat-pinned', chatId });
  }

  /**
   * Notify other tabs that a chat was unpinned
   */
  sendChatUnpinned(chatId: number): void {
    this.post({ type: 'chat-unpinned', chatId });
  }

  /**
   * Notify other tabs that a chat was moved to a folder
   */
  sendChatMovedToFolder(chatId: number, folderId: number): void {
    this.post({ type: 'chat-moved-to-folder', chatId, folderId });
  }

  sendFoldersChanged(): void {
    this.post({ type: 'folders-changed' });
  }

  /**
   * Listen for credit updates
   */
  onCreditUpdate(callback: (credits: number) => void): () => void {
    const handler = (data: ChannelMessage) => {
      if (data.type === 'credit-update' && typeof data.credits === 'number') {
        callback(data.credits);
      }
    };
    this.callbacks.add(handler);
    return () => this.callbacks.delete(handler);
  }

  /**
   * Listen for chat deleted events
   */
  onChatDeleted(callback: (chatId: number) => void): () => void {
    const handler = (data: ChannelMessage) => {
      if (data.type === 'chat-deleted' && typeof data.chatId === 'number') {
        callback(data.chatId);
      }
    };
    this.callbacks.add(handler);
    return () => this.callbacks.delete(handler);
  }

  /**
   * Listen for chat pinned events
   */
  onChatPinned(callback: (chatId: number) => void): () => void {
    const handler = (data: ChannelMessage) => {
      if (data.type === 'chat-pinned' && typeof data.chatId === 'number') {
        callback(data.chatId);
      }
    };
    this.callbacks.add(handler);
    return () => this.callbacks.delete(handler);
  }

  /**
   * Listen for chat unpinned events
   */
  onChatUnpinned(callback: (chatId: number) => void): () => void {
    const handler = (data: ChannelMessage) => {
      if (data.type === 'chat-unpinned' && typeof data.chatId === 'number') {
        callback(data.chatId);
      }
    };
    this.callbacks.add(handler);
    return () => this.callbacks.delete(handler);
  }

  /**
   * Listen for chat moved to folder events
   */
  onChatMovedToFolder(callback: (chatId: number, folderId: number) => void): () => void {
    const handler = (data: ChannelMessage) => {
      if (
        data.type === 'chat-moved-to-folder' &&
        typeof data.chatId === 'number' &&
        typeof data.folderId === 'number'
      ) {
        callback(data.chatId, data.folderId);
      }
    };
    this.callbacks.add(handler);
    return () => this.callbacks.delete(handler);
  }

  onFoldersChanged(callback: () => void): () => void {
    const handler = (data: ChannelMessage) => { if (data.type === 'folders-changed') callback(); };
    this.callbacks.add(handler);
    return () => this.callbacks.delete(handler);
  }

  /**
   * Close the channel and clean up listeners
   */
  close(): void {
    this.channel.close();
    this.callbacks.clear();
  }
}

// Create a singleton instance for the app
const broadcastChannel = new BroadcastChannelWrapper('medgpt-sync');

export default broadcastChannel;
