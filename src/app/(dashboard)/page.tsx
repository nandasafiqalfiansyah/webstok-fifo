"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, Container, Row, Col, Table, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faShoppingCart, faMoneyBillWave, faTrophy, faChartLine } from "@fortawesome/free-solid-svg-icons";

interface Produk {
  id: number;
  nama_produk: string;
  kategori: string;
  harga: number;
  BarangMasuk: { jumlah: number }[];
  BarangKeluar: { jumlah: number }[];
}

export default function DashboardPage() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [totalMasuk, setTotalMasuk] = useState(0);
  const [totalKeluar, setTotalKeluar] = useState(0);
  const [totalPenjualan, setTotalPenjualan] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastMonthData, setLastMonthData] = useState({
    masuk: 0,
    keluar: 0,
    penjualan: 0
  });

  useEffect(() => {
    async function fetchProduk() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
        const data = await res.json();

        const produkData = data.data;

        if (!Array.isArray(produkData)) {
          alert("Data produk tidak valid");
          return;
        }
        setProdukList(produkData);

        const masuk = produkData.reduce((sum: number, produk: Produk) => sum + produk.BarangMasuk.reduce((s, bm) => s + bm.jumlah, 0), 0);
        const keluar = produkData.reduce((sum: number, produk: Produk) => sum + produk.BarangKeluar.reduce((s, bk) => s + bk.jumlah, 0), 0);
        const penjualan = keluar * produkData.reduce((sum: number, produk: Produk) => sum + produk.harga, 0) / produkData.length;

        setTotalMasuk(masuk);
        setTotalKeluar(keluar);
        setTotalPenjualan(penjualan);

        // Simulasikan data bulan lalu
        setLastMonthData({
          masuk: Math.floor(masuk * 0.88),
          keluar: Math.floor(keluar * 0.92),
          penjualan: Math.floor(penjualan * 0.85)
        });
      } catch (error) {
        console.error("Error fetching produk:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduk();
  }, []);

  // Hitung persentase perubahan
  const calculatePercentage = (current: number, last: number) => {
    if (last === 0) return 0;
    return ((current - last) / last) * 100;
  };

  const masukPercentage = calculatePercentage(totalMasuk, lastMonthData.masuk);
  const keluarPercentage = calculatePercentage(totalKeluar, lastMonthData.keluar);
  const penjualanPercentage = calculatePercentage(totalPenjualan, lastMonthData.penjualan);

  const sortedProduk = [...produkList].sort((a, b) => 
    b.BarangKeluar.reduce((sum, bk) => sum + bk.jumlah, 0) - 
    a.BarangKeluar.reduce((sum, bk) => sum + bk.jumlah, 0)
  );

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Dashboard</h2>
        <div>
          <button className="btn btn-outline-primary me-2">
            <FontAwesomeIcon icon={faChartLine} className="me-2" />
            Laporan
          </button>
          <button className="btn btn-primary">
            <FontAwesomeIcon icon={faTrophy} className="me-2" />
            Produk Terbaik
          </button>
        </div>
      </div>

      <Row className="mb-4 g-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase text-muted mb-2">Total Barang Masuk</h6>
                  <h2 className="mb-0">{totalMasuk}</h2>
                  <small className={masukPercentage >= 0 ? "text-success" : "text-danger"}>
                    <FontAwesomeIcon 
                      icon={faChartLine} 
                      className={`me-1 ${masukPercentage >= 0 ? "fa-rotate-0" : "fa-rotate-180"}`} 
                    />
                    {Math.abs(masukPercentage).toFixed(1)}% dari bulan lalu
                  </small>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <FontAwesomeIcon icon={faBox} size="2x" className="text-primary" />
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase text-muted mb-2">Total Barang Keluar</h6>
                  <h2 className="mb-0">{totalKeluar}</h2>
                  <small className={keluarPercentage >= 0 ? "text-success" : "text-danger"}>
                    <FontAwesomeIcon 
                      icon={faChartLine} 
                      className={`me-1 ${keluarPercentage >= 0 ? "fa-rotate-0" : "fa-rotate-180"}`} 
                    />
                    {Math.abs(keluarPercentage).toFixed(1)}% dari bulan lalu
                  </small>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <FontAwesomeIcon icon={faShoppingCart} size="2x" className="text-warning" />
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase text-muted mb-2">Total Penjualan</h6>
                  <h2 className="mb-0">Rp {totalPenjualan.toLocaleString("id-ID")}</h2>
                  <small className={penjualanPercentage >= 0 ? "text-success" : "text-danger"}>
                    <FontAwesomeIcon 
                      icon={faChartLine} 
                      className={`me-1 ${penjualanPercentage >= 0 ? "fa-rotate-0" : "fa-rotate-180"}`} 
                    />
                    {Math.abs(penjualanPercentage).toFixed(1)}% dari bulan lalu
                  </small>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <FontAwesomeIcon icon={faMoneyBillWave} size="2x" className="text-success" />
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <CardBody className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">
              <FontAwesomeIcon icon={faTrophy} className="text-warning me-2" />
              Produk Terlaris
            </h4>
            <div>
              <Form.Select size="sm" style={{ width: 'auto' }}>
                <option>10 Teratas</option>
                <option>Semua Produk</option>
              </Form.Select>
            </div>
          </div>
          
          <div className="table-responsive">
            <Table striped bordered hover responsive>
              <thead className="bg-light">
                <tr>
                  <th style={{ width: "60px" }}>No</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Total Keluar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedProduk.slice(0, 10).map((produk, index) => (
                    <tr key={produk.id}>
                      <td>{index + 1}</td>
                      <td>{produk.nama_produk}</td>
                      <td>{produk.kategori}</td>
                      <td>Rp {produk.harga.toLocaleString("id-ID")}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="badge bg-success me-2">
                            {produk.BarangKeluar.reduce((sum, bk) => sum + bk.jumlah, 0)}
                          </span>
                          <small className="text-muted">
                          
                          
                            {(
                              (produk.BarangKeluar.reduce((sum, bk) => sum + bk.jumlah, 0) / 
                              produkList.reduce((sum, p) => sum + p.BarangKeluar.reduce((s, bk) => s + bk.jumlah, 0), 0) * 100)
                            ).toFixed(1)}% 

                        
                          </small>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>
    </Container>
  );
}