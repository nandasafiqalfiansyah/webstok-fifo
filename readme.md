# 📦 Nama Proyek

Deskripsi singkat mengenai proyek. Misalnya:

Aplikasi web modern menggunakan Next.js, Prisma, dan Cypress untuk pengujian. Dibangun untuk [tujuan proyek], misalnya: manajemen tugas, e-commerce, atau blog.

---

## 🚀 Tech Stack

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/) – ORM untuk PostgreSQL, MySQL, SQLite, dll.
- [Cypress](https://www.cypress.io/) – End-to-end testing
- [Node.js](https://nodejs.org/)
- (Opsional) Tambahkan framework CSS/komponen jika digunakan: Tailwind CSS, Chakra UI, dsb.

---

## 📂 Struktur Skrip

```bash
npm run dev           # Jalankan aplikasi dalam mode development
npm run build         # Generate Prisma client & build Next.js
npm run start         # Jalankan Next.js setelah build
npm run lint          # Jalankan linter
npm run lint:fix      # Perbaiki masalah lint otomatis
npm run cypress:open  # Buka UI Cypress
npm run cypress:run   # Jalankan semua test E2E di CLI
npm run test          # Start server & jalankan E2E test secara otomatis
npm run migrate:seed  # Generate Prisma client, migrasi DB & seed data
npm run seed          # Jalankan file seed saja
