import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { t, type Locale } from "./i18n";

type ComposeInput = {
  locale: Locale;
  date: Date;
  standardTitle: string | null;
  standardSkipped: boolean;
  presentCount: number;
  totalCount: number;
  story: string | null;
  consensus: string | null;
};

function dateLabel(d: Date, locale: Locale) {
  return d.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function composeSummary(input: ComposeInput) {
  const { locale } = input;
  const dateStr = dateLabel(input.date, locale);
  const lines: string[] = [];
  lines.push(
    input.standardSkipped || !input.standardTitle
      ? t(locale, "summary.line.standardSkipped")
      : t(locale, "summary.line.standard", { title: input.standardTitle }),
  );
  lines.push(
    t(locale, "summary.line.attendance", {
      present: input.presentCount,
      total: input.totalCount,
    }),
  );
  lines.push(
    input.story
      ? t(locale, "summary.line.story", { story: input.story })
      : t(locale, "summary.line.noStory"),
  );
  lines.push(
    input.consensus
      ? t(locale, "summary.line.consensus", { consensus: input.consensus })
      : t(locale, "summary.line.noConsensus"),
  );
  const subject = t(locale, "summary.subject", { date: dateStr });
  const body = lines.join("\n");
  // A one-line "summary" string suitable for storing on the session.
  const oneLine = [
    input.standardSkipped || !input.standardTitle
      ? "—"
      : input.standardTitle,
    `${input.presentCount}/${input.totalCount}`,
    input.story ?? "",
  ]
    .filter(Boolean)
    .join(" · ");
  return { subject, body, oneLine };
}

export async function deliverSummary({
  organizationId,
  subject,
  body,
}: {
  organizationId: string;
  subject: string;
  body: string;
}) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) return { delivered: false, reason: "no_org" as const };

  const tasks: Promise<unknown>[] = [];

  // Email via SMTP if configured.
  if (
    org.ownerSummaryEmail &&
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    tasks.push(
      transporter.sendMail({
        from: process.env.SUMMARY_FROM_EMAIL ?? "lineup@example.com",
        to: org.ownerSummaryEmail,
        subject,
        text: body,
      }),
    );
  }

  // LINE Notify if configured.
  const lineToken = org.lineNotifyToken || process.env.LINE_NOTIFY_DEFAULT_TOKEN;
  if (lineToken) {
    const message = `\n${subject}\n${body}`;
    tasks.push(
      fetch("https://notify-api.line.me/api/notify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lineToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ message }).toString(),
      }),
    );
  }

  if (tasks.length === 0) {
    return { delivered: false, reason: "no_channel" as const };
  }

  await Promise.allSettled(tasks);
  return { delivered: true as const };
}
