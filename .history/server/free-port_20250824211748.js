/**
 * Bu script port 5000 ni bo'shatish uchun
 * Ishga tushirish: node free-port.js
 * ESLATMA: Bu script Linux/Mac tizimlarda ishlaydi
 */

const { exec } = require('child_process');

console.log('Port 5000 da ishlab turgan jarayonni to\'xtatishga harakat qilinmoqda...');

// Linux/Mac tizimlar uchun
exec('lsof -i :5000 -t | xargs kill -9', (error, stdout, stderr) => {
  if (error) {
    console.log('Port 5000 bo\'shatishda xatolik:');
    console.log('Qo\'lda to\'xtatish uchun:');
    console.log('1. "lsof -i :5000" buyrug\'ini ishlating');
    console.log('2. "kill -9 <PID>" buyrug\'ini PID raqami bilan ishlating');
  } else {
    console.log('Port 5000 muvaffaqiyatli bo\'shatildi!');
    console.log('Endi "node index.js" buyrug\'i bilan serveringizni ishga tushirishingiz mumkin.');
  }
});

// Windows tizim uchun
// Bu Windows tizimda ishlash uchun alohida skript
exec('for /f "tokens=5" %a in (\'netstat -ano ^| find ":5000" ^| find "LISTENING"\') do taskkill /F /PID %a', 
  {shell: 'cmd.exe'},
  (error, stdout, stderr) => {
    if (!error) {
      console.log('Windows: Port 5000 muvaffaqiyatli bo\'shatildi!');
    }
  }
);
