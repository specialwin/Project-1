import { isAirtableConfigured } from "@/lib/config";
import type { Store } from "./types";
import { MemoryStore } from "./memory";
import { AirtableStore } from "./airtable";

export type { Store } from "./types";

const g = globalThis as unknown as { __stockyaStore?: Store };

/** เลือก backend: ใช้ Airtable ถ้าตั้งค่าครบ ไม่งั้นใช้ Demo ในหน่วยความจำ */
export function getStore(): Store {
  if (!g.__stockyaStore) {
    g.__stockyaStore = isAirtableConfigured()
      ? new AirtableStore()
      : new MemoryStore();
  }
  return g.__stockyaStore;
}

export function storeMode(): "airtable" | "demo" {
  return isAirtableConfigured() ? "airtable" : "demo";
}
