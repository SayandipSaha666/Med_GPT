import React, { useState } from 'react';
import moment from 'moment';
import { assets } from '../assets/assets';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

import { formatBytes, getFileCategory } from '../api/files/files.service';
import { useFilePreview } from '../store/previewStore';

export interface MessageFile {
  id: string;
  name: string;
  mime: string;
  sizeBytes: number;
  url: string;
  status?: string;
}

export interface MessageProps {
  message: {
    id?: number | string;
    role?: string;
    content: string;
    timestamp?: string | Date;
    isImage?: boolean;
    files?: MessageFile[];
    agentType?: string | null;
    metadata?: Record<string, unknown> | null;
  };
  onEdit?: (messageId: number | string, newContent: string) => Promise<void> | void;
  onDelete?: (messageId: number | string) => Promise<void> | void;
  isSending?: boolean;
}

/**
 * Extracts attached file links from message content if they were appended as text,
 * so they can be rendered as visual previews instead of raw markdown text links.
 */
function parseFilesAndContent(rawContent: string, existingFiles?: MessageFile[]) {
  const files: MessageFile[] = existingFiles ? [...existingFiles] : [];
  let cleanText = rawContent || '';

  // Extract markdown formatted file attachments [File Attachment: name](url)
  const attachmentRegex = /\[File Attachment:\s*([^\]]+)\]\(([^)]+)\)/gi;
  let match: RegExpExecArray | null;
  while ((match = attachmentRegex.exec(rawContent)) !== null) {
    const [, name, url] = match;
    const isImage = /\.(png|jpe?g|webp|gif|bmp|svg)/i.test(name) ||
      /\.(png|jpe?g|webp|gif|bmp|svg)/i.test(url) ||
      url.includes('/image/');

    if (!files.some((f) => f.url === url)) {
      files.push({
        id: url,
        name: name.trim(),
        mime: isImage ? 'image/jpeg' : 'application/pdf',
        sizeBytes: 0,
        url: url.trim(),
      });
    }
  }

  // Remove the appended attachment text blocks from the visual content
  cleanText = cleanText
    .replace(/Attached Medical Documents?:\s*(\[File Attachment:[^\]]+\]\([^)]+\)\s*)+/gi, '')
    .replace(/Please review and summarize the attached medical document\(s\):\s*(\[File Attachment:[^\]]+\]\([^)]+\)\s*)+/gi, '')
    .replace(/\[File Attachment:\s*([^\]]+)\]\(([^)]+)\)/gi, '')
    .trim();

  return { cleanText, files };
}

export const Message: React.FC<MessageProps> = ({
  message,
  onEdit,
  onDelete,
  isSending = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const { openPreview } = useFilePreview();

  const isUser = message?.role === 'user';
  const generationStatus = String(message?.metadata?.generationStatus || '');
  const progressMessage = String(message?.metadata?.progressMessage || '');
  const isGenerating = ['queued', 'running', 'routing', 'handed_off', 'generating'].includes(generationStatus);
  const { cleanText, files: allFiles } = parseFilesAndContent(message.content, message.files);
  const [editContent, setEditContent] = useState(cleanText || message.content);

  const imageFiles = allFiles.filter(
    (f) => f.mime?.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)/i.test(f.url)
  );
  const nonImageFiles = allFiles.filter(
    (f) => !f.mime?.startsWith('image/') && !/\.(png|jpe?g|webp|gif|bmp|svg)/i.test(f.url)
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanText || message.content);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    setEditContent(cleanText || message.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditContent(cleanText || message.content);
    setIsEditing(false);
  };

  const handleResubmit = async () => {
    if (!editContent.trim() || isSubmittingEdit) return;
    if (!onEdit || message.id == null) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSubmittingEdit(true);
      await onEdit(message.id, editContent.trim());
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update message');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || message.id == null) return;
    if (confirm('Delete this message and its corresponding assistant response?')) {
      try {
        await onDelete(message.id);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete message');
      }
    }
  };

  const handleFilePreview = (file: MessageFile) => {
    openPreview({
      id: file.id,
      name: file.name,
      url: file.url,
      mime: file.mime,
      sizeBytes: file.sizeBytes,
    });
  };

  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} my-3 animate-fade-in group`}>
      <div
        className={`
          flex items-start gap-3 max-w-[92%] sm:max-w-2xl
          ${isUser ? 'flex-row-reverse' : 'flex-row'}
        `}
      >
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-sm flex items-center justify-center">
              <img
                src={assets.user_icon}
                alt="User"
                className="w-full h-full rounded-[10px] object-cover bg-white dark:bg-gray-800"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[10px] flex items-center justify-center p-1">
                <img
                  src={assets.logo_full}
                  alt="MedGPT"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Message Container */}
        <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Rendered Attached Image Preview Window/Card */}
          {imageFiles.length > 0 && (
            <div className={`flex flex-wrap gap-2.5 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {imageFiles.map((file, idx) => (
                <div
                  key={file.id || idx}
                  className="relative group/preview rounded-2xl overflow-hidden border border-purple-200/80 dark:border-purple-800/60 shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-[#1a172a]"
                >
                  <button
                    type="button"
                    onClick={() => handleFilePreview(file)}
                    className="block relative cursor-pointer text-left focus:outline-none"
                    title={`Click to open full preview of ${file.name || 'image'}`}
                  >
                    <img
                      src={file.url}
                      alt={file.name || 'Prescription scan'}
                      className="w-32 h-32 sm:w-44 sm:h-44 object-cover rounded-2xl group-hover/preview:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {/* Hover Overlay with Preview Icon */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1 backdrop-blur-[1px] rounded-2xl">
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <span className="text-[11px] tracking-wide">Click to Preview</span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Non-image Document Attachments (PDF, DOCX) */}
          {nonImageFiles.length > 0 && (
            <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {nonImageFiles.map((file, idx) => {
                const category = getFileCategory(file.mime);
                return (
                  <button
                    key={file.id || idx}
                    type="button"
                    onClick={() => handleFilePreview(file)}
                    className={`
                      flex items-center gap-2 p-2 px-3 rounded-xl transition-all duration-200 cursor-pointer text-left
                      ${isUser
                        ? 'bg-purple-900/60 hover:bg-purple-800/80 text-white border border-purple-400/30'
                        : 'bg-purple-50 dark:bg-[#201c34] hover:bg-purple-100 dark:hover:bg-[#282342] text-gray-800 dark:text-gray-100 border border-purple-200/80 dark:border-purple-800/40'
                      }
                      shadow-xs max-w-xs
                    `}
                    title={`Click to preview ${file.name}`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${category === 'pdf' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold truncate max-w-[140px]">{file.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Bubble */}
          <div className="relative group/bubble">
            {/* User Action Buttons (Edit / Delete) */}
            {isUser && !isEditing && (onEdit || onDelete) && (
              <div className="absolute -top-3.5 right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-[#1f1b33] border border-purple-200 dark:border-purple-800/70 shadow-md rounded-lg p-0.5 z-10 text-gray-500 dark:text-gray-300">
                {onEdit && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    disabled={isSending}
                    className="p-1 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded cursor-pointer transition-colors disabled:opacity-40"
                    title="Edit message"
                    aria-label="Edit message"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSending}
                    className="p-1 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded cursor-pointer transition-colors disabled:opacity-40"
                    title="Delete message and AI response"
                    aria-label="Delete message"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            <div
              className={`
                relative p-3.5 sm:p-4 rounded-2xl text-sm
                ${isUser
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-xs shadow-md shadow-purple-500/15'
                  : 'bg-white dark:bg-[#181527] border border-purple-100 dark:border-purple-900/50 text-gray-800 dark:text-gray-100 rounded-tl-xs shadow-sm shadow-purple-500/5'
                }
              `}
            >
              {isGenerating && (
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-purple-700 dark:text-purple-300" role="status" aria-live="polite">
                  <span className="inline-block h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                  <span>{progressMessage || 'Generating a response…'}</span>
                </div>
              )}
              {isEditing ? (
                /* Inline Edit Mode */
                <div className="flex flex-col gap-2.5 min-w-[260px] sm:min-w-[340px]">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-xl bg-white/20 text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none min-h-[70px] scrollbar-thin"
                    rows={Math.max(2, editContent.split('\n').length)}
                    autoFocus
                    placeholder="Edit your message..."
                  />
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/20">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSubmittingEdit}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleResubmit}
                      disabled={!editContent.trim() || isSubmittingEdit}
                      className="px-3.5 py-1 text-xs font-bold rounded-lg bg-white text-purple-700 hover:bg-purple-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSubmittingEdit ? (
                        <>
                          <svg className="w-3 h-3 animate-spin text-purple-700" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>Resubmitting...</span>
                        </>
                      ) : (
                        <span>Resubmit</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : message.isImage ? (
                <img
                  src={message.content}
                  alt="Generated medical graphic"
                  className="w-full max-w-md rounded-xl object-cover shadow-md"
                />
              ) : (
                /* Rich Markdown Rendering with remark-gfm */
                <div
                  className={`
                    prose prose-sm max-w-none break-words
                    ${isUser
                      ? 'prose-invert text-white'
                      : 'dark:prose-invert text-gray-800 dark:text-gray-100'
                    }
                  `}
                >
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-base font-bold text-purple-700 dark:text-purple-300 mt-3 mb-1.5">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-sm font-bold text-purple-600 dark:text-purple-300 mt-2.5 mb-1">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-2 mb-1 uppercase tracking-wide">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="leading-relaxed mb-2 last:mb-0 text-inherit">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-outside ml-4 space-y-1 mb-2 text-inherit">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-outside ml-4 space-y-1 mb-2 text-inherit">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-relaxed text-inherit">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-inherit">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-inherit">{children}</em>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-purple-500 pl-3 py-1 my-2 bg-purple-50/70 dark:bg-purple-950/40 rounded-r-lg text-xs italic">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-2 rounded-xl border border-purple-200/80 dark:border-purple-900/60 shadow-xs">
                          <table className="w-full text-left text-xs border-collapse">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-purple-100/70 dark:bg-purple-950/60 font-semibold">{children}</thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="divide-y divide-purple-100 dark:divide-purple-900/40">{children}</tbody>
                      ),
                      tr: ({ children }) => (
                        <tr className="hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-colors">{children}</tr>
                      ),
                      th: ({ children }) => (
                        <th className="p-2 font-semibold border-b border-purple-200 dark:border-purple-800">{children}</th>
                      ),
                      td: ({ children }) => (
                        <td className="p-2 border-purple-100 dark:border-purple-900/40">{children}</td>
                      ),
                      code: ({ inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline ? (
                          <div className="relative my-2 rounded-xl overflow-hidden bg-gray-900 text-gray-100 border border-purple-900/40 shadow-sm">
                            {match && (
                              <div className="flex items-center justify-between px-3 py-1 bg-gray-800 text-[10px] text-gray-400 font-mono border-b border-gray-700">
                                <span>{match[1]}</span>
                              </div>
                            )}
                            <pre className="p-3 text-xs overflow-x-auto font-mono">
                              <code className={className} {...props}>{children}</code>
                            </pre>
                          </div>
                        ) : (
                          <code
                            className={`px-1.5 py-0.5 rounded-md font-mono text-xs ${
                              isUser
                                ? 'bg-white/20 text-white'
                                : 'bg-purple-100/70 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200'
                            }`}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 underline font-medium break-all"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {cleanText}
                  </Markdown>
                </div>
              )}

              {/* Assistant Footer Action Buttons */}
              {!isUser && !message.isImage && (
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 dark:border-purple-950/50 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Clinical Reference
                  </span>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-300 transition-colors p-1 rounded cursor-pointer"
                    title="Copy text"
                  >
                    {copied ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <span
            className={`
              text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1 font-medium
              ${isUser ? 'text-right' : 'text-left'}
            `}
          >
            {message.timestamp && !Number.isNaN(Date.parse(String(message.timestamp)))
              ? moment(message.timestamp).format('h:mm A')
              : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Message;
