/**
 * Port 5000ni bo'shatish uchun utility
 * Ishga tushirish: node free-port.js
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const PORT = 5000;

async function freePort() {
  console.log(`\n🔍 Port ${PORT} holatini tekshirish...\n`);
  
  try {
    // Portdagi jarayonlarni tekshirish
    const { stdout } = await execPromise(`lsof -i :${PORT} -t`);
    
    if (stdout.trim()) {
      const pids = stdout.trim().split('\n');
      console.log(`⚠️  Port ${PORT} quyidagi jarayonlar tomonidan ishlatilmoqda: ${pids.join(', ')}\n`);
      
      // Jarayonlarni to'xtatish
      for (const pid of pids) {
        console.log(`🔄 Jarayon ${pid} to'xtatilmoqda...`);
        await execPromise(`kill -9 ${pid}`);
      }
      
      console.log(`\n✅ Port ${PORT} muvaffaqiyatli bo'shatildi!`);
      console.log(`\n🚀 Endi serverni ishga tushiring: node index.js\n`);
    } else {
      console.log(`✅ Port ${PORT} allaqachon bo'sh. Server ishga tushishi mumkin.\n`);
    }
  } catch (error) {
    console.error(`\n❌ Xatolik: ${error.message}`);
    console.log('\nQo\'lda portni bo\'shatish:');
    console.log('1. sudo lsof -i :5000      # Portni ishlatayotgan jarayonlarni ko\'rish');
    console.log('2. sudo kill -9 <PID>      # Aniqlangan jarayon ID sini to\'xtatish\n');
  }
}

// Skriptni ishga tushirish
freePort();
