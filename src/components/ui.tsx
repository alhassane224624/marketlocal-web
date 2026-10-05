"use client";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Search,
  Star,
  type LucideIcon,
} from "lucide-react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

export const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

// fr-FR sépare les milliers par une espace fine insécable (U+202F) que la police
// d'affichage ne dessine pas : on la remplace par une espace insécable classique.
export const money = (value: number | string | null | undefined) =>
  `${Number(value ?? 0)
    .toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    .replace(/\u202f/g, "\u00a0")}\u00a0MAD`;

export const formatDate = (value: string, long = false) =>
  new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: long ? "long" : "short",
    year: "numeric",
  });

export { apiError } from "@/lib/errors";

/* ------------------------------------------------------------------ */
/* Boutons                                                             */
/* ------------------------------------------------------------------ */

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark" | "success";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-terra-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15)] hover:bg-terra-700 disabled:bg-sand-300 disabled:text-ink-500",
  secondary: "bg-sand-100 text-ink-800 hover:bg-sand-200 disabled:opacity-60",
  outline:
    "border border-sand-300 bg-white text-ink-800 hover:border-ink-300 hover:bg-sand-50 disabled:opacity-60",
  ghost: "text-ink-600 hover:bg-sand-100 hover:text-ink-900 disabled:opacity-50",
  danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50 disabled:opacity-60",
  dark: "bg-ink-900 text-sand-50 hover:bg-ink-800 disabled:opacity-60",
  success: "bg-olive-600 text-white hover:bg-olive-700 disabled:opacity-60",
};

const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-6 text-[15px]",
};

const buttonBase =
  "inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-colors duration-150";

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(buttonBase, variants[variant], sizes[size], extra);
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 size={size === "sm" ? 13 : 16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces et en-têtes                                                */
/* ------------------------------------------------------------------ */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-sand-200 bg-white shadow-soft", className)}>{children}</div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-sand-100 px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sand-100 text-ink-600">
            <Icon size={16} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-ink-900">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-terra-600">{eyebrow}</p>
        )}
        <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-[2.15rem] sm:leading-tight">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

type Tone = "terra" | "olive" | "saffron" | "ink" | "sky" | "violet";

const toneIcon: Record<Tone, string> = {
  terra: "bg-terra-50 text-terra-600",
  olive: "bg-olive-50 text-olive-600",
  saffron: "bg-saffron-50 text-saffron-700",
  ink: "bg-sand-100 text-ink-700",
  sky: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "terra",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-ink-500">{label}</p>
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", toneIcon[tone])}>
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-3 font-display text-[1.35rem] font-semibold leading-none text-ink-900 tabular-nums sm:text-[1.75rem]">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-ink-500">{hint}</p>}
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-sand-300 bg-white/60 px-6 py-14 text-center">
      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-sand-100 text-ink-500">
        <Icon size={24} />
      </span>
      <h3 className="font-display text-xl font-semibold text-ink-900">{title}</h3>
      {description && <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function Alert({
  tone = "error",
  children,
  className,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-olive-200 bg-olive-50 text-olive-800",
    info: "border-saffron-100 bg-saffron-50 text-saffron-700",
  }[tone];
  const Icon = tone === "error" ? AlertCircle : tone === "success" ? CheckCircle2 : Info;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-2.5 rounded-xl border px-4 py-3 text-sm", styles, className)}>
      <Icon size={17} className="mt-px shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Formulaires                                                         */
/* ------------------------------------------------------------------ */

export const inputClass =
  "w-full rounded-xl border border-sand-300 bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-terra-400 focus:outline-none focus:ring-4 focus:ring-terra-100 disabled:bg-sand-100";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-700">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-red-700">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-ink-500">{hint}</span>
      )}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClass, "h-11 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236f665d' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...props}
    >
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Badges, notes, avatars                                              */
/* ------------------------------------------------------------------ */

export function Badge({ tone = "ink", children, className }: { tone?: Tone | "red"; children: ReactNode; className?: string }) {
  const styles: Record<string, string> = {
    terra: "bg-terra-50 text-terra-700 ring-terra-100",
    olive: "bg-olive-50 text-olive-700 ring-olive-100",
    saffron: "bg-saffron-50 text-saffron-700 ring-saffron-100",
    ink: "bg-sand-100 text-ink-700 ring-sand-200",
    sky: "bg-sky-50 text-sky-800 ring-sky-100",
    violet: "bg-violet-50 text-violet-800 ring-violet-100",
    red: "bg-red-50 text-red-700 ring-red-100",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", styles[tone], className)}>
      {children}
    </span>
  );
}

const statusConfig: Record<string, { label: string; tone: Tone | "red" }> = {
  en_attente: { label: "En attente", tone: "saffron" },
  payee: { label: "Payée", tone: "sky" },
  expediee: { label: "Expédiée", tone: "violet" },
  livree: { label: "Livrée", tone: "olive" },
  annulee: { label: "Annulée", tone: "red" },
  valide: { label: "Validée", tone: "olive" },
  refuse: { label: "Refusée", tone: "red" },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const config = statusConfig[status] || { label: status, tone: "ink" as const };
  return (
    <Badge tone={config.tone}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label || config.label}
    </Badge>
  );
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? "text-saffron-400" : "text-sand-300"}
          fill="currentColor"
          strokeWidth={0}
        />
      ))}
    </span>
  );
}

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const palette = ["bg-terra-100 text-terra-800", "bg-olive-100 text-olive-800", "bg-saffron-100 text-saffron-700", "bg-sand-200 text-ink-800"];
  const color = palette[name.length % palette.length];
  const dims = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" }[size];
  return <span className={cn("grid shrink-0 place-items-center rounded-full font-bold", dims, color, className)}>{initials || "?"}</span>;
}

/* ------------------------------------------------------------------ */
/* Filtres segmentés, chargement                                       */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string | null>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition",
              active
                ? "border-ink-900 bg-ink-900 text-sand-50"
                : "border-sand-300 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-white/15" : "bg-sand-100 text-ink-500")}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-sand-200/70", className)} />;
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative block w-full sm:w-72">
      <span className="sr-only">{placeholder}</span>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-sand-300 bg-white pl-9 pr-3 text-sm placeholder:text-ink-400 focus:border-terra-400 focus:outline-none focus:ring-4 focus:ring-terra-100"
      />
    </label>
  );
}
