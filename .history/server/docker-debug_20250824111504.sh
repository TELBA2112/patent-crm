#!/bin/bash

echo "Docker containerlarni to'xtatish..."
docker-compose down

echo "Container loglarini ko'rish..."
docker logs patent-server

echo "Docker containerlarni qayta ishga tushirish..."
docker-compose up -d

echo "Kutish (5 sekund)..."
sleep 5

echo "Container holatini tekshirish..."
docker ps

echo "Patent server loglarini ko'rish..."
docker logs patent-server

echo "API test qilish..."
curl -X POST \
  http://localhost:5000/api/jobs \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -d '{
  "clientName": "Test",
  "clientSurname": "User",
  "phone": "123456789",
  "brandName": "TestBrand",
  "personType": "yuridik",
  "assignedTo": "OPERATOR_ID_HERE"
}'

echo ""
echo "Test tugadi."
