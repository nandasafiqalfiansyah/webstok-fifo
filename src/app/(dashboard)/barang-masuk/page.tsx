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
  const [filteredList, setFilteredList] = useState<BarangMasuk[]>([]);
  const [searchText, setSearchText] = useState("");
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
        setFilteredList(barangMasukData);
      } catch (error) {
        console.error("Error fetching barang masuk:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBarangMasuk();
  }, []);

  // Filter berdasarkan search input
  useEffect(() => {
    const filtered = barangMasukList.filter(
      (item) =>
        item.produk_nama.toLowerCase().includes(searchText.toLowerCase()) ||
        item.kategori.toLowerCase().includes(searchText.toLowerCase()) ||
        formatDate(item.tanggal_masuk).includes(searchText)
    );
    setFilteredList(filtered);
  }, [searchText, barangMasukList]);

  // Fungsi untuk menghapus data
  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus data ini?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus data");

      // Hapus dari state agar UI langsung diperbarui
      const updatedList = barangMasukList.filter((item) => item.id !== id);
      setBarangMasukList(updatedList);
      setFilteredList(updatedList);
    } catch (error) {
      console.error("Error deleting barang masuk:", error);
      alert("Terjadi kesalahan saat menghapus data.");
    }
  };

  const columns = [
    { name: "ID", selector: (row: BarangMasuk) => row.id, sortable: true, width: "80px" },
    { name: "Nama Produk", selector: (row: BarangMasuk) => row.produk_nama, sortable: true },
    { name: "Kategori", selector: (row: BarangMasuk) => row.kategori, sortable: true },
    { name: "Tanggal Masuk", selector: (row: BarangMasuk) => formatDate(row.tanggal_masuk), sortable: true },
    { name: "Jumlah", selector: (row: BarangMasuk) => row.jumlah, sortable: true, width: "100px" },
    {
      name: "Aksi",
      cell: (row: BarangMasuk) => (
        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row.id)}>
          Hapus
        </button>
      ),
      width: "100px",
    },
  ];

  // 🎨 Custom styles agar sesuai dengan Bootstrap
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
    <div className="container mt-4">
      <h3 className="mb-4">Barang Masuk</h3>
      <div className="border rounded shadow-sm p-3 bg-white">
        {/* Input pencarian */}
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Cari berdasarkan Nama Produk, Kategori, atau Tanggal Masuk..."
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
        />
      </div>
    </div>
  );
}
