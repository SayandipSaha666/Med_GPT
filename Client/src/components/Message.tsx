import React, { useEffect } from 'react';
import moment from 'moment';
import { assets } from '../assets/assets';
import Markdown from 'react-markdown';
import Prism from 'prismjs';

interface MessageProps {
  message: {
    role?: string;
    content: string;
    timestamp?: string | Date;
    isImage?: boolean;
  };
}

const Message: React.FC<MessageProps> = ({ message }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [message.content]);

  return (
    <div>
      {message?.role === 'user' ? (
        <div className="flex items-start justify-end my-4 gap-2">
          <div className="flex flex-col gap-2 p-2 px-4 bg-slate-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/30 rounded-xl max-w-2xl">
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
              <Markdown>{message.content}</Markdown>
            </div>
            <span className="text-xs text-gray-400 dark:text-purple-300">
              {message.timestamp ? moment(message.timestamp).fromNow() : ''}
            </span>
          </div>
          <img
            src={assets.user_icon}
            alt="User"
            className="w-8 h-8 rounded-full"
          />
        </div>
      ) : (
        <div className="inline-flex flex-col gap-2 p-2 px-4 max-w-2xl bg-gray-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/30 rounded-xl my-4">
          {message.isImage ? (
            <img
              src={message.content}
              alt="Generated"
              className="w-full max-w-96 rounded-xl"
            />
          ) : (
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
              <Markdown>{message.content}</Markdown>
            </div>
          )}
          <span className="text-xs text-gray-400 dark:text-purple-300">
            {message.timestamp ? moment(message.timestamp).fromNow() : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default Message;
