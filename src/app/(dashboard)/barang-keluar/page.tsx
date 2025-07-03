"use client";

import { useEffect, useState } from "react";
import { Card, Button, Modal, Form, Alert, Container, Table, InputGroup, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSave, faTimes, faPlus, faSpinner, faSearch, faBoxOpen } from "@fortawesome/free-solid-svg-icons";
import ReactLoading from 'react-loading';

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
}

export default function BarangKeluarPage() {
  const [barangKeluarList, setBarangKeluarList] = useState<BarangKeluar[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [filteredList, setFilteredList] = useState<BarangKeluar[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Omit<BarangKeluar, 'id' | 'produk_nama' | 'kategori'>>({ 
    produk_id: 0,
    tanggal_keluar: new Date().toISOString().split('T')[0],
    jumlah: 0,
    keterangan: ""
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; variant: string } | null>(null);

  // Format tanggal ke DD-MM-YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
  };

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch products
        const produkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
        if (!produkRes.ok) throw new Error("Failed to fetch products");
        const produkData = await produkRes.json();
        setProdukList(produkData?.data || []);

        // Fetch barang keluar
        const keluarRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar`);
        if (!keluarRes.ok) throw new Error("Failed to fetch outgoing items");
        const keluarData = await keluarRes.json();
        
        // Map produk data to barang keluar
        const mappedData = (keluarData?.data || []).map((item: any) => ({
          id: item.id,
          tanggal_keluar: item.tanggal_keluar,
          jumlah: item.jumlah,
          produk_id: item.produk_id,
          produk_nama: (produkData?.data || []).find((p: any) => p.id === item.produk_id)?.nama_produk || 'Unknown',
          kategori: (produkData?.data || []).find((p: any) => p.id === item.produk_id)?.kategori || 'Unknown',
          keterangan: item.keterangan || "-"
        }));

        setBarangKeluarList(mappedData);
        setFilteredList(mappedData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setMessage({ text: "Gagal memuat data", variant: "danger" });
      } finally {
        setLoading(false);
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
    setLoading(true);

    try {
      const url = editId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar/${editId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar`;
      
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ text: `Data barang keluar ${editId ? 'diperbarui' : 'ditambahkan'}`, variant: "success" });
        
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
      } else {
        setMessage({ text: result.message || "Gagal menyimpan data", variant: "danger" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan", variant: "danger" });
    } finally {
      setLoading(false);
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
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-keluar/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ text: "Data barang keluar dihapus", variant: "success" });
        setBarangKeluarList(prev => prev.filter(item => item.id !== id));
        setFilteredList(prev => prev.filter(item => item.id !== id));
      } else {
        setMessage({ text: "Gagal menghapus data", variant: "danger" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan", variant: "danger" });
    } finally {
      setLoading(false);
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
        <Alert variant={message.variant} onClose={() => setMessage(null)} dismissible>
          {message.text}
        </Alert>
      )}

      <Card className="shadow-sm border-0">
        <Card.Header className=" d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0">
            <FontAwesomeIcon icon={faBoxOpen} className="me-2" />
            Data Barang Keluar
          </h5>
          <Button 
            variant="primary" 
            onClick={() => setShowModal(true)}
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
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faSearch} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Cari berdasarkan nama produk, kategori, tanggal, atau keterangan..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>

          {/* Data Table */}
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Id Transaksi</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Tanggal Keluar</th>
                  <th>Jumlah</th>
                  <th>Aksi</th>
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
                ) : filteredList.length > 0 ? (
                  filteredList.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.id}</td>
                      <td>{item.produk_nama}</td>
                      <td>{item.kategori}</td>
                      <td>{formatDate(item.tanggal_keluar)}</td>
                      <td>{item.jumlah}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="warning" 
                            size="sm"
                            onClick={() => handleEdit(item.id)}
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            title="Hapus"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      Tidak ada data barang keluar
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
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
                disabled={loading}
              >
                <option value="">Pilih Produk</option>
                {(produkList || []).map(produk => (
                  <option key={produk.id} value={produk.id}>{produk.nama_produk}</option>
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
                disabled={loading}
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
                disabled={loading}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={loading}>
              <FontAwesomeIcon icon={faTimes} className="me-2" />
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                   <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                  </div>
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