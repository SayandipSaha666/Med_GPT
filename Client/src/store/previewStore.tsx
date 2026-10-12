import { createContext, useContext, useState, ReactNode } from 'react';

export interface PreviewFile {
  id?: string;
  name: string;
  url: string;
  mime: string;
  sizeBytes?: number;
  file?: File;
}

interface IFilePreviewContext {
  previewFile: PreviewFile | null;
  isOpen: boolean;
  isMinimized: boolean;
  openPreview: (file: PreviewFile) => void;
  closePreview: () => void;
  minimizePreview: () => void;
  restorePreview: () => void;
  toggleMinimize: () => void;
}

const FilePreviewContext = createContext<IFilePreviewContext | undefined>(undefined);

export function FilePreviewProvider({ children }: { children: ReactNode }) {
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const openPreview = (file: PreviewFile) => {
    setPreviewFile(file);
    setIsOpen(true);
    setIsMinimized(false);
  };

  const closePreview = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setPreviewFile(null);
  };

  const minimizePreview = () => {
    setIsMinimized(true);
  };

  const restorePreview = () => {
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  return (
    <FilePreviewContext.Provider
      value={{
        previewFile,
        isOpen,
        isMinimized,
        openPreview,
        closePreview,
        minimizePreview,
        restorePreview,
        toggleMinimize,
      }}
    >
      {children}
    </FilePreviewContext.Provider>
  );
}

export function useFilePreview() {
  const context = useContext(FilePreviewContext);
  if (!context) {
    throw new Error('useFilePreview must be used within a FilePreviewProvider');
  }
  return context;
}
