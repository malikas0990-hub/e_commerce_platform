# 🛍️ Wholesale Clothing eCommerce + CRM (Cloud)

A **dynamic eCommerce + CRM** platform for wholesale clothing trade.
Built to the BTEC Cloud Computing assignment requirements: SPA frontend, RESTful backend,
PostgreSQL + Redis, Docker, CI/CD and AWS (VPC, Load Balancer, Auto-scaling).

![CI](https://github.com/USERNAME/clothing-ecommerce/actions/workflows/ci.yml/badge.svg)

---

## 🏗️ Architecture

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
       │ RDS PostgreSQL  │     │ ElastiCache Redis │   (private, hidden from internet)
       └─────────────────┘     └───────────────────┘
                │
          NAT Gateway ──► outbound internet access only

CloudWatch CPU > 70% ⇒ scale up (+2) ;  CPU < 25% ⇒ scale down (−1)
```

---

## 🧩 Technologies

| Layer         | Technology |
|---------------|-------------|
| Frontend      | React 18 (Vite SPA), Ant Design, Recharts, Socket.IO client |
| Backend       | Node.js, Express, Sequelize, Socket.IO |
| Data          | PostgreSQL 15 (relational), Redis 7 (cache) |
| Auth          | JWT + RBAC (4 roles) |
| Container     | Docker, Docker Compose |
| CI/CD         | GitHub Actions |
| Infra (IaC)   | Terraform (AWS VPC, ALB, ASG, RDS, ElastiCache, CloudWatch) |

---

## 👥 CRM roles (RBAC)

As required, the CRM consists of 3 management roles plus the customer:

| Role         | Capabilities |
|--------------|--------------|
| **superadmin** | Full control + **staff management** (create admin/manager, assign roles) |
| **admin**      | Manage catalog, orders, customers (CRM) |
| **manager**    | View dashboard, update order statuses |
| customer       | Catalog, cart, place orders, own account |

---

## 🚀 Run locally (Docker — 1 command)

```bash
docker compose up --build
```

Opens:
- Frontend → http://localhost:3000
- Backend API → http://localhost:5000/api  (health: http://localhost:5000/health)
- PostgreSQL → localhost:5432
- Redis → localhost:6379

Initial (seed) logins:

| Role       | Email                  | Password    |
|------------|------------------------|-------------|
| Superadmin | superadmin@shop.uz     | super123    |
| Admin      | admin@shop.uz          | admin123    |
| Manager    | manager@shop.uz        | manager123  |
| Customer   | customer@shop.uz       | customer123 |

---

## 🛠️ For developers (without Docker)

```bash
# Backend
cd backend && npm install && cp .env.example .env && npm run dev
# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```
The Vite proxy forwards `/api` and `/socket.io` to the backend (5000).

---

## 📡 Main API endpoints

| Method | Path | Description | Access |
|-------|------|--------|--------|
| POST | `/api/auth/register` | Register | everyone |
| POST | `/api/auth/login` | Log in | everyone |
| GET  | `/api/products` | Catalog (filter, pagination, cache) | everyone |
| POST | `/api/orders` | Place an order (stock check, transaction) | auth |
| GET  | `/api/orders/my` | My orders | auth |
| GET  | `/api/admin/stats` | Dashboard statistics | admin/manager |
| GET  | `/api/admin/analytics` | Sales trend | admin/manager |
| GET  | `/api/admin/customers` | CRM customer list | admin/manager |
| GET/POST | `/api/users` | Staff management | **superadmin** |

---

## ☁️ Deploy to AWS (Terraform)

```bash
cd infrastructure
cp terraform.tfvars.example terraform.tfvars   # fill in the values
terraform init
terraform plan
terraform apply
```
Result: VPC (public/private subnets) + NAT + ALB + Auto Scaling Group (2–10) +
RDS PostgreSQL + ElastiCache Redis + CloudWatch alarms.
`terraform output alb_dns_name` — the public address of the site.

> Note: `terraform apply` requires a real AWS account and credentials
> (which incur costs). For the assignment, showing the `terraform plan` output is sufficient.

---

## 🔄 CI/CD

On every push to `main`: backend tests → frontend build → Docker image build →
deploy stage (`.github/workflows/ci.yml`).

---

## 📂 Structure

```
clothing-ecommerce/
├── frontend/          React SPA (Vite, Ant Design)
├── backend/           Node.js + Express + Sequelize + Socket.IO
├── database/          init.sql (extensions)
├── infrastructure/    Terraform (AWS IaC)
├── .github/workflows/ CI/CD
└── docker-compose.yml
```

## 📜 License
MIT — educational project for the BTEC Cloud Computing Assignment.
