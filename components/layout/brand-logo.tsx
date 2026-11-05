import { cn } from "@/lib/utils";

/**
 * Naguib Selim logo: NS monogram + bilingual wordmark, side by side.
 * Rendered as CSS masks so it follows the theme color (brown in light, tan in dark).
 */
export function BrandLogo({ className, label }: { className?: string; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      dir="ltr"
      className={cn("inline-flex items-center gap-1.5 text-primary", className)}
    >
      <span
        className="brand-mask block h-7 w-[35px]"
        style={{ maskImage: "url(/brand/ns-mark.png)" }}
      />
      <span
        className="brand-mask block h-5 w-[62px]"
        style={{ maskImage: "url(/brand/ns-wordmark.png)" }}
      />
    </span>
  );
}
