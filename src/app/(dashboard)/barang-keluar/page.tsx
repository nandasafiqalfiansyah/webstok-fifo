"use client";

import { useEffect, useState } from "react";
import { Card, Button, Modal, Form, Alert, Container, Table, InputGroup, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSave, faTimes, faPlus, faSpinner, faSearch, faBoxOpen } from "@fortawesome/free-solid-svg-icons";

interface BarangKeluar {
  id: number;
  tanggal_keluar: string;
  jumlah: number;
  produk_id: number;
  produk_nama: string;
  kategori: string;
  keterangan: string;
}

interface Produk {
  id: number;
  nama_produk: string;
  kategori: string;
  stok: number;
}

export default function BarangKeluarPage() {
  const [barangKeluarList, setBarangKeluarList] = useState<BarangKeluar[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [filteredList, setFilteredList] = useState<BarangKeluar[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState({
    page: true,
    form: false
  });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Omit<BarangKeluar, 'id' | 'produk_nama' | 'kategori'>>({ 
    produk_id: 0,
    tanggal_keluar: new Date().toISOString().split('T')[0],
    jumlah: 0,
    keterangan: ""
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; variant: string } | null>(null);

  // Format date to DD-MM-YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
  };

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(prev => ({ ...prev, page: true }));
        
        // Fetch products and outgoing items in parallel
        const [produkRes, keluarRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar`)
        ]);

        if (!produkRes.ok) throw new Error("Gagal memuat produk");
        if (!keluarRes.ok) throw new Error("Gagal memuat barang keluar");

        const [produkData, keluarData] = await Promise.all([
          produkRes.json(),
          keluarRes.json()
        ]);

        const produkItems = produkData?.data || [];
        const keluarItems = keluarData?.data || [];

        // Map product data to outgoing items
        const mappedData = keluarItems.map((item: any) => {
          const product = produkItems.find((p: any) => p.id === item.produk_id);
          return {
            id: item.id,
            tanggal_keluar: item.tanggal_keluar,
            jumlah: item.jumlah,
            produk_id: item.produk_id,
            produk_nama: product?.nama_produk || 'Unknown',
            kategori: product?.kategori || 'Unknown',
            keterangan: item.keterangan || "-"
          };
        });

        setProdukList(produkItems);
        setBarangKeluarList(mappedData);
        setFilteredList(mappedData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setMessage({ text: "Gagal memuat data", variant: "danger" });
      } finally {
        setLoading(prev => ({ ...prev, page: false }));
      }
    }

    fetchData();
  }, []);

  // Filter data
  useEffect(() => {
    const filtered = barangKeluarList.filter(
      (item) =>
        item.produk_nama.toLowerCase().includes(searchText.toLowerCase()) ||
        item.kategori.toLowerCase().includes(searchText.toLowerCase()) ||
        formatDate(item.tanggal_keluar).toLowerCase().includes(searchText.toLowerCase()) ||
        item.keterangan.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredList(filtered);
  }, [searchText, barangKeluarList]);

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "produk_id" || name === "jumlah" ? Number(value) : value
    }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, form: true }));

    try {
      // Check stock availability
      const product = produkList.find(p => p.id === formData.produk_id);
      if (product && formData.jumlah > product.stok) {
        throw new Error("Stok produk tidak mencukupi");
      }

      const url = editId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar/${editId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar`;
      
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || "Gagal menyimpan data");
      }

      setMessage({ 
        text: `Data barang keluar ${editId ? 'berhasil diperbarui' : 'berhasil ditambahkan'}`, 
        variant: "success" 
      });
      
      // Refresh data
      const keluarRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar`);
      const keluarData = await keluarRes.json();
      
      // Map produk data to barang keluar
      const mappedData = (keluarData?.data || []).map((item: any) => ({
        id: item.id,
        tanggal_keluar: item.tanggal_keluar,
        jumlah: item.jumlah,
        produk_id: item.produk_id,
        produk_nama: (produkList || []).find((p) => p.id === item.produk_id)?.nama_produk || 'Unknown',
        kategori: (produkList || []).find((p) => p.id === item.produk_id)?.kategori || 'Unknown',
        keterangan: item.keterangan || "-"
      }));

      setBarangKeluarList(mappedData);
      setFilteredList(mappedData);
      handleCloseModal();
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

  // Handle edit
  const handleEdit = (id: number) => {
    const itemToEdit = barangKeluarList.find(item => item.id === id);
    if (itemToEdit) {
      setFormData({
        produk_id: itemToEdit.produk_id,
        tanggal_keluar: itemToEdit.tanggal_keluar,
        jumlah: itemToEdit.jumlah,
        keterangan: itemToEdit.keterangan
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    try {
      setLoading(prev => ({ ...prev, page: true }));
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus data");
      }

      setMessage({ text: "Data barang keluar berhasil dihapus", variant: "success" });
      setBarangKeluarList(prev => prev.filter(item => item.id !== id));
      setFilteredList(prev => prev.filter(item => item.id !== id));
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

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({
      produk_id: 0,
      tanggal_keluar: new Date().toISOString().split('T')[0],
      jumlah: 0,
      keterangan: ""
    });
  };

  return (
    <Container className="py-4">
      {/* Message Alert */}
      {message && (
        <Alert 
          variant={message.variant} 
          onClose={() => setMessage(null)} 
          dismissible
          className="mt-3"
        >
          {message.text}
        </Alert>
      )}

      <Card className="shadow-sm border-0">
        <Card.Header className="d-flex justify-content-between align-items-center py-3 bg-primary text-white">
          <h5 className="mb-0">
            <FontAwesomeIcon icon={faBoxOpen} className="me-2" />
            Data Barang Keluar
          </h5>
          <Button 
            variant="light" 
            onClick={() => setShowModal(true)}
            disabled={loading.page}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Tambah Barang Keluar
          </Button>
        </Card.Header>
        <Card.Body>
          {/* Search Input */}
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <FontAwesomeIcon icon={faSearch} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Cari berdasarkan nama produk, kategori, tanggal, atau keterangan..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  disabled={loading.page}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
          </Row>

          {/* Data Table */}
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead >
                <tr>
                  <th>No</th>
                  <th>ID Transaksi</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Tanggal Keluar</th>
                  <th>Jumlah</th>
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading.page ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <div className="d-flex justify-content-center align-items-center">
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        Memuat data...
                      </div>
                    </td>
                  </tr>
                ) : filteredList.length > 0 ? (
                  filteredList.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.id}</td>
                      <td className="fw-semibold">{item.produk_nama}</td>
                      <td>
                        <span className="badge bg-info text-dark">{item.kategori}</span>
                      </td>
                      <td>{formatDate(item.tanggal_keluar)}</td>
                      <td>
                        <span className="badge bg-primary">{item.jumlah.toLocaleString()}</span>
                      </td>
                      <td>{item.keterangan}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-warning" 
                            size="sm"
                            onClick={() => handleEdit(item.id)}
                            title="Edit"
                            disabled={loading.page}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            title="Hapus"
                            disabled={loading.page}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      {searchText ? (
                        <span className="text-muted">Tidak ditemukan data yang sesuai dengan pencarian</span>
                      ) : (
                        <span className="text-muted">Belum ada data barang keluar</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static">
        <Modal.Header closeButton closeVariant="white" className="bg-primary text-white">
          <Modal.Title>
            <FontAwesomeIcon icon={editId ? faEdit : faPlus} className="me-2" />
            {editId ? 'Edit Barang Keluar' : 'Tambah Barang Keluar'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Produk</Form.Label>
              <Form.Select
                name="produk_id"
                value={formData.produk_id}
                onChange={handleChange}
                required
                disabled={loading.form}
              >
                <option value="">Pilih Produk</option>
                {(produkList || []).map(produk => (
                  <option key={produk.id} value={produk.id}>
                    {produk.nama_produk} (Stok: {produk.stok})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tanggal Keluar</Form.Label>
              <Form.Control
                type="date"
                name="tanggal_keluar"
                value={formData.tanggal_keluar}
                onChange={handleChange}
                required
                disabled={loading.form}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Jumlah</Form.Label>
              <Form.Control
                type="number"
                name="jumlah"
                value={formData.jumlah || ""}
                onChange={handleChange}
                required
                min={1}
                disabled={loading.form}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Keterangan (Opsional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="keterangan"
                value={formData.keterangan}
                onChange={handleChange}
                disabled={loading.form}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={loading.form}>
              <FontAwesomeIcon icon={faTimes} className="me-2" />
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={loading.form}>
              {loading.form ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                  Memproses...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="me-2" />
                  Simpan
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}