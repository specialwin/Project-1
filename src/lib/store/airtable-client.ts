// ไคลเอนต์ Airtable REST API แบบเบา ใช้ fetch ไม่ต้องพึ่ง SDK

const API = "https://api.airtable.com/v0";

export interface AirtableRecord<F = Record<string, unknown>> {
  id: string;
  fields: F;
  createdTime: string;
}

function baseUrl(table: string) {
  const base = process.env.AIRTABLE_BASE_ID;
  return `${API}/${base}/${encodeURIComponent(table)}`;
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function check(res: Response, action: string) {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${action} ล้มเหลว (${res.status}): ${body}`);
  }
}

/** อ่านทุกระเบียนในตาราง (จัดการ pagination ให้อัตโนมัติ) */
export async function listAll<F = Record<string, unknown>>(
  table: string,
): Promise<AirtableRecord<F>[]> {
  const out: AirtableRecord<F>[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(baseUrl(table));
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url.toString(), {
      headers: headers(),
      cache: "no-store",
    });
    await check(res, `list ${table}`);
    const data = (await res.json()) as {
      records: AirtableRecord<F>[];
      offset?: string;
    };
    out.push(...data.records);
    offset = data.offset;
  } while (offset);
  return out;
}

export async function getOne<F = Record<string, unknown>>(
  table: string,
  recordId: string,
): Promise<AirtableRecord<F> | null> {
  const res = await fetch(`${baseUrl(table)}/${recordId}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  await check(res, `get ${table}`);
  return (await res.json()) as AirtableRecord<F>;
}

export async function createOne<F = Record<string, unknown>>(
  table: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord<F>> {
  const res = await fetch(baseUrl(table), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ fields, typecast: true }),
  });
  await check(res, `create ${table}`);
  return (await res.json()) as AirtableRecord<F>;
}

export async function updateOne<F = Record<string, unknown>>(
  table: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord<F>> {
  const res = await fetch(`${baseUrl(table)}/${recordId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ fields, typecast: true }),
  });
  await check(res, `update ${table}`);
  return (await res.json()) as AirtableRecord<F>;
}
