"use client";

import { Check, Copy } from "lucide-react";
import { useActionState, useState } from "react";
import { closeInvite, createInvite, deleteInvite } from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteStatus } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminActionState, AdminInvite } from "@/types/admin";

const idle: AdminActionState = { status: "idle" };

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {copied ? "Copiado" : "Copiar"}
    </Button>
  );
}

function CreateInvite() {
  const [state, action, pending] = useActionState(createInvite, idle);
  const [kind, setKind] = useState<"code" | "email">("code");

  return (
    <section aria-labelledby="novo-convite" className="rounded-lg border border-line bg-surface-raised p-4 sm:p-6">
      <h2 id="novo-convite" className="label-caps">
        Novo acesso
      </h2>

      <form action={action} className="mt-4 space-y-4">
        <fieldset>
          <legend className="sr-only">Tipo de convite</legend>
          <div className="inline-flex rounded-md border border-line p-1">
            {(
              [
                { id: "code", label: "Código" },
                { id: "email", label: "E-mail" },
              ] as const
            ).map((o) => (
              <label
                key={o.id}
                className={cn(
                  "flex h-9 cursor-pointer items-center rounded-[6px] px-4 text-body-sm pointer-coarse:h-11 has-focus-visible:shadow-focus",
                  kind === o.id ? "bg-surface-sunken font-medium text-ink" : "text-ink-secondary",
                )}
              >
                <input
                  type="radio"
                  name="kind"
                  value={o.id}
                  checked={kind === o.id}
                  onChange={() => setKind(o.id)}
                  className="sr-only"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        {kind === "code" ? (
          <>
            <div className="max-w-sm">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                name="code"
                placeholder="Deixe vazio para gerar um"
                autoCapitalize="characters"
                autoComplete="off"
                className="mt-2 font-mono uppercase placeholder:font-sans placeholder:normal-case"
              />
            </div>
            <label className="flex items-start gap-3 text-body-sm text-ink">
              <input type="checkbox" name="reusable" className="mt-0.5 size-4 accent-ink" />
              <span>
                Vale para vários cadastros
                <span className="block text-ink-secondary">
                  Sem marcar, o código serve para uma pessoa só.
                </span>
              </span>
            </label>
          </>
        ) : (
          <div className="max-w-sm">
            <Label htmlFor="email-convite">E-mail do médico</Label>
            <Input
              id="email-convite"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="nome@exemplo.com"
              className="mt-2"
            />
            <p className="mt-2 text-body-sm text-ink-secondary">
              Com o e-mail na lista, ele se cadastra sem precisar de código.
            </p>
          </div>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Criando…" : kind === "code" ? "Criar código" : "Convidar"}
        </Button>

        {state.status !== "idle" && state.message && (
          <div
            role="status"
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-md p-3 text-body-sm",
              state.status === "error" ? "text-danger" : "bg-surface-sunken text-ink",
            )}
          >
            <span>{state.message}</span>
            {state.code && (
              <>
                <span className="font-mono font-medium">{state.code}</span>
                <CopyCode code={state.code} />
              </>
            )}
          </div>
        )}
      </form>
    </section>
  );
}

function InviteRow({ invite }: { invite: AdminInvite }) {
  const [closeState, closeAction, closing] = useActionState(closeInvite, idle);
  const [deleteState, deleteAction, deleting] = useActionState(deleteInvite, idle);
  const status = inviteStatus(invite);
  const feedback = [closeState, deleteState].find((s) => s.status !== "idle" && s.message);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <p className={cn("truncate text-body text-ink", invite.code && "font-mono")}>{invite.code ?? invite.email}</p>
        <p className="mt-0.5 text-body-sm text-ink-secondary">
          <span className={cn(status.active && "font-medium text-evidence-high")}>{status.label}</span> · criado em{" "}
          {formatDate(invite.createdAt)}
        </p>
        {feedback && (
          <p role="status" className={cn("mt-1 text-body-sm", feedback.status === "error" ? "text-danger" : "text-ink-secondary")}>
            {feedback.message}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {invite.code && status.active && <CopyCode code={invite.code} />}
        {invite.code && status.active && (
          <form action={closeAction}>
            <input type="hidden" name="inviteId" value={invite.id} />
            <Button type="submit" variant="tertiary" size="sm" disabled={closing}>
              Encerrar
            </Button>
          </form>
        )}
        {invite.email && status.active && (
          <form action={deleteAction}>
            <input type="hidden" name="inviteId" value={invite.id} />
            <Button type="submit" variant="tertiary" size="sm" disabled={deleting}>
              Retirar convite
            </Button>
          </form>
        )}
      </div>
    </li>
  );
}

export function InvitesPanel({ invites }: { invites: AdminInvite[] }) {
  const [showInactive, setShowInactive] = useState(false);
  const active = invites.filter((i) => inviteStatus(i).active);
  const inactive = invites.filter((i) => !inviteStatus(i).active);
  const shown = showInactive ? invites : active;

  return (
    <div className="space-y-6">
      <CreateInvite />

      <section aria-labelledby="lista-convites" className="rounded-lg border border-line bg-surface-raised p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="lista-convites" className="label-caps">
            {showInactive ? "Todos os acessos" : "Acessos ativos"}
          </h2>
          {inactive.length > 0 && (
            <Button type="button" variant="tertiary" size="sm" onClick={() => setShowInactive((v) => !v)}>
              {showInactive ? "Mostrar só os ativos" : `Ver usados e encerrados (${inactive.length})`}
            </Button>
          )}
        </div>
        {shown.length === 0 ? (
          <p className="mt-4 text-body-sm text-ink-secondary">Nenhum acesso ativo. Crie um código ou convide um e-mail.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {shown.map((i) => (
              <InviteRow key={i.id} invite={i} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
