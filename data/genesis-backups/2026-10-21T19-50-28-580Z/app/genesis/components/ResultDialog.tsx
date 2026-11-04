/*
path :           app/genesis/components/ResultDialog.tsx
tag :            ["genesis", "result", "dialog", "export", "ui"]
projectId:       new-genesis
type:            component
generic:         false

role:            Dialog plein écran qui affiche le résultat d'une sélection
                 (ReadFilesResult). Un segmented control simple (JSON | Markdown)
                 en haut de la zone de contenu permet de basculer la vue — pas
                 de Select, pas de colonne latérale. Largeur 95vw, hauteur 90vh :
                 le bloc <pre> occupe toute la place restante avec scrollbar
                 interne. Copier/Sauvegarder actifs uniquement en mode JSON.

flow:            Reçoit result + open + onOpenChange → useState(view: "json" |
                 "md") → calcule jsonString et mdString → segmented control
                 (2 boutons) bascule la vue → <pre> affiche la vue courante →
                 boutons Copier / Sauvegarder actifs seulement en mode json.

ecosystem:       Genesis = [
                   "@/app/genesis/actions/context-files.ts",
                   "@/app/genesis/actions/exclusions.ts",
                   "@/app/genesis/actions/read-files.ts",
                   "@/app/genesis/actions/write-files.ts",
                   "@/app/genesis/components/ContextFileEditor.tsx",
                   "@/app/genesis/components/ContextOutput.tsx",
                   "@/app/genesis/components/CopyToIaPanel.tsx",
                   "@/app/genesis/components/CreateFilesPanel.tsx",
                   "@/app/genesis/components/ExclusionsDialog.tsx",
                   "@/app/genesis/components/FileTree.tsx",
                   "@/app/genesis/components/FileTreeRow.tsx",
                   "@/app/genesis/components/GenesisNav.tsx",
                   "@/app/genesis/components/ReadFilesPanel.tsx",
                   "@/app/genesis/components/ResultDialog.tsx",
                   "@/app/genesis/components/ScriptInput.tsx",
                   "@/app/genesis/components/ScriptQueue.tsx",
                   "@/app/genesis/components/ScriptQueueItem.tsx",
                   "@/app/genesis/components/WriteReport.tsx",
                   "@/app/genesis/copy-to-ia/page.tsx",
                   "@/app/genesis/create-files/page.tsx",
                   "@/app/genesis/layout.tsx",
                   "@/app/genesis/lib/context-files.ts",
                   "@/app/genesis/lib/exclusions.ts",
                   "@/app/genesis/lib/parse-script.ts",
                   "@/app/genesis/lib/storage.ts",
                   "@/app/genesis/lib/tree.ts",
                   "@/app/genesis/lib/types.ts",
                   "@/app/genesis/lib/validations.ts",
                   "@/app/genesis/lib/write-scripts.ts",
                   "@/app/genesis/page.tsx",
                   "@/app/genesis/read-files/page.tsx",
                 ]

relatedFiles:    ["@/app/genesis/actions/read-files.ts",
                  "@/app/genesis/lib/types.ts"]

imports:         ["react", "lucide-react", "sonner",
                  "@/app/genesis/actions/read-files",
                  "@/app/genesis/lib/types",
                  "@/components/ui/button",
                  "@/components/ui/dialog"]

exports:         ["ResultDialog", "ResultDialogProps"]

useBy:           ["@/app/genesis/components/ReadFilesPanel.tsx"]

userStories:     ["*en tant qu'utilisateur je veux prévisualiser et exporter le JSON de ma sélection"]

status:          planned
pathChecked:     ✘false
metaDataChecked: ✘false
scriptChecked:   ✘false
*/

"use client";
// "use client" justifié : navigator.clipboard, useTransition, toast, useState.

import { useMemo, useState, useTransition } from "react";
import { Check, Copy, Save } from "lucide-react";
import { toast } from "sonner";

import { saveSelectionAction } from "@/app/genesis/actions/read-files";
import type { ReadFilesResult } from "@/app/genesis/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ResultDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly result: ReadFilesResult | null;
}

type ViewMode = "json" | "md";

/* ------------------------------------------------------------------ */
/*  Helpers purs                                                       */
/* ------------------------------------------------------------------ */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function languageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "ts",
    tsx: "tsx",
    js: "js",
    jsx: "jsx",
    json: "json",
    md: "md",
    css: "css",
    html: "html",
    yml: "yml",
    yaml: "yaml",
    prisma: "prisma",
  };
  return map[ext] ?? "text";
}

function buildMarkdown(result: ReadFilesResult): string {
  const lines: string[] = [];
  lines.push(
    `# Sélection — ${result.fileCount} fichier${result.fileCount > 1 ? "s" : ""} · ${formatSize(result.totalSize)}`,
  );
  lines.push("");
  for (const file of result.files) {
    lines.push(`## ${file.path}`);
    lines.push("");
    lines.push("```" + languageFromPath(file.path));
    lines.push(file.content);
    lines.push("```");
    lines.push("");
  }
  if (result.skipped.length > 0) {
    lines.push(`## Fichiers ignorés (${result.skipped.length})`);
    lines.push("");
    for (const skip of result.skipped) {
      lines.push(`- \`${skip.path}\` — ${skip.reason}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function ResultDialog({ open, onOpenChange, result }: ResultDialogProps) {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<ViewMode>("json");
  const [isPending, startTransition] = useTransition();

  const jsonString = useMemo(
    () => (result ? JSON.stringify(result, null, 2) : ""),
    [result],
  );
  const mdString = useMemo(() => (result ? buildMarkdown(result) : ""), [result]);

  const displayed = view === "json" ? jsonString : mdString;
  const isJsonView = view === "json";

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success("JSON copié dans le presse-papier.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le JSON.");
    }
  }

  function handleSave() {
    if (!result) return;
    startTransition(async () => {
      const response = await saveSelectionAction(jsonString);
      if (response.ok) {
        toast.success(`Sauvegardé : ${response.data}`);
      } else {
        toast.error(response.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-[95vw] flex-col gap-3 p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>Sélection</DialogTitle>
          <DialogDescription>
            {result
              ? `${result.fileCount} fichier${result.fileCount > 1 ? "s" : ""} · ${formatSize(result.totalSize)}${result.skipped.length > 0 ? ` · ${result.skipped.length} ignoré${result.skipped.length > 1 ? "s" : ""}` : ""}`
              : "Aucun résultat."}
          </DialogDescription>
        </DialogHeader>

        {result && (
          <>
            {/* Segmented control + actions sur une seule ligne */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
                <button
                  type="button"
                  onClick={() => setView("json")}
                  aria-pressed={isJsonView}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isJsonView
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() => setView("md")}
                  aria-pressed={!isJsonView}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    !isJsonView
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Markdown
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!isJsonView}
                  title={!isJsonView ? "Disponible en vue JSON uniquement" : undefined}
                >
                  {copied ? (
                    <>
                      <Check className="size-4" aria-hidden />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" aria-hidden />
                      Copier
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={isPending || !isJsonView}
                  title={!isJsonView ? "Disponible en vue JSON uniquement" : undefined}
                >
                  <Save className="size-4" aria-hidden />
                  {isPending ? "Sauvegarde…" : "Sauvegarder"}
                </Button>
              </div>
            </div>

            {/* Zone de code — pleine largeur, pleine hauteur restante */}
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border/60 bg-muted/30">
              <pre className="h-full overflow-auto p-5 font-mono text-xs leading-relaxed text-foreground/90">
                <code>{displayed}</code>
              </pre>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}