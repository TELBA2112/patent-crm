#!/bin/bash

echo "=== MongoDB Konteynerini qayta ishga tushirish ==="

# Docker ishlayotganini tekshirish
if ! command -v docker &> /dev/null; then
    echo "❌ Docker topilmadi!"
    echo "Iltimos, Docker o'rnatilganligini tekshiring."
    exit 1
fi

echo "1. Mavjud MongoDB konteynerlarini qidirish..."
MONGO_CONTAINER=$(docker ps -a | grep mongo | awk '{print $1}')

if [ -z "$MONGO_CONTAINER" ]; then
    echo "⚠️ MongoDB konteyneri topilmadi!"
    
    echo "2. MongoDB konteynerini yaratish..."
    docker run -d --name mongodb -p 27017:27017 mongo:6.0
    
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB konteyneri muvaffaqiyatli yaratildi va ishga tushirildi!"
    else
        echo "❌ MongoDB konteynerini yaratishda xatolik!"
        exit 1
    fi
else
    echo "2. Mavjud MongoDB konteynerini qayta ishga tushirish: $MONGO_CONTAINER"
    docker restart $MONGO_CONTAINER
    
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB konteyneri muvaffaqiyatli qayta ishga tushirildi!"
    else
        echo "❌ MongoDB konteynerini qayta ishga tushirishda xatolik!"
        exit 1
    fi
fi

echo "3. MongoDB konteynerining holatini tekshirish..."
docker ps | grep mongo

echo "4. MongoDB ulanishini tekshirish..."
echo "5 soniya kutilmoqda..."
sleep 5

echo "MongoDB holatini tekshirish skriptini ishga tushirish..."
node db-check.js

echo "MongoDB konteyneri muvaffaqiyatli ishga tushirildi!"
echo "Endi server ishga tushirish mumkin: node index.js"
