// ค่าตั้งค่าระดับระบบ อ่านจาก environment variables

export const expiryWarnDays = Number(process.env.EXPIRY_WARN_DAYS ?? 90);
export const expiryCriticalDays = Number(process.env.EXPIRY_CRITICAL_DAYS ?? 30);

export function isAirtableConfigured(): boolean {
  return Boolean(process.env.AIRTABLE_TOKEN && process.env.AIRTABLE_BASE_ID);
}

export const airtableTables = {
  users: process.env.AIRTABLE_TABLE_USERS ?? "Users",
  warehouses: process.env.AIRTABLE_TABLE_WAREHOUSES ?? "Warehouses",
  drugs: process.env.AIRTABLE_TABLE_DRUGS ?? "Drugs",
  lots: process.env.AIRTABLE_TABLE_LOTS ?? "Lots",
  transactions: process.env.AIRTABLE_TABLE_TRANSACTIONS ?? "Transactions",
};
