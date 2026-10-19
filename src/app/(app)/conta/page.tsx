import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { ProfileForm } from "@/components/account/profile-form";
import { ThemeToggle } from "@/components/account/theme-toggle";
import { InstallApp } from "@/components/pwa/install-app";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/data/profile";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Minha conta" };

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border border-line bg-surface-raised p-4 sm:p-6">
      <h2 id={id} className="label-caps scroll-mt-24">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function ContaPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/entrar");
  const { credits } = profile;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-24 sm:px-6 sm:pt-10">
      <h1 className="font-display text-display-md">Minha conta</h1>
      <p className="mt-2 text-body text-ink-secondary">
        {profile.email} · desde {formatDate(profile.createdAt)}
      </p>

      <div className="mt-10 space-y-6">
        <Section id="creditos" title="Créditos">
          <p className="font-display text-display-lg text-ink">
            {credits}
            <span className="ml-2 font-sans text-body text-ink-secondary">
              {credits === 1 ? "crédito restante" : "créditos restantes"}
            </span>
          </p>
          <p className="mt-3 text-body-sm text-ink-secondary">
            {credits === 0
              ? "Seus créditos acabaram. Fale com a mentoria para receber mais."
              : "Cada pesquisa usa 1 crédito. Quando acabarem, fale com a mentoria para receber mais."}
          </p>
        </Section>

        <Section id="dados" title="Dados cadastrais">
          <ProfileForm profile={profile} />
        </Section>

        <Section id="app" title="Usar como app">
          <InstallApp />
        </Section>

        <Section id="aparencia" title="Aparência">
          <ThemeToggle />
        </Section>

        <form action={signOut}>
          <Button type="submit" variant="secondary">
            Sair da conta
          </Button>
        </form>
      </div>
    </div>
  );
}
