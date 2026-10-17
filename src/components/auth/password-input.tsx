"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

/** Campo de senha com botão "Mostrar"/"Ocultar". */
export function PasswordInput(props: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-20" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-controls={props.id}
        className="absolute inset-y-1.5 right-1.5 rounded-sm px-2 text-body-sm font-medium text-ink-secondary hover:text-ink"
      >
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
