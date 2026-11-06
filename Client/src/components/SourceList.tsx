import type { ReactNode } from 'react';
import type { T_MessageSource } from '../api/api.types';

export function safeExternalUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return (value === value.trim() && (url.protocol === 'https:' || url.protocol === 'http:')) ? value : null;
  } catch {
    return null;
  }
}

export function validSources(sources: T_MessageSource[] | undefined): T_MessageSource[] {
  if (!Array.isArray(sources)) return [];
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (!source || !Number.isInteger(source.index) || source.index < 1 || !safeExternalUrl(source.url)) return false;
    const key = source.type === 'file' ? `file:${source.fileId}:${source.chunkIdx ?? ''}` : `web:${safeExternalUrl(source.url)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function SourceList({ sources, messageId }: { sources?: T_MessageSource[]; messageId: number | string; }) {
  const visible = validSources(sources);
  if (visible.length === 0) return null;

  return (
    <section className="med-sources" aria-label="Sources for this answer">
      <h3>Sources <span>{visible.length}</span></h3>
      <div className="med-source-list">
        {visible.map((source) => (
          <a
            id={`source-${messageId}-${source.index}`}
            key={`${source.type}-${source.index}-${source.url}`}
            href={safeExternalUrl(source.url) ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="med-source"
          >
            <span className="med-source-index">{source.index}</span>
            <span className="med-source-copy">
              <strong>{source.title || (source.type === 'file' ? source.fileName : source.domain)}</strong>
              <small>{source.type === 'file' ? source.fileName : source.domain}</small>
              {source.snippet && <span className="med-source-snippet">{source.snippet}</span>}
            </span>
            <svg className="med-source-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
          </a>
        ))}
      </div>
    </section>
  );
}

export function withCitationLinks(children: ReactNode, sources: T_MessageSource[] | undefined, messageId: number | string): ReactNode {
  const indexes = new Set(validSources(sources).map((source) => source.index));
  if (typeof children === 'string') {
    return children.split(/(\[\d+\])/g).map((part, position) => {
      const match = /^\[(\d+)\]$/.exec(part);
      const index = match ? Number(match[1]) : 0;
      return indexes.has(index) ? <a className="med-citation" href={`#source-${messageId}-${index}`} key={`${position}-${index}`} aria-label={`Source ${index}`}>{index}</a> : part;
    });
  }
  if (Array.isArray(children)) return children.map((child) => withCitationLinks(child, sources, messageId));
  return children;
}
