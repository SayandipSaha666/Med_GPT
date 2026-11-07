import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import type { T_KnowledgeResource, T_MessageSource } from '../api/api.types';

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

export function validResources(resources: T_KnowledgeResource[] | undefined): T_KnowledgeResource[] {
  if (!Array.isArray(resources)) return [];
  const seen = new Set<string>();
  return resources.filter((resource) => {
    if (!resource || !resource.id || seen.has(resource.id)) return false;
    seen.add(resource.id);
    return true;
  });
}

/** The same persisted entry set is rendered below an answer and in the side panel. */
export function KnowledgeResources({ resources, messageId, compact = false, onOpenPanel }: {
  resources?: T_KnowledgeResource[];
  messageId: number | string;
  compact?: boolean;
  onOpenPanel?: () => void;
}) {
  const entries = validResources(resources);
  if (!entries.length) return compact ? <p className="med-resource-empty">No knowledge entries were recorded for this response.</p> : null;
  return <section className={`med-knowledge-resources ${compact ? 'is-compact' : ''}`} aria-label="Knowledge entries used for this response">
    {!compact && <div className="med-resource-section-heading"><h3>Resources <span>{entries.length}</span></h3>{onOpenPanel && <button type="button" onClick={onOpenPanel}>View in panel</button>}</div>}
    <div className="med-resource-list">{entries.map((entry, position) => {
      const url = safeExternalUrl(entry.sourceUrl ?? undefined);
      return <article className="med-resource" key={entry.id} id={compact ? undefined : `resource-${messageId}-${entry.id}`}>
        <span className="med-resource-number" aria-hidden="true">{position + 1}</span>
        <div className="med-resource-copy">
          <strong title={entry.title}>{entry.title || 'Untitled resource'}</strong>
          <small>{entry.source ? entry.source.replace(/_/g, ' ').toLowerCase() : 'Knowledge entry'}{entry.createdAt && !Number.isNaN(Date.parse(entry.createdAt)) ? ` · ${new Date(entry.createdAt).toLocaleDateString()}` : ''}</small>
          {entry.excerpt && <p>{entry.excerpt}</p>}
          {url && <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${entry.title || 'resource'} in a new tab`}>Open source ↗</a>}
          {!url && <button type="button" onClick={() => void navigator.clipboard.writeText([entry.title || 'Untitled resource', entry.source || 'Knowledge entry', entry.excerpt || ''].filter(Boolean).join('\n')).then(() => toast.success('Resource details copied')).catch(() => toast.error('Could not copy resource details'))}>Copy details</button>}
        </div>
      </article>;
    })}</div>
  </section>;
}

export function withCitationLinks(children: ReactNode, sources: T_MessageSource[] | undefined, messageId: number | string, resources?: T_KnowledgeResource[]): ReactNode {
  const indexes = new Set(validSources(sources).map((source) => source.index));
  const entries = validResources(resources);
  if (typeof children === 'string') {
    return children.split(/(\[knowledge:[a-f\d-]{36}\]|\[\d+\])/gi).map((part, position) => {
      const knowledgeId = /^\[knowledge:([a-f\d-]{36})\]$/i.exec(part)?.[1];
      const resourceIndex = entries.findIndex((entry) => entry.id === knowledgeId);
      if (resourceIndex >= 0) return <a className="med-citation" href={`#resource-${messageId}-${knowledgeId}`} key={`${position}-${knowledgeId}`} aria-label={`Knowledge resource ${resourceIndex + 1}`}>{resourceIndex + 1}</a>;
      const match = /^\[(\d+)\]$/.exec(part);
      const index = match ? Number(match[1]) : 0;
      return indexes.has(index) ? <a className="med-citation" href={`#source-${messageId}-${index}`} key={`${position}-${index}`} aria-label={`Source ${index}`}>{index}</a> : part;
    });
  }
  if (Array.isArray(children)) return children.map((child) => withCitationLinks(child, sources, messageId, resources));
  return children;
}
