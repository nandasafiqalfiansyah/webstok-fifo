"use client";

import { useEffect, useState } from "react";
import { Card, Form, Button, Modal, Tab, Tabs, Alert, Container, Row, Col, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBox, faShoppingCart, faMoneyBillWave, faTrophy, 
  faChartLine, faPlus, faSave, faSpinner, faTimes, faEdit, 
  faUpload
} from "@fortawesome/free-solid-svg-icons";
interface Produk {
  id: number;
  nama_produk: string;
  kategori: string;
  harga: number;
  stok: number;
}

interface BarangMasuk {
  id: number;
  produk_id: number;
  jumlah: number;
  tanggal_masuk: string;
  Produk?: Produk;
}

interface BarangKeluar {
  id: number;
  produk_id: number;
  jumlah: number;
  tanggal_keluar: string;
  Produk?: Produk;
}

export default function InputDataPage() {
  // State for data
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [barangMasukList, setBarangMasukList] = useState<BarangMasuk[]>([]);
  const [barangKeluarList, setBarangKeluarList] = useState<BarangKeluar[]>([]);
  const [loading, setLoading] = useState(true);

  // State for forms
  const [formProduk, setFormProduk] = useState<Omit<Produk, 'id'>>({ 
    nama_produk: "", 
    kategori: "Elektronik", 
    harga: 0, 
    stok: 0 
  });
  const [formMasuk, setFormMasuk] = useState<Omit<BarangMasuk, 'id'>>({ 
    produk_id: 0, 
    jumlah: 0, 
    tanggal_masuk: new Date().toISOString().split('T')[0] 
  });
  const [formKeluar, setFormKeluar] = useState<Omit<BarangKeluar, 'id'>>({ 
    produk_id: 0, 
    jumlah: 0, 
    tanggal_keluar: new Date().toISOString().split('T')[0] 
  });
  const [message, setMessage] = useState<{ text: string; variant: string } | null>(null);
  const [editMode, setEditMode] = useState<{ type: string, id?: number }>({ type: '' });

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch products
        const produkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
        const produkData = await produkRes.json();
        setProdukList(produkData.data);

        // Fetch incoming goods
        const masukRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk`);
        const masukData = await masukRes.json();
        setBarangMasukList(masukData.data);

        // Fetch outgoing goods
        const keluarRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar`);
        const keluarData = await keluarRes.json();
        setBarangKeluarList(keluarData.data);

      } catch (error) {
        console.error("Error fetching data:", error);
        setMessage({ text: "Gagal memuat data", variant: "danger" });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
    setLoading(true);

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

      const result = await res.json();

      if (res.ok) {
        setMessage({ text: `Produk ${editMode.type === 'produk' ? 'diperbarui' : 'ditambahkan'}`, variant: "success" });
        // Refresh product list
        const produkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
        const produkData = await produkRes.json();
        setProdukList(produkData.data);
        resetProdukForm();
      } else {
        setMessage({ text: result.message || "Gagal menyimpan produk", variant: "danger" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const submitBarangMasuk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editMode.type === 'masuk' && editMode.id 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk/${editMode.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk`;
      
      const method = editMode.type === 'masuk' && editMode.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formMasuk)
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ text: `Barang masuk ${editMode.type === 'masuk' ? 'diperbarui' : 'ditambahkan'}`, variant: "success" });
        // Refresh incoming goods list
        const masukRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk`);
        const masukData = await masukRes.json();
        setBarangMasukList(masukData.data);
        resetMasukForm();
      } else {
        setMessage({ text: result.message || "Gagal menyimpan barang masuk", variant: "danger" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const submitBarangKeluar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editMode.type === 'keluar' && editMode.id 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar/${editMode.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar`;
      
      const method = editMode.type === 'keluar' && editMode.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formKeluar)
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ text: `Barang keluar ${editMode.type === 'keluar' ? 'diperbarui' : 'ditambahkan'}`, variant: "success" });
        // Refresh outgoing goods list
        const keluarRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar`);
        const keluarData = await keluarRes.json();
        setBarangKeluarList(keluarData.data);
        resetKeluarForm();
      } else {
        setMessage({ text: result.message || "Gagal menyimpan barang keluar", variant: "danger" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  // Edit handlers
  const editProduk = (produk: Produk) => {
    setFormProduk({
      nama_produk: produk.nama_produk,
      kategori: produk.kategori,
      harga: produk.harga,
      stok: produk.stok
    });
    setEditMode({ type: 'produk', id: produk.id });
  };

  const editBarangMasuk = (masuk: BarangMasuk) => {
    setFormMasuk({
      produk_id: masuk.produk_id,
      jumlah: masuk.jumlah,
      tanggal_masuk: masuk.tanggal_masuk
    });
    setEditMode({ type: 'masuk', id: masuk.id });
  };

  const editBarangKeluar = (keluar: BarangKeluar) => {
    setFormKeluar({
      produk_id: keluar.produk_id,
      jumlah: keluar.jumlah,
      tanggal_keluar: keluar.tanggal_keluar
    });
    setEditMode({ type: 'keluar', id: keluar.id });
  };

  // Delete handlers
  const deleteProduk = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setMessage({ text: "Produk dihapus", variant: "success" });
        // Refresh product list
        const produkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
        const produkData = await produkRes.json();
        setProdukList(produkData.data);
      } else {
        setMessage({ text: "Gagal menghapus produk", variant: "danger" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const deleteBarangMasuk = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data barang masuk ini?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setMessage({ text: "Barang masuk dihapus", variant: "success" });
        // Refresh incoming goods list
        const masukRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk`);
        const masukData = await masukRes.json();
        setBarangMasukList(masukData.data);
      } else {
        setMessage({ text: "Gagal menghapus barang masuk", variant: "danger" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const deleteBarangKeluar = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data barang keluar ini?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setMessage({ text: "Barang keluar dihapus", variant: "success" });
        // Refresh outgoing goods list
        const keluarRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar`);
        const keluarData = await keluarRes.json();
        setBarangKeluarList(keluarData.data);
      } else {
        setMessage({ text: "Gagal menghapus barang keluar", variant: "danger" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  // Reset forms
  const resetProdukForm = () => {
    setFormProduk({ nama_produk: "", kategori: "Elektronik", harga: 0, stok: 0 });
    setEditMode({ type: '' });
  };

  const resetMasukForm = () => {
    setFormMasuk({ produk_id: 0, jumlah: 0, tanggal_masuk: new Date().toISOString().split('T')[0] });
    setEditMode({ type: '' });
  };

  const resetKeluarForm = () => {
    setFormKeluar({ produk_id: 0, jumlah: 0, tanggal_keluar: new Date().toISOString().split('T')[0] });
    setEditMode({ type: '' });
  };

  // Categories
  const categories = ["Elektronik", "Pakaian", "Fashion", "Makanan", "Minuman", "Lainnya"];

  return (
    <Container className="py-4">
      {/* Message Alert */}
      {message && (
        <Alert variant={message.variant} onClose={() => setMessage(null)} dismissible>
          {message.text}
        </Alert>
      )}

      <Tabs defaultActiveKey="produk" className="mb-4">
        {/* Produk Tab */}
        <Tab eventKey="produk" title="Produk">
          <Card>
            <Card.Header>
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
                      />
                    </Form.Group>
                  </Col>
                </Row>

               


                <div className="d-flex justify-content-end gap-2">
                <a href="/import">
                    <Button variant="secondary">
                      <FontAwesomeIcon icon={faUpload} className="me-2" />
                      Import
                    </Button>
                  </a>
               


                  {editMode.type === 'produk' && (
                    <Button variant="secondary" onClick={resetProdukForm}>
                      Batal
                    </Button>
                  )}
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? (
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
            <Card.Header>
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faBox} className="me-2" />
                Daftar Produk
              </h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                   <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
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
                          <Button 
                            variant="warning" 
                            size="sm" 
                            className="me-2"
                            onClick={() => editProduk(produk)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => deleteProduk(produk.id)}
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </Button>
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
            <Card.Header>
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
                      >
                        <option value="">Pilih Produk</option>
                        {produkList.map(produk => (
                          <option key={produk.id} value={produk.id}>{produk.nama_produk}</option>
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
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end gap-2">
                  {editMode.type === 'masuk' && (
                    <Button variant="secondary" onClick={resetMasukForm}>
                      Batal
                    </Button>
                  )}
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? (
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
            <Card.Header>
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                Daftar Barang Masuk
              </h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Produk</th>
                      <th>Jumlah</th>
                      <th>Tanggal Masuk</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barangMasukList.map((masuk, index) => (
                      <tr key={masuk.id}>
                        <td>{index + 1}</td>
                        <td>{produkList.find(p => p.id === masuk.produk_id)?.nama_produk || 'Unknown'}</td>
                        <td>{masuk.jumlah}</td>
                        <td>{new Date(masuk.tanggal_masuk).toLocaleDateString('id-ID')}</td>
                        <td>
                          <Button 
                            variant="warning" 
                            size="sm" 
                            className="me-2"
                            onClick={() => editBarangMasuk(masuk)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => deleteBarangMasuk(masuk.id)}
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </Button>
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
            <Card.Header>
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
                      >
                        <option value="">Pilih Produk</option>
                        {produkList.map(produk => (
                          <option key={produk.id} value={produk.id}>{produk.nama_produk}</option>
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
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end gap-2">
                  {editMode.type === 'keluar' && (
                    <Button variant="secondary" onClick={resetKeluarForm}>
                      Batal
                    </Button>
                  )}
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? (
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
            <Card.Header>
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                Daftar Barang Keluar
              </h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                  </div>
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
                        <td>{new Date(keluar.tanggal_keluar).toLocaleDateString('id-ID')}</td>
                        <td>
                          <Button 
                            variant="warning" 
                            size="sm" 
                            className="me-2"
                            onClick={() => editBarangKeluar(keluar)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => deleteBarangKeluar(keluar.id)}
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </Button>
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
    </Container>
  );
}