"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Button, Modal, Form, Alert, Container, Table, InputGroup, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEdit, 
  faTrash, 
  faSave, 
  faTimes, 
  faPlus, 
  faSpinner, 
  faSearch, 
  faBox, 
  faFileImport, 
  faUpload 
} from "@fortawesome/free-solid-svg-icons";
import { parse } from "papaparse";

interface BarangMasuk {
  id: number;
  tanggal_masuk: string;
  jumlah: number;
  produk_id: number;
  produk_nama: string;
  kategori: string;
  masa_exp: string; 
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
  masa_exp?: string;
}

export default function BarangMasukPage() {
  const [barangMasukList, setBarangMasukList] = useState<BarangMasuk[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [filteredList, setFilteredList] = useState<BarangMasuk[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState({
    page: true,
    form: false,
    import: false
  });
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formData, setFormData] = useState<Omit<BarangMasuk, 'id' | 'produk_nama' | 'kategori'>>({ 
    produk_id: 0,
    tanggal_masuk: new Date().toISOString().split('T')[0],
    jumlah: 0,
    masa_exp: ""
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; variant: string } | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Format date to DD-MM-YYYY
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, page: true }));
      
      // Fetch products and incoming items in parallel
      const [produkRes, masukRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk`)
      ]);

      if (!produkRes.ok) throw new Error("Failed to fetch products");
      if (!masukRes.ok) throw new Error("Failed to fetch incoming items");

      const [produkData, masukData] = await Promise.all([
        produkRes.json(),
        masukRes.json()
      ]);

      const produkItems = produkData?.data || [];
      const masukItems = masukData?.data || [];

      // Map product data to incoming items
      const mappedData = masukItems.map((item: any) => {
        const product = produkItems.find((p: any) => p.id === item.produk_id);
        return {
          id: item.id,
          tanggal_masuk: item.tanggal_masuk,
          jumlah: item.jumlah,
          produk_id: item.produk_id,
          masa_exp: item.masa_exp || "",
          produk_nama: product?.nama_produk || 'Unknown',
          kategori: product?.kategori || 'Unknown'
        };
      });

      setProdukList(produkItems);
      setBarangMasukList(mappedData);
      setFilteredList(mappedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ text: "Gagal memuat data", variant: "danger" });
    } finally {
      setLoading(prev => ({ ...prev, page: false }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter data
  useEffect(() => {
    const filtered = barangMasukList.filter(item => {
      const searchLower = searchText.toLowerCase();
      return (
        item.produk_nama.toLowerCase().includes(searchLower) ||
        item.kategori.toLowerCase().includes(searchLower) ||
        formatDate(item.tanggal_masuk).toLowerCase().includes(searchLower) ||
        (item.masa_exp && formatDate(item.masa_exp).toLowerCase().includes(searchLower))
      );
    });
    setFilteredList(filtered);
  }, [searchText, barangMasukList, formatDate]);

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
      const url = editId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk/${editId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk`;
      
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || "Failed to save data");
      }

      setMessage({ 
        text: `Data barang masuk ${editId ? 'diperbarui' : 'ditambahkan'}`, 
        variant: "success" 
      });
      
      await fetchData();
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

    setLoading(prev => ({ ...prev, import: true }));
    setMessage(null);

    try {
      const importData = await new Promise<ImportData[]>((resolve, reject) => {
        parse(importFile, {
          header: true,
          complete: (results: any) => {
            const validData = results.data
              .filter((item: any) => item.produk_id && item.tanggal_masuk && item.jumlah)
              .map((item: any) => ({
                produk_id: Number(item.produk_id),
                tanggal_masuk: item.tanggal_masuk,
                jumlah: Number(item.jumlah),
                masa_exp: item.masa_exp || undefined
              }));

            if (validData.length === 0) {
              reject(new Error("Tidak ada data valid yang ditemukan"));
              return;
            }

            resolve(validData);
          },
          error: (error: any) => {
            reject(new Error("Gagal memproses file CSV"));
          }
        });
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: importData }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || "Gagal mengimpor data");
      }

      const result = await res.json();
      setMessage({ 
        text: `Berhasil mengimpor ${result.data?.length || 0} data barang masuk`, 
        variant: "success" 
      });
      
      await fetchData();
      setShowImportModal(false);
      setImportFile(null);
    } catch (error) {
      console.error("Error:", error);
      setMessage({ 
        text: error instanceof Error ? error.message : "Terjadi kesalahan saat mengimpor", 
        variant: "danger" 
      });
    } finally {
      setLoading(prev => ({ ...prev, import: false }));
    }
  };

  // Handle edit
  const handleEdit = (id: number) => {
    const itemToEdit = barangMasukList.find(item => item.id === id);
    if (itemToEdit) {
      setFormData({
        produk_id: itemToEdit.produk_id,
        tanggal_masuk: itemToEdit.tanggal_masuk,
        jumlah: itemToEdit.jumlah,
        masa_exp: itemToEdit.masa_exp || ""
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barang-masuk/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus data");
      }

      setMessage({ text: "Data barang masuk dihapus", variant: "success" });
      setBarangMasukList(prev => prev.filter(item => item.id !== id));
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
      tanggal_masuk: new Date().toISOString().split('T')[0],
      jumlah: 0,
      masa_exp: ""
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
              disabled={loading.page}
            >
              <FontAwesomeIcon icon={faFileImport} className="me-2" />
              Import
            </Button>
            <Button 
              variant="primary" 
              onClick={() => setShowModal(true)}
              disabled={loading.page}
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
                  disabled={loading.page}
                />
              </InputGroup>
            </Col>
          </Row>

          {/* Data Table */}
          <div className="table-responsive">
            <Table striped bordered hover className="mt-3">
              <thead >
                <tr>
                  <th>No</th>
                  <th>Id transaksi</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Tanggal Masuk</th>
                  <th>Masa Expired</th>
                  <th>Jumlah</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading.page ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
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
                      <td>{item.produk_nama}</td>
                      <td>{item.kategori}</td>
                      <td>{formatDate(item.tanggal_masuk)}</td>
                      <td>{item.masa_exp ? formatDate(item.masa_exp) : '-'}</td>
                      <td>{item.jumlah.toLocaleString()}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="warning" 
                            size="sm"
                            onClick={() => handleEdit(item.id)}
                            title="Edit"
                            disabled={loading.page}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button 
                            variant="danger" 
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
                    <td colSpan={7} className="text-center py-4">
                      {searchText ? "Tidak ada data yang sesuai dengan pencarian" : "Tidak ada data barang masuk"}
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
                disabled={loading.form}
              >
                <option value="">Pilih Produk</option>
                {produkList.map(produk => (
                  <option key={produk.id} value={produk.id}>
                    {produk.nama_produk}
                  </option>
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
              <Form.Label>Tanggal Expired (Opsional)</Form.Label>
              <Form.Control
                type="date"
                name="masa_exp"
                value={formData.masa_exp}
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

      {/* Import Modal */}
      <Modal show={showImportModal} onHide={() => setShowImportModal(false)} backdrop="static">
        <Modal.Header closeButton closeVariant="white" className="bg-success text-white">
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
              disabled={loading.import}
            />
            <Form.Text muted>
              Format CSV harus mengandung kolom: produk_id, tanggal_masuk, jumlah (masa_exp opsional)
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowImportModal(false)} 
            disabled={loading.import}
          >
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Batal
          </Button>
          <Button 
            variant="success" 
            onClick={handleImportSubmit} 
            disabled={loading.import || !importFile}
          >
            {loading.import ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                Mengimport...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUpload} className="me-2" />
                Import
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}