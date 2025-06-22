"use client";

import { useEffect, useState } from "react";
import { Card, Form, Button, Modal, Tab, Tabs, Alert, Container, Row, Col, Table, Accordion } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBox, faShoppingCart, faMoneyBillWave, faTrophy, 
  faChartLine, faPlus, faSave, faSpinner, faTimes, faEdit, 
  faUpload, faExclamationTriangle, faHistory
} from "@fortawesome/free-solid-svg-icons";

interface Produk {
  BarangMasuk?: BarangMasuk[];
  BarangKeluar?: BarangKeluar[];
  id: number;
  nama_produk: string;
  kategori: string;
  harga: number;
  stok: number;
  tanggal_kadaluarsa?: string;
}

interface BarangMasuk {
  id: number;
  produk_id: number;
  jumlah: number;
  tanggal_masuk: string;
  masa_exp: string | null;
  Produk?: Produk;
}

interface BarangKeluar {
  id: number;
  produk_id: number;
  jumlah: number;
  tanggal_keluar: string;
  Produk?: Produk;
  masa_exp: string | null;
}

interface ProdukTransactionHistory {
  id: number;
  type: 'masuk' | 'keluar';
  jumlah: number;
  tanggal: string;
  masa_exp: string | null;
}

export default function InputDataPage() {
  // State for data
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [barangMasukList, setBarangMasukList] = useState<BarangMasuk[]>([]);
  const [barangKeluarList, setBarangKeluarList] = useState<BarangKeluar[]>([]);
  const [selectedProductHistory, setSelectedProductHistory] = useState<ProdukTransactionHistory[]>([]);
  const [loading, setLoading] = useState({
    page: true,
    form: false,
    history: false
  });

  // State for forms
  const [formProduk, setFormProduk] = useState<Omit<Produk, 'id'>>({ 
    nama_produk: "", 
    kategori: "Elektronik", 
    harga: 0, 
    stok: 0,
    tanggal_kadaluarsa: new Date().toISOString().split('T')[0] 
  });
  const [formMasuk, setFormMasuk] = useState<Omit<BarangMasuk, 'id'>>({ 
    produk_id: 0, 
    jumlah: 0, 
    tanggal_masuk: new Date().toISOString().split('T')[0],
    masa_exp: null
  });
  const [formKeluar, setFormKeluar] = useState<Omit<BarangKeluar, 'id'>>({ 
    produk_id: 0, 
    jumlah: 0, 
    tanggal_keluar: new Date().toISOString().split('T')[0],
    masa_exp: null
  });
  const [message, setMessage] = useState<{ text: string; variant: string } | null>(null);
  const [editMode, setEditMode] = useState<{ type: string, id?: number }>({ type: '' });
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Format date to local string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(prev => ({ ...prev, page: true }));
      
      // Fetch all data in parallel
      const [produkRes, masukRes, keluarRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar`)
      ]);

      const [produkData, masukData, keluarData] = await Promise.all([
        produkRes.json(),
        masukRes.json(),
        keluarRes.json()
      ]);

      setProdukList(produkData.data);
      setBarangMasukList(masukData.data);
      setBarangKeluarList(keluarData.data);

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

  // Fetch product transaction history
  const fetchProductHistory = async (productId: number) => {
    try {
      setLoading(prev => ({ ...prev, history: true }));
      
      const [masukRes, keluarRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk?produk_id=${productId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar?produk_id=${productId}`)
      ]);

      const [masukData, keluarData] = await Promise.all([
        masukRes.json(),
        keluarRes.json()
      ]);

      const history: ProdukTransactionHistory[] = [
        ...masukData.data.map((item: BarangMasuk) => ({
          id: item.id,
          type: 'masuk',
          jumlah: item.jumlah,
          tanggal: item.tanggal_masuk,
          masa_exp: item.masa_exp
        })),
        ...keluarData.data.map((item: BarangKeluar) => ({
          id: item.id,
          type: 'keluar',
          jumlah: item.jumlah,
          tanggal: item.tanggal_keluar,
          masa_exp: null
        }))
      ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

      setSelectedProductHistory(history);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Error fetching product history:", error);
      setMessage({ text: "Gagal memuat riwayat produk", variant: "danger" });
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  };

  // Form handlers
  const handleProdukChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormProduk(prev => ({
      ...prev,
      [name]: name === "harga" || name === "stok" ? Number(value) : value
    }));
  };

  const handleMasukChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormMasuk(prev => ({
      ...prev,
      [name]: name === "produk_id" || name === "jumlah" ? Number(value) : value
    }));
  };

  const handleKeluarChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormKeluar(prev => ({
      ...prev,
      [name]: name === "produk_id" || name === "jumlah" ? Number(value) : value
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
        text: `Produk ${editMode.type === 'produk' ? 'diperbarui' : 'ditambahkan'}`, 
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

  const submitBarangMasuk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, form: true }));

    try {
      const url = editMode.type === 'masuk' && editMode.id 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk/${editMode.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk`;
      
      const method = editMode.type === 'masuk' && editMode.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formMasuk,
          masa_exp: formMasuk.masa_exp || null
        })
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || "Gagal menyimpan barang masuk");
      }

      setMessage({ 
        text: `Barang masuk ${editMode.type === 'masuk' ? 'diperbarui' : 'ditambahkan'}`, 
        variant: "success" 
      });
      
      await fetchData();
      resetMasukForm();
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

  const submitBarangKeluar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, form: true }));

    try {
      // Check if product has enough stock
      const product = produkList.find(p => p.id === formKeluar.produk_id);
      if (product && product.stok < formKeluar.jumlah) {
        throw new Error("Stok produk tidak mencukupi");
      }

      const url = editMode.type === 'keluar' && editMode.id 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar/${editMode.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar`;
      
      const method = editMode.type === 'keluar' && editMode.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formKeluar)
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || "Gagal menyimpan barang keluar");
      }

      setMessage({ 
        text: `Barang keluar ${editMode.type === 'keluar' ? 'diperbarui' : 'ditambahkan'}`, 
        variant: "success" 
      });
      
      await fetchData();
      resetKeluarForm();
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

  const editBarangMasuk = (masuk: BarangMasuk) => {
    setFormMasuk({
      produk_id: masuk.produk_id,
      jumlah: masuk.jumlah,
      tanggal_masuk: masuk.tanggal_masuk,
      masa_exp: masuk.masa_exp || null
    });
    setEditMode({ type: 'masuk', id: masuk.id });
  };

  const editBarangKeluar = (keluar: BarangKeluar) => {
    setFormKeluar({
      produk_id: keluar.produk_id,
      jumlah: keluar.jumlah,
      tanggal_keluar: keluar.tanggal_keluar,
      masa_exp: keluar.masa_exp || null

    });
    setEditMode({ type: 'keluar', id: keluar.id });
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

      setMessage({ text: "Produk dihapus", variant: "success" });
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

  const deleteBarangMasuk = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data barang masuk ini?")) return;
    
    setLoading(prev => ({ ...prev, page: true }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus barang masuk");
      }

      setMessage({ text: "Barang masuk dihapus", variant: "success" });
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

  const deleteBarangKeluar = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data barang keluar ini?")) return;
    
    setLoading(prev => ({ ...prev, page: true }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus barang keluar");
      }

      setMessage({ text: "Barang keluar dihapus", variant: "success" });
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

  const resetMasukForm = () => {
    setFormMasuk({ 
      produk_id: 0, 
      jumlah: 0, 
      tanggal_masuk: new Date().toISOString().split('T')[0],
      masa_exp: null
    });
    setEditMode({ type: '' });
  };

  const resetKeluarForm = () => {
    setFormKeluar({ 
      produk_id: 0, 
      jumlah: 0, 
      tanggal_keluar: new Date().toISOString().split('T')[0],
      masa_exp: null
    });
    setEditMode({ type: '' });
  };

  // Categories
  const categories = ["Elektronik", "Pakaian", "Fashion", "Makanan", "Minuman", "Lainnya"];

  return (
    <Container className="py-4">
      {/* Message Alert */}
      {message && (
        <Alert variant={message.variant} onClose={() => setMessage(null)} dismissible className="mt-3">
          {message.text}
        </Alert>
      )}

      <Tabs defaultActiveKey="produk" className="mb-4">
        {/* Produk Tab */}
        <Tab eventKey="produk" title="Produk">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faBox} className="me-2" />
                {editMode.type === 'produk' ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h5>
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

                <div className="d-flex justify-content-end gap-2">
                  <a href="/import">
                    <Button variant="secondary" disabled={loading.form}>
                      <FontAwesomeIcon icon={faUpload} className="me-2" />
                      Import
                    </Button>
                  </a>

                  {editMode.type === 'produk' && (
                    <Button 
                      variant="secondary" 
                      onClick={resetProdukForm}
                      disabled={loading.form}
                    >
                      Batal
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
                        {editMode.type === 'produk' ? 'Update' : 'Simpan'}
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Produk List */}
          <Card className="mt-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faBox} className="me-2" />
                Daftar Produk
              </h5>
            </Card.Header>
            <Card.Body>
              {loading.page ? (
                <div className="text-center py-4">
                  <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                  <p className="mt-2">Memuat data produk...</p>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama Produk</th>
                      <th>Kategori</th>
                      <th>Harga</th>
                      <th>Stok</th>
                      <th>ipe - Kadaluarsa - pcs</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produkList.map((produk, index) => (
                      <tr key={produk.id}>
                        <td>{index + 1}</td>
                        <td>{produk.nama_produk}</td>
                        <td>{produk.kategori}</td>
                        <td>Rp {produk.harga.toLocaleString("id-ID")}</td>
                        <td>{produk.stok}</td>
                        <td>
                            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                              {/* Untuk Barang Masuk */}
                              {produk.BarangMasuk && produk.BarangMasuk.length > 0 && 
                                produk.BarangMasuk.map((masuk, idx) => (
                                  <div key={`masuk-${idx}`}>
                                    <span style={{ fontWeight: 'bold', color: 'green' }}>Masuk - </span> 
                                     {formatDate(masuk.masa_exp)} - {masuk.jumlah} pcs
                                  </div>
                                ))
                              }
                              
                              {/* Untuk Barang Keluar */}
                              {produk.BarangKeluar && produk.BarangKeluar.length > 0 && 
                                produk.BarangKeluar.map((keluar, idx) => (
                                  <div key={`keluar-${idx}`}>
                                    <span style={{ fontWeight: 'bold', color: 'red' }}>Keluar</span> - 
                                    {formatDate(keluar.masa_exp)} - {keluar.jumlah} pcs
                                  </div>
                                ))
                              }
                              
                              {/* Jika tidak ada data sama sekali */}
                              {(!produk.BarangMasuk || produk.BarangMasuk.length === 0) && 
                              (!produk.BarangKeluar || produk.BarangKeluar.length === 0) && 
                              ' tidak ada transaksi'}
                            </div>
                          </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="info" 
                              size="sm"
                              onClick={() => fetchProductHistory(produk.id)}
                              title="Riwayat"
                              disabled={loading.page}
                            >
                              <FontAwesomeIcon icon={faHistory} />
                            </Button>
                            <Button 
                              variant="warning" 
                              size="sm"
                              onClick={() => editProduk(produk)}
                              title="Edit"
                              disabled={loading.page}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button 
                              variant="danger" 
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
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Barang Masuk Tab */}
        <Tab eventKey="masuk" title="Barang Masuk">
          <Card>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                {editMode.type === 'masuk' ? 'Edit Barang Masuk' : 'Tambah Barang Masuk'}
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={submitBarangMasuk}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Produk</Form.Label>
                      <Form.Select
                        name="produk_id"
                        value={formMasuk.produk_id}
                        onChange={handleMasukChange}
                        required
                        disabled={loading.form}
                      >
                        <option value="">Pilih Produk</option>
                        {produkList.map(produk => (
                          <option key={produk.id} value={produk.id}>
                            {produk.nama_produk} (Stok: {produk.stok})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Jumlah</Form.Label>
                      <Form.Control
                        type="number"
                        name="jumlah"
                        value={formMasuk.jumlah || ""}
                        onChange={handleMasukChange}
                        required
                        min={1}
                        disabled={loading.form}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tanggal Masuk</Form.Label>
                      <Form.Control
                        type="date"
                        name="tanggal_masuk"
                        value={formMasuk.tanggal_masuk}
                        onChange={handleMasukChange}
                        required
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
                        name="masa_exp"
                        value={formMasuk.masa_exp || ""}
                        onChange={(e) => setFormMasuk({
                          ...formMasuk,
                          masa_exp: e.target.value || null
                        })}
                        disabled={loading.form}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end gap-2">
                  {editMode.type === 'masuk' && (
                    <Button 
                      variant="secondary" 
                      onClick={resetMasukForm}
                      disabled={loading.form}
                    >
                      Batal
                    </Button>
                  )}
                  <Button variant="success" type="submit" disabled={loading.form}>
                    {loading.form ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        {editMode.type === 'masuk' ? 'Update' : 'Simpan'}
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Barang Masuk List */}
          <Card className="mt-4">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                Daftar Barang Masuk
              </h5>
            </Card.Header>
            <Card.Body>
              {loading.page ? (
                <div className="text-center py-4">
                  <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                  <p className="mt-2">Memuat data barang masuk...</p>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Produk</th>
                      <th>Jumlah</th>
                      <th>Tanggal Masuk</th>
                      <th>Kadaluarsa</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barangMasukList.map((masuk, index) => (
                      <tr key={masuk.id}>
                        <td>{index + 1}</td>
                        <td>{produkList.find(p => p.id === masuk.produk_id)?.nama_produk || 'Unknown'}</td>
                        <td>{masuk.jumlah}</td>
                        <td>{formatDate(masuk.tanggal_masuk)}</td>
                        <td>{formatDate(masuk.masa_exp)}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="warning" 
                              size="sm"
                              onClick={() => editBarangMasuk(masuk)}
                              title="Edit"
                              disabled={loading.page}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => deleteBarangMasuk(masuk.id)}
                              title="Hapus"
                              disabled={loading.page}
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Barang Keluar Tab */}
        <Tab eventKey="keluar" title="Barang Keluar">
          <Card>
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                {editMode.type === 'keluar' ? 'Edit Barang Keluar' : 'Tambah Barang Keluar'}
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={submitBarangKeluar}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Produk</Form.Label>
                      <Form.Select
                        name="produk_id"
                        value={formKeluar.produk_id}
                        onChange={handleKeluarChange}
                        required
                        disabled={loading.form}
                      >
                        <option value="">Pilih Produk</option>
                        {produkList.map(produk => (
                          <option key={produk.id} value={produk.id}>
                            {produk.nama_produk} (Stok: {produk.stok})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Jumlah</Form.Label>
                      <Form.Control
                        type="number"
                        name="jumlah"
                        value={formKeluar.jumlah || ""}
                        onChange={handleKeluarChange}
                        required
                        min={1}
                        disabled={loading.form}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tanggal Keluar</Form.Label>
                      <Form.Control
                        type="date"
                        name="tanggal_keluar"
                        value={formKeluar.tanggal_keluar}
                        onChange={handleKeluarChange}
                        required
                        disabled={loading.form}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end gap-2">
                  {editMode.type === 'keluar' && (
                    <Button 
                      variant="secondary" 
                      onClick={resetKeluarForm}
                      disabled={loading.form}
                    >
                      Batal
                    </Button>
                  )}
                  <Button variant="danger" type="submit" disabled={loading.form}>
                    {loading.form ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        {editMode.type === 'keluar' ? 'Update' : 'Simpan'}
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Barang Keluar List */}
          <Card className="mt-4">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                Daftar Barang Keluar
              </h5>
            </Card.Header>
            <Card.Body>
              {loading.page ? (
                <div className="text-center py-4">
                  <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                  <p className="mt-2">Memuat data barang keluar...</p>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Produk</th>
                      <th>Jumlah</th>
                      <th>Tanggal Keluar</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barangKeluarList.map((keluar, index) => (
                      <tr key={keluar.id}>
                        <td>{index + 1}</td>
                        <td>{produkList.find(p => p.id === keluar.produk_id)?.nama_produk || 'Unknown'}</td>
                        <td>{keluar.jumlah}</td>
                        <td>{formatDate(keluar.tanggal_keluar)}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="warning" 
                              size="sm"
                              onClick={() => editBarangKeluar(keluar)}
                              title="Edit"
                              disabled={loading.page}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => deleteBarangKeluar(keluar.id)}
                              title="Hapus"
                              disabled={loading.page}
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Product History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <FontAwesomeIcon icon={faHistory} className="me-2" />
            Riwayat Transaksi Produk
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading.history ? (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
              <p className="mt-2">Memuat riwayat produk...</p>
            </div>
          ) : selectedProductHistory.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tipe</th>
                  <th>Jumlah</th>
                  <th>Tanggal</th>
                  <th>Kadaluarsa</th>
                </tr>
              </thead>
              <tbody>
                {selectedProductHistory.map((item, index) => (
                  <tr key={`${item.type}-${item.id}`}>
                    <td>{index + 1}</td>
                    <td>
                      {item.type === 'masuk' ? (
                        <span className="badge bg-success">Masuk</span>
                      ) : (
                        <span className="badge bg-danger">Keluar</span>
                      )}
                    </td>
                    <td>{item.jumlah}</td>
                    <td>{formatDate(item.tanggal)}</td>
                    <td>{formatDate(item.masa_exp)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Alert variant="info">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              Tidak ada riwayat transaksi untuk produk ini
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}