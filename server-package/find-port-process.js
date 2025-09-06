/**
 * Bu script port 5000 ni ishlatayotgan jarayonni topish uchun
 * Ishga tushirish: node find-port-process.js
 */

const { exec } = require('child_process');

console.log('Port 5000 da ishlab turgan jarayon qidirilmoqda...');

// Linux/Mac uchun
exec('lsof -i :5000', (error, stdout, stderr) => {
  if (error) {
    console.log('lsof buyrug\'i ishlamadi. Windows tizimida bo\'lishingiz mumkin.');
    
    // Windows uchun
    exec('netstat -ano | findstr :5000', (error, stdout, stderr) => {
      if (error) {
        console.log('Jarayonni topishda xatolik yuz berdi:', error);
        return;
      }
      
      if (stdout) {
        console.log('Port 5000 da ishlab turgan jarayon topildi (Windows):');
        console.log(stdout);
        console.log('\nJarayonni to\'xtatish uchun:');
        console.log('1. PID raqamini aniqlang (oxirgi ustun)');
        console.log('2. "taskkill /F /PID <raqam>" buyrug\'ini ishlating');
      } else {
        console.log('Port 5000 da hech qanday jarayon topilmadi.');
      }
    });
    
    return;
  }
  
  if (stdout) {
    console.log('Port 5000 da ishlab turgan jarayon topildi (Linux/Mac):');
    console.log(stdout);
    console.log('\nJarayonni to\'xtatish uchun:');
    console.log('1. PID raqamini aniqlang (ikkinchi ustun)');
    console.log('2. "kill -9 <PID>" buyrug\'ini ishlating');
  } else {
    console.log('Port 5000 da hech qanday jarayon topilmadi.');
  }
});
