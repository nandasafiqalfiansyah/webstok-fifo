"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody, Form, Button, Row, Col } from "react-bootstrap";

export default function Page() {
  const [namaProduk, setNamaProduk] = useState("");
  const [kategori, setKategori] = useState("");
  const [harga, setHarga] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_produk: namaProduk,
          kategori,
          harga,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage("Produk berhasil ditambahkan!");
        setNamaProduk("");
        setKategori("");
        setHarga(0);
      } else {
        setMessage(result.message || "Terjadi kesalahan.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Gagal mengirim data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <Card className="shadow-sm border-0">
        <CardHeader className="bg-primary text-white">
          <h5 className="mb-0">Form Tambah Produk</h5>
        </CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nama Produk</Form.Label>
              <Form.Control
                type="text"
                value={namaProduk}
                onChange={(e) => setNamaProduk(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Kategori</Form.Label>
              <Form.Control
                type="text"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Harga</Form.Label>
              <Form.Control
                type="number"
                value={harga}
                onChange={(e) => setHarga(Number(e.target.value))}
                required
              />
            </Form.Group>

            <Button variant="success" type="submit" disabled={loading}>
              {loading ? "Mengirim..." : "Simpan"}
            </Button>

            {message && (
              <p className="mt-3 text-info">
                <strong>{message}</strong>
              </p>
            )}
          </Form>
        </CardBody>
      </Card>
    </div>
  );
}
