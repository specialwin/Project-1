import { getUserOrRedirect, getOrganizationForUser } from "@/lib/session";
import { asLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserOrRedirect();
  const org = await getOrganizationForUser(user);
  const locale = asLocale(org.language);
  return (
    <>
      <PageHeader locale={locale} orgName={org.name} />
      <main className="container py-6">{children}</main>
      <footer className="app-footer container py-8 text-[0.7rem] uppercase tracking-wider3 text-muted">
        Lineup
      </footer>
    </>
  );
}
