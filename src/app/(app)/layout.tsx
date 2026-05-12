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
      <main className="container py-8">{children}</main>
      <footer className="container py-10 text-[0.72rem] uppercase tracking-wider3 text-muted">
        Lineup
      </footer>
    </>
  );
}
