"use client";

import { useState, useCallback } from "react";
import { Card, Button, Modal, Form, Alert, Container, Table, InputGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faCheck, faTimes, faSpinner, faFileImport } from "@fortawesome/free-solid-svg-icons";
import { parse } from "papaparse";

interface Produk {
  id?: number;
  nama_produk: string;
  harga: number;
  stok: number;
  kategori: string; // Tambahkan field kategori
}

export default function ImportProdukPage() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ text: string; variant: string } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [defaultKategori, setDefaultKategori] = useState<string>("Umum"); // Default kategori

  // Handle file upload
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
              kategori: row.kategori || defaultKategori // Gunakan kategori dari CSV atau default
            }));

          setProdukList(parsedData);
          setMessage({ 
            text: `Berhasil memproses ${parsedData.length} produk dari file`, 
            variant: "success" 
          });
        } catch (error) {
          console.error("Error parsing CSV:", error);
          setMessage({ 
            text: "Format file tidak sesuai. Pastikan format: nama,harga,stok,kategori", 
            variant: "danger" 
          });
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        setMessage({ text: "Gagal memproses file CSV", variant: "danger" });
        setLoading(false);
      }
    });
  }, [defaultKategori]);

  // Handle import to API
  const handleImport = async () => {
    if (produkList.length === 0) {
      setMessage({ text: "Tidak ada data untuk diimport", variant: "warning" });
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const produk of produkList) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nama_produk: produk.nama_produk,
              harga: produk.harga,
              stok: produk.stok,
              kategori: produk.kategori || defaultKategori // Pastikan kategori selalu ada
            }),
          });

          const result = await res.json();

          if (!res.ok) {
            throw new Error(result.message || "Gagal menambahkan produk");
          }

          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Gagal menambahkan ${produk.nama_produk}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (errorCount > 0) {
        setMessage({
          text: `Import selesai dengan ${successCount} sukses dan ${errorCount} gagal. ${errors.join(' ')}`,
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
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan saat mengimport", variant: "danger" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Container className="py-4">
      {/* Message Alert */}
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
          <Form.Group className="mb-3">
            <Form.Label>Kategori Default</Form.Label>
            <Form.Select 
              value={defaultKategori}
              onChange={(e) => setDefaultKategori(e.target.value)}
            >
              <option value="Umum">Umum</option>
              <option value="Elektronik">Elektronik</option>
              <option value="Peralatan Rumah Tangga">Peralatan Rumah Tangga</option>
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
            </Form.Select>
            <Form.Text muted>Kategori ini akan digunakan jika tidak ada kolom kategori di CSV</Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
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
              Format CSV harus mengandung kolom: nama,harga,stok (kategori opsional). Contoh:<br />
              nama,harga,stok,kategori<br />
              Lampu LED,25000,50,Elektronik<br />
              Panci Kecil,16000,30,Peralatan Rumah Tangga
            </Form.Text>
          </Form.Group>

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
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
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