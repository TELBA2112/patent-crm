// MKTU (Nice Classification) sinflari ma'lumotlar bazasi
// Har bir sinf uchun raqami, nomi va batafsil tavsifi berilgan
/* */
export const mktuClasses = [
  {
    classNumber: 1,
    name: "Kimyoviy moddalar",
    description: "Sanoat, ilm-fan va fotosuratchilik maqsadlarida, shuningdek qishloq xo'jaligi, bog'dorchilik va o'rmonchilikda foydalaniladigan kimyoviy moddalar; qayta ishlanmagan sun'iy smolalar, qayta ishlanmagan plastmassalar; yong'in va yong'in oldini olish tarkiblari; metallarni toblovchi va payvandlash preparatlari; terini oshlash uchun moddalar; sanoatda ishlatiladigan yelimlar; mastikalar va boshqa shpatlyovkalar; kompostlar, o'g'itlar, o'g'itlovchi moddalar; biologik preparatlar sanoat va ilm-fan maqsadlarida ishlatiladi.",
    keywords: ["kimyo", "smola", "plastmassa", "o'g'it", "yelim", "payvandlash", "sanoat"]
  },
  {
    classNumber: 2,
    name: "Bo'yoqlar va qoplamalar",
    description: "Bo'yoqlar, laklar, emallar; zanglashdan himoya qiluvchi va yog'ochni chirishdan saqlovchi vositalar; bo'yovchi moddalar; bo'yash, bezatish, bosma va badiiy-bezak ishlari uchun bo'yoqlar; qayta ishlanmagan tabiiy smolalar; metallarni varaq va kukun ko'rinishidagi rassomlar, dizaynerlar, typograflar va badiiy-bezak ishlari uchun.",
    keywords: ["bo'yoq", "lak", "emal", "zang", "himoya", "qoplama"]
  },
  {
    classNumber: 3,
    name: "Kosmetika va tozalash",
    description: "Kosmetik va pardoz vositalari, tibbiy bo'lmaganlar; tibbiy bo'lmagan tish pastalari; parfyumeriya mahsulotlari, efir moylari; oqartirish preparatlari va kir yuvish uchun boshqa moddalar; tozalash, silliqlash, tozalash va abraziv ishlov berish vositalari.",
    keywords: ["kosmetika", "shampun", "sovun", "parfyumeriya", "tozalash", "yuvish", "krem"]
  },
  {
    classNumber: 4,
    name: "Moylar va yonilg'i",
    description: "Sanoat moylari va yog'lari, mumlar; moylash materiallari; chang yutuvchi, ho'llovchi va bog'lovchi birikmalar; yonilg'i va yorituvchi moddalar; sham va piliklar yoritish uchun.",
    keywords: ["yog'", "moy", "yonilg'i", "mum", "dizel", "benzin", "sham"]
  },
  {
    classNumber: 5,
    name: "Farmatsevtika",
    description: "Farmatsevtik, tibbiy va veterinarlik preparatlari; gigiyenik vositalar tibbiy maqsadlarda; tibbiy yoki veterinariya maqsadlarida ishlatiluvchi parhez oziq-ovqat mahsulotlari va moddalar, bolalar oziq-ovqatlari; inson yoki hayvonlar uchun oziq-ovqat qo'shimchalari; gipsli bog'lamlar, bog'lash materiallari; tishlarni to'ldirish uchun materiallar, tish mumi; dezinfektsiyalovchi vositalar; zararkunandalarga qarshi preparatlar; fungitsidlar, gerbitsidlar.",
    keywords: ["dori", "tibbiyot", "preparatlar", "vitamin", "biologik", "dezinfektsiya"]
  },
  {
    classNumber: 6,
    name: "Metallar va metal mahsulotlari",
    description: "Oddiy metallar va ularning qotishmalari, rudalar; qurilish va konstruksiya uchun metall materiallar; ko'chma metall imoratlar; temiryo'l izlari uchun metall materiallar; oddiy metallardan tayyorlangan metall arqonlar va simlar; metall temir-tersak mahsulotlari; mayda metall uskunalar; metall konteynerlar saqlash yoki tashish uchun; seyflar.",
    keywords: ["metall", "temir", "po'lat", "alyuminiy", "mis", "qotishma", "sim", "armatura"]
  },
  {
    classNumber: 7,
    name: "Mashinalar",
    description: "Mashinalar, mashinalar va mexanik asboblar, motor va dvigatellar (quruqlikdagi transport vositalari uchun mo'ljallangan bunday motorlar bundan mustasno); mashina ulanishi va transmissiya komponentlari (quruqlikdagi transport vositalari uchun mo'ljallangan bunday komponentlar bundan mustasno); qishloq xo'jaligi asboblari, qo'l bilan boshqariladiganlar bundan mustasno; inkubatorlar tuxumlar uchun; savdo avtomatlari.",
    keywords: ["mashina", "stanok", "dvigatel", "generator", "motor", "mexanizm", "nasoslar"]
  },
  {
    classNumber: 8,
    name: "Qo'l asboblari",
    description: "Qo'l bilan boshqariladigan asboblar va qurilmalar; pichoqlar, sanchqilar va qoshiqlar; sovuq qurollar, o'q otishlari bundan mustasno; ustara.",
    keywords: ["asbob", "pichoq", "sanchqi", "qoshiq", "ustara", "otvertka", "bolg'a"]
  },
  {
    classNumber: 9,
    name: "Elektr, ilmiy, AKT jihozlar",
    description: "Ilmiy, tadqiqot, navigatsiya, geodeziya, fotografiya, kinematografiya, audiovizual, optik, tortish, o'lchash, signalizatsiya, aniqlash, tekshirish, qutqaruv va o'qitish uchun apparatlar va asboblar; elektr tokini uzatish, kommutatsiya, o'zgartirish, akkumulyatsiya, tartibga solish yoki boshqarish uchun apparatlar va asboblar; ovoz yoki tasvirlarni yozish, uzatish, ko'paytirishyoki qayta ishlash uchun apparatlar va asboblar; yozilgan va yuklab olinadigan media, kompyuter dasturlari, bo'sh raqamli yoki analog yozish va saqlash vositalari; pul bilan ishlaydigan apparatlar mexanizmlari; kassa apparatlari, hisoblash qurilmalari; kompyuterlar va kompyuter periferiya qurilmalari; sho'ng'in kostyumlari, g’avvos niqoblari, quloq tiqinlar g’avvoslar va suzuvchilar uchun, burun qisqichlari g’avvoslar va suzuvchilar uchun, g’avvoslar va suzuvchilar uchun qo'lqoplar, nafas olish apparati suv ostida suzish uchun; o't o'chirish qurilmalari.",
    keywords: ["elektr", "elektronika", "kompyuter", "dastur", "texnologiya", "ilmiy"]
  },
  {
    classNumber: 10,
    name: "Tibbiy jihozlar",
    description: "Jarrohlik, tibbiy, tish va veterinariya apparatlari va asboblari; protezlar, qo'llar, ko'zlar va tishlar; ortopedik mahsulotlar; tikuv materiallari; nogironlar uchun terapevtik va yordam beruvchi qurilmalar; massaj apparatlari; bolalar uchun qurilmalar, uchish va ifloslantirish qurilmalari; jinsiy faoliyat uchun moslamalar, qurilmalar va predmetlar.",
    keywords: ["tibbiy", "jarroh", "protez", "klinika", "tish", "apparat"]
  },
  {
    classNumber: 11,
    name: "Isitish, sovutish va yorug'lik",
    description: "Yoritish, isitish, sovitish, bug' hosil qilish, pishirish, quritish, ventilyatsiya, suv ta'minoti va sanitariya-texnik maqsadlar uchun mo'ljallangan apparatlar va moslamalar.",
    keywords: ["isitgich", "konditsioner", "yorug'lik", "ventilyatsiya", "sovutgich"]
  },
  {
    classNumber: 12,
    name: "Transport vositalari",
    description: "Transport vositalari; quruqlik, havo yoki suvda harakatlanish uchun mo'ljallangan apparatlar.",
    keywords: ["mashina", "avto", "transport", "yuk", "avtobus", "samolyot", "qayiq"]
  },
  {
    classNumber: 13,
    name: "O'q-dorilar va portlovchi moddalar",
    description: "O't ochish qurollari; o'q-dorilar va snaryadlar; portlovchi moddalar; pirotexnika vositalari.",
    keywords: ["qurol", "portlovchi", "o'q", "snaryad", "pirotexnika", "harbiy"]
  },
  {
    classNumber: 14,
    name: "Qimmatbaho metallar va zargarlik",
    description: "Qimmatbaho metallar va ularning qotishmalari; zargarlik buyumlari, qimmatbaho va yarim qimmatbaho toshlar; soatsozlik va xronometrik asboblar.",
    keywords: ["zargarlik", "soat", "qimmatbaho", "oltin", "kumush", "platina", "tilla"]
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
