"use client";

import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Card, CardBody } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp, faBox, faShoppingCart, faMoneyBillWave } from "@fortawesome/free-solid-svg-icons";

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

  useEffect(() => {
    async function fetchProduk() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/produk`);
        const data = await res.json();

        const produkData = data.data;
        setProdukList(produkData);

        // Hitung total barang masuk & keluar
        const masuk = produkData.reduce((sum: number, produk: Produk) => sum + produk.BarangMasuk.reduce((s, bm) => s + bm.jumlah, 0), 0);
        const keluar = produkData.reduce((sum: number, produk: Produk) => sum + produk.BarangKeluar.reduce((s, bk) => s + bk.jumlah, 0), 0);

        setTotalMasuk(masuk);
        setTotalKeluar(keluar);
        setTotalPenjualan(keluar * produkData.reduce((sum: number, produk: Produk) => sum + produk.harga, 0) / produkData.length);
      } catch (error) {
        console.error("Error fetching produk:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduk();
  }, []);

  const columns = [
    { name: "ID", selector: (row: Produk) => row.id, sortable: true, width: "80px" },
    { name: "Nama Produk", selector: (row: Produk) => row.nama_produk, sortable: true },
    { name: "Kategori", selector: (row: Produk) => row.kategori, sortable: true },
    { name: "Harga", selector: (row: Produk) => row.harga.toLocaleString("id-ID"), sortable: true },
    { name: "Total Keluar", selector: (row: Produk) => row.BarangKeluar.reduce((sum, bk) => sum + bk.jumlah, 0), sortable: true },
  ];

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Dashboard</h3>

      <div className="row mb-4">
        <div className="col-md-4">
          <Card bg="primary" text="white" className="shadow">
            <CardBody className="d-flex justify-content-between align-items-center">
              <div>
                <h5>Total Barang Masuk</h5>
                <h3>{totalMasuk}</h3>
              </div>
              <FontAwesomeIcon icon={faBox} size="2x" />
            </CardBody>
          </Card>
        </div>
        <div className="col-md-4">
          <Card bg="warning" text="white" className="shadow">
            <CardBody className="d-flex justify-content-between align-items-center">
              <div>
                <h5>Total Barang Keluar</h5>
                <h3>{totalKeluar}</h3>
              </div>
              <FontAwesomeIcon icon={faShoppingCart} size="2x" />
            </CardBody>
          </Card>
        </div>
        <div className="col-md-4">
          <Card bg="success" text="white" className="shadow">
            <CardBody className="d-flex justify-content-between align-items-center">
              <div>
                <h5>Total Penjualan</h5>
                <h3>Rp {totalPenjualan.toLocaleString("id-ID")}</h3>
              </div>
              <FontAwesomeIcon icon={faMoneyBillWave} size="2x" />
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="border rounded shadow-sm p-3 bg-white">
        <h4 className="mb-3">Produk Terlaris</h4>
        <DataTable
          columns={columns}
          data={produkList.sort((a, b) => 
            b.BarangKeluar.reduce((sum, bk) => sum + bk.jumlah, 0) - 
            a.BarangKeluar.reduce((sum, bk) => sum + bk.jumlah, 0)
          )}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          responsive
        />
      </div>
    </div>
  );
}
