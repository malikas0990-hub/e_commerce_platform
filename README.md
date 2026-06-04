# 🛍️ Ulgurji Kiyim eCommerce + CRM (Cloud)

Ulgurji kiyim-kechak savdosi uchun **dinamik eCommerce + CRM** platformasi.
BTEC Cloud Computing assignment talablariga mos: SPA frontend, RESTful backend,
PostgreSQL + Redis, Docker, CI/CD va AWS (VPC, Load Balancer, Auto-scaling).

![CI](https://github.com/USERNAME/clothing-ecommerce/actions/workflows/ci.yml/badge.svg)

---

## 🏗️ Arxitektura

```
                          Internet
                              │
                   ┌──────────▼───────────┐   PUBLIC SUBNET
                   │  Application Load     │   (10.0.0.0/24, 10.0.1.0/24)
                   │  Balancer (ALB :80)   │
                   └──────────┬───────────┘
                              │  forward :5000
        ┌─────────────────────▼─────────────────────┐  PRIVATE SUBNET
        │   Auto Scaling Group (2 → 10 instances)    │  (10.0.10.0/24, 10.0.11.0/24)
        │   Backend (Node.js + Express) in Docker    │
        └───────┬───────────────────────┬───────────┘
                │                        │
       ┌────────▼────────┐     ┌─────────▼─────────┐
       │ RDS PostgreSQL  │     │ ElastiCache Redis │   (private, internetdan yashirin)
       └─────────────────┘     └───────────────────┘
                │
          NAT Gateway ──► internetga faqat chiqish (outbound)

CloudWatch CPU > 70% ⇒ scale up (+2) ;  CPU < 25% ⇒ scale down (−1)
```

---

## 🧩 Texnologiyalar

| Qatlam        | Texnologiya |
|---------------|-------------|
| Frontend      | React 18 (Vite SPA), Ant Design, Recharts, Socket.IO client |
| Backend       | Node.js, Express, Sequelize, Socket.IO |
| Ma'lumotlar   | PostgreSQL 15 (relyatsion), Redis 7 (kesh) |
| Auth          | JWT + RBAC (4 rol) |
| Konteyner     | Docker, Docker Compose |
| CI/CD         | GitHub Actions |
| Infra (IaC)   | Terraform (AWS VPC, ALB, ASG, RDS, ElastiCache, CloudWatch) |

---

## 👥 CRM rollari (RBAC)

Whiteboarddagi talabga muvofiq CRM 3 ta boshqaruv rolidan iborat + mijoz:

| Rol          | Imkoniyatlar |
|--------------|--------------|
| **superadmin** | To'liq nazorat + **xodimlarni boshqarish** (admin/manager yaratish, rol berish) |
| **admin**      | Katalog, buyurtmalar, mijozlar (CRM) ni boshqarish |
| **manager**    | Dashboard ko'rish, buyurtma statuslarini yangilash |
| customer       | Katalog, savatcha, buyurtma berish, o'z kabineti |

---

## 🚀 Lokal ishga tushirish (Docker — 1 buyruq)

```bash
docker compose up --build
```

Ochiladi:
- Frontend → http://localhost:3000
- Backend API → http://localhost:5000/api  (health: http://localhost:5000/health)
- PostgreSQL → localhost:5432
- Redis → localhost:6379

Boshlang'ich (seed) loginlar:

| Rol        | Email                  | Parol       |
|------------|------------------------|-------------|
| Superadmin | superadmin@shop.uz     | super123    |
| Admin      | admin@shop.uz          | admin123    |
| Manager    | manager@shop.uz        | manager123  |
| Mijoz      | customer@shop.uz       | customer123 |

---

## 🛠️ Dasturchilar uchun (Docker'siz)

```bash
# Backend
cd backend && npm install && cp .env.example .env && npm run dev
# Frontend (alohida terminal)
cd frontend && npm install && npm run dev
```
Frontend Vite proxy orqali `/api` va `/socket.io` ni backendga (5000) yo'naltiradi.

---

## 📡 Asosiy API endpointlar

| Metod | Yo'l | Tavsif | Ruxsat |
|-------|------|--------|--------|
| POST | `/api/auth/register` | Ro'yxatdan o'tish | hammaga |
| POST | `/api/auth/login` | Kirish | hammaga |
| GET  | `/api/products` | Katalog (filter, sahifalash, kesh) | hammaga |
| POST | `/api/orders` | Buyurtma berish (ombor tekshiruvi, tranzaksiya) | auth |
| GET  | `/api/orders/my` | Mening buyurtmalarim | auth |
| GET  | `/api/admin/stats` | Dashboard statistikasi | admin/manager |
| GET  | `/api/admin/analytics` | Sotuv trendi | admin/manager |
| GET  | `/api/admin/customers` | CRM mijozlar ro'yxati | admin/manager |
| GET/POST | `/api/users` | Xodimlarni boshqarish | **superadmin** |

---

## ☁️ AWS'ga deploy (Terraform)

```bash
cd infrastructure
cp terraform.tfvars.example terraform.tfvars   # qiymatlarni to'ldiring
terraform init
terraform plan
terraform apply
```
Natijada: VPC (public/private subnet) + NAT + ALB + Auto Scaling Group (2–10) +
RDS PostgreSQL + ElastiCache Redis + CloudWatch alarmlari yaratiladi.
`terraform output alb_dns_name` — saytning ommaviy manzili.

> Eslatma: `terraform apply` haqiqiy AWS akkaunt va kreditsiallarni talab qiladi
> (xarajatga sabab bo'ladi). Topshiriq uchun `terraform plan` natijasini ko'rsatish kifoya.

---

## 🔄 CI/CD

Har bir `main`ga push: backend testlari → frontend build → Docker image build →
deploy bosqichi (`.github/workflows/ci.yml`).

---

## 📂 Struktura

```
clothing-ecommerce/
├── frontend/          React SPA (Vite, Ant Design)
├── backend/           Node.js + Express + Sequelize + Socket.IO
├── database/          init.sql (extensions)
├── infrastructure/    Terraform (AWS IaC)
├── .github/workflows/ CI/CD
└── docker-compose.yml
```

## 📜 Litsenziya
MIT — BTEC Cloud Computing Assignment uchun ta'limiy loyiha.
