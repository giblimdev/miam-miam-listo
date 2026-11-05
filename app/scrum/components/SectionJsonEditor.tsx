/*
path :           components/scrum/SectionJsonEditor.tsx
tag :            ["scrum", "section-json", "editor", "client", "ui"]
projectId :      <à fournir>
type:            component
generic:         false

role:            Éditeur JSON générique pour UNE section Scrum. Affiche
                 un <textarea> pré-rempli avec le tableau JSON de la
                 section, un bandeau d'erreur persistant, un indicateur
                 de modifications non enregistrées, et quatre actions :
                 Copier, Télécharger (.json), Annuler (retour à la
                 baseline), Enregistrer (appelle
                 updateSectionJsonAction). Réutilise l'UX et les
                 conventions de GlobalJsonExport (textarea simple,
                 sonner pour les toasts, dirty state). Composant CLIENT
                 (useState + useTransition + navigator.clipboard +
                 Blob). Ne connaît PAS le service : il reçoit
                 initialJson (déjà sérialisé côté serveur) et
                 section. Source unique pour les 7 sections.

flow:            Props { flow, section, initialJson } →
                 useState(baseline), useState(draft), useState(error),
                 useTransition → édition libre dans le textarea →
                 Enregistrer → startTransition(async () => {
                   result = await updateSectionJsonAction(flow, section,
                   draft); si !ok : setError + toast.error ; sinon :
                   setBaseline(result.data) + setDraft(result.data) +
                   toast.success }) → Copier / Télécharger utilisent
                 toujours draft.

ecosystem:       Scrum = [
                   "@/components/scrum/SectionJsonEditor.tsx",
                   "@/app/scrum/lib/actions/section-json.ts",
                   "@/app/scrum/lib/validations/sections.ts",
                   "@/app/scrum/lib/types.ts",
                 ]

relatedFiles:    ["@/app/scrum/lib/actions/section-json.ts",
                  "@/app/scrum/lib/validations/sections.ts",
                  "@/app/scrum/lib/types.ts",
                  "@/components/ui/button.tsx"]

imports:         ["react", "lucide-react", "sonner",
                  "@/app/scrum/lib/actions/section-json",
                  "@/app/scrum/lib/validations/sections",
                  "@/app/scrum/lib/types",
                  "@/components/ui/button"]

exports:         ["SectionJsonEditor", "SectionJsonEditorProps"]

useBy:           ["@/app/scrum/[flow]/idee/page.tsx",
                  "@/app/scrum/[flow]/feature/page.tsx",
                  "@/app/scrum/[flow]/persona/page.tsx",
                  "@/app/scrum/[flow]/epic/page.tsx",
                  "@/app/scrum/[flow]/user-story/page.tsx",
                  "@/app/scrum/[flow]/sprint/page.tsx",
                  "@/app/scrum/[flow]/task/page.tsx"]

userStories:     ["*en tant qu'utilisateur je veux éditer le JSON d'une section Scrum et l'enregistrer"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : navigator.clipboard, Blob, toast, useState, useTransition.

import { useState, useTransition } from "react";
import { Check, Copy, Download, FileJson, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { updateSectionJsonAction } from "@/app/scrum/lib/actions/section-json";
import type { EditableSection } from "@/app/scrum/lib/validations/sections";
import type { ScrumFlow } from "@/app/scrum/lib/types";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface SectionJsonEditorProps {
  readonly flow: ScrumFlow;
  readonly section: EditableSection;
  /** JSON pretty-printé de la section, sérialisé côté serveur. */
  readonly initialJson: string;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function SectionJsonEditor({
  flow,
  section,
  initialJson,
}: SectionJsonEditorProps) {
  const [copied, setCopied] = useState(false);
  const [baseline, setBaseline] = useState(initialJson);
  const [draft, setDraft] = useState(initialJson);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = draft !== baseline;

  /* ----------------------------- Actions ---------------------------- */

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      toast.success(`JSON "${section}" copié.`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le JSON.");
    }
  }

  function handleDownload() {
    try {
      const blob = new Blob([draft], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${flow}-${section}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Téléchargement lancé.");
    } catch {
      toast.error("Impossible de télécharger le JSON.");
    }
  }

  function handleReset() {
    setDraft(baseline);
    setError(null);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateSectionJsonAction(flow, section, draft);
      if (!result.ok) {
        setError(result.error);
        toast.error("Échec de l'enregistrement.");
        return;
      }
      // writeScrumFile a normalisé id/order/timestamps : on réaligne
      // baseline ET draft sur la forme canonique serveur.
      const canonical = JSON.stringify(result.data, null, 2);
      setBaseline(canonical);
      setDraft(canonical);
      toast.success(`Section "${section}" enregistrée.`);
    });
  }

  /* ------------------------------ Rendu ----------------------------- */

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-md"
            style={{
              background:
                "linear-gradient(135deg, var(--chart-2), color-mix(in oklab, var(--chart-2) 60%, black))",
            }}
          >
            <FileJson className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              JSON — {section}
            </h2>
            <p className="text-sm text-muted-foreground">
              Document du flux <code>{flow}</code>, section{" "}
              <code>{section}</code>
              {dirty && (
                <span className="ml-2 text-xs font-medium text-amber-600 dark:text-amber-500">
                  • modifications non enregistrées
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleCopy}>
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
          <Button type="button" variant="outline" onClick={handleDownload}>
            <Download className="size-4" aria-hidden />
            Télécharger
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={!dirty || isPending}
          >
            <RotateCcw className="size-4" aria-hidden />
            Annuler
          </Button>
          <Button type="button" onClick={handleSave} disabled={!dirty || isPending}>
            <Save className="size-4" aria-hidden />
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="whitespace-pre-wrap rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          spellCheck={false}
          aria-label={`JSON de la section ${section} du flux ${flow}`}
          className="block max-h-[70vh] min-h-[40vh] w-full resize-y overflow-auto bg-transparent p-5 font-mono text-xs leading-relaxed text-foreground/90 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}