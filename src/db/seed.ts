import { getDb } from "./index";
import { topics, channels, users } from "./schema";
import crypto from "crypto";

export const INITIAL_TOPICS = [
  { id: "top_mexanika", slug: "mexanika", title: "Mexanika", sortOrder: 1 },
  { id: "top_termodinamika", slug: "molekulyar-fizika", title: "Molekulyar fizika va termodinamika", sortOrder: 2 },
  { id: "top_elektr", slug: "elektr", title: "Elektr", sortOrder: 3 },
  { id: "top_magnetizm", slug: "magnetizm", title: "Magnetizm", sortOrder: 4 },
  { id: "top_tebranishlar", slug: "tebranishlar-tolqinlar", title: "Tebranishlar va to'lqinlar", sortOrder: 5 },
  { id: "top_optika", slug: "optika", title: "Optika", sortOrder: 6 },
  { id: "top_kvant", slug: "kvant-fizikasi", title: "Kvant fizikasi", sortOrder: 7 },
  { id: "top_atom_yadro", slug: "atom-yadro", title: "Atom va yadro fizikasi", sortOrder: 8 },
];

export const INITIAL_CHANNELS = [
  { id: "chan_umumiy", slug: "umumiy", title: "umumiy", description: "Barcha universitet talabalari uchun umumiy akademik va ilmiy muloqot zali", type: "public", sortOrder: 1 },
  { id: "chan_savol_javob", slug: "savol-javob", title: "savol-javob", description: "Murakkab fizika masalalari, formulalar va laboratoriya bo'yicha savol-javoblar", type: "public", sortOrder: 2 },
  { id: "chan_elonlar", slug: "elonlar", title: "e'lonlar", description: "Olimpiadalar, konferensiyalar va platforma yangiliklari (Faqat moderatorlar yozadi)", type: "announcement", sortOrder: 3 },
  { id: "chan_mexanika", slug: "mexanika", title: "mexanika", description: "Kinematika, dinamika, statika va saqlanish qonunlari", type: "public", sortOrder: 4 },
  { id: "chan_termodinamika", slug: "termodinamika", title: "termodinamika", description: "Molekulyar fizika, gaz qonunlari, entropiya va issiqlik dvigatellari", type: "public", sortOrder: 5 },
  { id: "chan_elektr", slug: "elektr-magnetizm", title: "elektr-magnetizm", description: "Elektrostatika, zanjirlar, Lorens kuchi va elektromagnit induksiya", type: "public", sortOrder: 6 },
  { id: "chan_optika", slug: "optika", title: "optika", description: "Geometrik va to'lqin optikasi, interferensiya, difraksiya va qutblanish", type: "public", sortOrder: 7 },
  { id: "chan_kvant", slug: "kvant-yadro", title: "kvant-yadro", description: "Fotoeffekt, Bor nazariyasi, Shredinger tenglamasi va yadro reaksiyalari", type: "public", sortOrder: 8 },
  { id: "chan_tasodifiy", slug: "tasodifiy", title: "tasodifiy", description: "Talabalik hayoti, ilmiy memlar va erkin fikrlar", type: "public", sortOrder: 9 },
];

export async function seedDatabase() {
  const db = getDb();
  console.log("[Seed] Initializing 8 physics topics and default Discord-style channels...");

  try {
    for (const t of INITIAL_TOPICS) {
      await db
        .insert(topics)
        .values(t)
        .onConflictDoUpdate({
          target: topics.id,
          set: { title: t.title, slug: t.slug, sortOrder: t.sortOrder },
        });
    }

    for (const c of INITIAL_CHANNELS) {
      await db
        .insert(channels)
        .values(c)
        .onConflictDoUpdate({
          target: channels.id,
          set: { title: c.title, slug: c.slug, description: c.description, type: c.type, sortOrder: c.sortOrder },
        });
    }

    console.log("[Seed] Successfully seeded topics and channels.");
  } catch (err) {
    console.warn("[Seed] Warning while seeding database:", err);
  }
}

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seedDatabase().then(() => {
    console.log("[Seed] Done.");
    process.exit(0);
  });
}
