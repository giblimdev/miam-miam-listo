/*
path :           components/ui/sheet.tsx
tag :            ["ui", "sheet", "drawer", "overlay", "generic", "a11y", "client", "shadcn-compatible"]
projectId:       miam-miam-listo
type:            component
generic:         true

role:            Drawer latéral générique exposant l'API shadcn
                 (Sheet, SheetTrigger, SheetContent, SheetHeader,
                 SheetTitle, SheetDescription, SheetFooter, SheetClose)
                 SANS dépendance Radix/Base UI : implémentation autonome
                 avec overlay, animation, a11y, scroll lock, Escape.
                 Compatible avec les consommateurs existants
                 (ScrumSidebar.tsx) qui importent l'API composée.
                 Utilisé aussi par Header.tsx (drawer principal).

                 API exposée (mêmes noms que shadcn) :
                 - Sheet          : racine contrôlée (open/onOpenChange)
                                    ou non contrôlée (defaultOpen).
                 - SheetTrigger   : bouton qui ouvre.
                 - SheetContent   : panneau + overlay + fermeture.
                                    Prop `side` : "left" | "right".
                 - SheetHeader    : zone d'en-tête du panneau.
                 - SheetTitle     : titre (aria-labelledby auto).
                 - SheetDescription : description (aria-describedby auto).
                 - SheetFooter    : pied du panneau.
                 - SheetClose     : bouton de fermeture contextuel.

                 CONTEXTE : un React.Context propage { open, setOpen }
                 du Sheet racine vers SheetTrigger / SheetContent /
                 SheetClose. Chaque sous-composant peut donc être
                 disposé librement dans le JSX.

flow:            <Sheet open onOpenChange> → SheetContext.Provider →
                   SheetTrigger (bouton → setOpen(true))
                   SheetContent (si open : overlay + panneau + focus +
                     Escape + scroll lock + aria-labelledby/describedby)
                     SheetHeader
                       SheetTitle
                       SheetDescription
                     children
                     SheetFooter
                   SheetClose (bouton → setOpen(false))

ecosystem:       UI = [
                   "@/components/ui/button.tsx",
                   "@/components/ui/sheet.tsx",
                 ]

relatedFiles:    ["@/components/layout/header/Header.tsx",
                  "@/app/scrum/components/ScrumSidebar.tsx",
                  "@/components/ui/button.tsx"]

imports:         ["react", "lucide-react",
                  "@/components/ui/button"]

exports:         ["Sheet", "SheetTrigger", "SheetContent", "SheetHeader",
                  "SheetTitle", "SheetDescription", "SheetFooter",
                  "SheetClose", "SheetSide"]

useBy:           ["@/components/layout/header/Header.tsx",
                  "@/app/scrum/components/ScrumSidebar.tsx"]

userStories:     ["*en tant que développeur je veux un drawer latéral réutilisable compatible avec l'API shadcn"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : Context, useState, useEffect, interactions.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SheetSide = "left" | "right";

interface SheetContextValue {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly titleId: string;
  readonly descriptionId: string;
}

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext(component: string): SheetContextValue {
  const ctx = useContext(SheetContext);
  if (!ctx) {
    throw new Error(
      `<${component}> doit être utilisé à l'intérieur d'un <Sheet>.`,
    );
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Sheet (racine)                                                     */
/* ------------------------------------------------------------------ */

export interface SheetProps {
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly defaultOpen?: boolean;
  readonly children: React.ReactNode;
}

export function Sheet({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  children,
}: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const titleId = useId();
  const descriptionId = useId();

  const value: SheetContextValue = {
    open,
    setOpen,
    titleId,
    descriptionId,
  };

  return (
    <SheetContext.Provider value={value}>{children}</SheetContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  SheetTrigger                                                       */
/* ------------------------------------------------------------------ */

export interface SheetTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: React.ReactNode;
}

export function SheetTrigger({
  children,
  onClick,
  ...props
}: SheetTriggerProps) {
  const { setOpen } = useSheetContext("SheetTrigger");

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(true);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  SheetContent                                                       */
/* ------------------------------------------------------------------ */

export interface SheetContentProps {
  readonly side?: SheetSide;
  readonly className?: string;
  readonly children: React.ReactNode;
  readonly hideCloseButton?: boolean;
  readonly id?: string;
}

export function SheetContent({
  side = "right",
  className,
  children,
  hideCloseButton = false,
  id,
}: SheetContentProps) {
  const { open, setOpen, titleId, descriptionId } =
    useSheetContext("SheetContent");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const sideClass = side === "left" ? "left-0" : "right-0";
  const borderClass = side === "left" ? "border-r" : "border-l";

  return (
    <>
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`fixed inset-y-0 z-50 flex w-80 max-w-[85vw] flex-col bg-background shadow-xl outline-none ${sideClass} ${borderClass} border-border/60 ${className ?? ""}`}
      >
        {children}

        {!hideCloseButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3"
          >
            <X className="h-5 w-5" aria-hidden />
          </Button>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  SheetHeader / SheetTitle / SheetDescription / SheetFooter          */
/* ------------------------------------------------------------------ */

export interface SheetHeaderProps {
  readonly className?: string;
  readonly children: React.ReactNode;
}

export function SheetHeader({ className, children }: SheetHeaderProps) {
  return (
    <div
      className={`flex h-16 shrink-0 flex-col justify-center gap-1 border-b border-border/60 px-4 pr-12 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export interface SheetTitleProps {
  readonly className?: string;
  readonly children: React.ReactNode;
}

export function SheetTitle({ className, children }: SheetTitleProps) {
  const { titleId } = useSheetContext("SheetTitle");
  return (
    <h2
      id={titleId}
      className={`text-sm font-semibold text-foreground ${className ?? ""}`}
    >
      {children}
    </h2>
  );
}

export interface SheetDescriptionProps {
  readonly className?: string;
  readonly children: React.ReactNode;
}

export function SheetDescription({
  className,
  children,
}: SheetDescriptionProps) {
  const { descriptionId } = useSheetContext("SheetDescription");
  return (
    <p
      id={descriptionId}
      className={`text-xs text-muted-foreground ${className ?? ""}`}
    >
      {children}
    </p>
  );
}

export interface SheetFooterProps {
  readonly className?: string;
  readonly children: React.ReactNode;
}

export function SheetFooter({ className, children }: SheetFooterProps) {
  return (
    <div
      className={`mt-auto flex shrink-0 items-center justify-end gap-2 border-t border-border/60 px-4 py-3 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SheetClose                                                         */
/* ------------------------------------------------------------------ */

export interface SheetCloseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: React.ReactNode;
}

export function SheetClose({ children, onClick, ...props }: SheetCloseProps) {
  const { setOpen } = useSheetContext("SheetClose");

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}