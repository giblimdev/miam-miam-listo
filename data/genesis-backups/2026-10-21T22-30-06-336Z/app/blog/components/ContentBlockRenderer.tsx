/*
path :           app/blog/components/ContentBlockRenderer.tsx
tag :            ["blog", "component", "content-block", "renderer", "recursive"]
projectId:       new-genesis
type :           component
generic:         false

role:            Rendu récursif d'un arbre de blocs de contenu côté
                 public. Importe resolveMediaUrl depuis media-url
                 (client-safe). Aucune interaction client : Server
                 Component pur. Un <img loading="lazy"> par bloc image,
                 <video> / <audio> contrôlés, <pre> pour le code, iframe
                 sandbox pour les embeds, lien téléchargement pour les
                 documents.

flow:            Props { nodes: TreeNode<ContentBlock>[] } → rend chaque
                 nœud → récursion sur children avec depth + 1.

ecosystem:       BlogUI = [
                   ... (identique à Livraison 1)
                 ]

relatedFiles:    ["@/app/blog/lib/types.ts",
                  "@/app/blog/lib/tree.ts",
                  "@/app/blog/lib/media-url.ts"]

imports:         ["@/app/blog/lib/types",
                  "@/app/blog/lib/tree",
                  "@/app/blog/lib/media-url"]

exports:         ["ContentBlockRenderer", "ContentBlockRendererProps"]

useBy:           ["@/app/blog/components/ArticleBody.tsx"]

userStories:     ["us4100003", "us1100005"]
status:          done
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

import type {
  AudioBlock,
  CodeBlock,
  ContentBlock,
  DocumentBlock,
  EmbedBlock,
  ImageBlock,
  ParagraphBlock,
  SectionBlock,
  VideoBlock,
} from "@/app/blog/lib/types";
import type { TreeNode } from "@/app/blog/lib/tree";
import { resolveMediaUrl } from "@/app/blog/lib/media-url";

export interface ContentBlockRendererProps {
  readonly nodes: readonly TreeNode<ContentBlock>[];
  readonly depth?: number;
}

function headingFor(depth: number, title: string, id: string) {
  const cls =
    depth <= 1
      ? "text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
      : depth === 2
        ? "text-xl font-bold tracking-tight text-foreground sm:text-2xl"
        : "text-lg font-bold tracking-tight text-foreground sm:text-xl";
  if (depth <= 1) {
    return (
      <h2 id={id} className={`scroll-mt-24 ${cls}`}>
        {title}
      </h2>
    );
  }
  if (depth === 2) {
    return (
      <h3 id={id} className={`scroll-mt-24 ${cls}`}>
        {title}
      </h3>
    );
  }
  return (
    <h4 id={id} className={`scroll-mt-24 ${cls}`}>
      {title}
    </h4>
  );
}

function renderLeaf(block: ContentBlock, depth: number): React.ReactNode {
  switch (block.type) {
    case "paragraph": {
      const b = block as ParagraphBlock;
      return (
        <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
          {b.text}
        </p>
      );
    }
    case "image": {
      const b = block as ImageBlock;
      return (
        <figure className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveMediaUrl(b.path)}
            alt={b.alt}
            width={b.width}
            height={b.height}
            loading="lazy"
            className="w-full rounded-xl border border-border/60 object-cover"
          />
          {(b.caption || b.credit) && (
            <figcaption className="text-xs text-muted-foreground">
              {b.caption}
              {b.credit && (
                <span className="ml-1 opacity-70">— {b.credit}</span>
              )}
            </figcaption>
          )}
        </figure>
      );
    }
    case "video": {
      const b = block as VideoBlock;
      return (
        <figure className="space-y-2">
          <video
            src={resolveMediaUrl(b.path)}
            poster={b.poster ? resolveMediaUrl(b.poster) : undefined}
            controls
            preload="metadata"
            className="w-full rounded-xl border border-border/60"
          />
          {b.caption && (
            <figcaption className="text-xs text-muted-foreground">
              {b.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case "audio": {
      const b = block as AudioBlock;
      return (
        <figure className="space-y-2">
          <audio
            src={resolveMediaUrl(b.path)}
            controls
            preload="metadata"
            className="w-full"
          />
          {b.caption && (
            <figcaption className="text-xs text-muted-foreground">
              {b.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case "code": {
      const b = block as CodeBlock;
      return (
        <figure className="space-y-2">
          <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground/90">
            <code>{b.code}</code>
          </pre>
          {(b.caption || b.language) && (
            <figcaption className="text-xs text-muted-foreground">
              {b.language}
              {b.caption && <span className="ml-2">{b.caption}</span>}
            </figcaption>
          )}
        </figure>
      );
    }
    case "embed": {
      const b = block as EmbedBlock;
      return (
        <figure className="space-y-2">
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-muted/40">
            <iframe
              src={b.url}
              title={`${b.provider} embed`}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          {b.caption && (
            <figcaption className="text-xs text-muted-foreground">
              {b.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case "document": {
      const b = block as DocumentBlock;
      return (
        <a
          href={resolveMediaUrl(b.path)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-chart-2/10 text-chart-2">
            📄
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              {b.title}
            </span>
            <span className="block text-xs text-muted-foreground">
              {b.mimeType} ·{" "}
              {b.sizeBytes >= 1024 * 1024
                ? `${(b.sizeBytes / (1024 * 1024)).toFixed(1)} Mo`
                : `${Math.round(b.sizeBytes / 1024)} Ko`}
            </span>
          </span>
        </a>
      );
    }
    case "section":
      return null; // géré par renderNode
    default:
      return null;
  }
}

function renderNode(
  node: TreeNode<ContentBlock>,
  depth: number,
): React.ReactNode {
  if (node.type === "section") {
    const s = node as TreeNode<SectionBlock>;
    return (
      <section className="space-y-4">
        {headingFor(depth, s.title, s.id)}
        <div className="space-y-4">
          <ContentBlockRenderer nodes={s.children} depth={depth + 1} />
        </div>
      </section>
    );
  }
  return renderLeaf(node, depth);
}

export function ContentBlockRenderer({
  nodes,
  depth = 1,
}: ContentBlockRendererProps) {
  return (
    <div className="space-y-4">
      {nodes.map((node) => (
        <div key={node.id}>{renderNode(node, depth)}</div>
      ))}
    </div>
  );
}