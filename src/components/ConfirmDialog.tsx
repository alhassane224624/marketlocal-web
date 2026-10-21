"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Button, buttonClass, cn, inputClass } from "@/components/ui";

export interface ConfirmOptions {
  title: string;
  /** Conséquences de l'action, en clair. */
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger : action irréversible (suppression, remboursement, refus…). */
  tone?: "danger" | "default";
}

export interface PromptOptions extends ConfirmOptions {
  /** Champ texte obligatoire (ex. motif d'un refus), transmis à la confirmation. */
  inputLabel: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
}

/**
 * Fenêtre de confirmation, à la place de window.confirm().
 *
 *   const [confirm, dialog] = useConfirm();
 *   if (!(await confirm({ title: "Supprimer ?", tone: "danger" }))) return;
 *   …
 *   return <>{dialog}…</>;
 */
export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    // Une demande précédente encore ouverte est considérée comme annulée.
    resolver.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  }, []);

  const dialog = options ? <ConfirmDialog options={options} onClose={close} /> : null;
  return [confirm, dialog];
}

/**
 * Variante avec un champ texte obligatoire (motif) :
 *   const [ask, dialog] = usePrompt();
 *   const motif = await ask({ title: "Refuser ?", inputLabel: "Motif", minLength: 5 });
 *   if (motif === null) return; // annulé
 */
export function usePrompt(): [(options: PromptOptions) => Promise<string | null>, ReactNode] {
  const [options, setOptions] = useState<PromptOptions | null>(null);
  const resolver = useRef<((value: string | null) => void) | null>(null);

  const ask = useCallback((next: PromptOptions) => {
    resolver.current?.(null);
    setOptions(next);
    return new Promise<string | null>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((value: boolean, text?: string) => {
    resolver.current?.(value ? (text ?? "").trim() : null);
    resolver.current = null;
    setOptions(null);
  }, []);

  const dialog = options ? <ConfirmDialog options={options} onClose={close} /> : null;
  return [ask, dialog];
}

function ConfirmDialog({
  options,
  onClose,
}: {
  options: ConfirmOptions | PromptOptions;
  onClose: (value: boolean, text?: string) => void;
}) {
  const danger = options.tone === "danger";
  const panelRef = useRef<HTMLDivElement>(null);
  const input = "inputLabel" in options ? options : null;
  const [text, setText] = useState("");
  const tooShort = input ? text.trim().length < (input.minLength ?? 1) : false;

  // Focus sur « Annuler » (choix sans risque) et fermeture avec Échap.
  useEffect(() => {
    // Avec un champ : focus dans le champ ; sinon sur « Annuler » (choix sans risque).
    panelRef.current?.querySelector<HTMLElement>(input ? "textarea" : "[data-cancel]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, input]);

  const Icon = danger ? AlertTriangle : HelpCircle;
  // Rendu dans <body> : un parent animé (transform) piégerait sinon le fond « fixed ».
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button type="button" aria-label="Annuler" onClick={() => onClose(false)} className="absolute inset-0 bg-ink-950/50" />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={options.description ? "confirm-description" : undefined}
        className="relative w-full max-w-md animate-fade-up rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex gap-4">
          <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", danger ? "bg-red-50 text-red-700" : "bg-sand-100 text-ink-700")}>
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-title" className="font-display text-xl font-semibold text-ink-900">{options.title.replace(/ ([?!:])$/, "\u00a0$1")}</h2>
            {options.description && (
              <div id="confirm-description" className="mt-2 text-sm leading-relaxed text-ink-600">{options.description}</div>
            )}
          </div>
        </div>
        {input && (
          <label className="mt-5 block">
            <span className="mb-1.5 block text-sm font-semibold text-ink-800">{input.inputLabel}</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={input.maxLength ?? 500}
              placeholder={input.placeholder}
              className={cn(inputClass, "py-2.5")}
            />
            {input.minLength && tooShort && (
              <span className="mt-1 block text-xs text-ink-500">Au moins {input.minLength} caractères ({text.trim().length} pour l’instant)</span>
            )}
          </label>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button data-cancel variant="outline" onClick={() => onClose(false)}>
            {options.cancelLabel || "Annuler"}
          </Button>
          <button
            type="button"
            onClick={() => onClose(true, text)}
            disabled={tooShort}
            className={danger ? buttonClass("primary", "md", "!bg-red-700 hover:!bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed") : buttonClass("dark", "md", "disabled:cursor-not-allowed")}
          >
            {options.confirmLabel || "Confirmer"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
