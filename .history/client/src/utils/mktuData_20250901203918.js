// MKTU (Nice Classification) sinflari ma'lumotlar bazasi
// Har bir sinf uchun raqami, nomi va batafsil tavsifi berilgan
/* */

// Faoliyat turi bo'yicha tavsiya qilinadigan sinflar
export const getRecommendedClasses = (activity) => {
  if (!activity || activity.trim() === '') return [];
  
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

// Store selected MKTU classes in localStorage for sharing between dashboards
export const storeMktuClasses = (classes) => {
  if (Array.isArray(classes)) {
    // Add debug output to verify data is being stored
    console.log("Storing MKTU classes to localStorage:", classes);
    localStorage.setItem('selectedMktuClasses', JSON.stringify(classes));
    
    // Dispatch a custom event to notify other components
    const event = new CustomEvent('mktuClassesUpdated', {
      detail: { classes }
    });
    document.dispatchEvent(event);
  }
};

// Get selected MKTU classes from localStorage
export const getStoredMktuClasses = () => {
  try {
    const storedClasses = localStorage.getItem('selectedMktuClasses');
    const parsed = storedClasses ? JSON.parse(storedClasses) : [];
    // Add debug output to verify data is being retrieved
    console.log("Retrieved MKTU classes from localStorage:", parsed);
    return parsed;
  } catch (error) {
    console.error('Error parsing stored MKTU classes:', error);
    return [];
  }
};

// Share power of attorney documents between dashboards
export const sharePowerOfAttorneyDocuments = (documents) => {
  if (documents) {
    localStorage.setItem('sharedPowerOfAttorneyDocs', JSON.stringify(documents));
    
    // Dispatch a custom event for real-time updates
    const event = new CustomEvent('powerOfAttorneyUpdated', { 
      detail: { documents } 
    });
    document.dispatchEvent(event);
  }
};

// Get shared power of attorney documents
export const getSharedPowerOfAttorneyDocuments = () => {
  try {
    const storedDocs = localStorage.getItem('sharedPowerOfAttorneyDocs');
    return storedDocs ? JSON.parse(storedDocs) : null;
  } catch (error) {
    console.error('Error parsing stored power of attorney documents:', error);
    return null;
  }
};
  },
  {
    classNumber: 15,
    name: "Musiqa asboblari",
    description: "Musiqa asboblari; musiqa joylashuvi uchun pultlar va pultlar; dirijorlaning tayoqchalari.",
    keywords: ["musiqa", "cholg'u", "pianino", "gitara", "skripka", "dirijom"]
  },
  {
    classNumber: 16,
    name: "Qog'oz mahsulotlari va ofis jihozlari",
    description: "Qog'oz va karton; bosmaxona mahsulotlari; kitob muqovasiga materiallar; suratlar; kanselyariya va ofis jihozlari, mebellardan tashqari; yelim kanselyariya yoki ro'zg'or maqsadlari uchun; rassomlar materiallari va chizmachilik materiallari; mo'yqalamlar; ta'lim va o'quv materiallari; plastik listi, plyonkalar va qoplar o'rash va qadoqlash uchun; shriftlar; bosma klishelar.",
    keywords: ["qog'oz", "ofis", "daftar", "ruchka", "kitob", "bosma"]
  },
  {
    classNumber: 17,
    name: "Rezina va izolyatsiya materiallari",
    description: "Qayta ishlanmagan va yarim ishlangan kauchuk, guttapercha, rezina, asbest, sluda va bu materiallarning o'rinbosarlari; ishlab chiqarishda ishlatiladigan ekstruziv plastmassa va smolalar; zichlovchi, to'ldiruvchi va izolyatsiya qiluvchi materiallar; egiluvchan quvurlar, trubkalar va shlanglar, metall bo'lmaganlar.",
    keywords: ["rezina", "plastik", "izolyatsiya", "quvur", "shlang", "kauchuk"]
  },
  {
    classNumber: 18,
    name: "Charm va sumkalar",
    description: "Teri va sun'iy teri; hayvonlar terilari; sayohat yuklari va tashish sumkalari; soyabonlar va quyosh soyabonlari; yurish tayoqlari; qamchilar, jilovlar va egarlar; yoqalar, shoxillar va hayvonlar uchun kiyimlar.",
    keywords: ["sumka", "charm", "teri", "portfel", "hamyon", "egarlar"]
  },
  {
    classNumber: 19,
    name: "Qurilish materiallari",
    description: "Qurilish materiallari, metall bo'lmaganlar; qattiq qurilish quvurlari, metall bo'lmaganlar; asfalt, qora smola, qatron va bitum; ko'chma binolar yoki tuzilmalar, metall bo'lmaganlar; haykaltaroshlik asarlari, metall bo'lmaganlar.",
    keywords: ["qurilish", "g'isht", "beton", "taxta", "yog'och", "stroy"]
  },
  {
    classNumber: 20,
    name: "Mebellar va jihozlar",
    description: "Mebellar, ko'zgular, kartina romlari; saqlanadigan yoki tashiladigan idishlar, metalldan bo'lmaganlar; qayta ishlanmagan yoki yarim ishlangan suyak, shox, kitning murtlari yoki marjon, chig'anoq, qahrabo, ona marjon, dengiz ko'pigi; mershshaum va bu materiallarning o'rinbosarlari, yoki plastmassadan.",
    keywords: ["mebel", "divan", "stol", "stul", "shkaf", "ko'zgu"]
  },
  {
    classNumber: 21,
    name: "Ro'zg'or jihozlari",
    description: "Ro'zg'or yoki oshxona jihozlari va konteynerlar; oshxona va dasturxon anjomlari, sanchqilar, pichoqlar va qoshiqlardan tashqari; taroqlar va gubkalar; cho'tkalar va mo'yqalamlar, tayyorlash uchun materallardan tashqari; cho'tka tayyorlash uchun materiallar; tozalash uchun vositalar; ishlanmagan yoki yarim ishlangan shisha, qurilish oynasidan tashqari; shisha, chinni va sopol idishlar.",
    keywords: ["idish", "oshxona", "ro'zg'or", "choynak", "piyola", "ko'za"]
  },
  {
    classNumber: 22,
    name: "Arqonlar va matolar",
    description: "Arqonlar va iplar; to'rlar; chodir va brezentlar; brezentdan soyabonlar; yelkanlar; qoplar yuklarni tashish va saqlash uchun; to'ldiruvchi, yostiq va to'ldirish materiallari, qog'oz, karton, rezina yoki plastmassadan tashqari; xom tolali to'qimachilik materiallari va ularning o'rnini bosuvchilar.",
    keywords: ["arqon", "ip", "tolali", "chodir", "to'r", "brezent"]
  },
  {
    classNumber: 23,
    name: "Iplar va ip kalava",
    description: "Iplar va ip kalava to'qish uchun.",
    keywords: ["ip", "kalava", "to'qish", "tikuv", "mato"]
  },
  {
    classNumber: 24,
    name: "To'qimachilik mahsulotlari",
    description: "To'qimachilik mahsulotlari va to'qimachilik mahsulotlarining o'rinbosarlari; ro'zg'or chorshablari; to'qimachilik yoki plastik pardalar.",
    keywords: ["mato", "choyshab", "parda", "choyshablar", "yostiqlar"]
  },
  {
    classNumber: 25,
    name: "Kiyim-kechak va oyoq kiyimlar",
    description: "Kiyimlar, oyoq kiyimlar, bosh kiyimlar.",
    keywords: ["kiyim", "poyabzal", "ko'ylak", "shim", "kostum", "futbolka", "moda"]
  },
  {
    classNumber: 26,
    name: "Galantereya va ziynatlash",
    description: "Dantellalar, tesmalar va kashtalar, va yopishqoq lentalar va lentalar; tugmalar, ilmoqlar va ko'zchalar, to'g'nag'ichlar va ignalar; sun'iy gullar; soch bezaklari; sochlar.",
    keywords: ["bezak", "tugma", "lenta", "yasama", "galantereya"]
  },
  {
    classNumber: 27,
    name: "Pol qoplamalari va gilamlar",
    description: "Gilamlar, gilamchalar, bo'yralar, linoleum va boshqa materiallar mavjud pollarni qoplash uchun; devor osilma buyumlari [to'qimachilikdan bo'lmagan].",
    keywords: ["gilam", "linoleum", "poyondoz", "pol", "qoplama"]
  },
  {
    classNumber: 28,
    name: "O'yinchoqlar va o'yinlar",
    description: "O'yinlar, o'yinchoqlar va buyumlar o'ynash uchun; video o'yin apparatlari; gimnastika va sport buyumlari; archa bezaklari.",
    keywords: ["o'yin", "o'yinchoq", "sport", "gimnastika", "archa"]
  },
  {
    classNumber: 29,
    name: "Go'sht, baliq, parranda va yovvoyi parrandalar",
    description: "Go'sht, baliq, parranda va yovvoyi parrandalar; go'sht ekstraktlari; konservalangan, muzlatilgan, quritilgan va pishirilgan mevalar va sabzavotlar; jelylar, murabbo, kompotlar; tuxumlar; sut, pishloq, sariyog', yogurt va boshqa sut mahsulotlari; yog'lar va moylar ovqat uchun.",
    keywords: ["go'sht", "baliq", "sabzavot", "meva", "sut", "konserva"]
  },
  {
    classNumber: 30,
    name: "Qahva, choy, kakao va ziravorlar",
    description: "Qahva, choy, kakao va ularning o'rnini bosuvchilar; guruch, makaron va lapsha; tapioka va sagu; un va don mahsulotlari; non, xamirli va shirinlik mahsulotlari; shokolad; muzqaymoq, sherbet va boshqa oziq-ovqat muzlari; shakar, asal, patoka; achitqilar, novvoylik kukunlari; tuz, ziravorlar, xushbo'ylashtirilgan o'tlar; sirka, souslar va boshqa ziravorlar; muz [muzlatilgan suv].",
    keywords: ["qahva", "choy", "qand", "un", "non", "makaron"]
  },
  {
    classNumber: 31,
    name: "Qishloq xo'jaligi mahsulotlari",
    description: "Qayta ishlanmagan qishloq xo'jaligi, akvakultura, bog'dorchilik va o'rmon mahsulotlari; qayta ishlanmagan donlar va urug'lar; yangi mevalar va sabzavotlar, yangi o'tlar; tabiiy o'simliklar va gullar; piyozlar, ko'chatlar va ekish uchun urug'lar; tirik hayvonlar; hayvonlar uchun oziqalar va ichimliklar; solod.",
    keywords: ["urug'", "ko'chat", "hayvon", "ozuqa", "qishloq", "o'rmon"]
  },
  {
    classNumber: 32,
    name: "Pivo va alkogolsiz ichimliklar",
    description: "Pivo; alkogolsiz ichimliklar; mineral va gazlangan suvlar; mevali ichimliklar va meva sharbatlari; siroplar va boshqa alkogolsiz preparatlar ichimliklar tayyorlash uchun.",
    keywords: ["pivo", "ichimlik", "suv", "sharbat", "alkogolsiz"]
  },
  {
    classNumber: 33,
    name: "Alkogol ichimliklar",
    description: "Alkogol ichimliklar, pivo bundan mustasno; ichimliklar tayyorlash uchun spirtli preparatlar.",
    keywords: ["alkogol", "vino", "viski", "aroq", "konyak", "shampan"]
  },
  {
    classNumber: 34,
    name: "Tamaki va chekish jihozlari",
    description: "Tamaki va tamaki o'rnini bosuvchilar; sigaretalar va sigaralar; elektron sigaretalar va og'izdan chiqadigan bugʻlantirgichlar chekuvchilar uchun; chekuvchilar uchun jihozlar; gugurtlar.",
    keywords: ["tamaki", "sigaret", "trubka", "gugurt", "chekish"]
  },
  {
    classNumber: 35,
    name: "Reklama va biznes boshqaruvi",
    description: "Reklama; biznes menejmentini boshqarish; biznes ma'muriyati; ofis funksiyalari.",
    keywords: ["reklama", "biznes", "marketing", "savdo", "boshqaruv", "import", "eksport", "tijorat", "menejment"]
  },
  {
    classNumber: 36,
    name: "Moliyaviy operatsiyalar",
    description: "Sug'urta xizmatlari; moliyaviy ishlar; valyuta operatsiyalari; ko'chmas mulk operatsiyalari.",
    keywords: ["moliya", "sug'urta", "bank", "kredit", "investitsiya", "ko'chmas mulk", "ipoteka", "valyuta"]
  },
  {
    classNumber: 37,
    name: "Qurilish va ta'mirlash",
    description: "Qurilish xizmatlari; o'rnatish va ta'mirlash xizmatlari; tog'-kon qazish, neft va gaz qazish.",
    keywords: ["qurilish", "ta'mirlash", "o'rnatish", "montaj", "remont", "qazish"]
  },
  {
    classNumber: 38,
    name: "Telekommunikatsiyalar",
    description: "Telekommunikatsiya xizmatlari.",
    keywords: ["aloqa", "telekom", "internet", "telefon", "sputnik", "tarmoq"]
  },
  {
    classNumber: 39,
    name: "Transport va saqlash",
    description: "Transport; tovarlarni o'rash va saqlash; sayohatlarni tashkil etish.",
    keywords: ["transport", "yuk tashish", "yetkazib berish", "logistika", "saqlash", "sayohat", "turizm"]
  },
  {
    classNumber: 40,
    name: "Materiallarni qayta ishlash",
    description: "Materiallarni qayta ishlash; chiqindilar va axlatni qayta ishlash; havo tozalash va suv ishlov berish; bosma xizmatlar; oziq-ovqatni va ichimliklarni konservalash.",
    keywords: ["ishlab chiqarish", "ishlov berish", "quyish", "qayta ishlash"]
  },
  {
    classNumber: 41,
    name: "Ta'lim va ko'ngilochar",
    description: "Ta'lim; treninglar taqdim etish; ko'ngilochar tadbirlar; sport va madaniy tadbirlar.",
    keywords: ["ta'lim", "o'qitish", "ko'ngil ochish", "sport", "madaniy", "tadbir"]
  },
  {
    classNumber: 42,
    name: "Ilmiy-texnik xizmatlar",
    description: "Ilmiy va texnologik xizmatlar va ularga tegishli tadqiqot va loyihalash xizmatlari; sanoat tahlili, sanoat tadqiqotlari va sanoat dizayni xizmatlari; sifatni nazorat qilish va tekshirish xizmatlari; kompyuter apparati va dasturiy ta'minotini loyihalash va ishlab chiqish; yuridik xizmatlar.",
    keywords: ["ilmiy", "texnik", "dasturiy ta'minot", "kompyuter", "tadqiqot", "loyiha", "dizayn", "IT", "yuridik"]
  },
  {
    classNumber: 43,
    name: "Oziq-ovqat va turar-joy xizmatlari",
    description: "Oziq-ovqat va ichimliklar bilan ta'minlash xizmatlari; vaqtinchalik turar-joyni ta'minlash.",
    keywords: ["restoran", "kafe", "oziq-ovqat", "ovqatlanish", "mehmonxona", "hostel", "yotoq"]
  },
  {
    classNumber: 44,
    name: "Tibbiy xizmatlar",
    description: "Tibbiy xizmatlar; veterinariya xizmatlari; inson va hayvonlar uchun gigiyena va go'zallik xizmatlari; qishloq xo'jaligi, bog'dorchilik va o'rmonchilik xizmatlari.",
    keywords: ["tibbiyot", "klinika", "davolash", "salomatlik", "gigiyena", "go'zallik", "qishloq xo'jaligi"]
  },
  {
    classNumber: 45,
    name: "Yuridik va xavfsizlik xizmatlari",
    description: "Yuridik xizmatlar; mulk va shaxslarni jismoniy himoya qilish bo'yicha xavfsizlik xizmatlari; shaxsiy va ijtimoiy ehtiyojlarni qondirish uchun boshqalar tomonidan ko'rsatiladigan individual xizmatlar.",
    keywords: ["yuridik", "advokat", "huquqiy", "xavfsizlik", "himoya", "ijtimoiy", "shaxsiy"]
  }
];

// Faoliyat turi bo'yicha tavsiya qilinadigan sinflar
export const getRecommendedClasses = (activity) => {
  if (!activity || activity.trim() === '') return [];
  
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

// Store selected MKTU classes in localStorage for sharing between dashboards
export const storeMktuClasses = (classes) => {
  if (Array.isArray(classes)) {
    // Add debug output to verify data is being stored
    console.log("Storing MKTU classes to localStorage:", classes);
    localStorage.setItem('selectedMktuClasses', JSON.stringify(classes));
    
    // Dispatch a custom event to notify other components
    const event = new CustomEvent('mktuClassesUpdated', {
      detail: { classes }
    });
    document.dispatchEvent(event);
  }
};

// Get selected MKTU classes from localStorage
export const getStoredMktuClasses = () => {
  try {
    const storedClasses = localStorage.getItem('selectedMktuClasses');
    const parsed = storedClasses ? JSON.parse(storedClasses) : [];
    // Add debug output to verify data is being retrieved
    console.log("Retrieved MKTU classes from localStorage:", parsed);
    return parsed;
  } catch (error) {
    console.error('Error parsing stored MKTU classes:', error);
    return [];
  }
};

// Share power of attorney documents between dashboards
export const sharePowerOfAttorneyDocuments = (documents) => {
  if (documents) {
    localStorage.setItem('sharedPowerOfAttorneyDocs', JSON.stringify(documents));
    
    // Dispatch a custom event for real-time updates
    const event = new CustomEvent('powerOfAttorneyUpdated', { 
      detail: { documents } 
    });
    document.dispatchEvent(event);
  }
};

// Get shared power of attorney documents
export const getSharedPowerOfAttorneyDocuments = () => {
  try {
    const storedDocs = localStorage.getItem('sharedPowerOfAttorneyDocs');
    return storedDocs ? JSON.parse(storedDocs) : null;
  } catch (error) {
    console.error('Error parsing stored power of attorney documents:', error);
    return null;
  }
};
