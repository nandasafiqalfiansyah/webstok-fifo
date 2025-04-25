"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Button, Modal, Form, Alert, Container, Table, InputGroup, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSave, faTimes, faPlus, faSpinner, faSearch, faBox, faFileImport, faUpload } from "@fortawesome/free-solid-svg-icons";
import { parse } from "papaparse";
interface BarangMasuk {
  id: number;
  tanggal_masuk: string;
  jumlah: number;
  produk_id: number;
  produk_nama: string;
  kategori: string;
}

interface Produk {
  id: number;
  nama_produk: string;
  kategori: string;
}

interface ImportData {
  produk_id: number;
  tanggal_masuk: string;
  jumlah: number;
}

export default function BarangMasukPage() {
  const [barangMasukList, setBarangMasukList] = useState<BarangMasuk[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [filteredList, setFilteredList] = useState<BarangMasuk[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formData, setFormData] = useState<Omit<BarangMasuk, 'id' | 'produk_nama' | 'kategori'>>({ 
    produk_id: 0,
    tanggal_masuk: new Date().toISOString().split('T')[0],
    jumlah: 0
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; variant: string } | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);

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

        // Fetch barang masuk
        const masukRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk`);
        if (!masukRes.ok) throw new Error("Failed to fetch incoming items");
        const masukData = await masukRes.json();
        
        // Map produk data to barang masuk
        const mappedData = (masukData?.data || []).map((item: any) => ({
          id: item.id,
          tanggal_masuk: item.tanggal_masuk,
          jumlah: item.jumlah,
          produk_id: item.produk_id,
          produk_nama: (produkData?.data || []).find((p: any) => p.id === item.produk_id)?.nama_produk || 'Unknown',
          kategori: (produkData?.data || []).find((p: any) => p.id === item.produk_id)?.kategori || 'Unknown'
        }));

        setBarangMasukList(mappedData);
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
    const filtered = barangMasukList.filter(
      (item) =>
        item.produk_nama.toLowerCase().includes(searchText.toLowerCase()) ||
        item.kategori.toLowerCase().includes(searchText.toLowerCase()) ||
        formatDate(item.tanggal_masuk).toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredList(filtered);
  }, [searchText, barangMasukList]);

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
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk/${editId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk`;
      
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ text: `Data barang masuk ${editId ? 'diperbarui' : 'ditambahkan'}`, variant: "success" });
        
        // Refresh data
        const masukRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk`);
        const masukData = await masukRes.json();
        
        // Map produk data to barang masuk
        const mappedData = (masukData?.data || []).map((item: any) => ({
          id: item.id,
          tanggal_masuk: item.tanggal_masuk,
          jumlah: item.jumlah,
          produk_id: item.produk_id,
          produk_nama: (produkList || []).find((p) => p.id === item.produk_id)?.nama_produk || 'Unknown',
          kategori: (produkList || []).find((p) => p.id === item.produk_id)?.kategori || 'Unknown'
        }));

        setBarangMasukList(mappedData);
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

  // Handle file upload for import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  // Handle import submit
  const handleImportSubmit = async () => {
    if (!importFile) {
      setMessage({ text: "Silakan pilih file terlebih dahulu", variant: "warning" });
      return;
    }

    setImportLoading(true);
    setMessage(null);

    try {
      // Parse CSV file
      parse(importFile, {
        header: true,
        complete: async (results:  any) => {
          const importData: ImportData[] = results.data
            .filter((item: any) => item.produk_id && item.tanggal_masuk && item.jumlah)
            .map((item: any) => ({
              produk_id: Number(item.produk_id),
              tanggal_masuk: item.tanggal_masuk,
              jumlah: Number(item.jumlah)
            }));

          if (importData.length === 0) {
            setMessage({ text: "Tidak ada data valid yang ditemukan", variant: "warning" });
            return;
          }

          // Send to API
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk/import`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: importData }),
          });

          const result = await res.json();

          if (res.ok) {
            setMessage({ text: `Berhasil mengimpor ${result.data?.length || 0} data barang masuk`, variant: "success" });
            
            // Refresh data
            const masukRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk`);
            const masukData = await masukRes.json();
            
            // Map produk data to barang masuk
            const mappedData = (masukData?.data || []).map((item: any) => ({
              id: item.id,
              tanggal_masuk: item.tanggal_masuk,
              jumlah: item.jumlah,
              produk_id: item.produk_id,
              produk_nama: (produkList || []).find((p) => p.id === item.produk_id)?.nama_produk || 'Unknown',
              kategori: (produkList || []).find((p) => p.id === item.produk_id)?.kategori || 'Unknown'
            }));

            setBarangMasukList(mappedData);
            setFilteredList(mappedData);
            setShowImportModal(false);
            setImportFile(null);
          } else {
            setMessage({ text: result.message || "Gagal mengimpor data", variant: "danger" });
          }
        },
        error: (error : any) => {
          console.error("CSV parsing error:", error);
          setMessage({ text: "Gagal memproses file CSV", variant: "danger" });
        }
      });
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan saat mengimpor", variant: "danger" });
    } finally {
      setImportLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (id: number) => {
    const itemToEdit = barangMasukList.find(item => item.id === id);
    if (itemToEdit) {
      setFormData({
        produk_id: itemToEdit.produk_id,
        tanggal_masuk: itemToEdit.tanggal_masuk,
        jumlah: itemToEdit.jumlah
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ text: "Data barang masuk dihapus", variant: "success" });
        setBarangMasukList(prev => prev.filter(item => item.id !== id));
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
      tanggal_masuk: new Date().toISOString().split('T')[0],
      jumlah: 0
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
        <Card.Header className="d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0">
            <FontAwesomeIcon icon={faBox} className="me-2" />
            Data Barang Masuk
          </h5>
          <div>
            <Button 
              variant="success" 
              onClick={() => setShowImportModal(true)}
              className="me-2"
            >
              <FontAwesomeIcon icon={faFileImport} className="me-2" />
              Import
            </Button>
            <Button 
              variant="primary" 
              onClick={() => setShowModal(true)}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Tambah Barang Masuk
            </Button>
          </div>
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
                  placeholder="Cari berdasarkan nama produk, kategori, atau tanggal..."
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
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Tanggal Masuk</th>
                  <th>Jumlah</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    </td>
                  </tr>
                ) : filteredList.length > 0 ? (
                  filteredList.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.produk_nama}</td>
                      <td>{item.kategori}</td>
                      <td>{formatDate(item.tanggal_masuk)}</td>
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
                    <td colSpan={6} className="text-center py-4">
                      Tidak ada data barang masuk
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
            {editId ? 'Edit Barang Masuk' : 'Tambah Barang Masuk'}
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
              <Form.Label>Tanggal Masuk</Form.Label>
              <Form.Control
                type="date"
                name="tanggal_masuk"
                value={formData.tanggal_masuk}
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

      {/* Import Modal */}
      <Modal show={showImportModal} onHide={() => setShowImportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faFileImport} className="me-2" />
            Import Data Barang Masuk
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>File CSV</Form.Label>
            <Form.Control
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={importLoading}
            />
            <Form.Text muted>
              Format CSV harus mengandung kolom: produk_id, tanggal_masuk, jumlah
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImportModal(false)} disabled={importLoading}>
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Batal
          </Button>
          <Button variant="primary" onClick={handleImportSubmit} disabled={importLoading || !importFile}>
            {importLoading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                Mengimport...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUpload } className="me-2" />
                Import
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}