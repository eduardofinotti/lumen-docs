"use client";

import { useActionState, useState } from "react";
import { setBlocked, updateCredits } from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { filterUsers } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { specialtyLabel } from "@/lib/specialties";
import { cn } from "@/lib/utils";
import type { AdminActionState, AdminUser } from "@/types/admin";

const idle: AdminActionState = { status: "idle" };

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2 text-body-sm",
        tone === "danger" ? "border-danger/40 text-danger" : "border-line text-ink-secondary",
      )}
    >
      {children}
    </span>
  );
}

function Feedback({ state }: { state: AdminActionState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p role="status" className={cn("text-body-sm", state.status === "error" ? "text-danger" : "text-ink-secondary")}>
      {state.message}
    </p>
  );
}

function UserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const [creditsState, creditsAction, savingCredits] = useActionState(updateCredits, idle);
  const [blockState, blockAction, savingBlock] = useActionState(setBlocked, idle);
  const blocked = user.blockedAt !== null;
  const specialty = specialtyLabel(user.specialty);
  const crm = user.crm ? `CRM ${user.crm}${user.crmUf ? `/${user.crmUf}` : ""}` : null;

  return (
    <li className={cn("rounded-lg border border-line bg-surface-raised p-4 sm:p-5", blocked && "bg-surface-sunken")}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-body font-medium text-ink">{user.fullName || "Sem nome"}</p>
          <p className="truncate text-body-sm text-ink-secondary">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.isAdmin && <Badge>Admin</Badge>}
          {blocked && <Badge tone="danger">Acesso suspenso</Badge>}
        </div>
      </div>

      <p className="mt-2 text-body-sm text-ink-secondary">
        {[specialty ?? "Especialidade não informada", crm].filter(Boolean).join(" · ")}
      </p>
      <p className="mt-1 text-body-sm text-ink-secondary">
        Desde {formatDate(user.createdAt)} ·{" "}
        {user.questions === 1 ? "1 pergunta" : `${user.questions} perguntas`}
        {user.lastActiveAt ? ` · última em ${formatDate(user.lastActiveAt)}` : " · nenhuma pergunta ainda"}
      </p>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
        <form action={creditsAction} className="flex items-end gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <div>
            <Label htmlFor={`creditos-${user.id}`} className="text-body-sm text-ink-secondary">
              Créditos
            </Label>
            <Input
              id={`creditos-${user.id}`}
              name="credits"
              type="number"
              inputMode="numeric"
              min={0}
              max={100000}
              defaultValue={user.credits}
              className="mt-1 w-28"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={savingCredits}>
            {savingCredits ? "Salvando…" : "Salvar"}
          </Button>
        </form>

        {!isSelf && (
          <form action={blockAction}>
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="blocked" value={blocked ? "false" : "true"} />
            <Button type="submit" variant={blocked ? "secondary" : "tertiary"} disabled={savingBlock}>
              {blocked ? "Reativar acesso" : "Suspender acesso"}
            </Button>
          </form>
        )}
      </div>

      <div className="mt-2 space-y-1">
        <Feedback state={creditsState} />
        <Feedback state={blockState} />
      </div>
    </li>
  );
}

export function UsersPanel({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const [query, setQuery] = useState("");
  const shown = filterUsers(users, query);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full sm:max-w-sm">
          <Label htmlFor="busca-usuario">Buscar médico</Label>
          <Input
            id="busca-usuario"
            type="search"
            placeholder="Nome ou e-mail"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-2"
          />
        </div>
        <p className="text-body-sm text-ink-secondary" aria-live="polite">
          {shown.length === users.length
            ? `${users.length} ${users.length === 1 ? "médico" : "médicos"}`
            : `${shown.length} de ${users.length}`}
        </p>
      </div>

      {shown.length === 0 ? (
        <p className="mt-8 text-body text-ink-secondary">Ninguém encontrado com essa busca.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((u) => (
            <UserRow key={u.id} user={u} isSelf={u.id === currentUserId} />
          ))}
        </ul>
      )}
    </div>
  );
}
