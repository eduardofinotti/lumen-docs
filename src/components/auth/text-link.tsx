import Link from "next/link";
import { cn } from "@/lib/utils";

export function TextLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "rounded-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink",
        className,
      )}
      {...props}
    />
  );
}
