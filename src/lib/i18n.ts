// Two-locale dictionary. Tone: quiet, professional, slightly serious.
// No exclamation marks. No emojis. No motivational quotes.

export type Locale = "en" | "th";

type Dict = Record<string, string>;

const en: Dict = {
  "app.name": "Lineup",
  "app.tagline": "The daily fifteen minutes.",

  "nav.today": "Today",
  "nav.history": "History",
  "nav.signOut": "Sign out",
  "nav.signIn": "Sign in",

  "today.heading": "Today’s lineup",
  "today.standardLabel": "Today’s standard",
  "today.standardSkipped": "No standard was discussed today.",
  "today.skipStandard": "Skip today",
  "today.unskipStandard": "Restore",
  "today.inversionTitle": "The inversion",
  "today.inversionPrompt":
    "Describe a bad service experience you had recently as a customer. Then ask: how do we make sure this never happens to a patient at our clinic.",
  "today.consensusLabel": "How we prevent this here",
  "today.consensusPlaceholder":
    "Write the answer the team agreed on, in one or two sentences.",
  "today.attendance": "Attendance",
  "today.stories": "Stories shared",
  "today.addStory": "Add a story",
  "today.storyAuthor": "Name (optional)",
  "today.storyBad": "The bad experience",
  "today.storyPrevention": "How we prevent it here (optional)",
  "today.save": "Save",
  "today.cancel": "Cancel",
  "today.finish": "Finish lineup",
  "today.alreadyFinished": "Lineup finished",
  "today.noTeam":
    "There are no active team members yet. Add team members before running a lineup.",
  "today.standardEmpty":
    "No standards have been seeded for this organization yet.",

  "streak.label": "lineups in a row",
  "streak.none": "No streak yet.",

  "history.heading": "History",
  "history.empty": "No lineups have been finished yet.",
  "history.attendance": "attendance",
  "history.standard": "Standard",
  "history.skipped": "Skipped",
  "history.stale": "Untouched 30+ days",
  "history.coverageHeading": "Standards coverage",
  "history.coverageSubheading":
    "When each standard was last discussed. Items untouched for more than thirty days are flagged.",
  "history.lastDiscussed": "Last discussed",
  "history.never": "Never",
  "history.daysAgo": "{days} days ago",
  "history.today": "today",
  "history.yesterday": "yesterday",

  "signIn.heading": "Sign in",
  "signIn.email": "Email",
  "signIn.password": "Password",
  "signIn.submit": "Continue",
  "signIn.error": "We could not sign you in. Check your details.",
  "signIn.hint": "Default owner: owner@example.com / lineup",

  "summary.subject": "Lineup — {date}",
  "summary.line.standard": "Standard: {title}",
  "summary.line.standardSkipped": "Standard: skipped today",
  "summary.line.attendance": "Attendance: {present} of {total}",
  "summary.line.story": "Story shared: {story}",
  "summary.line.consensus": "How we prevent it here: {consensus}",
  "summary.line.noStory": "No story was shared today.",
  "summary.line.noConsensus": "No consensus answer was recorded.",
};

const th: Dict = {
  "app.name": "Lineup",
  "app.tagline": "สิบห้านาทีของทุกวัน",

  "nav.today": "วันนี้",
  "nav.history": "ประวัติ",
  "nav.signOut": "ออกจากระบบ",
  "nav.signIn": "เข้าสู่ระบบ",

  "today.heading": "ไลน์อัพวันนี้",
  "today.standardLabel": "มาตรฐานของวันนี้",
  "today.standardSkipped": "วันนี้ไม่ได้พูดถึงมาตรฐานข้อใด",
  "today.skipStandard": "ข้ามวันนี้",
  "today.unskipStandard": "นำกลับมา",
  "today.inversionTitle": "การกลับด้าน",
  "today.inversionPrompt":
    "เล่าประสบการณ์บริการที่ไม่ดีที่ท่านได้รับในฐานะลูกค้าเมื่อเร็ว ๆ นี้ แล้วถามว่า เราจะมั่นใจได้อย่างไรว่าสิ่งนี้จะไม่เกิดกับผู้ป่วยของคลินิกเรา",
  "today.consensusLabel": "วิธีที่เราป้องกันไม่ให้เกิดที่นี่",
  "today.consensusPlaceholder":
    "บันทึกคำตอบที่ทีมเห็นพ้อง ในหนึ่งหรือสองประโยค",
  "today.attendance": "การเข้าร่วม",
  "today.stories": "เรื่องที่ถูกแบ่งปัน",
  "today.addStory": "เพิ่มเรื่องเล่า",
  "today.storyAuthor": "ชื่อ (ไม่บังคับ)",
  "today.storyBad": "ประสบการณ์ที่ไม่ดี",
  "today.storyPrevention": "วิธีที่เราจะป้องกันที่นี่ (ไม่บังคับ)",
  "today.save": "บันทึก",
  "today.cancel": "ยกเลิก",
  "today.finish": "จบไลน์อัพ",
  "today.alreadyFinished": "ไลน์อัพเสร็จสิ้นแล้ว",
  "today.noTeam":
    "ยังไม่มีสมาชิกในทีม กรุณาเพิ่มสมาชิกก่อนเริ่มไลน์อัพ",
  "today.standardEmpty": "องค์กรนี้ยังไม่มีมาตรฐานในระบบ",

  "streak.label": "ไลน์อัพติดต่อกัน",
  "streak.none": "ยังไม่เริ่มนับ",

  "history.heading": "ประวัติ",
  "history.empty": "ยังไม่มีไลน์อัพที่เสร็จสิ้น",
  "history.attendance": "เข้าร่วม",
  "history.standard": "มาตรฐาน",
  "history.skipped": "ข้าม",
  "history.stale": "ไม่ได้พูดถึงเกินสามสิบวัน",
  "history.coverageHeading": "การครอบคลุมของมาตรฐาน",
  "history.coverageSubheading":
    "ครั้งล่าสุดที่แต่ละมาตรฐานถูกพูดถึง รายการที่เกินสามสิบวันจะถูกทำเครื่องหมายไว้",
  "history.lastDiscussed": "ล่าสุด",
  "history.never": "ยังไม่เคย",
  "history.daysAgo": "{days} วันที่ผ่านมา",
  "history.today": "วันนี้",
  "history.yesterday": "เมื่อวาน",

  "signIn.heading": "เข้าสู่ระบบ",
  "signIn.email": "อีเมล",
  "signIn.password": "รหัสผ่าน",
  "signIn.submit": "ดำเนินการต่อ",
  "signIn.error": "ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบข้อมูล",
  "signIn.hint": "เจ้าของเริ่มต้น: owner@example.com / lineup",

  "summary.subject": "Lineup — {date}",
  "summary.line.standard": "มาตรฐาน: {title}",
  "summary.line.standardSkipped": "มาตรฐาน: ข้ามในวันนี้",
  "summary.line.attendance": "เข้าร่วม: {present} จาก {total}",
  "summary.line.story": "เรื่องที่แบ่งปัน: {story}",
  "summary.line.consensus": "วิธีป้องกันที่นี่: {consensus}",
  "summary.line.noStory": "วันนี้ไม่มีเรื่องเล่าที่ถูกแบ่งปัน",
  "summary.line.noConsensus": "ยังไม่มีคำตอบที่เห็นพ้อง",
};

const DICTS: Record<Locale, Dict> = { en, th };

export function t(locale: Locale, key: string, vars?: Record<string, string | number>) {
  const dict = DICTS[locale] ?? DICTS.en;
  let s = dict[key] ?? DICTS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return s;
}

export function asLocale(s: string | null | undefined): Locale {
  return s === "th" ? "th" : "en";
}
