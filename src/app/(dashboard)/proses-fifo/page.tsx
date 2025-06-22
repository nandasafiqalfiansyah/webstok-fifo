"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Table, Card, Container, Spinner, Badge } from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";

interface BarangMasuk {
  id: number;
  tanggal_masuk: string;
  jumlah: number;
  masa_exp?: string;
}

interface BarangKeluar {
  id: number;
  tanggal_keluar: string;
  jumlah: number;
}

interface Produk {
  id: number;
  nama_produk: string;
  kategori: string;
  harga: number;
  stok: number;
  tanggal_kadaluarsa?: string;
  BarangMasuk: BarangMasuk[];
  BarangKeluar: BarangKeluar[];
}

export default function ProsesFifo() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProduk = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
      if (!res.ok) throw new Error("Failed to fetch products");
      
      const data = await res.json();
      setProdukList(data.data || []);
    } catch (error) {
      console.error("Error fetching produk:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProduk();
  }, [fetchProduk]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const generatePDF = useCallback(() => {
    const doc = new jsPDF();
    doc.text("Laporan FIFO", 14, 10);

    autoTable(doc, {
      startY: 20,
      head: [["No", "Nama Produk", "Kategori", "Harga", "Stok Awal", "Sisa Stok", "Rekomendasi"]],
      body: produkList.map((produk, index) => {
        const sisaStok = calculateRemainingStock(produk);
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
  }, [produkList]);

  const calculateRemainingStock = (produk: Produk) => {
    return produk.BarangKeluar.reduce((acc, bk) => acc - bk.jumlah, produk.stok);
  };

  const renderTransactionDetails = (produk: Produk) => {
    const hasMasuk = produk.BarangMasuk?.length > 0;
    const hasKeluar = produk.BarangKeluar?.length > 0;

    if (!hasMasuk && !hasKeluar) {
      return <div className="text-muted">Tidak ada transaksi</div>;
    }

    return (
      <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
        {hasMasuk && produk.BarangMasuk.map((masuk, idx) => (
          <div key={`masuk-${idx}`} className="mb-1">
            <Badge bg="success" className="me-2">Masuk</Badge>
            {formatDate(masuk.tanggal_masuk)} - {masuk.jumlah} pcs
            {masuk.masa_exp && ` (Exp: ${formatDate(masuk.masa_exp)})`}
          </div>
        ))}
        
        {hasKeluar && produk.BarangKeluar.map((keluar, idx) => (
          <div key={`keluar-${idx}`} className="mb-1">
            <Badge bg="danger" className="me-2">Keluar</Badge>
            {formatDate(keluar.tanggal_keluar)} - {keluar.jumlah} pcs
          </div>
        ))}
      </div>
    );
  };

  const renderLoadingRow = (colSpan: number) => (
    <tr>
      <td colSpan={colSpan} className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <div className="mt-2">Memuat data...</div>
      </td>
    </tr>
  );

  const renderStockRecommendation = (sisaStok: number) => {
    return sisaStok < 10 ? (
      <Badge bg="danger">Perlu restock</Badge>
    ) : (
      <Badge bg="success">Stok aman</Badge>
    );
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Proses Algoritma FIFO</h2>
        <Button variant="primary" onClick={generatePDF} disabled={loading}>
          <FontAwesomeIcon icon={faFilePdf} className="me-2" />
          Download Laporan PDF
        </Button>
      </div>

      {/* Raw Data Table */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h4 className="mb-3">Tabel 1: Data Mentah (Sebelum FIFO)</h4>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="bg-light">
                <tr>
                  <th style={{ width: "60px" }}>No</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Stok Awal</th>
                  <th>Transaksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? renderLoadingRow(7) : (
                  produkList.map((produk, index) => (
                    <tr key={produk.id}>
                      <td>{index + 1}</td>
                      <td>{produk.nama_produk}</td>
                      <td>{produk.kategori}</td>
                      <td>Rp {produk.harga.toLocaleString("id-ID")}</td>
                      <td>{produk.stok}</td>
                      <td>{renderTransactionDetails(produk)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* FIFO Results Table */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h4 className="mb-3">Tabel 2: Data FIFO</h4>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="bg-light">
                <tr>
                  <th style={{ width: "60px" }}>No</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Stok Awal</th>
                  <th>Sisa Stok</th>
                </tr>
              </thead>
              <tbody>
                {loading ? renderLoadingRow(7) : (
                  produkList.map((produk, index) => {
                    const sisaStok = calculateRemainingStock(produk);
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

      {/* Analysis Table */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h4 className="mb-3">Tabel 3: Analisis & Rekomendasi</h4>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="bg-light">
                <tr>
                  <th style={{ width: "60px" }}>No</th>
                  <th>Nama Produk</th>
                  <th>Stok Awal</th>
                  <th>Sisa Stok</th>
                  <th>Rekomendasi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? renderLoadingRow(6) : (
                  produkList.map((produk, index) => {
                    const sisaStok = calculateRemainingStock(produk);
                    return (
                      <tr key={produk.id}>
                        <td>{index + 1}</td>
                        <td>{produk.nama_produk}</td>
                        <td>{produk.stok}</td>
                        <td>{sisaStok}</td>
                        <td>{renderStockRecommendation(sisaStok)}</td>
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