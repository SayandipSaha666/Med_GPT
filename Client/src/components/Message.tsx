import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { assets } from '../assets/assets';
import Markdown from 'react-markdown';
import Prism from 'prismjs';
import toast from 'react-hot-toast';

import { formatBytes, getFileCategory } from '../api/files/files.service';
import { useFilePreview } from '../store/previewStore';

interface MessageProps {
  message: {
    role?: string;
    content: string;
    timestamp?: string | Date;
    isImage?: boolean;
    files?: Array<{
      id: string;
      name: string;
      mime: string;
      sizeBytes: number;
      url: string;
      status?: string;
    }>;
  };
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const { openPreview } = useFilePreview();

  useEffect(() => {
    Prism.highlightAll();
  }, [message.content]);

  const isUser = message?.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} my-3 animate-fade-in`}>
      <div
        className={`
          flex items-start gap-3 max-w-[88%] sm:max-w-2xl
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

        {/* Bubble */}
        <div className="flex flex-col min-w-0">
          <div
            className={`
              relative p-3.5 sm:p-4 rounded-2xl text-sm
              ${isUser
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-xs shadow-md shadow-purple-500/15'
                : 'bg-white dark:bg-[#181527] border border-purple-100 dark:border-purple-900/50 text-gray-800 dark:text-gray-100 rounded-tl-xs shadow-sm shadow-purple-500/5'
              }
            `}
          >
            {/* Attached Files / Reports / Scans */}
            {message.files && message.files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.files.map((file, idx) => {
                  const isImg = file.mime?.startsWith('image/');
                  const category = getFileCategory(file.mime);

                  const handleFileClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    openPreview({
                      id: file.id,
                      name: file.name,
                      url: file.url,
                      mime: file.mime,
                      sizeBytes: file.sizeBytes,
                    });
                  };

                  if (isImg) {
                    return (
                      <button
                        key={file.id || idx}
                        type="button"
                        onClick={handleFileClick}
                        className="group relative block rounded-xl overflow-hidden border border-purple-200/50 dark:border-purple-800/50 hover:scale-[1.02] transition-transform duration-200 shadow-sm cursor-pointer text-left"
                        title={`Click to preview ${file.name}`}
                      >
                        <img
                          src={file.url}
                          alt={file.name}
                          className="max-h-48 max-w-full sm:max-w-xs object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Preview Scan
                        </div>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={file.id || idx}
                      type="button"
                      onClick={handleFileClick}
                      className={`
                        flex items-center gap-2.5 p-2 px-3 rounded-xl transition-all duration-200 cursor-pointer text-left
                        ${isUser
                          ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                          : 'bg-purple-50/80 dark:bg-[#201c34] hover:bg-purple-100/70 dark:hover:bg-[#282342] text-gray-800 dark:text-gray-100 border border-purple-200/80 dark:border-purple-800/40'
                        }
                        shadow-xs max-w-xs
                      `}
                      title={`Click to preview ${file.name}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${category === 'pdf'
                        ? 'bg-rose-500/20 text-rose-300 dark:text-rose-400'
                        : category === 'doc'
                          ? 'bg-blue-500/20 text-blue-300 dark:text-blue-400'
                          : 'bg-purple-500/20 text-purple-300 dark:text-purple-400'
                        }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className="text-xs font-semibold truncate max-w-[150px]">
                          {file.name}
                        </span>
                        <span className="text-[10px] opacity-75">
                          {formatBytes(file.sizeBytes)} • Preview
                        </span>
                      </div>
                      <svg className="w-3.5 h-3.5 opacity-60 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            )}

            {message.isImage ? (
              <img
                src={message.content}
                alt="Generated medical graphic"
                className="w-full max-w-md rounded-xl object-cover shadow-md"
              />
            ) : (
              <div
                className={`
                  prose prose-sm max-w-none break-words
                  ${isUser
                    ? 'prose-invert text-white'
                    : 'dark:prose-invert text-gray-800 dark:text-gray-100 prose-headings:text-purple-700 dark:prose-headings:text-purple-300 prose-a:text-blue-500'
                  }
                `}
              >
                <Markdown>{message.content}</Markdown>
              </div>
            )}

            {/* Assistant Action Buttons */}
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
