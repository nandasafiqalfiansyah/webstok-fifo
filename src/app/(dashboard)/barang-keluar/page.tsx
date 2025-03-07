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
  const [filteredList, setFilteredList] = useState<BarangKeluar[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBarangKeluar() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
        const data = await res.json();

        let barangKeluarData: BarangKeluar[] = data.data.flatMap((produk: any) =>
          produk.BarangKeluar.map((bk: any) => ({
            id: bk.id,
            tanggal_keluar: bk.tanggal_keluar,
            jumlah: bk.jumlah,
            produk_nama: produk.nama_produk,
            kategori: produk.kategori,
          }))
        );

        // 🔥 Sort data berdasarkan tanggal_keluar dari yang terbaru ke yang lama
        barangKeluarData = barangKeluarData.sort((a, b) => 
          new Date(b.tanggal_keluar).getTime() - new Date(a.tanggal_keluar).getTime()
        );

        setBarangKeluarList(barangKeluarData);
        setFilteredList(barangKeluarData);
      } catch (error) {
        console.error("Error fetching barang keluar:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBarangKeluar();
  }, []);

  // Filter berdasarkan search input
  useEffect(() => {
    const filtered = barangKeluarList.filter(
      (item) =>
        item.produk_nama.toLowerCase().includes(searchText.toLowerCase()) ||
        item.kategori.toLowerCase().includes(searchText.toLowerCase()) ||
        formatDate(item.tanggal_keluar).includes(searchText)
    );
    setFilteredList(filtered);
  }, [searchText, barangKeluarList]);

  // Fungsi untuk menghapus data
  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus data ini?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus data");

      // Hapus dari state agar UI langsung diperbarui
      const updatedList = barangKeluarList.filter((item) => item.id !== id);
      setBarangKeluarList(updatedList);
      setFilteredList(updatedList);
    } catch (error) {
      console.error("Error deleting barang keluar:", error);
      alert("Terjadi kesalahan saat menghapus data.");
    }
  };

  const columns = [
    { name: "ID", selector: (row: BarangKeluar) => row.id, sortable: true, width: "80px" },
    { name: "Nama Produk", selector: (row: BarangKeluar) => row.produk_nama, sortable: true },
    { name: "Kategori", selector: (row: BarangKeluar) => row.kategori, sortable: true },
    { name: "Tanggal Keluar", selector: (row: BarangKeluar) => formatDate(row.tanggal_keluar), sortable: true },
    { name: "Jumlah", selector: (row: BarangKeluar) => row.jumlah, sortable: true, width: "100px" },
    {
      name: "Aksi",
      cell: (row: BarangKeluar) => (
        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row.id)}>
          Hapus
        </button>
      ),
      width: "100px",
    },
  ];

  // Custom styling
  const customStyles = {
    headCells: {
      style: {
        fontSize: "14px",
        fontWeight: "bold",
      },
    },
    cells: {
      style: {
        fontSize: "14px",
      },
    },
  };

  return (
    <div className="container mt-4 bg-transparent">
      <h3 className="mb-4">Barang Keluar</h3>
      <div className="border rounded shadow-sm p-3">
        {/* Input pencarian */}
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Cari berdasarkan Nama Produk, Kategori, atau Tanggal Keluar..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Tabel Data */}
        <DataTable
          columns={columns}
          data={filteredList}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          responsive
          customStyles={customStyles}
          className="rd-table"
        />
      </div>
    </div>
  );
}
