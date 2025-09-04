/**
 * Server diagnostika fayli
 * Bu faylni serverni tekshirish uchun ishga tushiring: node check-server.js
 */

const http = require('http');

// Serverning ishlayotganini tekshirish
function checkServerRunning() {
  console.log('Server diagnostikasi boshlandi...');
  
  // Port 5000 da server ishlayotganini tekshirish
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/',
    method: 'GET'
  }, (res) => {
    console.log(`Server javob berdi: Status ${res.statusCode}`);
    
    // API yo'llarini tekshirish
    checkApiEndpoint('/api/jobs');
  });
  
  req.on('error', (e) => {
    console.error(`❌ Server ishlamayapti yoki bog'lanib bo'lmadi: ${e.message}`);
    console.log('\n✅ MASLAHAT: Serverni qayta ishga tushiring: `node index.js`');
    
    // Docker holatini tekshirish
    console.log('\nDocker holatini tekshirish:');
    console.log('1. `docker ps` buyrug\'ini ishlating va "patent" nomli container borligini tekshiring');
    console.log('2. `docker logs <container_id>` orqali containerda xatolar bormi tekshiring');
    console.log('3. Agar Docker ishlatilayotgan bo\'lsa, portlar to\'g\'ri mapplanganini tekshiring (5000:5000)');
  });
  
  req.end();
}

// API endpointlarni tekshirish
function checkApiEndpoint(path) {
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'OPTIONS', // OPTIONS so'rovi server javob beradimi tekshirish uchun
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,authorization'
    }
  }, (res) => {
    console.log(`\n${path} endpointi mavjud: Status ${res.statusCode}`);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ API endpoint ishlayapti!');
    } else {
      console.log('❌ API endpoint mavjud emas yoki boshqa xatolik bor');
    }
  });
  
  req.on('error', (e) => {
    console.error(`❌ ${path} endpointini tekshirishda xatolik: ${e.message}`);
  });
  
  req.end();
}

// Serverning index.js faylini tekshirish
const fs = require('fs');
try {
  const indexFile = fs.readFileSync('./index.js', 'utf8');
  console.log('\nindex.js fayli mavjud ✅');
  
  // Jobs routerining ro'yxatdan o'tganligini tekshirish
  if (indexFile.includes("'/api/jobs', require('./routes/jobs')") || 
      indexFile.includes('"/api/jobs", require("./routes/jobs")')) {
    console.log('✅ Jobs routeri index.js faylida to\'g\'ri ro\'yxatdan o\'tkazilgan');
  } else {
    console.log('❌ Jobs routeri index.js faylida topilmadi yoki noto\'g\'ri ro\'yxatdan o\'tkazilgan');
  }
} catch (err) {
  console.error('❌ index.js faylini o\'qishda xatolik:', err.message);
}

// MongoDB ulanishini tekshirish
console.log('\nMongoDB ulanishini tekshirish:');
console.log('MONGO_URI muhit o\'zgaruvchisi mavjud:', process.env.MONGO_URI ? '✅ Ha' : '❌ Yo\'q');
console.log('\nServer ishlayotganini tekshiring:');
console.log('1. Serverni qayta ishga tushiring: `node index.js`');
console.log('2. Serverni ishga tushirish uchun alohida terminal oynasini ochib, quyidagi buyruqni ishlating:');
console.log('   cd /home/abdunodir/Patent syat/server && node index.js');

// Server tekshiruvini boshlash
checkServerRunning();
