"use client";

import { useState, useCallback } from "react";
import { Card, Button, Form, Alert, Container, Table, InputGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faSpinner, faDownload } from "@fortawesome/free-solid-svg-icons";
import { parse } from "papaparse";

interface Produk {
  id?: number;
  nama_produk: string;
  harga: number;
  stok: number;
  kategori: string;
  tanggal_kadaluarsa?: string;
}

const DEFAULT_KATEGORI = "Umum";
const KATEGORI_OPTIONS = [
  "Umum",
  "Elektronik",
  "Peralatan Rumah Tangga",
  "Makanan",
  "Minuman"
];

const SAMPLE_CSV = `nama,harga,stok,kategori,tanggal_kadaluarsa
Lampu LED,25000,50,Elektronik,2025-12-31
Panci Aluminium,120000,30,Peralatan Rumah Tangga,
Teh Celup,15000,100,Makanan,2024-06-30
Mouse Wireless,85000,25,Elektronik,
Susu UHT,18000,75,Minuman,2023-11-15`;

export default function ImportProdukPage() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ text: string; variant: string } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [defaultKategori, setDefaultKategori] = useState<string>(DEFAULT_KATEGORI);

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contoh_produk.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);
    setMessage(null);

    parse(file, {
      header: true,
      complete: (results) => {
        try {
          const parsedData = results.data
            .filter((row: any) => row.nama && row.harga && row.stok)
            .map((row: any) => ({
              nama_produk: row.nama.trim(),
              harga: Number(row.harga),
              stok: Number(row.stok),
              kategori: row.kategori?.trim() || defaultKategori,
              tanggal_kadaluarsa: row.tanggal_kadaluarsa || undefined
            }));

          setProdukList(parsedData);
          setMessage({ 
            text: `Berhasil memproses ${parsedData.length} produk dari file`, 
            variant: "success" 
          });
        } catch (error) {
          setMessage({ 
            text: "Format file tidak sesuai. Pastikan format: nama,harga,stok,kategori", 
            variant: "danger" 
          });
        } finally {
          setLoading(false);
        }
      },
      error: () => {
        setMessage({ text: "Gagal memproses file CSV", variant: "danger" });
        setLoading(false);
      }
    });
  }, [defaultKategori]);

  const handleImport = async () => {
    if (produkList.length === 0) {
      setMessage({ text: "Tidak ada data untuk diimport", variant: "warning" });
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      const results = await Promise.allSettled(
        produkList.map(produk => 
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nama_produk: produk.nama_produk,
              harga: produk.harga,
              stok: produk.stok,
              kategori: produk.kategori || defaultKategori,
              tanggal_kadaluarsa: produk.tanggal_kadaluarsa
            }),
          })
        )
      );

      const successCount = results.filter(r => r.status === "fulfilled" && r.value.ok).length;
      const errorCount = results.filter(r => r.status === "rejected" || !r.value.ok).length;

      if (errorCount > 0) {
        const errors = results
          .map((r, i) => 
            r.status === "rejected" ? `Produk ${produkList[i].nama_produk}: ${r.reason.message}` :
            !r.value.ok ? `Produk ${produkList[i].nama_produk}: Gagal menyimpan` : null
          )
          .filter(Boolean);

        setMessage({
          text: `Import selesai dengan ${successCount} sukses dan ${errorCount} gagal. ${errors.join(', ')}`,
          variant: "warning"
        });
      } else {
        setMessage({
          text: `Berhasil mengimport ${successCount} produk`,
          variant: "success"
        });
        setProdukList([]);
        setFileName(null);
      }
    } catch (error) {
      setMessage({ 
        text: "Terjadi kesalahan saat mengimport", 
        variant: "danger" 
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Container className="py-4">
      {message && (
        <Alert variant={message.variant} onClose={() => setMessage(null)} dismissible>
          {message.text}
        </Alert>
      )}

      <Card className="shadow-sm border-0">
        <Card.Header className="d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0">Import Data Produk</h5>
          <Button 
            variant="primary" 
            onClick={handleImport}
            disabled={importing || produkList.length === 0}
          >
            {importing ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                Mengimport...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUpload} className="me-2" />
                Import Data
              </>
            )}
          </Button>
        </Card.Header>
        
        <Card.Body>
          <div className="mb-4">
            <Form.Group className="mb-3">
              <Form.Label>Kategori Default</Form.Label>
              <Form.Select 
                value={defaultKategori}
                onChange={(e) => setDefaultKategori(e.target.value)}
                disabled={loading || importing}
              >
                {KATEGORI_OPTIONS.map(kategori => (
                  <option key={kategori} value={kategori}>{kategori}</option>
                ))}
              </Form.Select>
              <Form.Text muted>Kategori ini akan digunakan jika tidak ada kolom kategori di CSV</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Upload File CSV</Form.Label>
              <InputGroup>
                <Form.Control
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={loading || importing}
                />
              </InputGroup>
              <Form.Text muted>
                Format CSV harus mengandung kolom: nama,harga,stok (kategori opsional).
              </Form.Text>
            </Form.Group>

            <Button 
              variant="outline-secondary" 
              onClick={downloadSampleCSV}
              className="mt-2"
            >
              <FontAwesomeIcon icon={faDownload} className="me-2" />
              Download Contoh CSV
            </Button>
          </div>

          {fileName && (
            <div className="mb-3">
              <strong>File:</strong> {fileName} | 
              <strong> Total Produk:</strong> {produkList.length}
            </div>
          )}

          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Produk</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th>Kategori</th>
                  <th>Tanggal Kadaluarsa</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                      Memproses file...
                    </td>
                  </tr>
                ) : produkList.length > 0 ? (
                  produkList.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.nama_produk}</td>
                      <td>Rp {item.harga.toLocaleString('id-ID')}</td>
                      <td>{item.stok}</td>
                      <td>{item.kategori || defaultKategori}</td>
                      <td>{item.tanggal_kadaluarsa || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      Tidak ada data produk. Silakan upload file CSV.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}