/**
 * BroadcastChannel wrapper for cross-tab synchronization.
 *
 * This provides a type-safe wrapper around the BroadcastChannel API
 * for syncing data across browser tabs.
 */

type ChannelMessage<T extends string> =
  | { type: T; payload?: unknown }
  | { type: 'credit-update'; credits: number }
  | { type: 'chat-deleted'; chatId: number }
  | { type: 'chat-pinned'; chatId: number }
  | { type: 'chat-unpinned'; chatId: number }
  | { type: 'chat-moved-to-folder'; chatId: number; folderId: number };

class BroadcastChannelWrapper<T extends string> {
  private channel: BroadcastChannel;
  private callbacks: Map<string, (data: ChannelMessage<T>) => void> = new Map();

  constructor(private channelName: string) {
    this.channel = new BroadcastChannel(channelName);
    this.setupMessageHandler();
  }

  private setupMessageHandler() {
    this.channel.onmessage = (event: MessageEvent) => {
      const data: ChannelMessage<T> = event.data;
      this.callbacks.forEach((callback) => callback(data));
    };
  }

  /**
   * Send a message to all other tabs
   */
  send(type: T, payload?: unknown): void {
    this.channel.postMessage({ type, payload });
  }

  /**
   * Update credits across all tabs
   */
  sendCreditUpdate(credits: number): void {
    this.channel.postMessage({ type: 'credit-update', credits });
  }

  /**
   * Notify other tabs that a chat was deleted
   */
  sendChatDeleted(chatId: number): void {
    this.channel.postMessage({ type: 'chat-deleted', chatId });
  }

  /**
   * Notify other tabs that a chat was pinned
   */
  sendChatPinned(chatId: number): void {
    this.channel.postMessage({ type: 'chat-pinned', chatId });
  }

  /**
   * Notify other tabs that a chat was unpinned
   */
  sendChatUnpinned(chatId: number): void {
    this.channel.postMessage({ type: 'chat-unpinned', chatId });
  }

  /**
   * Notify other tabs that a chat was moved to a folder
   */
  sendChatMovedToFolder(chatId: number, folderId: number): void {
    this.channel.postMessage({ type: 'chat-moved-to-folder', chatId, folderId });
  }

  /**
   * Listen for messages of a specific type
   */
  on(type: T, callback: (data: ChannelMessage<T>) => void): () => void {
    this.callbacks.set(type, callback);
    return () => this.callbacks.delete(type);
  }

  /**
   * Listen for credit updates
   */
  onCreditUpdate(callback: (credits: number) => void): () => void {
    const handler = (data: ChannelMessage<T>) => {
      if (data.type === 'credit-update' && typeof data.credits === 'number') {
        callback(data.credits);
      }
    };
    this.callbacks.set('credit-update', handler);
    return () => this.callbacks.delete('credit-update');
  }

  /**
   * Listen for chat deleted events
   */
  onChatDeleted(callback: (chatId: number) => void): () => void {
    const handler = (data: ChannelMessage<T>) => {
      if (data.type === 'chat-deleted' && typeof data.chatId === 'number') {
        callback(data.chatId);
      }
    };
    this.callbacks.set('chat-deleted', handler);
    return () => this.callbacks.delete('chat-deleted');
  }

  /**
   * Listen for chat pinned events
   */
  onChatPinned(callback: (chatId: number) => void): () => void {
    const handler = (data: ChannelMessage<T>) => {
      if (data.type === 'chat-pinned' && typeof data.chatId === 'number') {
        callback(data.chatId);
      }
    };
    this.callbacks.set('chat-pinned', handler);
    return () => this.callbacks.delete('chat-pinned');
  }

  /**
   * Listen for chat unpinned events
   */
  onChatUnpinned(callback: (chatId: number) => void): () => void {
    const handler = (data: ChannelMessage<T>) => {
      if (data.type === 'chat-unpinned' && typeof data.chatId === 'number') {
        callback(data.chatId);
      }
    };
    this.callbacks.set('chat-unpinned', handler);
    return () => this.callbacks.delete('chat-unpinned');
  }

  /**
   * Listen for chat moved to folder events
   */
  onChatMovedToFolder(callback: (chatId: number, folderId: number) => void): () => void {
    const handler = (data: ChannelMessage<T>) => {
      if (
        data.type === 'chat-moved-to-folder' &&
        typeof data.chatId === 'number' &&
        typeof data.folderId === 'number'
      ) {
        callback(data.chatId, data.folderId);
      }
    };
    this.callbacks.set('chat-moved-to-folder', handler);
    return () => this.callbacks.delete('chat-moved-to-folder');
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
const broadcastChannel = new BroadcastChannelWrapper<'credit-update' | 'chat-deleted' | 'chat-pinned' | 'chat-unpinned' | 'chat-moved-to-folder'>('medgpt-sync');

export default broadcastChannel;
