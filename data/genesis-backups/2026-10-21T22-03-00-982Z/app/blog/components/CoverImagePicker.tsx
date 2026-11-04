/*
path :           app/blog/components/CoverImagePicker.tsx
tag :            ["blog", "admin", "form", "cover", "upload", "paste", "client"]
projectId:       new-genesis
type :           component
generic:         false

role:            Sélecteur de couverture pour ArticleForm. Upload
                 IMMÉDIAT à la sélection. Rollback géré par le
                 parent via deleteCoverFileAction.

flow:            Props { value, onChange, disabled? } → drop zone /
                 Ctrl+V / clic → uploadArticleCoverAction →
                 onChange(chemin serveur). Aperçu + Retirer.

ecosystem:       BlogAdmin = [
                   "@/app/blog/admin/articles/[id]/edit/page.tsx",
                   "@/app/blog/admin/articles/new/page.tsx",
                   "@/app/blog/admin/articles/page.tsx",
                   "@/app/blog/admin/articles/ArticleRow.tsx",
                   "@/app/blog/admin/setup/page.tsx",
                   "@/app/blog/admin/taxonomy/page.tsx",
                   "@/app/blog/components/ArticleForm.tsx",
                   "@/app/blog/components/CoverImagePicker.tsx",
                   "@/app/blog/components/QuickCreateCategoryDialog.tsx",
                   "@/app/blog/components/QuickCreateTagDialog.tsx",
                   "@/app/blog/components/articleDraft.ts",
                 ]

relatedFiles:    ["@/app/blog/components/ArticleForm.tsx",
                  "@/app/blog/lib/uploads/actions.ts",
                  "@/app/blog/lib/uploads/validations.ts"]

imports:         ["react", "lucide-react", "sonner",
                  "@/app/blog/lib/uploads/actions",
                  "@/app/blog/lib/uploads/validations",
                  "@/components/ui/button"]

exports:         ["CoverImagePicker", "CoverImagePickerProps"]

useBy:           ["@/app/blog/components/ArticleForm.tsx"]

userStories:     ["us1100005", "us1100006"]

status:          planned
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : useState, useTransition, drag&drop, clipboard, toast.

import { useId, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { uploadArticleCoverAction } from "@/app/blog/lib/uploads/actions";
import {
  ALLOWED_IMAGE_MIME,
  MAX_UPLOAD_BYTES,
} from "@/app/blog/lib/uploads/validations";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface CoverImagePickerProps {
  /** Chemin relatif stocké dans coverImage (ex. "articles/2026/x.jpg"). */
  readonly value: string;
  /** Callback : nouveau chemin (après upload immédiat) ou "". */
  readonly onChange: (path: string) => void;
  /** Désactive pendant la soumission du formulaire parent. */
  readonly disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function publicUrl(relativePath: string): string {
  return `/blog/${relativePath}`;
}

function isAllowedMime(type: string): boolean {
  return (ALLOWED_IMAGE_MIME as readonly string[]).includes(type);
}

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */

export function CoverImagePicker({
  value,
  onChange,
  disabled = false,
}: CoverImagePickerProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);

  const busy = isPending || disabled;

  function upload(file: File) {
    if (!isAllowedMime(file.type)) {
      toast.error("Format non supporté (JPEG, PNG, WebP, GIF).");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Image trop lourde (max 5 Mo).");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("slug", "cover");

      const result = await uploadArticleCoverAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChange(result.data.path);
      toast.success("Couverture enregistrée.");
    });
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) upload(file);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    if (busy) return;
    const item = Array.from(event.clipboardData.items).find((i) =>
      i.type.startsWith("image/"),
    );
    if (!item) return;
    const file = item.getAsFile();
    if (file) upload(file);
  }

  function handleRemove() {
    if (busy) return;
    onChange("");
  }

  /* ------------------------------------------------------------------ */
  /*  Rendu                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={ALLOWED_IMAGE_MIME.join(",")}
        onChange={handleFileSelect}
        className="sr-only"
        aria-label="Choisir une image de couverture"
        disabled={busy}
      />

      {value ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/10 p-3 sm:flex-row sm:items-center">
          <img
            src={publicUrl(value)}
            alt="Aperçu de la couverture"
            className="h-24 w-full rounded-lg object-cover sm:w-40"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate font-mono text-xs text-muted-foreground">
              /blog/{value}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Upload className="size-3.5" aria-hidden />
                )}
                Remplacer
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleRemove}
                disabled={busy}
                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Retirer
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-disabled={busy}
          aria-label="Déposer, coller ou choisir une image de couverture"
          onClick={() => !busy && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (busy) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onPaste={handlePaste}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isDragging
              ? "border-chart-1 bg-chart-1/5"
              : "border-border/60 bg-muted/10 hover:bg-muted/20"
          } ${busy ? "cursor-not-allowed opacity-60" : ""}`}
        >
          {isPending ? (
            <>
              <Loader2
                className="size-6 animate-spin text-muted-foreground"
                aria-hidden
              />
              <p className="text-xs text-muted-foreground">Envoi en cours…</p>
            </>
          ) : (
            <>
              <ImagePlus
                className="size-6 text-muted-foreground"
                aria-hidden
              />
              <p className="text-sm font-medium text-foreground">
                Déposer une image, coller (Ctrl+V) ou cliquer
              </p>
              <p className="text-[11px] text-muted-foreground">
                JPEG, PNG, WebP, GIF — max 5 Mo
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}