#!/bin/bash

echo "=============================="
echo "  PATENT SERVER RESTART TOOL  "
echo "=============================="

# Joriy direktoriyadagi Node.js jarayonlarini to'xtatish
echo -e "\n📋 Ishlab turgan Node.js jarayonlarini to'xtatish..."
pkill -f "node index.js" || echo "Node.js jarayon topilmadi"

# Docker konteynerlarni to'xtatish
echo -e "\n🔻 Docker konteynerlarini to'xtatish..."
docker-compose down

# Docker konteynerlarni qayta ishga tushirish
echo -e "\n🔺 Docker konteynerlarini qayta ishga tushirish..."
docker-compose up -d

# Docker konteynerlar holatini tekshirish
echo -e "\n📊 Konteynerlar holati:"
docker ps

# MongoDB ga ulanishni kutish
echo -e "\n⏳ MongoDB ga ulanish kutilmoqda..."
sleep 5

# Node.js serverni ishga tushirish
echo -e "\n🚀 Node.js serverni ishga tushirish..."
node index.js
