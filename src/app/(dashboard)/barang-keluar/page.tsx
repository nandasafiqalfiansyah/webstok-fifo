"use client";

import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";

interface BarangKeluar {
  id: number;
  tanggal_keluar: string;
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

export default function BarangKeluarPage() {
  const [barangKeluarList, setBarangKeluarList] = useState<BarangKeluar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBarangKeluar() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
        const data = await res.json()
        const barangKeluarData: BarangKeluar[] = data.data.flatMap((produk: any) =>
          produk.BarangKeluar.map((bk: any) => ({
            id: bk.id,
            tanggal_keluar: bk.tanggal_keluar,
            jumlah: bk.jumlah,
            produk_nama: produk.nama_produk,
            kategori: produk.kategori,
          }))
        );

        setBarangKeluarList(barangKeluarData);
      } catch (error) {
        console.error("Error fetching barang keluar:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBarangKeluar();
  }, []);

  const columns = [
    { name: "ID", selector: (row: BarangKeluar) => row.id, sortable: true, width: "80px" },
    { name: "Nama Produk", selector: (row: BarangKeluar) => row.produk_nama, sortable: true },
    { name: "Kategori", selector: (row: BarangKeluar) => row.kategori, sortable: true },
    { name: "Tanggal Keluar", selector: (row: BarangKeluar) => formatDate(row.tanggal_keluar), sortable: true },
    { name: "Jumlah", selector: (row: BarangKeluar) => row.jumlah, sortable: true, width: "100px" },
  ];

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Barang Keluar</h3>
      <div className="border rounded shadow-sm p-3 bg-white">
        <DataTable
          columns={columns}
          data={barangKeluarList}
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
