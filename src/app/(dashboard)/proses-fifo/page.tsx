"use client";

import { useEffect, useState } from "react";
import { Button, Table, Card } from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Produk = {
  id: number;
  nama_produk: string;
  kategori: string;
  harga: number;
  stok: number;
  BarangMasuk: { id: number; tanggal_masuk: string; jumlah: number }[];
  BarangKeluar: { id: number; tanggal_keluar: string; jumlah: number }[];
};

export default function ProsesFifo() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduk() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
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

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan FIFO", 14, 10);

    autoTable(doc, {
      startY: 20,
      head: [["ID", "Nama Produk", "Kategori", "Harga", "Stok Awal", "Sisa Stok", "Rekomendasi"]],
      body: produkList.map((produk) => {
        let sisaStok = produk.stok;
        produk.BarangKeluar.forEach((bk) => {
          sisaStok -= bk.jumlah;
        });
        const rekomendasi = sisaStok < 10 ? "Perlu restock" : "Stok masih aman";
        return [
          produk.id,
          produk.nama_produk,
          produk.kategori,
          `Rp ${produk.harga.toLocaleString("id-ID")}`,
          produk.stok,
          sisaStok,
          rekomendasi,
        ];
      }),
    });

    doc.save("Laporan_FIFO.pdf");
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Proses Algoritma FIFO</h2>

      <Card className="mb-4 shadow-sm p-3">
        <Button variant="primary" onClick={generatePDF} className="mb-3">
          Download Laporan PDF
        </Button>
        <h4 className="mt-3">Tabel 1: Data Mentah (Sebelum FIFO)</h4>
        <Table striped bordered hover responsive className="mt-2">
          <thead>
            <tr className="table-primary text-center">
              <th>ID</th>
              <th>Nama Produk</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Stok Awal</th>
              <th>Barang Masuk</th>
              <th>Barang Keluar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center">Loading...</td></tr>
            ) : (
              produkList.map((produk) => (
                <tr key={produk.id} className="text-center">
                  <td>{produk.id}</td>
                  <td>{produk.nama_produk}</td>
                  <td>{produk.kategori}</td>
                  <td>Rp {produk.harga.toLocaleString("id-ID")}</td>
                  <td>{produk.stok}</td>
                  <td>
                    {produk.BarangMasuk.map((bm) => (
                      <div key={bm.id}>{new Date(bm.tanggal_masuk).toLocaleDateString("id-ID")} ({bm.jumlah})</div>
                    ))}
                  </td>
                  <td>
                    {produk.BarangKeluar.map((bk) => (
                      <div key={bk.id}>{new Date(bk.tanggal_keluar).toLocaleDateString("id-ID")} ({bk.jumlah})</div>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <Card className="mb-4 shadow-sm p-3">
        <h4 className="mt-3">Tabel 2: Data Setelah FIFO</h4>
        <Table striped bordered hover responsive className="mt-2">
          <thead>
            <tr className="table-primary text-center">
              <th>ID</th>
              <th>Nama Produk</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Stok Awal</th>
              <th>Sisa Stok</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center">Loading...</td></tr>
            ) : (
              produkList.map((produk) => {
                let sisaStok = produk.stok;
                produk.BarangKeluar.forEach((bk) => {
                  sisaStok -= bk.jumlah;
                });
                return (
                  <tr key={produk.id} className="text-center">
                    <td>{produk.id}</td>
                    <td>{produk.nama_produk}</td>
                    <td>{produk.kategori}</td>
                    <td>Rp {produk.harga.toLocaleString("id-ID")}</td>
                    <td>{produk.stok}</td>
                    <td>{sisaStok}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </Card>

      <Card className="mb-4 shadow-sm p-3">
        <h4 className="mt-3">Tabel 3: Analisis & Rekomendasi</h4>
        <Table striped bordered hover responsive className="mt-2">
          <thead>
            <tr className="table-primary text-center">
              <th>Nama Produk</th>
              <th>Stok Awal</th>
              <th>Sisa Stok</th>
              <th>Rekomendasi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center">Loading...</td></tr>
            ) : (
              produkList.map((produk) => {
                let sisaStok = produk.stok;
                produk.BarangKeluar.forEach((bk) => {
                  sisaStok -= bk.jumlah;
                });
                const rekomendasi = sisaStok < 10 ? (
                  <span className="badge bg-danger">Perlu restock</span>
                ) : (
                  <span className="badge bg-success">Stok masih aman</span>
                );
                return (
                  <tr key={produk.id} className="text-center">
                    <td>{produk.nama_produk}</td>
                    <td>{produk.stok}</td>
                    <td>{sisaStok}</td>
                    <td>{rekomendasi}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
