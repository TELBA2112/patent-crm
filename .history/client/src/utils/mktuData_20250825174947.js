// MKTU (Nice Classification) sinflari ma'lumotlar bazasi
// Har bir sinf uchun nomi va tavsif berilgan

export const mktuClasses = [
  {
    classNumber: 1,
    name: "Kimyoviy moddalar",
    description: "Sanoat, fan va fotografiya sohalarida, shuningdek qishloq xo'jaligi, bog'dorchilik va o'rmonchilikda qo'llaniladigan kimyoviy moddalar",
    keywords: ["kimyo", "kimyoviy", "kislotalar", "sanoat kimyosi", "o'g'itlar", "yelim"]
  },
  {
    classNumber: 2,
    name: "Bo'yoqlar va laklar",
    description: "Bo'yoqlar, laklar; korroziyadan himoya qiluvchi va yog'ochni buzilishdan himoya qiluvchi moddalar; ranglovchi moddalar; bo'yoq ishlatish uchun suyuqliklar",
    keywords: ["bo'yoq", "lak", "pigment", "korroziya", "himoya", "rang", "buyoq"]
  },
  {
    classNumber: 3,
    name: "Kosmetika va tozalash vositalari",
    description: "Kosmetika va pardoz vositalari; parfyumeriya mahsulotlari; efir moylari; kir yuvish vositalari; tozalash preparatlari",
    keywords: ["kosmetika", "parfyumeriya", "sovun", "shampun", "tozalash", "yuvish", "tish pastasi"]
  },
  {
    classNumber: 4,
    name: "Texnik moylar va yonilg'ilar",
    description: "Sanoat moylari va yog'lari, mum; moylash materiallari; chang yutuvchi, namlantiruvchi va bog'lovchi tarkiblar; yonilg'i va yoritish uchun materiallar",
    keywords: ["moy", "yog'", "yonilg'i", "benzin", "dizel", "shamlar", "elektr energiyasi"]
  },
  {
    classNumber: 5,
    name: "Farmatsevtika mahsulotlari",
    description: "Farmatsevtik, tibbiy va veterinariya preparatlari; tibbiy maqsadlar uchun gigiyenik preparatlar; tibbiy yoki veterinariya maqsadlarida ishlatiladigan parhez oziq-ovqatlari va moddalar",
    keywords: ["dori", "vitamin", "vaksina", "antiseptik", "biologik preparat", "dezinfeksiya", "tibbiyot"]
  },
  // ...ko'proq sinflar...
  {
    classNumber: 35,
    name: "Reklama va biznes",
    description: "Reklama; biznesni boshqarish; biznes ma'muriyati; ofis vazifalari; marketing va savdo xizmatlari",
    keywords: ["reklama", "marketing", "biznes", "savdo", "menejment", "buxgalteriya", "import", "eksport", "chakana savdo", "ulgurji savdo"]
  },
  {
    classNumber: 36,
    name: "Moliyaviy xizmatlar",
    description: "Sug'urta; moliyaviy operatsiyalar; pul operatsiyalari; ko'chmas mulk operatsiyalari",
    keywords: ["moliya", "bank", "sug'urta", "investitsiya", "ko'chmas mulk", "kredit", "pul"]
  },
  {
    classNumber: 37,
    name: "Qurilish va ta'mirlash",
    description: "Qurilish xizmatlari; ta'mirlash; o'rnatish xizmatlari",
    keywords: ["qurilish", "ta'mirlash", "montaj", "o'rnatish", "bino", "inshoot", "ta'minot"]
  },
  {
    classNumber: 38,
    name: "Telekommunikatsiya",
    description: "Telekommunikatsiya xizmatlari",
    keywords: ["aloqa", "internet", "telefon", "televidenie", "radio", "email", "mobil aloqa"]
  },
  {
    classNumber: 39,
    name: "Transport va saqlash",
    description: "Transport; tovarlarni o'rash va saqlash; sayohatlarni tashkil etish",
    keywords: ["transport", "tashish", "saqlash", "logistika", "sayohat", "turizm", "jo'natish"]
  },
  {
    classNumber: 40,
    name: "Material qayta ishlash",
    description: "Materiallarni qayta ishlash",
    keywords: ["ishlab chiqarish", "qayta ishlash", "metall", "to'qimachilik", "chop etish", "pechat", "energiya"]
  },
  {
    classNumber: 41,
    name: "Ta'lim va ko'ngil ochar xizmatlar",
    description: "Ta'lim; o'quv jarayonini ta'minlash; ko'ngilochar tadbirlar; sport va madaniy tadbirlar",
    keywords: ["ta'lim", "o'qitish", "trening", "ko'ngil ochish", "madaniyat", "sport", "nashriyot"]
  },
  {
    classNumber: 42,
    name: "Ilmiy va texnologik xizmatlar",
    description: "Ilmiy va texnologik xizmatlar hamda ularga tegishli tadqiqot va ishlanmalar; sanoat tahlili va tadqiqot xizmatlari; kompyuter apparat va dasturiy ta'minotini loyihalash va ishlab chiqish; yuridik xizmatlar",
    keywords: ["ilmiy", "texnologik", "tadqiqot", "dasturiy ta'minot", "loyihalash", "huquq", "yuridik", "legal"]
  },
  {
    classNumber: 43,
    name: "Ovqatlanish va turar joy",
    description: "Oziq-ovqat va ichimliklarni tayyorlash bo'yicha xizmatlar; vaqtinchalik turar joy bilan ta'minlash",
    keywords: ["restoran", "kafe", "mehmonxona", "ovqatlanish", "yotoq", "oziq-ovqat", "catering"]
  },
  {
    classNumber: 44,
    name: "Tibbiy va gigiyenik xizmatlar",
    description: "Tibbiy xizmatlar; veterinariya xizmatlari; odamlar va hayvonlar uchun gigiyenik va go'zallik parvarishi; qishloq xo'jaligi, bog'dorchilik va o'rmonchilik xizmatlari",
    keywords: ["tibbiyot", "klinika", "sog'liq", "go'zallik", "veterinar", "qishloq xo'jalik", "bog'dorchilik"]
  },
  {
    classNumber: 45,
    name: "Shaxsiy va ijtimoiy xizmatlar",
    description: "Shaxsiy va ijtimoiy ehtiyojlarni qondirish uchun boshqalar taqdim etadigan xizmatlar; mulk va shaxslarni jismoniy himoya qilish bo'yicha xizmatlar",
    keywords: ["shaxsiy", "ijtimoiy", "xavfsizlik", "himoya", "nikoh", "marosim", "yurist", "advokat", "huquq", "legal"]
  }
];

// Faoliyat turi bo'yicha tavsiya qilinadigan sinflar
export const getRecommendedClasses = (activity) => {
  if (!activity) return [];
  
  const lowercaseActivity = activity.toLowerCase();
  
  // Har bir sinfni tekshiramiz va uning tavsifida/kalit so'zlarida faoliyat turi mavjud bo'lsa, uni qaytaramiz
  const recommendedClasses = mktuClasses.filter(mktuClass => {
    // Sinfning nomi va tavsifini tekshirish
    if (mktuClass.name.toLowerCase().includes(lowercaseActivity)) {
      return true;
    }
    
    if (mktuClass.description.toLowerCase().includes(lowercaseActivity)) {
      return true;
    }
    
    // Kalit so'zlarni tekshirish
    if (mktuClass.keywords && Array.isArray(mktuClass.keywords)) {
      return mktuClass.keywords.some(keyword => 
        lowercaseActivity.includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(lowercaseActivity)
      );
    }
    
    return false;
  });
  
  return recommendedClasses;
};
