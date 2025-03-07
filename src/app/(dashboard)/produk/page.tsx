"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import DataTable from "react-data-table-component";

interface Produk {
  id: number;
  nama_produk: string;
  kategori: string;
  harga: number;
  stok: number;
  BarangMasuk: { id: number; tanggal_masuk: string; jumlah: number }[];
  BarangKeluar: { id: number; tanggal_keluar: string; jumlah: number }[];
}

// Fungsi untuk memformat tanggal ke DD-MM-YYYY
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export default function ProdukList() {
  const router = useRouter();
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduk() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
        if (!res.ok) throw new Error("Gagal mengambil data produk");
        const data = await res.json();
        setProdukList(data.data);
      } catch (error) {
        console.error("Error fetching produk:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduk();
  }, []);

  const columns = [
    { name: "ID", selector: (row: Produk) => row.id, sortable: true, width: "80px" },
    { name: "Nama Produk", selector: (row: Produk) => row.nama_produk, sortable: true },
    { name: "Kategori", selector: (row: Produk) => row.kategori, sortable: true },
    { name: "Harga", selector: (row: Produk) => `Rp ${row.harga.toLocaleString("id-ID")}`, sortable: true },
    { name: "Stok", selector: (row: Produk) => row.stok, sortable: true, width: "100px" },
    {
      name: "Barang Masuk",
      cell: (row: Produk) =>
        row.BarangMasuk.length > 0 ? (
          row.BarangMasuk.map((bm) => (
            <div key={bm.id}>
              {formatDate(bm.tanggal_masuk)} ({bm.jumlah})
            </div>
          ))
        ) : (
          <span>-</span>
        ),
    },
    {
      name: "Barang Keluar",
      cell: (row: Produk) =>
        row.BarangKeluar.length > 0 ? (
          row.BarangKeluar.map((bk) => (
            <div key={bk.id}>
              {formatDate(bk.tanggal_keluar)} ({bk.jumlah})
            </div>
          ))
        ) : (
          <span>-</span>
        ),
    },
  ];

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Daftar Produk</h3>
      <div className="mb-3 text-end mr-2">
      <Button variant="success" className="m-2"  onClick={() => router.push("/produk/create")}>
          <FontAwesomeIcon icon={faPlus} fixedWidth /> Import Produk
        </Button>
        <Button variant="success" onClick={() => router.push("/produk/create")}>
          <FontAwesomeIcon icon={faPlus} fixedWidth /> Tambah Produk
        </Button>
      </div>

      <div className="border rounded shadow-sm p-3 bg-white">
        <DataTable
          columns={columns}
          data={produkList}
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
