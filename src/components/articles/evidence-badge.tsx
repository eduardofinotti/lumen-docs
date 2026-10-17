import { evidenceLabels, evidenceStrength } from "@/lib/evidence";
import { cn } from "@/lib/utils";
import type { EvidenceLevel, EvidenceStrength } from "@/types/article";

const strengthClasses: Record<EvidenceStrength, string> = {
  alta: "text-evidence-high border-evidence-high/40",
  media: "text-evidence-mid border-evidence-mid/40",
  baixa: "text-evidence-low border-evidence-low/40",
};

/** Etiqueta de nível de evidência: a cor reforça, o texto informa. */
export function EvidenceBadge({
  level,
  className,
}: {
  level: EvidenceLevel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-label uppercase",
        strengthClasses[evidenceStrength[level]],
        className,
      )}
    >
      {evidenceLabels[level]}
    </span>
  );
}
