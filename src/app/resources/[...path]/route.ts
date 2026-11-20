import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await context.params;
    const requested = segments.join("/");

    // Extract lecture number if applicable, e.g. "lectures/1-maruza.pdf" -> 1
    const match = requested.match(/(\d+)-(?:maruza|taqdimot)/i);
    const lectureNum = match ? match[1] : "1";

    const html = `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <title>${lectureNum}-ma'ruza: O'quv-uslubiy majmua | TATU HEMIS</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    header { border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 25px; }
    h1 { color: #1e3a8a; font-size: 22px; margin: 0 0 8px 0; }
    .badge { display: inline-block; background: #eff6ff; color: #1e3a8a; border: 1px solid #bfdbfe; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 3px; text-transform: uppercase; }
    .meta { font-size: 12px; color: #64748b; margin-top: 5px; }
    section { margin-bottom: 24px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 4px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin-top: 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
    ul { margin: 8px 0; padding-left: 20px; font-size: 13px; }
    li { margin-bottom: 6px; }
    .footer { font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 40px; }
    .btn { display: inline-block; background: #1e3a8a; color: white; padding: 8px 16px; text-decoration: none; font-size: 12px; font-weight: bold; border-radius: 3px; margin-top: 10px; }
  </style>
</head>
<body>
  <header>
    <span class="badge">HEMIS Dars Resursi</span>
    <h1>TATU Umumiy Fizika Kafedrasi: ${lectureNum}-Mavzu O'quv Qo'llanmasi</h1>
    <div class="meta">Dotsent Alimuradov Lochinbek · Dasturiy injiniring bakalavriat ta'lim yo'nalishi · 2026/2027 o'quv yili</div>
  </header>

  <section>
    <h2>1. Mavzuning qisqacha mazmuni va maqsadi</h2>
    <p style="font-size: 13px;">Ushbu ma'ruzada talabalar fizika kursi doirasida fundamental nazariy tushunchalar, differensial harakat tenglamalari, energiya va impulsning saqlanish tamoyillari hamda zamonaviy dasturiy injiniring sohasidagi amaliy tadbiqlar bilan tanishadilar.</p>
  </section>

  <section>
    <h2>2. Asosiy formulalar va tushunchalar</h2>
    <ul>
      <li><strong>Kinematik bog'lanish:</strong> $\\vec{v} = \\frac{d\\vec{r}}{dt}$, $\\vec{a} = \\frac{d\\vec{v}}{dt} = \\frac{d^2\\vec{r}}{dt^2}$</li>
      <li><strong>Dinamika va impuls saqlanishi:</strong> $\\vec{F} = \\frac{d\\vec{p}}{dt} = m\\vec{a}$, $\\sum \\vec{p}_i = \\text{const}$</li>
      <li><strong>Ish va energiya:</strong> $A = \\int \\vec{F} \\cdot d\\vec{r}$, $E = E_k + E_p = \\text{const}$</li>
    </ul>
  </section>

  <section>
    <h2>3. Tavsiya etiladigan adabiyotlar</h2>
    <ul>
      <li>1. Sultonov O. va boshq. "Umumiy fizika kursi" (Mexanika va molekulyar fizika), Toshkent, 2024.</li>
      <li>2. Irodov I.E. "Fizikadan masalalar to'plami", 2022.</li>
      <li>3. Sivuxin D.V. "Umumiy fizika kursi", I jild, Moskva, Nauka.</li>
    </ul>
    <a href="javascript:window.print()" class="btn">Chop etish / PDF sifatida saqlash</a>
  </section>

  <div class="footer">
    Muhammad al-Xorazmiy nomidagi TATU HEMIS portali integratsiyasi · FizikaLab LMS
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Resurs yuklashda xatolik" }, { status: 500 });
  }
}
