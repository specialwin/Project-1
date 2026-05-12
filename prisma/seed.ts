import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// -----------------------------------------------------------------------------
// 25 default standards.
//
// These are placeholders written in the Schulze register so the app is usable
// out of the box. Replace bodyEn / bodyTh with your final copy. Numbering 1..25
// is stable; edits to title/body do not change rotation.
// -----------------------------------------------------------------------------
type SeedStandard = {
  number: number;
  titleEn: string;
  bodyEn: string;
  titleTh: string;
  bodyTh: string;
};

const STANDARDS: SeedStandard[] = [
  {
    number: 1,
    titleEn: "The patient is the reason we are here.",
    bodyEn:
      "Every decision begins with the question: does this serve the person in front of us. The work is not the task; the work is the person.",
    titleTh: "ผู้ป่วยคือเหตุผลที่เราอยู่ที่นี่",
    bodyTh:
      "ทุกการตัดสินใจเริ่มจากคำถามเดียวว่า สิ่งนี้ตอบสนองคนตรงหน้าหรือไม่ งานของเราไม่ใช่งาน แต่คือคน",
  },
  {
    number: 2,
    titleEn: "A warm welcome is the first treatment.",
    bodyEn:
      "We greet each person by name when possible, with eye contact and an unhurried voice. The greeting sets the tone for everything that follows.",
    titleTh: "การต้อนรับที่อบอุ่นคือการรักษาแรกของเรา",
    bodyTh:
      "เราทักทายแต่ละท่านด้วยชื่อเมื่อทำได้ ด้วยสายตาที่สบตา และน้ำเสียงที่ไม่รีบเร่ง คำทักทายเป็นตัวกำหนดสิ่งที่จะเกิดขึ้นต่อไป",
  },
  {
    number: 3,
    titleEn: "Anticipate the unspoken need.",
    bodyEn:
      "We notice what is not asked for: a glass of water, a place to sit, a moment of quiet. The smallest courtesy, given before it is requested, is the highest courtesy.",
    titleTh: "คาดการณ์ความต้องการที่ยังไม่ได้เอ่ย",
    bodyTh:
      "เราใส่ใจในสิ่งที่ยังไม่ได้ร้องขอ น้ำหนึ่งแก้ว ที่นั่งที่สบาย ช่วงเวลาเงียบ มารยาทเล็ก ๆ ที่หยิบยื่นก่อนถูกขอ คือมารยาทสูงสุด",
  },
  {
    number: 4,
    titleEn: "Own the problem until it is resolved.",
    bodyEn:
      "Whoever first hears of a concern owns it. We do not transfer; we accompany. The handoff is a personal introduction, not a forwarded message.",
    titleTh: "รับผิดชอบปัญหาจนกว่าจะคลี่คลาย",
    bodyTh:
      "ผู้ที่ได้รับฟังปัญหาก่อนคือเจ้าของปัญหา เราไม่ส่งต่อ แต่พาไปด้วยกัน การส่งมอบงานคือการแนะนำให้รู้จัก ไม่ใช่ส่งข้อความต่อ",
  },
  {
    number: 5,
    titleEn: "We speak quietly, and we speak well.",
    bodyEn:
      "The volume of the room is our responsibility. We choose words with care. We do not joke at anyone’s expense.",
    titleTh: "เราพูดเบา และพูดดี",
    bodyTh:
      "ระดับเสียงของห้องคือความรับผิดชอบของเรา เราเลือกคำพูดด้วยความระมัดระวัง เราไม่ล้อเลียนผู้ใด",
  },
  {
    number: 6,
    titleEn: "Cleanliness is the first impression and the lasting one.",
    bodyEn:
      "Surfaces, floors, uniforms, fingernails. If we see it, we tend to it. There is no hierarchy of cleaning duties.",
    titleTh: "ความสะอาดคือความประทับใจแรก และความประทับใจที่ยั่งยืน",
    bodyTh:
      "พื้นผิว พื้น เครื่องแบบ เล็บมือ หากเราเห็น เราดูแล ไม่มีลำดับชั้นของงานทำความสะอาด",
  },
  {
    number: 7,
    titleEn: "We never say no without offering what we can do.",
    bodyEn:
      "If the answer is not available, the next sentence begins with what is. A refusal without an alternative is a small abandonment.",
    titleTh: "เราจะไม่ปฏิเสธโดยไม่เสนอสิ่งที่เราทำให้ได้",
    bodyTh:
      "หากคำตอบคือไม่มี ประโยคถัดไปต้องเริ่มต้นด้วยสิ่งที่มี การปฏิเสธโดยไม่มีทางเลือกอื่น คือการทอดทิ้งเล็ก ๆ",
  },
  {
    number: 8,
    titleEn: "The complaint is a gift.",
    bodyEn:
      "When someone tells us we have fallen short, they have given us the chance to improve. We thank them in plain language and we act.",
    titleTh: "คำตำหนิคือของขวัญ",
    bodyTh:
      "เมื่อมีผู้บอกว่าเราทำได้ไม่ดีพอ เขามอบโอกาสให้เราพัฒนา เรากล่าวขอบคุณอย่างจริงใจ และลงมือแก้ไข",
  },
  {
    number: 9,
    titleEn: "We remember.",
    bodyEn:
      "Names, preferences, the conversation from last visit. Memory is how we tell someone they matter without saying so.",
    titleTh: "เราจดจำ",
    bodyTh:
      "ชื่อ ความชอบ บทสนทนาจากครั้งก่อน การจดจำคือวิธีที่เราบอกว่าคนผู้นั้นสำคัญ โดยไม่ต้องเอ่ยปาก",
  },
  {
    number: 10,
    titleEn: "Privacy is not optional.",
    bodyEn:
      "We do not discuss a patient where another patient can hear. We close the door. We lower our voice. We never check a record we are not currently using.",
    titleTh: "ความเป็นส่วนตัวไม่ใช่ทางเลือก",
    bodyTh:
      "เราไม่พูดถึงผู้ป่วยในที่ที่ผู้ป่วยรายอื่นได้ยิน เราปิดประตู ลดเสียง และไม่เปิดบันทึกที่เราไม่ได้กำลังใช้งานอยู่",
  },
  {
    number: 11,
    titleEn: "The waiting time is also the service.",
    bodyEn:
      "If a wait is unavoidable, we explain, we update, we offer comfort. Silence in the waiting area is our failure, not the patient’s problem.",
    titleTh: "เวลารอคอยก็คือการบริการ",
    bodyTh:
      "หากการรอเลี่ยงไม่ได้ เราต้องอธิบาย อัปเดต และดูแลความสบาย ความเงียบในห้องรอคือความบกพร่องของเรา ไม่ใช่ปัญหาของผู้ป่วย",
  },
  {
    number: 12,
    titleEn: "Every team member is empowered to make it right.",
    bodyEn:
      "You do not need to ask permission to do what is plainly correct for the person in front of you. We will support the decision.",
    titleTh: "ทุกคนในทีมมีอำนาจที่จะทำให้สิ่งต่าง ๆ ถูกต้อง",
    bodyTh:
      "ท่านไม่ต้องขออนุญาตเพื่อทำในสิ่งที่ถูกต้องอย่างชัดเจนสำหรับคนตรงหน้า เราจะสนับสนุนการตัดสินใจของท่าน",
  },
  {
    number: 13,
    titleEn: "We do not point. We accompany.",
    bodyEn:
      "If a patient needs the restroom, the lab, the pharmacy, we walk them at least to the corner where they can see the door.",
    titleTh: "เราไม่ชี้ เราพาไป",
    bodyTh:
      "หากผู้ป่วยต้องการห้องน้ำ ห้องแล็บ หรือห้องยา เราเดินไปกับท่านอย่างน้อยจนถึงจุดที่ท่านมองเห็นประตู",
  },
  {
    number: 14,
    titleEn: "Appearance is a quiet form of respect.",
    bodyEn:
      "We dress for the people we serve, not for ourselves. Uniforms pressed, hair tidy, shoes clean. Nothing about our appearance should ask for attention.",
    titleTh: "การแต่งกายคือการให้เกียรติอย่างเงียบ ๆ",
    bodyTh:
      "เราแต่งกายเพื่อผู้ที่เราดูแล ไม่ใช่เพื่อตัวเอง เครื่องแบบเรียบร้อย ผมเป็นระเบียบ รองเท้าสะอาด ไม่มีสิ่งใดบนเรือนกายเราที่เรียกร้องความสนใจ",
  },
  {
    number: 15,
    titleEn: "We finish what we start, on the day we start it.",
    bodyEn:
      "An unanswered question, an unreturned call, an unposted result — these are debts. We close the loop before the day closes.",
    titleTh: "เราทำสิ่งที่เริ่มไว้ ให้เสร็จในวันที่เริ่ม",
    bodyTh:
      "คำถามที่ยังไม่ได้ตอบ สายที่ยังไม่ได้โทรกลับ ผลที่ยังไม่ได้แจ้ง ทั้งหมดคือหนี้ เราปิดวงจรก่อนวันจะสิ้นสุด",
  },
  {
    number: 16,
    titleEn: "We greet one another the way we greet patients.",
    bodyEn:
      "How we treat each other is rehearsed in front of every guest. The tone of the back office becomes the tone of the front desk.",
    titleTh: "เราทักทายกันเองในแบบเดียวกับที่ทักทายผู้ป่วย",
    bodyTh:
      "วิธีที่เราปฏิบัติต่อกันคือการซ้อมต่อหน้าผู้มาเยือนทุกคน น้ำเสียงในห้องทำงานหลังบ้านจะกลายเป็นน้ำเสียงที่หน้าเคาน์เตอร์",
  },
  {
    number: 17,
    titleEn: "Document with the same care we give to the patient.",
    bodyEn:
      "The chart is the next clinician’s introduction to the person we just served. Write it as though you were writing about a friend.",
    titleTh: "บันทึกด้วยความใส่ใจเดียวกับที่เรามอบให้ผู้ป่วย",
    bodyTh:
      "เวชระเบียนคือคำแนะนำต่อแพทย์ท่านถัดไป เกี่ยวกับคนที่เราเพิ่งดูแล เขียนราวกับเรากำลังเขียนเกี่ยวกับเพื่อน",
  },
  {
    number: 18,
    titleEn: "We do not eat or drink in the patient’s sightline.",
    bodyEn:
      "Breaks are taken in the break room, not at the counter, not at the desk. A patient should never wait while we finish a snack.",
    titleTh: "เราจะไม่ทานอาหารหรือเครื่องดื่มในสายตาของผู้ป่วย",
    bodyTh:
      "พักเป็นเวลาในห้องพัก ไม่ใช่ที่เคาน์เตอร์ ไม่ใช่ที่โต๊ะทำงาน ผู้ป่วยไม่ควรต้องรอในขณะที่เรารับประทานอาหารว่างให้เสร็จ",
  },
  {
    number: 19,
    titleEn: "Money is discussed plainly and without embarrassment.",
    bodyEn:
      "Costs are stated clearly, in advance, in a private voice. A patient should never be surprised at the counter.",
    titleTh: "พูดเรื่องค่าใช้จ่ายอย่างตรงไปตรงมา โดยไม่ทำให้อึดอัด",
    bodyTh:
      "ค่าใช้จ่ายต้องบอกล่วงหน้า อย่างชัดเจน ด้วยน้ำเสียงที่เป็นส่วนตัว ผู้ป่วยไม่ควรประหลาดใจตอนชำระเงิน",
  },
  {
    number: 20,
    titleEn: "We do not blame the system in front of the patient.",
    bodyEn:
      "If a machine, a form, or a process has failed, we apologize on its behalf. The patient is not interested in our internal workings.",
    titleTh: "เราจะไม่โทษระบบต่อหน้าผู้ป่วย",
    bodyTh:
      "หากเครื่องมือ แบบฟอร์ม หรือกระบวนการของเราล้มเหลว เราขอโทษแทน ผู้ป่วยไม่ได้สนใจการทำงานภายในของเรา",
  },
  {
    number: 21,
    titleEn: "The last impression is the one that lasts.",
    bodyEn:
      "We accompany every guest to the door, or at least into sight of it. The goodbye is more remembered than the hello.",
    titleTh: "ความประทับใจสุดท้ายคือสิ่งที่อยู่ยาวนาน",
    bodyTh:
      "เราเดินไปส่งผู้มาเยือนถึงประตู หรืออย่างน้อยจนมองเห็นประตู คำลาเป็นที่จดจำมากกว่าคำทักทาย",
  },
  {
    number: 22,
    titleEn: "We protect each other.",
    bodyEn:
      "If a colleague is struggling — with a difficult patient, with a long line, with a hard day — we step in without being asked. No one is left to drown in front of guests.",
    titleTh: "เราดูแลกันและกัน",
    bodyTh:
      "หากเพื่อนร่วมงานกำลังลำบาก กับผู้ป่วยที่ยาก กับคิวที่ยาว กับวันที่หนัก เราเข้าไปช่วยโดยไม่ต้องรอให้ขอร้อง ไม่มีใครถูกทิ้งให้จมต่อหน้าผู้มาเยือน",
  },
  {
    number: 23,
    titleEn: "Our telephone voice is our front desk.",
    bodyEn:
      "We answer within three rings, with the name of the clinic and our own name. We smile before we speak; it carries through the line.",
    titleTh: "น้ำเสียงทางโทรศัพท์คือเคาน์เตอร์ต้อนรับของเรา",
    bodyTh:
      "เรารับโทรศัพท์ภายในสามครั้งของการเรียก ด้วยชื่อคลินิก และชื่อของเราเอง เรายิ้มก่อนพูด รอยยิ้มจะส่งผ่านสายไปถึงปลายทาง",
  },
  {
    number: 24,
    titleEn: "We say what we will do, and we do what we said.",
    bodyEn:
      "A promised callback by five o’clock happens by five o’clock. If it cannot, the call to explain happens first.",
    titleTh: "เราบอกในสิ่งที่จะทำ และทำในสิ่งที่บอก",
    bodyTh:
      "หากสัญญาว่าจะโทรกลับภายในห้าโมง ต้องโทรภายในห้าโมง หากทำไม่ได้ การโทรไปอธิบายต้องมาก่อน",
  },
  {
    number: 25,
    titleEn: "Excellence is the accumulation of small unflinching choices.",
    bodyEn:
      "We do not believe in grand gestures. We believe in the discipline of doing the small thing right, again, on a Tuesday afternoon when no one is watching.",
    titleTh: "ความเป็นเลิศคือการสะสมของการเลือกเล็ก ๆ ที่ไม่หวั่นไหว",
    bodyTh:
      "เราไม่เชื่อในท่วงท่าที่ยิ่งใหญ่ เราเชื่อในวินัยของการทำสิ่งเล็ก ๆ ให้ถูกต้อง ซ้ำแล้วซ้ำเล่า ในบ่ายวันอังคารที่ไม่มีใครจับตามอง",
  },
];

async function main() {
  // Create or reuse a default organization for first-run experience.
  const existing = await prisma.organization.findFirst({
    where: { name: "Demo Clinic" },
  });

  const org =
    existing ??
    (await prisma.organization.create({
      data: {
        name: "Demo Clinic",
        language: "en",
        tier: "free",
        memberCap: 5,
      },
    }));

  // Seed standards if missing.
  const standardCount = await prisma.standard.count({
    where: { organizationId: org.id },
  });
  if (standardCount === 0) {
    await prisma.standard.createMany({
      data: STANDARDS.map((s) => ({ ...s, organizationId: org.id })),
    });
    // eslint-disable-next-line no-console
    console.log(`Seeded 25 standards for ${org.name}.`);
  }

  // Seed a small team if missing.
  const memberCount = await prisma.teamMember.count({
    where: { organizationId: org.id },
  });
  if (memberCount === 0) {
    await prisma.teamMember.createMany({
      data: [
        { organizationId: org.id, name: "Khun Anong", role: "Front desk" },
        { organizationId: org.id, name: "Dr. Prawit", role: "Physician" },
        { organizationId: org.id, name: "Khun Saichon", role: "Nurse" },
        { organizationId: org.id, name: "Khun Malee", role: "Assistant" },
      ],
    });
  }

  // Seed an owner login if missing.
  const ownerEmail = "owner@example.com";
  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });
  if (!existingOwner) {
    const passwordHash = await bcrypt.hash("lineup", 10);
    await prisma.user.create({
      data: {
        email: ownerEmail,
        name: "Owner",
        passwordHash,
        role: "owner",
        organizationId: org.id,
      },
    });
    // eslint-disable-next-line no-console
    console.log(`Seeded owner: ${ownerEmail} / lineup`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
