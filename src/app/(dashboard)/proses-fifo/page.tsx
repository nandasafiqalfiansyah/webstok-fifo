"use client";

import { useEffect, useState } from "react";
import { Button, Table, Card, Container } from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";

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
      head: [["No", "Nama Produk", "Kategori", "Harga", "Stok Awal", "Sisa Stok", "Rekomendasi"]],
      body: produkList.map((produk, index) => {
        let sisaStok = produk.stok;
        produk.BarangKeluar.forEach((bk) => {
          sisaStok -= bk.jumlah;
        });
        const rekomendasi = sisaStok < 10 ? "Perlu restock" : "Stok masih aman";
        return [
          index + 1,
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
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Proses Algoritma FIFO</h2>
        <Button variant="primary" onClick={generatePDF}>
          <FontAwesomeIcon icon={faFilePdf} className="me-2" />
          Download Laporan PDF
        </Button>
      </div>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h4 className="mb-3">Tabel 1: Data Mentah (Sebelum FIFO)</h4>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="bg-light">
                <tr>
                  <th width="60">No</th>
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
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  produkList.map((produk, index) => (
                    <tr key={produk.id}>
                      <td>{index + 1}</td>
                      <td>{produk.nama_produk}</td>
                      <td>{produk.kategori}</td>
                      <td>Rp {produk.harga.toLocaleString("id-ID")}</td>
                      <td>{produk.stok}</td>
                      <td>
                        {produk.BarangMasuk.map((bm) => (
                          <div key={bm.id}>
                            {new Date(bm.tanggal_masuk).toLocaleDateString("id-ID")} ({bm.jumlah})
                          </div>
                        ))}
                      </td>
                      <td>
                        {produk.BarangKeluar.map((bk) => (
                          <div key={bk.id}>
                            {new Date(bk.tanggal_keluar).toLocaleDateString("id-ID")} ({bk.jumlah})
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h4 className="mb-3">Tabel 2: Data Setelah FIFO</h4>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="bg-light">
                <tr>
                  <th width="60">No</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Stok Awal</th>
                  <th>Sisa Stok</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  produkList.map((produk, index) => {
                    let sisaStok = produk.stok;
                    produk.BarangKeluar.forEach((bk) => {
                      sisaStok -= bk.jumlah;
                    });
                    return (
                      <tr key={produk.id}>
                        <td>{index + 1}</td>
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
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h4 className="mb-3">Tabel 3: Analisis & Rekomendasi</h4>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="bg-light">
                <tr>
                  <th width="60">No</th>
                  <th>Nama Produk</th>
                  <th>Stok Awal</th>
                  <th>Sisa Stok</th>
                  <th>Rekomendasi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  produkList.map((produk, index) => {
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
                      <tr key={produk.id}>
                        <td>{index + 1}</td>
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
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}