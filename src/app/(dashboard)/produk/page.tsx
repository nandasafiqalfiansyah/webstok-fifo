"use client";

import { useEffect, useState } from "react";
import { Card, Form, Button, Modal, Tab, Tabs, Alert, Container, Row, Col, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBox, faSave, faSpinner, faTimes, faEdit, 
  faUpload, faHistory, faSearch
} from "@fortawesome/free-solid-svg-icons";

interface Produk {
  id: number;
  nama_produk: string;
  kategori: string;
  harga: number;
  stok: number;
  tanggal_kadaluarsa?: string;
  BarangMasuk?: {
    id: number;
    jumlah: number;
    tanggal_masuk: string;
    masa_exp: string | null;
  }[];
  BarangKeluar?: {
    id: number;
    jumlah: number;
    tanggal_keluar: string;
    masa_exp: string | null;
  }[];
}

export default function InputDataPage() {
  // State for data
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState({
    page: true,
    form: false
  });
  const [searchTerm, setSearchTerm] = useState("");

  // State for forms
  const [formProduk, setFormProduk] = useState<Omit<Produk, 'id'>>({ 
    nama_produk: "", 
    kategori: "Elektronik", 
    harga: 0, 
    stok: 0,
    tanggal_kadaluarsa: new Date().toISOString().split('T')[0] 
  });
  const [message, setMessage] = useState<{ text: string; variant: string } | null>(null);
  const [editMode, setEditMode] = useState<{ type: string, id?: number }>({ type: '' });

  // Format date to local string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(prev => ({ ...prev, page: true }));
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
      const data = await res.json();

      setProdukList(data.data);

    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ text: "Gagal memuat data", variant: "danger" });
    } finally {
      setLoading(prev => ({ ...prev, page: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products based on search term
  const filteredProdukList = produkList.filter(produk =>
    produk.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produk.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form handlers
  const handleProdukChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormProduk(prev => ({
      ...prev,
      [name]: name === "harga" || name === "stok" ? Number(value) : value
    }));
  };

  // Submit handlers
  const submitProduk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, form: true }));

    try {
      const url = editMode.type === 'produk' && editMode.id 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/produk/${editMode.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/produk`;
      
      const method = editMode.type === 'produk' && editMode.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formProduk)
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || "Gagal menyimpan produk");
      }

      setMessage({ 
        text: `Produk ${editMode.type === 'produk' ? 'berhasil diperbarui' : 'berhasil ditambahkan'}`, 
        variant: "success" 
      });
      
      await fetchData();
      resetProdukForm();
    } catch (error) {
      console.error("Error:", error);
      setMessage({ 
        text: error instanceof Error ? error.message : "Terjadi kesalahan", 
        variant: "danger" 
      });
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  // Edit handlers
  const editProduk = (produk: Produk) => {
    setFormProduk({
      nama_produk: produk.nama_produk,
      kategori: produk.kategori,
      harga: produk.harga,
      stok: produk.stok,
      tanggal_kadaluarsa: produk.tanggal_kadaluarsa || new Date().toISOString().split('T')[0] 
    });
    setEditMode({ type: 'produk', id: produk.id });
  };

  // Delete handlers
  const deleteProduk = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    
    setLoading(prev => ({ ...prev, page: true }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus produk");
      }

      setMessage({ text: "Produk berhasil dihapus", variant: "success" });
      await fetchData();
    } catch (error) {
      console.error("Error:", error);
      setMessage({ 
        text: error instanceof Error ? error.message : "Terjadi kesalahan", 
        variant: "danger" 
      });
    } finally {
      setLoading(prev => ({ ...prev, page: false }));
    }
  };

  // Reset forms
  const resetProdukForm = () => {
    setFormProduk({ nama_produk: "", kategori: "Elektronik", harga: 0, stok: 0, tanggal_kadaluarsa: "" });
    setEditMode({ type: '' });
  };

  // Categories
  const categories = [
    "Elektronik", 
    "Pakaian", 
    "Fashion", 
    "Makanan", 
    "Minuman", 
    "Kesehatan",
    "Perabotan",
    "Olahraga",
    "Lainnya"
  ];

  return (
    <Container className="py-4">
      {/* Message Alert */}
      {message && (
        <Alert variant={message.variant} onClose={() => setMessage(null)} dismissible className="mt-3">
          {message.text}
        </Alert>
      )}

      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <FontAwesomeIcon icon={faBox} className="me-2" />
            Manajemen Produk
          </h5>
        </Card.Header>
        <Card.Body>
          <Tabs defaultActiveKey="produk" className="mb-4">
            <Tab eventKey="produk" title="Produk">
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    {editMode.type === 'produk' ? 'Edit Produk' : 'Tambah Produk Baru'}
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={submitProduk}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nama Produk</Form.Label>
                          <Form.Control
                            type="text"
                            name="nama_produk"
                            value={formProduk.nama_produk}
                            onChange={handleProdukChange}
                            required
                            placeholder="Contoh: Laptop Gaming"
                            disabled={loading.form}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Kategori</Form.Label>
                          <Form.Select
                            name="kategori"
                            value={formProduk.kategori}
                            onChange={handleProdukChange}
                            required
                            disabled={loading.form}
                          >
                            {categories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Harga (Rp)</Form.Label>
                          <Form.Control
                            type="number"
                            name="harga"
                            value={formProduk.harga || ""}
                            onChange={handleProdukChange}
                            required
                            min={0}
                            placeholder="Contoh: 15000000"
                            disabled={loading.form}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Stok</Form.Label>
                          <Form.Control
                            type="number"
                            name="stok"
                            value={formProduk.stok || ""}
                            onChange={handleProdukChange}
                            required
                            min={0}
                            placeholder="Contoh: 10"
                            disabled={loading.form}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Tanggal Kadaluarsa (Opsional)</Form.Label>
                          <Form.Control
                            type="date"
                            name="tanggal_kadaluarsa"
                            value={formProduk.tanggal_kadaluarsa || ""}
                            onChange={handleProdukChange}
                            disabled={loading.form}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-end gap-2">
                      <a href="/import">
                        <Button variant="outline-secondary" disabled={loading.form}>
                          <FontAwesomeIcon icon={faUpload} className="me-2" />
                          Import Data
                        </Button>
                      </a>

                      {editMode.type === 'produk' && (
                        <Button 
                          variant="outline-danger" 
                          onClick={resetProdukForm}
                          disabled={loading.form}
                        >
                          Batal Edit
                        </Button>
                      )}
                      <Button variant="primary" type="submit" disabled={loading.form}>
                        {loading.form ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faSave} className="me-2" />
                            {editMode.type === 'produk' ? 'Update Produk' : 'Simpan Produk'}
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>

              {/* Produk List */}
              <Card className="mt-4 border-0 shadow-sm">
                <Card.Header className=" d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Daftar Produk</h6>
                  <div className="w-25">
                    <Form.Control
                      type="text"
                      placeholder="Cari produk..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </Card.Header>
                <Card.Body>
                  {loading.page ? (
                    <div className="text-center py-4">
                      <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                      <p className="mt-2">Memuat data produk...</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table striped bordered hover className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>No</th>
                            <th>Nama Produk</th>
                            <th>Kategori</th>
                            <th>Harga</th>
                            <th>Stok</th>
                            <th>Kadaluarsa</th>
                            <th>Riwayat Stok</th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProdukList.length > 0 ? (
                            filteredProdukList.map((produk, index) => (
                              <tr key={produk.id}>
                                <td>{index + 1}</td>
                                <td className="fw-semibold">{produk.nama_produk}</td>
                                <td>
                                  <span className="badge bg-info text-dark">
                                    {produk.kategori}
                                  </span>
                                </td>
                                <td className="text-nowrap">Rp {produk.harga.toLocaleString("id-ID")}</td>
                                <td>
                                  <span className={`badge ${produk.stok > 0 ? 'bg-success' : 'bg-danger'}`}>
                                    {produk.stok}
                                  </span>
                                </td>
                                <td>
                                  {produk.tanggal_kadaluarsa ? (
                                    <span className={`badge ${new Date(produk.tanggal_kadaluarsa) > new Date() ? 'bg-success' : 'bg-danger'}`}>
                                      {formatDate(produk.tanggal_kadaluarsa)}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td>
                                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                    {produk.BarangMasuk && produk.BarangMasuk.length > 0 ? (
                                      produk.BarangMasuk.map((masuk, idx) => (
                                        <div key={`masuk-${idx}`} className="mb-1">
                                          <small>
                                            <span className="badge bg-success me-1">Masuk</span>
                                            {masuk.jumlah} pcs - {formatDate(masuk.masa_exp)}
                                          </small>
                                        </div>
                                      ))
                                    ) : (
                                      <small className="text-muted">Tidak ada riwayat masuk</small>
                                    )}
                                    {produk.BarangKeluar && produk.BarangKeluar.length > 0 && (
                                      produk.BarangKeluar.map((keluar, idx) => (
                                        <div key={`keluar-${idx}`} className="mb-1">
                                          <small>
                                            <span className="badge bg-danger me-1">Keluar</span>
                                            {keluar.jumlah} pcs - {formatDate(keluar.masa_exp)}
                                          </small>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <Button 
                                      variant="outline-info" 
                                      size="sm"
                                      onClick={() => editProduk(produk)}
                                      title="Edit"
                                      disabled={loading.page}
                                    >
                                      <FontAwesomeIcon icon={faEdit} />
                                    </Button>
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      onClick={() => deleteProduk(produk.id)}
                                      title="Hapus"
                                      disabled={loading.page}
                                    >
                                      <FontAwesomeIcon icon={faTimes} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="text-center py-4">
                                {searchTerm ? (
                                  <span className="text-muted">Tidak ditemukan produk yang sesuai dengan pencarian</span>
                                ) : (
                                  <span className="text-muted">Belum ada data produk</span>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
}