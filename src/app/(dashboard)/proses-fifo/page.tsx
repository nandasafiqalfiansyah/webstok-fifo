"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, Table, Card, Container, Spinner, Badge, Alert } from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFilePdf, 
  faInfoCircle,
  faBox,
  faArrowRightArrowLeft,
  faLightbulb
} from "@fortawesome/free-solid-svg-icons";

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

interface BarangKeluarDetail {
  tanggal_keluar: string;
  jumlah: number;
  dari_masuk_id: number;
  masa_exp?: string;
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
  const [error, setError] = useState<string | null>(null);

  const fetchProduk = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
      
      if (!res.ok) {
        throw new Error(`Gagal memuat data produk (${res.status})`);
      }

      const data = await res.json();
      setProdukList(data.data || []);
    } catch (err) {
      console.error("Error fetching produk:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProduk();
  }, [fetchProduk]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const generatePDF = useCallback(() => {
    try {
      const doc = new jsPDF();
      
      // Header with logo and title
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text("Laporan FIFO Inventory", 105, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Dibuat pada: ${new Date().toLocaleDateString('id-ID')}`, 105, 22, { align: 'center' });

      // Summary table
      autoTable(doc, {
        startY: 30,
        head: [["No", "Produk", "Kategori", "Stok Awal", "Sisa Stok", "Status"]],
        body: produkList.map((produk, index) => {
          const sisaStok = calculateRemainingStock(produk);
          const status = sisaStok < 10 ? "Perlu Restock" : "Aman";
          
          return [
            index + 1,
            produk.nama_produk,
            produk.kategori,
            produk.stok,
            sisaStok,
            status
          ];
        }),
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 10 }
      });

      // Detailed transactions
      doc.addPage();
      doc.setFontSize(16);
      doc.text("Detail Transaksi FIFO", 105, 15, { align: 'center' });
      
      produkList.forEach((produk, index) => {
        if (index > 0) doc.addPage();
        
        doc.setFontSize(14);
        doc.text(`${produk.nama_produk} (${produk.kategori})`, 14, 25);
        
        const fifoKeluar = simulateFifo(produk.BarangMasuk, produk.BarangKeluar);
        
        autoTable(doc, {
          startY: 35,
          head: [["Tipe", "Tanggal", "Jumlah", "Keterangan"]],
          body: [
            ...produk.BarangMasuk.map(masuk => [
              "MASUK",
              formatDate(masuk.tanggal_masuk),
              masuk.jumlah,
              masuk.masa_exp ? `Exp: ${formatDate(masuk.masa_exp)}` : '-'
            ]),
            ...fifoKeluar.map(keluar => [
              "KELUAR",
              formatDate(keluar.tanggal_keluar),
              keluar.jumlah,
              `Dari Masuk ID: ${keluar.dari_masuk_id}${keluar.masa_exp ? ` (Exp: ${formatDate(keluar.masa_exp)})` : ''}`
            ])
          ],
          headStyles: {
            fillColor: [52, 152, 219],
            textColor: 255
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 40 },
            2: { cellWidth: 25 },
            3: { cellWidth: 'auto' }
          }
        });
      });

      doc.save(`Laporan_FIFO_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Gagal membuat laporan PDF");
    }
  }, [produkList]);

  const calculateRemainingStock = (produk: Produk) => {
    const totalKeluar = produk.BarangKeluar.reduce((sum, bk) => sum + bk.jumlah, 0);
    return Math.max(0, produk.stok - totalKeluar);
  };

  const simulateFifo = (
    barangMasuk: BarangMasuk[],
    barangKeluar: BarangKeluar[]
  ): BarangKeluarDetail[] => {
    // Create a deep copy of incoming items
    const masukQueue = JSON.parse(JSON.stringify(barangMasuk)).sort(
      (a: BarangMasuk, b: BarangMasuk) => 
        new Date(a.tanggal_masuk).getTime() - new Date(b.tanggal_masuk).getTime()
    );

    const hasilKeluar: BarangKeluarDetail[] = [];

    for (const keluar of barangKeluar) {
      let sisaKeluar = keluar.jumlah;

      while (sisaKeluar > 0 && masukQueue.length > 0) {
        const masuk = masukQueue[0];
        const jumlahDiambil = Math.min(sisaKeluar, masuk.jumlah);

        hasilKeluar.push({
          tanggal_keluar: keluar.tanggal_keluar,
          jumlah: jumlahDiambil,
          dari_masuk_id: masuk.id,
          masa_exp: masuk.masa_exp,
        });

        masuk.jumlah -= jumlahDiambil;
        sisaKeluar -= jumlahDiambil;

        if (masuk.jumlah === 0) {
          masukQueue.shift();
        }
      }

      if (sisaKeluar > 0) {
        console.warn(`Tidak cukup stok untuk transaksi keluar ${keluar.id}`);
      }
    }

    return hasilKeluar;
  };

  const renderTransactionDetails = (produk: Produk) => {
    const hasMasuk = produk.BarangMasuk?.length > 0;
    const hasKeluar = produk.BarangKeluar?.length > 0;
    const fifoKeluar = simulateFifo(produk.BarangMasuk, produk.BarangKeluar);

    if (!hasMasuk && !hasKeluar) {
      return <div className="text-muted small">Tidak ada transaksi</div>;
    }

    return (
      <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
        {hasMasuk && produk.BarangMasuk.map((masuk, idx) => (
          <div key={`masuk-${idx}`} className="mb-1 small">
            <Badge bg="success" className="me-2">
              <FontAwesomeIcon icon={faBox} className="me-1" />
              Masuk
            </Badge>
            <span className="fw-semibold">{formatDate(masuk.tanggal_masuk)}</span> - 
            <span className="text-primary mx-1">{masuk.jumlah} pcs</span>
            {masuk.masa_exp && (
              <span className="text-muted ms-1">
                (Exp: {formatDate(masuk.masa_exp)})
              </span>
            )}
          </div>
        ))}

        {fifoKeluar.map((keluar, idx) => (
          <div key={`keluar-${idx}`} className="mb-1 small">
            <Badge bg="danger" className="me-2">
              <FontAwesomeIcon icon={faArrowRightArrowLeft} className="me-1" />
              Keluar
            </Badge>
            <span className="fw-semibold">{formatDate(keluar.tanggal_keluar)}</span> - 
            <span className="text-primary mx-1">{keluar.jumlah} pcs</span>
            <span className="text-muted ms-1">
              (Dari Masuk ID: {keluar.dari_masuk_id}
              {keluar.masa_exp && `, Exp: ${formatDate(keluar.masa_exp)}`})
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderLoading = () => (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" />
      <div className="mt-3">Memuat data FIFO...</div>
    </div>
  );

  const renderStockStatus = (sisaStok: number, stokAwal: number) => {
    const percentage = (sisaStok / stokAwal) * 100;
    
    let variant = "success";
    if (percentage < 20) variant = "danger";
    else if (percentage < 50) variant = "warning";
    
    return (
      <div className="d-flex align-items-center">
        <Badge bg={variant} className="me-2">
          {sisaStok}
        </Badge>
        <div className="progress flex-grow-1" style={{ height: '6px' }}>
          <div 
            className={`progress-bar bg-${variant}`} 
            role="progressbar" 
            style={{ width: `${percentage}%` }}
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    );
  };

  const renderRecommendation = (produk: Produk) => {
    const sisaStok = calculateRemainingStock(produk);
    
    if (sisaStok <= 0) {
      return (
        <Badge bg="danger" className="w-100 py-2">
          <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
          Stok Habis - Segera Restock!
        </Badge>
      );
    } else if (sisaStok < 5) {
      return (
        <Badge bg="danger" className="w-100 py-2">
          <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
          Stok Kritis - Restock Mendesak
        </Badge>
      );
    } else if (sisaStok < 10) {
      return (
        <Badge bg="warning" className="w-100 py-2">
          <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
          Stok Menipis - Perlu Restock
        </Badge>
      );
    } else if (sisaStok < produk.stok * 0.3) {
      return (
        <Badge bg="info" className="w-100 py-2">
          <FontAwesomeIcon icon={faLightbulb} className="me-1" />
          Stok Cukup - Pantau Terus
        </Badge>
      );
    } else {
      return (
        <Badge bg="success" className="w-100 py-2">
          <FontAwesomeIcon icon={faLightbulb} className="me-1" />
          Stok Aman
        </Badge>
      );
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FontAwesomeIcon icon={faBox} className="me-2 text-primary" />
            Proses FIFO Inventory
          </h2>
          <p className="text-muted mb-0">
            Sistem manajemen stok dengan metode First-In-First-Out (FIFO)
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={generatePDF} 
          disabled={loading || produkList.length === 0}
          className="d-flex align-items-center"
        >
          <FontAwesomeIcon icon={faFilePdf} className="me-2" />
          Export PDF
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
          {error}
        </Alert>
      )}

      {loading ? renderLoading() : (
        <>
          {/* Raw Data Table */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-primary text-white py-3">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faBox} className="me-2" />
                Data Mentah Inventory
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead >
                    <tr>
                      <th style={{ width: "50px" }}>No</th>
                      <th>Nama Produk</th>
                      <th>Kategori</th>
                      <th>Harga</th>
                      <th>Stok Awal</th>
                      <th>Kadaluarsa</th>
                      <th>Detail Transaksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produkList.map((produk, index) => (
                      <tr key={produk.id}>
                        <td className="text-center">{index + 1}</td>
                        <td className="fw-semibold">{produk.nama_produk}</td>
                        <td>
                          <Badge bg="info" className="text-dark">
                            {produk.kategori}
                          </Badge>
                        </td>
                        <td>Rp{produk.harga.toLocaleString("id-ID")}</td>
                        <td>{produk.stok}</td>
                        <td>
                          {produk.tanggal_kadaluarsa ? (
                            <Badge bg={new Date(produk.tanggal_kadaluarsa) > new Date() ? 'success' : 'danger'}>
                              {formatDate(produk.tanggal_kadaluarsa)}
                            </Badge>
                          ) : '-'}
                        </td>
                        <td>{renderTransactionDetails(produk)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* FIFO Analysis Table */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-primary text-white py-3">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faArrowRightArrowLeft} className="me-2" />
                Analisis FIFO
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead >
                    <tr>
                      <th style={{ width: "50px" }}>No</th>
                      <th>Nama Produk</th>
                      <th>Kategori</th>
                      <th>Harga</th>
                      <th>Stok Awal</th>
                      <th>Sisa Stok</th>
                      <th>Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produkList.map((produk, index) => {
                      const sisaStok = calculateRemainingStock(produk);
                      return (
                        <tr key={produk.id}>
                          <td className="text-center">{index + 1}</td>
                          <td className="fw-semibold">{produk.nama_produk}</td>
                          <td>
                            <Badge bg="info" className="text-dark">
                              {produk.kategori}
                            </Badge>
                          </td>
                          <td>Rp{produk.harga.toLocaleString("id-ID")}</td>
                          <td>{produk.stok}</td>
                          <td>{renderStockStatus(sisaStok, produk.stok)}</td>
                          <td className="text-center">
                            {Math.round((sisaStok / produk.stok) * 100)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Recommendations Table */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-primary text-white py-3">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                Rekomendasi Manajemen Stok
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead >
                    <tr>
                      <th style={{ width: "50px" }}>No</th>
                      <th>Nama Produk</th>
                      <th>Stok Awal</th>
                      <th>Sisa Stok</th>
                      <th>Status Kadaluarsa</th>
                      <th>Rekomendasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produkList.map((produk, index) => {
                      const sisaStok = calculateRemainingStock(produk);
                      const isExpired = produk.tanggal_kadaluarsa && new Date(produk.tanggal_kadaluarsa) < new Date();
                      
                      return (
                        <tr key={produk.id}>
                          <td className="text-center">{index + 1}</td>
                          <td className="fw-semibold">{produk.nama_produk}</td>
                          <td>{produk.stok}</td>
                          <td>
                            <span className={sisaStok < 5 ? 'text-danger fw-bold' : ''}>
                              {sisaStok}
                            </span>
                          </td>
                          <td>
                            {produk.tanggal_kadaluarsa ? (
                              <Badge bg={isExpired ? 'danger' : 'success'}>
                                {formatDate(produk.tanggal_kadaluarsa)}
                                {isExpired && ' (Expired)'}
                              </Badge>
                            ) : '-'}
                          </td>
                          <td>{renderRecommendation(produk)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
}