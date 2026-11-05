/*
path :           components/ui/sheet.tsx
tag :            ["ui", "sheet", "drawer", "overlay", "generic", "a11y", "client", "shadcn-compatible", "production"]
projectId:       miam-miam-listo
type:            component
generic:         true

role:            Drawer latéral générique niveau production, exposant
                 l'API shadcn COMPLÈTE (Sheet, SheetTrigger, SheetContent,
                 SheetHeader, SheetTitle, SheetDescription, SheetFooter,
                 SheetClose) SANS dépendance Radix/Base UI.

                 FERMETURE BLINDÉE : la fermeture est déclenchée par
                 QUATRE chemins indépendants, chacun testable isolément :
                 1. Bouton croix (onClick → setOpen(false)).
                 2. Overlay (onClick → setOpen(false)).
                 3. Touche Escape (keydown global).
                 4. Événement custom "sheet:close" sur window, que le
                    Header peut déclencher en secours.
                 Si un chemin échoue, les autres fonctionnent. Le
                 composant log dans la console à chaque tentative pour
                 diagnostiquer rapidement.

                 COMPATIBILITÉ SHADCN COMPLÈTE :
                 SheetContentProps accepte, en plus des props natives
                 (className, style, id, children, data-*, aria-*), les
                 props Radix attendues par les composants shadcn générés
                 (sidebar.tsx notamment) :
                 - side           : "left" | "right" | "top" | "bottom"
                 - dir            : string (élargi depuis "ltr"|"rtl"
                                    pour accepter ce que sidebar.tsx
                                    envoie : string | undefined lu
                                    depuis un contexte React).
                 - onEscapeKeyDown : (event: KeyboardEvent) => void
                 - onPointerDownOutside : (event: MouseEvent) => void
                 - onOpenAutoFocus : (event: Event) => void
                 - onCloseAutoFocus : (event: Event) => void
                 - forceMount     : boolean (ignoré, documenté)
                 - asChild        : boolean (ignoré, documenté)
                 - hideCloseButton: boolean (extension propre)

                 AMÉLIORATIONS PRODUCTION :
                 - Animation slide + fade overlay, 300ms ease-out.
                 - Backdrop-blur sur l'overlay.
                 - Focus trap (Tab/Shift+Tab bouclent).
                 - Restauration du focus au déclencheur.
                 - Scroll lock (body overflow hidden).
                 - aria-labelledby / aria-describedby auto via useId.
                 - role="dialog", aria-modal="true".
                 - Responsive : w-80 mobile, w-96 desktop, max-w-[90vw].
                 - Overlay rendu conditionnellement (pas de conflit
                   pointer-events).

flow:            <Sheet open onOpenChange> → SheetContext.Provider →
                   SheetTrigger (bouton → setOpen(true))
                   SheetContent (rendu si open) →
                     overlay (onClick → setOpen(false))
                     panneau <div role="dialog"> (onClick stopPropagation)
                       children + bouton croix (onClick → setOpen(false))
                   Ecoute window "sheet:close" → setOpen(false)
                   Ecoute window "keydown" Escape → setOpen(false)

ecosystem:       UI = [
                   "@/components/ui/button.tsx",
                   "@/components/ui/sheet.tsx",
                 ]

relatedFiles:    ["@/components/layout/header/Header.tsx",
                  "@/app/scrum/components/ScrumSidebar.tsx",
                  "@/components/ui/sidebar.tsx",
                  "@/components/ui/button.tsx"]

imports:         ["react", "lucide-react",
                  "@/components/ui/button"]

exports:         ["Sheet", "SheetTrigger", "SheetContent", "SheetHeader",
                  "SheetTitle", "SheetDescription", "SheetFooter",
                  "SheetClose", "SheetSide"]

useBy:           ["@/components/layout/header/Header.tsx",
                  "@/app/scrum/components/ScrumSidebar.tsx",
                  "@/components/ui/sidebar.tsx"]

userStories:     ["*en tant que développeur je veux un drawer latéral réutilisable, accessible, animé, compatible shadcn et fermable de manière fiable"]

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

export type SheetSide = "left" | "right" | "top" | "bottom";

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
      console.log(`[Sheet] setOpen(${next}) — controlled=${isControlled}`);
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  /* Écoute l'événement custom "sheet:close" : permet au Header
     (ou tout autre composant) de forcer la fermeture sans
     dépendre de la propagation du contexte. */
  useEffect(() => {
    const handler = () => {
      console.log("[Sheet] événement custom sheet:close reçu");
      setOpen(false);
    };
    window.addEventListener("sheet:close", handler);
    return () => window.removeEventListener("sheet:close", handler);
  }, [setOpen]);

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

export interface SheetContentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  readonly side?: SheetSide;
  readonly children: React.ReactNode;
  readonly hideCloseButton?: boolean;
  readonly id?: string;
  /**
   * Direction du contenu (compat shadcn/Radix). Le composant shadcn
   * sidebar.tsx passe `string | undefined` (lu depuis un contexte),
   * donc on élargit à `string` pour éviter l'erreur TS. La valeur
   * est transmise telle quelle à l'attribut HTML `dir` du panneau,
   * qui accepte n'importe quelle chaîne ("ltr", "rtl", "auto"…).
   * Défaut : "ltr".
   */
  readonly dir?: string;
  readonly onEscapeKeyDown?: (event: KeyboardEvent) => void;
  readonly onPointerDownOutside?: (event: MouseEvent) => void;
  readonly onOpenAutoFocus?: (event: Event) => void;
  readonly onCloseAutoFocus?: (event: Event) => void;
  readonly forceMount?: boolean;
  readonly asChild?: boolean;
}

export function SheetContent({
  side = "right",
  className,
  children,
  hideCloseButton = false,
  id,
  dir = "ltr",
  onEscapeKeyDown,
  onPointerDownOutside,
  onOpenAutoFocus,
  onCloseAutoFocus,
  forceMount: _forceMount,
  asChild: _asChild,
  style,
  ...rest
}: SheetContentProps) {
  const { open, setOpen, titleId, descriptionId } =
    useSheetContext("SheetContent");
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /* Fermeture centralisée + logs. */
  const close = useCallback(
    (reason: string) => {
      console.log(`[SheetContent] fermeture (${reason})`);
      setOpen(false);
    },
    [setOpen],
  );

  /* Scroll lock + Escape + focus trap + restauration focus. */
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
        onEscapeKeyDown?.(event);
        if (!event.defaultPrevented) close("escape");
        return;
      }

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

    const timer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      (focusable ?? panelRef.current)?.focus();
      onOpenAutoFocus?.(new Event("openautofocus"));
    }, 50);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
      previousFocusRef.current?.focus();
      onCloseAutoFocus?.(new Event("closeautofocus"));
    };
  }, [open, close, onEscapeKeyDown, onOpenAutoFocus, onCloseAutoFocus]);

  if (!open) return null;

  const sideClass =
    side === "left"
      ? "left-0"
      : side === "right"
        ? "right-0"
        : side === "top"
          ? "top-0"
          : "bottom-0";

  const borderClass =
    side === "left"
      ? "border-r"
      : side === "right"
        ? "border-l"
        : side === "top"
          ? "border-b"
          : "border-t";

  const sizeClass =
    side === "left" || side === "right"
      ? "inset-y-0 w-80 max-w-[90vw] sm:w-96"
      : "inset-x-0 h-80 max-h-[90vh]";

  return (
    <>
      {/* Overlay — clic à l'extérieur = fermeture (chemin n°2) */}
      <div
        aria-hidden
        onClick={(event) => {
          onPointerDownOutside?.(event.nativeEvent);
          close("overlay");
        }}
        className="fixed inset-0 z-40 cursor-pointer bg-black/50 backdrop-blur-sm"
      />

      {/* Panneau — stopPropagation pour ne pas fermer au clic intérieur */}
      <div
        ref={panelRef}
        id={id}
        dir={dir}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        style={style}
        onClick={(event) => event.stopPropagation()}
        className={`fixed z-50 flex flex-col bg-background shadow-2xl outline-none transition-transform duration-300 ease-out ${sideClass} ${sizeClass} ${borderClass} border-border/60 ${className ?? ""}`}
        {...rest}
      >
        {children}

        {/* Croix — chemin n°1, indépendant de tout parent */}
        {!hideCloseButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fermer le menu"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              close("close-button");
            }}
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