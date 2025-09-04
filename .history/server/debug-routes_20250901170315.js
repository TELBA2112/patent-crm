/**
 * Express routes muammolarini qidirish uchun utility
 * 
 * Ishga tushirish: node debug-routes.js
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ROUTES_DIR = path.join(__dirname, 'routes');

// Route handler ishlashini tekshirish uchun funksiya
function validateRouteHandler(handler) {
  // Check if this is a function
  if (typeof handler === 'function') {
    return true;
  }
  
  // Check if this is an arrow function in string form
  if (typeof handler === 'string' && (handler.includes('=>') || handler.includes('function'))) {
    return true;
  }
  
  // Not a valid handler
  return false;
}

// Route fayllarini tekshirish
async function checkRoutesInDirectory() {
  console.log(`🔍 Express routes "${ROUTES_DIR}" direktoryasida tekshirilmoqda...\n`);
  
  try {
    const files = fs.readdirSync(ROUTES_DIR);
    
    // .js fayllari uchun filter
    const routeFiles = files.filter(file => file.endsWith('.js'));
    
    let totalProblems = 0;
    
    // Har bir faylni tekshirish
    for (const file of routeFiles) {
      const filePath = path.join(ROUTES_DIR, file);
      console.log(`📄 Faylni tekshirish: ${file}`);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // JavaScript kodni parse qilish
        const ast = parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        });
        
        let problems = 0;
        
        // Abstract Syntax Tree ni kezib chiqish va route.METHOD ni tekshirish
        traverse(ast, {
          CallExpression(path) {
            if (path.node.callee.type === 'MemberExpression' && 
                path.node.callee.object.name === 'router' &&
                ['get', 'post', 'put', 'delete', 'patch'].includes(path.node.callee.property.name)) {
              
              const methodName = path.node.callee.property.name;
              const args = path.node.arguments;
              
              // Kamida 2ta argument bo'lishi kerak (path, callback)
              if (args.length < 2) {
                console.log(`❌ Qator ${path.node.loc.start.line}: router.${methodName}() ga yetarli argumentlar berilmagan`);
                problems++;
                return;
              }
              
              // Oxirgi argument - callback function yoki middleware array bo'lishi kerak
              const lastArg = args[args.length - 1];
              
              if (lastArg.type !== 'FunctionExpression' && 
                  lastArg.type !== 'ArrowFunctionExpression' &&
                  lastArg.type !== 'Identifier' &&
                  lastArg.type !== 'CallExpression') {
                console.log(`❌ Qator ${path.node.loc.start.line}: router.${methodName}() oxirgi argument function emas: ${lastArg.type}`);
                problems++;
              }
            }
          }
        });
        
        if (problems === 0) {
          console.log(`✅ "${file}" faylida muammolar topilmadi`);
        } else {
          console.log(`⚠️ "${file}" faylida ${problems} muammo topildi`);
          totalProblems += problems;
        }
        
      } catch (error) {
        console.error(`❌ "${file}" faylini parse qilishda xatolik: ${error.message}`);
        totalProblems++;
      }
      
      console.log(''); // Qatorni ajratish
    }
    
    // Natijalarni ko'rsatish
    if (totalProblems === 0) {
      console.log('✅ Barcha route fayllar to\'g\'ri formatda.');
    } else {
      console.log(`⚠️ Jami ${totalProblems} muammo topildi. Iltimos, ko'rsatilgan qatorlarni tekshiring.`);
    }
    
  } catch (error) {
    console.error(`❌ Direktoryani o'qishda xatolik: ${error.message}`);
  }
}

// Tekshirishni boshlash
checkRoutesInDirectory().catch(err => {
  console.error('Kutilmagan xatolik:', err);
});
