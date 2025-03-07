const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Seed Admin Data
  const adminPassword = await bcrypt.hash('admin', 10);
  await prisma.admin.createMany({
    data: [
      { nama: 'Admin', email: 'admin@gmail.com', password: adminPassword },
    ],
  });

  // Seed Produk Data
  const produkList = await prisma.produk.createMany({
    data: [
      { nama_produk: 'Laptop Gaming', kategori: 'Elektronik', harga: 15000000, stok: 10 },
      { nama_produk: 'Kaos Polos', kategori: 'Pakaian', harga: 75000, stok: 100 },
      { nama_produk: 'Smartphone', kategori: 'Elektronik', harga: 5000000, stok: 25 },
      { nama_produk: 'Sepatu Sneakers', kategori: 'Fashion', harga: 350000, stok: 30 },
    ],
  });

  // Ambil produk yang baru dibuat
  const produk = await prisma.produk.findMany();

  // Seed BarangMasuk Data
  await prisma.barangMasuk.createMany({
    data: produk.map((p) => ({
      tanggal_masuk: new Date(),
      jumlah: Math.floor(Math.random() * 20) + 5,
      produk_id: p.id,
    })),
  });

  // Seed BarangKeluar Data
  await prisma.barangKeluar.createMany({
    data: produk.map((p) => ({
      tanggal_keluar: new Date(),
      jumlah: Math.floor(Math.random() * 10) + 2,
      produk_id: p.id,
    })),
  });
}

main()
  .then(() => {
    console.log('Seeding successful!');
    prisma.$disconnect();
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    prisma.$disconnect();
    process.exit(1);
  });
