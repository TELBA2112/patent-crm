/**
 * Bu skript port 5000 bilan bog'liq muammolarni hal qilishda yordam beradi
 * 
 * Ishlatish: node port-xato.js
 */

const { exec } = require('child_process');
const os = require('os');

console.log('Serveringiz port 5000 ishlatmoqda va uni bo\'shatish kerak.');
console.log('Quyidagi ko\'rsatmalarga amal qiling:');

if (os.platform() === 'win32') {
  console.log('\nWindows tizimi uchun:');
  console.log('1. CMD yoki PowerShell-ni administrativ rejimda oching');
  console.log('2. Quyidagi buyruqni kiriting:');
  console.log('   netstat -ano | findstr :5000');
  console.log('3. Ko\'rsatilgan PID raqamini yozib oling');
  console.log('4. Keyin quyidagi buyruqni bajaring:');
  console.log('   taskkill /F /PID <yozib_olgan_PID_raqami>');
  
  // Windows uchun jarayonlarni ko'rsatish
  exec('netstat -ano | findstr :5000', (error, stdout, stderr) => {
    if (error) {
      console.log('Portni tekshirishda xatolik yuz berdi');
      return;
    }
    console.log('\nPort 5000ni ishlatayotgan jarayonlar:');
    console.log(stdout);
  });
} else {
  console.log('\nLinux/Mac tizimi uchun:');
  console.log('1. Terminal oynasida quyidagi buyruqni kiriting:');
  console.log('   sudo lsof -i :5000');
  console.log('2. Ko\'rsatilgan PID raqamini yozib oling');
  console.log('3. Keyin quyidagi buyruqni bajaring:');
  console.log('   kill -9 <yozib_olgan_PID_raqami>');
  
  // Linux/Mac uchun jarayonlarni ko'rsatish
  exec('lsof -i :5000', (error, stdout, stderr) => {
    if (error) {
      console.log('Portni tekshirishda xatolik yuz berdi');
      return;
    }
    console.log('\nPort 5000ni ishlatayotgan jarayonlar:');
    console.log(stdout);
  });
}

console.log('\nAgar Docker ishlayotgan bo\'lsa:');
console.log('1. docker ps - barcha ishlayotgan konteynerlarni ko\'rish');
console.log('2. docker stop <CONTAINER_ID> - kerakli konteynerni to\'xtatish');

console.log('\nPort bo\'shatilgach, serverni qayta ishga tushiring:');
console.log('node index.js');
