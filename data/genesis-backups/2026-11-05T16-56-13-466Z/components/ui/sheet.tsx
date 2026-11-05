/*
path :           components/ui/sheet.tsx
tag :            ["ui", "sheet", "drawer", "overlay", "generic", "a11y", "client", "shadcn-compatible", "production"]
projectId:       miam-miam-listo
type:            component
generic:         true

role:            Drawer latéral générique niveau production, exposant
                 l'API shadcn (Sheet, SheetTrigger, SheetContent,
                 SheetHeader, SheetTitle, SheetDescription, SheetFooter,
                 SheetClose) SANS dépendance Radix/Base UI.

                 AMÉLIORATIONS PRODUCTION :
                 - Animation d'entrée/sortie : slide horizontal
                   (translate-x) + fade overlay, 300ms ease-out.
                 - Backdrop-flou sur l'overlay (backdrop-blur-sm).
                 - Focus trap : le focus reste dans le panneau tant
                   qu'il est ouvert (Tab / Shift+Tab bouclent).
                 - Restauration du focus : à la fermeture, le focus
                   revient sur l'élément qui a déclenché l'ouverture.
                 - Scroll lock : body overflow hidden pendant l'ouverture.
                 - Escape ferme le drawer.
                 - aria-labelledby / aria-describedby auto via useId.
                 - role="dialog", aria-modal="true".
                 - Panneau responsive : w-80 mobile, w-96 desktop,
                   max-w-[90vw] pour ne jamais déborder.
                 - z-index maîtrisé : overlay z-40, panneau z-50.
                 - Le panneau est TOUJOURS monté (pas de return null)
                   pour permettre l'animation de sortie ; la visibilité
                   est pilotée par `data-state="open" | "closed"`.

flow:            <Sheet open onOpenChange> → SheetContext.Provider →
                   SheetTrigger (bouton → setOpen(true))
                   SheetContent (toujours monté, data-state piloté par
                     open) → overlay + panneau + focus trap + Escape +
                     scroll lock + aria-labelledby/describedby
                     SheetHeader
                       SheetTitle
                       SheetDescription
                     children (zone scrollable)
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

userStories:     ["*en tant que développeur je veux un drawer latéral réutilisable, accessible et animé"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

"use client";
// "use client" justifié : Context, useState, useEffect, focus trap, interactions.

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
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /* Scroll lock + Escape + focus initial + restauration focus. */
  useEffect(() => {
    if (!open) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      /* Focus trap : Tab / Shift+Tab bouclent dans le panneau. */
      if (event.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey);

    /* Focus initial sur le premier élément focusable du panneau. */
    const timer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      (focusable ?? panelRef.current)?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
      previousFocusRef.current?.focus();
    };
  }, [open, setOpen]);

  const sideClass = side === "left" ? "left-0" : "right-0";
  const borderClass = side === "left" ? "border-r" : "border-l";
  const translateClosed =
    side === "left" ? "-translate-x-full" : "translate-x-full";

  return (
    <>
      {/* Overlay — toujours monté, opacité pilotée par data-state */}
      <div
        aria-hidden
        data-state={open ? "open" : "closed"}
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
      />

      {/* Panneau — toujours monté, translate piloté par data-state */}
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        data-state={open ? "open" : "closed"}
        className={`fixed inset-y-0 z-50 flex w-80 max-w-[90vw] flex-col bg-background shadow-2xl outline-none transition-transform duration-300 ease-out sm:w-96 ${sideClass} ${borderClass} border-border/60 data-[state=closed]:${translateClosed} data-[state=open]:translate-x-0 ${className ?? ""}`}
      >
        {children}

        {!hideCloseButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-10 text-muted-foreground hover:text-foreground"
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
      className={`flex shrink-0 flex-col gap-1 border-b border-border/60 bg-gradient-to-b from-chart-1/5 to-transparent px-5 pb-4 pt-5 pr-14 ${className ?? ""}`}
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
      className={`text-base font-bold tracking-tight text-foreground ${className ?? ""}`}
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
      className={`mt-auto flex shrink-0 flex-col gap-2 border-t border-border/60 bg-muted/30 px-4 py-3 ${className ?? ""}`}
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