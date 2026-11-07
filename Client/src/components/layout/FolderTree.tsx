import type { ReactNode } from 'react';
import type { T_Chat, T_ChatFolder } from '../../api/api.types';

interface Props {
  folders: T_ChatFolder[];
  chats: T_Chat[];
  collapsedIds: number[];
  activePath: string;
  onToggle: (id: number) => void;
  onOpenFolder: (id: number) => void;
  onOpenChat: (id: number) => void;
  onNewChat: (id: number) => void;
  onNewChild: (id: number) => void;
  onRename: (folder: T_ChatFolder) => void;
  onDelete: (folder: T_ChatFolder) => void;
  onRemoveChat: (folderId: number, chatId: number) => void;
}

export function FolderTree({ folders, chats, collapsedIds, activePath, onToggle, onOpenFolder, onOpenChat, onNewChat, onNewChild, onRename, onDelete, onRemoveChat }: Props) {
  const renderLevel = (parentId: number | null, lineage: Set<number>): ReactNode => folders.filter((folder) => folder.parentId === parentId && !lineage.has(folder.id)).map((folder) => {
    const nextLineage = new Set(lineage).add(folder.id);
    const collapsed = collapsedIds.includes(folder.id);
    const folderChats = chats.filter((chat) => folder.chatIds.includes(chat.id));
    return <div key={folder.id} className="med-folder-node">
      <div className={`med-folder-row ${activePath === `/main/folder/${folder.id}` ? 'is-active' : ''}`}>
        <button type="button" className="med-folder-action" onClick={() => onToggle(folder.id)} aria-expanded={!collapsed} aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${folder.name}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={collapsed ? 'is-collapsed' : ''}><path d="m6 9 6 6 6-6" /></svg></button>
        <button type="button" className="med-folder-name" onClick={() => onOpenFolder(folder.id)} title={folder.name}><svg className="med-folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 6h7l2 2h9v11H3z" /></svg>{folder.name}</button>
        <details className="med-folder-menu"><summary className="med-folder-action" aria-label={`Actions for ${folder.name}`}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></summary>
          <div role="group" aria-label={`${folder.name} actions`}>
            <button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); onNewChat(folder.id); }}>New chat</button>
            <button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); onNewChild(folder.id); }}>New subfolder</button>
            <button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); onRename(folder); }}>Rename</button>
            <button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); onDelete(folder); }}>Delete</button>
          </div>
        </details>
      </div>
      {!collapsed && <div className="med-folder-children">
        {renderLevel(folder.id, nextLineage)}
        {folderChats.map((chat) => <div className="med-folder-chat" key={chat.id}>
          <button type="button" onClick={() => onOpenChat(chat.id)} title={chat.title}>{chat.title || 'New chat'}</button>
          <button type="button" onClick={() => onRemoveChat(folder.id, chat.id)} aria-label={`Remove ${chat.title || 'chat'} from ${folder.name}`} title="Remove from folder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" /></svg></button>
        </div>)}
        {folderChats.length === 0 && !folders.some((item) => item.parentId === folder.id) && <div className="med-folder-empty">No chats yet</div>}
      </div>}
    </div>;
  });
  return <div className="med-folder-tree">{renderLevel(null, new Set())}{folders.length === 0 && <p className="med-folder-empty">Create a folder to organize chats.</p>}</div>;
}
