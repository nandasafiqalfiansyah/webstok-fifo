"use client";

import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";

interface BarangMasuk {
  id: number;
  tanggal_masuk: string;
  jumlah: number;
  produk_nama: string;
  kategori: string;
}

// Fungsi format tanggal ke DD-MM-YYYY
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export default function BarangMasukPage() {
  const [barangMasukList, setBarangMasukList] = useState<BarangMasuk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBarangMasuk() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
        const data = await res.json();

        // Ekstrak hanya data Barang Masuk dari produk
        const barangMasukData: BarangMasuk[] = data.data.flatMap((produk: any) =>
          produk.BarangMasuk.map((bm: any) => ({
            id: bm.id,
            tanggal_masuk: bm.tanggal_masuk,
            jumlah: bm.jumlah,
            produk_nama: produk.nama_produk,
            kategori: produk.kategori,
          }))
        );

        setBarangMasukList(barangMasukData);
      } catch (error) {
        console.error("Error fetching barang masuk:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBarangMasuk();
  }, []);

  const columns = [
    { name: "ID", selector: (row: BarangMasuk) => row.id, sortable: true, width: "80px" },
    { name: "Nama Produk", selector: (row: BarangMasuk) => row.produk_nama, sortable: true },
    { name: "Kategori", selector: (row: BarangMasuk) => row.kategori, sortable: true },
    { name: "Tanggal Masuk", selector: (row: BarangMasuk) => formatDate(row.tanggal_masuk), sortable: true },
    { name: "Jumlah", selector: (row: BarangMasuk) => row.jumlah, sortable: true, width: "100px" },
  ];

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Barang Masuk</h3>
      <div className="border rounded shadow-sm p-3 bg-white">
        <DataTable
          columns={columns}
          data={barangMasukList}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          responsive
        />
      </div>
    </div>
  );
}
