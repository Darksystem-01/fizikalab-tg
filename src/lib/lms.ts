/**
 * FizikaLab LMS Core Engine
 * Manages university-grade curricula, semester modules, prerequisite progression,
 * scoring rubrics, student mastery badges, daily streaks, and certified graduation credentials.
 */

export interface CourseModuleItem {
  id: string;
  itemType: "theory" | "pre_quiz" | "lab" | "post_quiz" | "problem";
  refKey: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  minPassScore: number; // e.g. 60 out of 100
}

export interface CourseModule {
  id: string;
  orderIndex: number;
  title: string;
  description: string;
  labKey: string;
  learningOutcomes: string[];
  items: CourseModuleItem[];
}

export interface UniversityCourse {
  id: string;
  code: string;
  title: string;
  discipline: string;
  description: string;
  targetAudience: string;
  semester: number;
  totalCredits: number; // ECTS credits, typically 4-6 in Uzbekistan HEMIS
  modules: CourseModule[];
}

export interface StudentMasteryBadge {
  id: string;
  title: string;
  category: "mechanics" | "electromagnetism" | "optics" | "quantum" | "metrology" | "perfectionist";
  level: "bronze" | "silver" | "gold" | "platinum";
  icon: string;
  description: string;
  unlockedAt?: string;
}

export interface SpeedGraderRubric {
  labKey: string;
  criteria: {
    key: "theory_understanding" | "experimental_precision" | "error_analysis" | "academic_conclusion";
    title: string;
    maxPoints: number;
    description: string;
    levels: { points: number; label: string; desc: string }[];
  }[];
}

/**
 * Standard Uzbek Higher Education (OTM) accredited Physics curricula:
 */
export const UNIVERSITY_COURSES: UniversityCourse[] = [
  {
    id: "phys-101",
    code: "FIZ-101",
    title: "Umumiy Fizika I: Klassik Mexanika va Termodinamika",
    discipline: "Umumkasbiy va fundamental fanlar",
    description:
      "Oliy ta’lim muassasalari muhandislik va tabiiy fanlar yo‘nalishlari uchun 1-semestr o‘quv kursi. Kinematika, dinamika, statika va molekulyar fizikani to‘liq qamrab oladi.",
    targetAudience: "Bakalavriat 1-kurs talabalari (Muhandislik, Energetika, Axborot Texnologiyalari)",
    semester: 1,
    totalCredits: 5,
    modules: [
      {
        id: "mod-1",
        orderIndex: 1,
        title: "1-Modul: O‘lchash usullari va Asboblar xatoligi",
        description: "Vernier shtangensirkul, mikrometr va sferometr yordamida o‘lchash, to‘g‘ri va egri xatoliklarni statistik baholash.",
        labKey: "metrology",
        learningOutcomes: [
          "Asbobning absolyut va nisbiy xatoliklarini aniqlash",
          "Noniussiz va noniusli shkalalardan hisob olish ko‘nikmasi",
          "Sferometr yordamida sferik yuzalar egrilik radiusini o‘lchash",
        ],
        items: [
          {
            id: "m1-item-1",
            itemType: "theory",
            refKey: "metrology-theory",
            title: "O‘lchashlar nazariyasi va xatoliklar taqsimoti",
            description: "Gaus va Styudent taqsimotlari, tasodifiy va sistematik xatoliklar qonuniyati.",
            estimatedMinutes: 20,
            minPassScore: 0,
          },
          {
            id: "m1-item-2",
            itemType: "pre_quiz",
            refKey: "quiz-metrology-pre",
            title: "Pre-Lab Kirish Nazorati (Metrologiya)",
            description: "Laboratoriyaga kirishdan oldin asboblardan foydalanish qoidalarini tekshirish.",
            estimatedMinutes: 15,
            minPassScore: 70,
          },
          {
            id: "m1-item-3",
            itemType: "lab",
            refKey: "metrology",
            title: "1-Laboratoriya: Asboblarni kalibrlash va o‘lchash",
            description: "Virtual shtangensirkul va mikrometrda silindr va sharlar o‘lchamlarini o‘lchash.",
            estimatedMinutes: 45,
            minPassScore: 60,
          },
          {
            id: "m1-item-4",
            itemType: "post_quiz",
            refKey: "metrology-report",
            title: "Xatoliklar hisobi va Yakuniy hisobot himoyasi",
            description: "Absolyut xatolik, dispersiya va Styudent koeffitsientini hisoblab hisobot topshirish.",
            estimatedMinutes: 30,
            minPassScore: 60,
          },
        ],
      },
      {
        id: "mod-2",
        orderIndex: 2,
        title: "2-Modul: Kinematika va Egrichiziqli Harakat",
        description: "Gorizontga burchak ostida otilgan jismning traektoriyasi, erkin tushish tezlanishi va ballistika.",
        labKey: "kinematics",
        learningOutcomes: [
          "2D trayektoriya parametrlari (uchish uzoqligi, maksimal balandlik)ni tahlil qilish",
          "Havo qarshiligi hisobga olingan Runge-Kutta (RK4) dinamikasini o‘rganish",
        ],
        items: [
          {
            id: "m2-item-1",
            itemType: "theory",
            refKey: "kinematics-theory",
            title: "Ballistik harakat va harakat tenglamalari",
            description: "Kinematik tenglamalar va tezlik vektorlarining proyeksiyalari.",
            estimatedMinutes: 25,
            minPassScore: 0,
          },
          {
            id: "m2-item-2",
            itemType: "pre_quiz",
            refKey: "quiz-kinematics-pre",
            title: "Pre-Lab Kirish Nazorati (Kinematika)",
            description: "Burchak ostida otilgan jismning t_uchish va L_max formulalari bo‘yicha nazorat.",
            estimatedMinutes: 15,
            minPassScore: 70,
          },
          {
            id: "m2-item-3",
            itemType: "lab",
            refKey: "kinematics",
            title: "2-Laboratoriya: Ballistika va Traektoriya stendi",
            description: "Turli boshlang‘ich tezlik va burchaklarda otilgan jismning parametrlarini aniqlash.",
            estimatedMinutes: 45,
            minPassScore: 60,
          },
          {
            id: "m2-item-4",
            itemType: "problem",
            refKey: "prob-kin-01",
            title: "Amaliy hisoblash: Optimal uchish burchagini topish",
            description: "Havo qarshiligi sharoitida maksimal masofa burchagini hisoblash.",
            estimatedMinutes: 20,
            minPassScore: 60,
          },
        ],
      },
      {
        id: "mod-3",
        orderIndex: 3,
        title: "3-Modul: Qiya Tekislikdagi Bog‘langan Jismlar Dinamikasi",
        description: "Nyuton qonunlari, kuchlar dekompozitsiyasi, sirpanish ishqalanishi va Kater mayatnigi.",
        labKey: "dynamics",
        learningOutcomes: [
          "Qiya tekislikdagi barcha kuch vektorlarini tahlil qilish (FBD tahlili)",
          "Erkin tebranishlar yordamida g tezlanishni yuqori aniqlikda o‘lchash",
        ],
        items: [
          {
            id: "m3-item-1",
            itemType: "theory",
            refKey: "dynamics-theory",
            title: "Nyutonning II-qonuni va Erkin Jism Diagrammasi (FBD)",
            description: "Normal reaksiya kuchi, ishqalanish va ip tarangligini proyeksiyalash usullari.",
            estimatedMinutes: 25,
            minPassScore: 0,
          },
          {
            id: "m3-item-2",
            itemType: "pre_quiz",
            refKey: "quiz-dynamics-pre",
            title: "Pre-Lab Nazorati (Kuchlar taqsimoti)",
            description: "m1 va m2 bog‘langan jismlarning harakat shartlarini aniqlash.",
            estimatedMinutes: 15,
            minPassScore: 70,
          },
          {
            id: "m3-item-3",
            itemType: "lab",
            refKey: "dynamics",
            title: "3-Laboratoriya: Qiya tekislik stendi va FBD tekshiruvi",
            description: "6 ta kuch vektori ta'sirida tezlanish a va taranglik T ni eksperimental o‘lchash.",
            estimatedMinutes: 50,
            minPassScore: 60,
          },
          {
            id: "m3-item-4",
            itemType: "post_quiz",
            refKey: "dynamics-report",
            title: "Hisobot va Himoya: Ishqalanish koeffitsientini hisoblash",
            description: "Tajriba natijalari asosida sirpanish ishqalanish koeffitsienti mu ni aniqlash.",
            estimatedMinutes: 30,
            minPassScore: 60,
          },
        ],
      },
      {
        id: "mod-4",
        orderIndex: 4,
        title: "4-Modul: Molekulyar Fizika va Termodinamik Sikllar",
        description: "Ideal va real gazlar (Van der Waals holat tenglamasi), Karno sikli va FIK hisobi.",
        labKey: "thermodynamics",
        learningOutcomes: [
          "Izoprotsesslarni p-V va T-S diagrammalarida modellashtirish",
          "Issiqlik dvigatelining maksimal foydali ish koeffitsientini baholash",
        ],
        items: [
          {
            id: "m4-item-1",
            itemType: "theory",
            refKey: "thermo-theory",
            title: "Termodinamika qonunlari va Karno sikli",
            description: "Termodinamikaning 1- va 2-qonunlari, entropiya va issiqlik sig‘imlari.",
            estimatedMinutes: 30,
            minPassScore: 0,
          },
          {
            id: "m4-item-2",
            itemType: "lab",
            refKey: "thermodynamics",
            title: "4-Laboratoriya: Ideal gaz qonunlari va Karno tsikli stendi",
            description: "Izotermik, izobarik va adiabatik jarayonlarda gazning ishini o‘lchash.",
            estimatedMinutes: 45,
            minPassScore: 60,
          },
          {
            id: "m4-item-3",
            itemType: "post_quiz",
            refKey: "thermo-report",
            title: "Termodinamik hisobot va xatoliklar tahlili",
            description: "Issiqlik balansi tenglamasi bo‘yicha laboratoriya xulosasini himoya qilish.",
            estimatedMinutes: 25,
            minPassScore: 60,
          },
        ],
      },
    ],
  },
  {
    id: "phys-102",
    code: "FIZ-102",
    title: "Umumiy Fizika II: Elektromagnetizm, Optika va Kvant Fizikasi",
    discipline: "Umumkasbiy va fundamental fanlar",
    description:
      "Elektrostatika, to‘g‘ri va o‘zgaruvchan tok zanjirlari, interferensiya, difraksiya va fotoeffekt hodisalari o‘rganiladigan 2-semestr kursi.",
    targetAudience: "Bakalavriat 1/2-kurs talabalari (Fizika, IT, Muhandislik)",
    semester: 2,
    totalCredits: 5,
    modules: [
      {
        id: "mod-5",
        orderIndex: 1,
        title: "5-Modul: To‘g‘ri Tok Qonunlari va Ko‘prik Sxemalari",
        description: "Vitston ko‘prigi, Om va Kirxgof qonunlari asosida noma'lum qarshiliklarni yuqori aniqlikda o‘lchash.",
        labKey: "electromagnetism",
        learningOutcomes: [
          "Murakkab tarmoqlangan elektr zanjirlarini hisoblash",
          "Ko‘prik muvozanati shartlarini tushunish va xatolikni minimallashtirish",
        ],
        items: [
          {
            id: "m5-item-1",
            itemType: "theory",
            refKey: "em-theory",
            title: "Kirxgof qonunlari va o‘lchov ko‘priklari",
            description: "Tugunlar va konturlar qonunlari, potensiallar farqi.",
            estimatedMinutes: 25,
            minPassScore: 0,
          },
          {
            id: "m5-item-2",
            itemType: "lab",
            refKey: "electromagnetism",
            title: "5-Laboratoriya: Vitston ko‘prigi va RLC stendi",
            description: "Reostatlar va ko‘prik balansi yordamida rezistor qarshiligini o‘lchash.",
            estimatedMinutes: 45,
            minPassScore: 60,
          },
        ],
      },
      {
        id: "mod-6",
        orderIndex: 2,
        title: "6-Modul: Yorug‘lik Interferensiyasi va Nyuton Halqalari",
        description: "Yassi qavariq linza va yassi plastinka orasidagi havo qatlamida yorug‘lik interferensiyasi.",
        labKey: "optics",
        learningOutcomes: [
          "Nyuton halqalarining qora va yorug‘ radiuslarini hisoblash",
          "To‘lqin uzunligi va egrilik radiusini interferension usulda aniqlash",
        ],
        items: [
          {
            id: "m6-item-1",
            itemType: "theory",
            refKey: "optics-theory",
            title: "Yorug‘lik to‘lqin tabiati va interferensiya",
            description: "Yo‘l farqi, kogerentlik shartlari va qalinlikka bog‘liqlik.",
            estimatedMinutes: 25,
            minPassScore: 0,
          },
          {
            id: "m6-item-2",
            itemType: "lab",
            refKey: "optics",
            title: "6-Laboratoriya: Nyuton halqalari interferometri",
            description: "Mikroskop yordamida halqalar diametrini o‘lchab to‘lqin uzunligini topish.",
            estimatedMinutes: 45,
            minPassScore: 60,
          },
        ],
      },
      {
        id: "mod-7",
        orderIndex: 3,
        title: "7-Modul: Fotoeffekt va Plank Doimiysini Aniqlash",
        description: "Tashqi fotoeffekt qonuniyatlari, to‘xtatuvchi potensial va yorug‘likning korpuskulyar tabiati.",
        labKey: "atomic",
        learningOutcomes: [
          "Eynshteyn fotoeffekt tenglamasini tekshirish",
          "Plank doimiysi h va chiqish ishini voltamper xarakteristikadan aniqlash",
        ],
        items: [
          {
            id: "m7-item-1",
            itemType: "theory",
            refKey: "atomic-theory",
            title: "Kvantlar nazariyasi va fotoeffekt",
            description: "Foton energiyasi, to‘xtatuvchi kuchlanish va qizil chegara.",
            estimatedMinutes: 30,
            minPassScore: 0,
          },
          {
            id: "m7-item-2",
            itemType: "lab",
            refKey: "atomic",
            title: "7-Laboratoriya: Fotoeffekt stendi va V-I egri chiziqlari",
            description: "Turli chastotalardagi yorug‘lik uchun to‘xtatuvchi potensialni o‘lchash.",
            estimatedMinutes: 50,
            minPassScore: 60,
          },
        ],
      },
    ],
  },
];

/**
 * Standard Grading Rubric for University Lab Reports (HEMIS 100-point scale)
 */
export const STANDARD_LAB_RUBRIC: SpeedGraderRubric = {
  labKey: "standard",
  criteria: [
    {
      key: "theory_understanding",
      title: "1. Nazariy bilimi va Pre-lab testi",
      maxPoints: 20,
      description: "Eksperiment asosidagi fizik qonuniyatlar, formulalar va hodisalarni chuqur tushunish darajasi.",
      levels: [
        { points: 20, label: "A'lo (18-20)", desc: "Barcha savollarga to‘g‘ri javob berilgan, qonuniyatlarning fizik ma'nosi to‘liq tushuntirilgan." },
        { points: 15, label: "Yaxshi (14-17)", desc: "Asosiy qonuniyatlar to‘g‘ri, lekin mayda nazariy noaniqliklar mavjud." },
        { points: 10, label: "Qoniqarli (10-13)", desc: "Formulalarni biladi, biroq ularning kelib chiqishini to‘liq tushunmagan." },
        { points: 5, label: "Yetarsiz (0-9)", desc: "Nazariy tushuncha juda past, pre-lab testini muvaffaqiyatsiz topshirgan." },
      ],
    },
    {
      key: "experimental_precision",
      title: "2. O‘lchovlar to‘liqligi va asbob aniqligi",
      maxPoints: 30,
      description: "Virtual stendda o‘tkazilgan o‘lchovlar soni, asbob shkalalaridan to‘g‘ri hisob olish va o‘lchash madaniyati.",
      levels: [
        { points: 30, label: "A'lo (27-30)", desc: "Kamida 5-7 marta qayta o‘lchangan, asbobning nol xatoligi e'tiborga olingan." },
        { points: 22, label: "Yaxshi (21-26)", desc: "O‘lchovlar soni yetarli, mayda hisoblash yoki qayd etish xatoliklari bor." },
        { points: 15, label: "Qoniqarli (15-20)", desc: "Kam sonli o‘lchovlar o‘tkazilgan, ba'zi qiymatlar qo‘pol xatoliklarga ega." },
        { points: 8, label: "Yetarsiz (0-14)", desc: "O‘lchovlar to‘liq emas yoki uydirma/nusxalangan qiymatlar kiritilgan." },
      ],
    },
    {
      key: "error_analysis",
      title: "3. Xatoliklar tahlili va formulalar",
      maxPoints: 25,
      description: "O‘rtacha arifmetik qiymat, absolyut xatolik, o‘rtacha kvadratik chetlanish va nisbiy xatolik (epsilon %) hisobi.",
      levels: [
        { points: 25, label: "A'lo (23-25)", desc: "Barcha xatoliklar (Styudent koeffitsienti bilan) xatosiz hisoblangan, o‘lchov birliklari aniq." },
        { points: 18, label: "Yaxshi (18-22)", desc: "Asosiy hisoblar to‘g‘ri, faqat yaxlitlashda kichik nuqsonlar uchraydi." },
        { points: 12, label: "Qoniqarli (12-17)", desc: "Faqat oddiy ayirish xatoligi topilgan, statistik dispersiya hisoblanmagan." },
        { points: 5, label: "Yetarsiz (0-11)", desc: "Xatoliklar hisobi umuman bajarilmagan yoki noto‘g‘ri formula ishlatilgan." },
      ],
    },
    {
      key: "academic_conclusion",
      title: "4. Ilmiy xulosa va tahlil sifati",
      maxPoints: 25,
      description: "Natijalar jadvali va grafiklar asosida olingan fizik xulosa, adabiyotlar qiymatlari (CODATA) bilan solishtirish.",
      levels: [
        { points: 25, label: "A'lo (23-25)", desc: "Mustaqil, chuqur tahliliy xulosa; olingan natija jadval qiymatlari bilan ilmiy asoslangan." },
        { points: 18, label: "Yaxshi (18-22)", desc: "Xulosa to‘g‘ri, lekin qisqa va odatiy qolipda yozilgan." },
        { points: 12, label: "Qoniqarli (12-17)", desc: "Xulosada faqat raqamlar takrorlangan, sabab-oqibat tahlili yo‘q." },
        { points: 5, label: "Yetarsiz (0-11)", desc: "Xulosa yo‘q yoki boshqa mavzuga tegishli matn nusxalangan." },
      ],
    },
  ],
};

/**
 * Checks whether a specific course module is unlocked for a student.
 * Module 1 is always unlocked.
 * Subsequent modules require all previous module items to be completed with >= minPassScore.
 */
export function checkModuleUnlockStatus(
  course: UniversityCourse,
  moduleIndex: number,
  completedItemIds: Set<string>
): { isUnlocked: boolean; reason?: string } {
  if (moduleIndex === 0) {
    return { isUnlocked: true };
  }

  // Check all previous modules
  for (let i = 0; i < moduleIndex; i++) {
    const prevMod = course.modules[i];
    if (!prevMod) continue;

    for (const item of prevMod.items) {
      if (item.minPassScore > 0 && !completedItemIds.has(item.id)) {
        return {
          isUnlocked: false,
          reason: `Oldingi "${prevMod.title}" modulidagi "${item.title}" topshirig‘i to‘liq bajarilmagan.`,
        };
      }
    }
  }

  return { isUnlocked: true };
}

/**
 * Calculates student level, XP, and streak milestones.
 */
export function calculateStudentRank(totalXp: number): {
  level: number;
  title: string;
  nextLevelXp: number;
  progressPercent: number;
} {
  const XP_PER_LEVEL = 500;
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const currentLevelBase = (level - 1) * XP_PER_LEVEL;
  const nextLevelXp = level * XP_PER_LEVEL;
  const progressPercent = Math.min(
    100,
    Math.round(((totalXp - currentLevelBase) / XP_PER_LEVEL) * 100)
  );

  let title = "Fizika Havaskori";
  if (level >= 10) title = "Kvant Nazariyotchisi";
  else if (level >= 7) title = "Katta Laborant";
  else if (level >= 5) title = "Tajribali Tadqiqotchi";
  else if (level >= 3) title = "Nyuton Shogirdi";
  else if (level >= 2) title = "Kichik Tadqiqotchi";

  return { level, title, nextLevelXp, progressPercent };
}
