import { ChevronDown } from "lucide-react";
import { inputClasses } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Select nativo com o visual do Input. Preferido ao select do Radix nos
 * formulários: funciona sem JavaScript e usa o seletor do próprio celular.
 */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(inputClasses, "appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 stroke-[1.5] text-ink-secondary"
        aria-hidden="true"
      />
    </div>
  );
}
