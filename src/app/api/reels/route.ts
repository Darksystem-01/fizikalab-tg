import { NextResponse } from "next/server";
import { reelsQuerySchema } from "@/lib/validation/reels";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { reels, users, topics, reelLikes, reelSaves } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { INITIAL_TOPICS } from "@/db/seed";

// Verified educational video assets for fallback seeding
const INITIAL_DEMO_REELS = [
  {
    id: "reel_mexanika_1",
    authorNickname: "fizik_uz",
    authorUniversity: "TATU",
    topicSlug: "mexanika",
    title: "2D Ballistika: 45° burchak ostida otilgan jism nega eng uzoqqa boradi?",
    description: "Havo qarshiligi hisobga olinganda va olinmaganda trayektoriya farqlari.",
    problemText: "Boshlang'ich tezligi v₀ = 20 m/s bo'lgan jism qaysi burchak ostida otilganda maksimal uchish masofasi (R_max) ga erishadi? (g = 9.8 m/s²)",
    answerText: "Vakuumda θ = 45°. R_max = v₀² / g = 400 / 9.8 ≈ 40.82 metr.",
    hint: "R = (v₀² * sin(2θ)) / g formulasida sin(2θ) funksiyasining maksimum qiymatini toping.",
    difficulty: "oson",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    durationSec: 45,
    viewsCount: 1420,
    likesCount: 312,
    commentsCount: 18,
  },
  {
    id: "reel_optika_1",
    authorNickname: "nur_optika",
    authorUniversity: "O'zMU",
    topicSlug: "optika",
    title: "Nyuton Halqalari: Interferensiya qorong'u markazga ega bo'lishining sababi nima?",
    description: "Yassi qavariq linza va shisha plastinka orasidagi yorug'lik to'lqinlarining aks etishi.",
    problemText: "Yorug'lik optik zichroq muhitdan (havodan shishaga) qaytganida to'lqin fazasi qanchaga o'zgaradi?",
    answerText: "To'lqin fazasi π (180°) ga o'zgaradi yoki yarim to'lqin uzunligi (λ/2) ga teng optik yo'l farqi yuzaga keladi.",
    hint: "Stoks qoidasini va qattiq chegaradan akslanish hodisasini eslang.",
    difficulty: "orta",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    durationSec: 52,
    viewsCount: 980,
    likesCount: 205,
    commentsCount: 12,
  },
  {
    id: "reel_termodinamika_1",
    authorNickname: "termo_pro",
    authorUniversity: "TDTU",
    topicSlug: "molekulyar-fizika",
    title: "Karno Sikli: Nega biror issiqlik mashinasi FIK 100% bo'la olmaydi?",
    description: "Termodinamikaning 2-qonuni va Kelvin-Plank postulati.",
    problemText: "Isitgich harorati T₁ = 500 K, sovutgich harorati T₂ = 300 K bo'lgan ideal Karno dvigatelining FIK ini toping.",
    answerText: "η = (T₁ - T₂) / T₁ = (500 - 300) / 500 = 0.40 (40%).",
    hint: "Karno mashinasining samaradorlik formulasidan foydalaning.",
    difficulty: "oson",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    durationSec: 60,
    viewsCount: 2310,
    likesCount: 540,
    commentsCount: 45,
  },
  {
    id: "reel_elektr_1",
    authorNickname: "elektron_uz",
    authorUniversity: "TATU",
    topicSlug: "elektr",
    title: "RLC Tebranish Konturi va Rezonans Hodisasi",
    description: "Induktivlik va sig'im qarshiliklari tenglashganda oqim amplitudasining keskin oshishi.",
    problemText: "L = 10 mH va C = 10 μF bo'lgan konturda rezonans chastotasi f₀ qanchaga teng?",
    answerText: "f₀ = 1 / (2π√(LC)) ≈ 503.29 Gs.",
    hint: "Tomson formulasidan foydalaning: ω₀ = 1/√(LC).",
    difficulty: "qiyin",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    durationSec: 58,
    viewsCount: 1670,
    likesCount: 420,
    commentsCount: 29,
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsedQuery = reelsQuerySchema.safeParse({
      topic: searchParams.get("topic") || undefined,
      tab: searchParams.get("tab") || "foryou",
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || 6,
    });

    if (!parsedQuery.success) {
      return NextResponse.json({ error: "So'rov parametrlari noto'g'ri." }, { status: 400 });
    }

    const { topic: topicSlug, tab, cursor, limit } = parsedQuery.data;
    const currentUser = await getSessionUser();
    const db = getDb();

    // Ensure demo seed if reels table is empty
    try {
      const [existingCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(reels);

      if (Number(existingCount?.count || 0) === 0) {
        // Seed default topics first if not existing
        for (const t of INITIAL_TOPICS) {
          await db
            .insert(topics)
            .values(t)
            .onConflictDoNothing();
        }

        // Create a default creator user for demo reels
        const demoUserId = "user_demo_fizik";
        await db
          .insert(users)
          .values({
            id: demoUserId,
            nickname: "fizikalab_official",
            phoneHmac: "demo_phone_hmac_1",
            phoneEncrypted: "demo:enc:phone",
            passwordHash: "argon2id_demo_placeholder",
            role: "creator",
            status: "active",
            university: "Toshkent Axborot Texnologiyalari Universiteti (TATU)",
            faculty: "Kiberxavfsizlik fakulteti",
          })
          .onConflictDoNothing();

        for (const r of INITIAL_DEMO_REELS) {
          const [foundTopic] = await db
            .select()
            .from(topics)
            .where(eq(topics.slug, r.topicSlug))
            .limit(1);

          if (foundTopic) {
            await db
              .insert(reels)
              .values({
                id: r.id,
                authorId: demoUserId,
                topicId: foundTopic.id,
                title: r.title,
                description: r.description,
                problemText: r.problemText,
                answerText: r.answerText,
                hint: r.hint,
                difficulty: r.difficulty,
                videoUrl: r.videoUrl,
                durationSec: r.durationSec,
                status: "published",
                publishedAt: new Date(),
                viewsCount: r.viewsCount,
                likesCount: r.likesCount,
                commentsCount: r.commentsCount,
              })
              .onConflictDoNothing();
          }
        }
      }
    } catch (seedErr) {
      console.warn("[Reels API] Seed warning:", seedErr);
    }

    // Query published reels with authors and topics
    let query = db
      .select({
        id: reels.id,
        title: reels.title,
        description: reels.description,
        problemText: reels.problemText,
        answerText: reels.answerText,
        hint: reels.hint,
        difficulty: reels.difficulty,
        videoUrl: reels.videoUrl,
        thumbnailUrl: reels.thumbnailUrl,
        durationSec: reels.durationSec,
        viewsCount: reels.viewsCount,
        likesCount: reels.likesCount,
        commentsCount: reels.commentsCount,
        publishedAt: reels.publishedAt,
        createdAt: reels.createdAt,
        author: {
          id: users.id,
          nickname: users.nickname,
          avatarUrl: users.avatarUrl,
          university: users.university,
          faculty: users.faculty,
        },
        topic: {
          id: topics.id,
          slug: topics.slug,
          title: topics.title,
        },
      })
      .from(reels)
      .innerJoin(users, eq(reels.authorId, users.id))
      .innerJoin(topics, eq(reels.topicId, topics.id))
      .where(eq(reels.status, "published"))
      .orderBy(desc(reels.publishedAt))
      .limit(limit + 1);

    const results = await query;
    let hasMore = false;
    let nextCursor: string | null = null;

    if (results.length > limit) {
      hasMore = true;
      results.pop();
      nextCursor = results[results.length - 1]?.id || null;
    }

    // Check user interaction (hasLiked, hasSaved)
    const enriched = await Promise.all(
      results.map(async (item) => {
        let hasLiked = false;
        let hasSaved = false;

        if (currentUser) {
          try {
            const [like] = await db
              .select()
              .from(reelLikes)
              .where(and(eq(reelLikes.reelId, item.id), eq(reelLikes.userId, currentUser.id)))
              .limit(1);
            hasLiked = Boolean(like);

            const [save] = await db
              .select()
              .from(reelSaves)
              .where(and(eq(reelSaves.reelId, item.id), eq(reelSaves.userId, currentUser.id)))
              .limit(1);
            hasSaved = Boolean(save);
          } catch {
            // best-effort
          }
        }

        return {
          ...item,
          hasLiked,
          hasSaved,
        };
      })
    );

    return NextResponse.json({
      reels: enriched,
      nextCursor,
      hasMore,
    });
  } catch (err) {
    console.error("[Reels API] Exception:", err);
    return NextResponse.json({ error: "Reels yuklashda server xatoligi yuz berdi." }, { status: 500 });
  }
}
