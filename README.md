# ☕ The Coffee House — Smart Restaurant Ordering System

A modern, full-featured **QR-based restaurant ordering system** built with Next.js, Prisma, and PostgreSQL. Customers scan a QR code at their table to browse the menu, place orders, chat with staff, and request services — all from their phone. No app download required.

> 🌐 **Live Demo:** [illustrious-churros-d1fc68.netlify.app](https://69a5d717820146b9ee90f328--illustrious-churros-d1fc68.netlify.app)

---

## 🔗 Live Links

| Page | Description | Link |
|------|-------------|------|
| 🏠 **Home** | Landing page | [Visit →](https://69a5d717820146b9ee90f328--illustrious-churros-d1fc68.netlify.app/) |
| 📱 **Table 1 Menu** | Customer ordering (Table 1) | [Visit →](https://69a5d717820146b9ee90f328--illustrious-churros-d1fc68.netlify.app/r/coffee-house/t/1) |
| 📱 **Table 2 Menu** | Customer ordering (Table 2) | [Visit →](https://69a5d717820146b9ee90f328--illustrious-churros-d1fc68.netlify.app/r/coffee-house/t/2) |
| 📱 **Table 3 Menu** | Customer ordering (Table 3) | [Visit →](https://69a5d717820146b9ee90f328--illustrious-churros-d1fc68.netlify.app/r/coffee-house/t/3) |
| 🍳 **Kitchen Display** | Real-time order queue for kitchen staff | [Visit →](https://69a5d717820146b9ee90f328--illustrious-churros-d1fc68.netlify.app/kitchen) |
| 📊 **Admin Dashboard** | Business analytics & overview | [Visit →](https://69a5d717820146b9ee90f328--illustrious-churros-d1fc68.netlify.app/admin) |
| 🍔 **Menu Management** | Add, edit, delete menu items & categories | [Visit →](https://69a5d717820146b9ee90f328--illustrious-churros-d1fc68.netlify.app/admin/menu) |
| 💰 **Sales Report** | Revenue tracking & sales analytics | [Visit →](https://69a5d717820146b9ee90f328--illustrious-churros-d1fc68.netlify.app/admin/sales) |

---

## ✨ Features

### 📱 Customer Experience
- **QR Code Ordering** — Scan a table QR code to instantly access the digital menu
- **Beautiful Menu UI** — Browse categories, view item details, and add to cart
- **Real-time Order Tracking** — See order status updates live (Received → Preparing → Ready)
- **Live Chat** — Message restaurant staff directly from the table
- **Service Requests** — Call waiter, request the bill, ask for water, or request table cleaning

### 🍳 Kitchen Display System
- **Live Order Feed** — New orders appear in real-time
- **Status Management** — Mark orders as Preparing, Ready, or Completed
- **Order Details** — View items, quantities, special notes, and table number

### 📊 Admin Dashboard
- **Business Analytics** — Revenue charts, top-selling items, and weekly trends
- **Menu Management** — Full CRUD for categories and menu items
- **Sales Reports** — Track daily, weekly, and monthly revenue
- **Table Management** — Monitor active tables and sessions
- **Toggle Availability** — Instantly mark items as sold out

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | Full-stack React framework (App Router) |
| **Prisma ORM** | Database modeling & queries |
| **PostgreSQL** (Supabase) | Cloud database |
| **Netlify** | Hosting & deployment |
| **Vanilla CSS** | Custom design system with CSS variables |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- A PostgreSQL database (or use SQLite for local dev)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ahmadprojects85-dev/Resturant_order.git
cd Resturant_order

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database connection string

# 4. Push database schema
npx prisma db push

# 5. Seed the database with sample data
node prisma/seed.js

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database models
│   └── seed.js            # Sample data seeder
├── src/
│   ├── app/
│   │   ├── admin/         # Admin dashboard, menu management, sales
│   │   ├── api/           # REST API routes
│   │   ├── kitchen/       # Kitchen display system
│   │   ├── r/             # Customer-facing menu & ordering
│   │   └── page.js        # Home page
│   ├── components/        # Reusable UI components
│   ├── context/           # React context providers
│   └── lib/               # Prisma client & utilities
├── public/                # Static assets
└── package.json
```

---

## 🌐 Deployment

This app is deployed on **Netlify** with a **Supabase** PostgreSQL database. See [deployment.md](deployment.md) for detailed deployment instructions for other platforms (Vercel, Railway, Docker).

---

## 📄 License

This project is proprietary software. All rights reserved.

---

<p align="center">
  Built with ❤️ using Next.js & Prisma
</p>
