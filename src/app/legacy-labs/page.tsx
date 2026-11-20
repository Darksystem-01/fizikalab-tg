import Link from "next/link";
import { ArrowLeft, BookOpen, Cpu, FlaskConical, Gauge, PlayCircle, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "FizikaLab Legacy Labs — Arxivlangan Virtual Laboratoriyalar",
  description: "FizikaLab loyihasining klassik 2D/3D interaktiv simulyatsiya va hisob-kitob stendlari arxivi.",
};

const chapters = [
  { id: "metrology", title: "1. O'lchash va Xatoliklar Nazariyasi (Metrologiya)", href: "/labs/metrology", desc: "Noniusli shtangensirkul, mikrometr, sferometr va xatoliklar tarqalishi." },
  { id: "kinematics", title: "2. Kinematika", href: "/labs/kinematics", desc: "2D ballistika, havo qarshiligi (RK4) va to'g'ri chiziqli harakat." },
  { id: "dynamics", title: "3. Dinamika", href: "/labs/dynamics", desc: "Qiya tekislik, elastik/noelastik to'qnashuvlar va Kater mayatnigi." },
  { id: "statics", title: "4. Statika va Gidrostatika", href: "/labs/statics", desc: "Kuchlar stoli, richag momenti va Arximed kuchi." },
  { id: "electromagnetism", title: "5. Elektr va Magnetizm", href: "/labs/electromagnetism", desc: "Vitston ko'prigi, RLC rezonans konturi va RC zaryadlanish." },
  { id: "optics", title: "6. To'lqin va Geometrik Optika", href: "/labs/optics", desc: "Yupqa linzalar, Nyuton halqalari va yorug'lik difraksiyasi." },
  { id: "thermodynamics", title: "7. Molekulyar Fizika va Termodinamika", href: "/labs/thermodynamics", desc: "Maksvell tezlik taqsimoti, Karno sikli va Van-der-Vaals gazi." },
  { id: "atomic-nuclear", title: "8. Atom va Yadro Fizikasi", href: "/labs/atomic-nuclear", desc: "Fotoeffekt, Kompton sochilishi, Bor vodorod spektri va radioaktiv parchalanish." },
];

export default function LegacyLabsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" /> Bosh sahifa (Reels)
            </Link>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-900/50 text-blue-300 border border-blue-700/50">
              Legacy Simulyatsiyalar
            </span>
          </div>
          <Link
            href="/chat"
            className="text-sm text-blue-400 hover:text-blue-300 transition"
          >
            Talabalar chati &rarr;
          </Link>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-blue-500" />
            FizikaLab Klassik Virtual Laboratoriya Stendlari
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
            Bu bo&apos;limda umumiy fizika fanining 8 ta asosiy bo&apos;limi bo&apos;yicha avval ishlab chiqilgan
            matematik aniq Runge-Kutta, RLC, Karno va Fotoeffekt modellariga ega barcha interaktiv stendlar saqlanadi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chapters.map((ch) => (
            <Link
              key={ch.id}
              href={ch.href}
              className="group block p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition shadow-sm"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-base font-bold text-slate-200 group-hover:text-blue-400 transition">
                  {ch.title}
                </h2>
                <PlayCircle className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition shrink-0 ml-2" />
              </div>
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                {ch.desc}
              </p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
          <Link
            href="/video-labs"
            className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center hover:border-slate-700 transition"
          >
            <BookOpen className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-300">Video Darslar Katalogi</div>
            <div className="text-xs text-slate-500 mt-1">OTM va xalqaro tajriba videolari</div>
          </Link>
          <Link
            href="/instruments"
            className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center hover:border-slate-700 transition"
          >
            <Gauge className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-300">Virtual Asboblar</div>
            <div className="text-xs text-slate-500 mt-1">Shtangensirkul, mikrometr, sferometr</div>
          </Link>
          <Link
            href="/verify"
            className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center hover:border-slate-700 transition"
          >
            <ShieldCheck className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-300">Hisobotlarni Tekshirish</div>
            <div className="text-xs text-slate-500 mt-1">QR va akademik autentifikatsiya</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
