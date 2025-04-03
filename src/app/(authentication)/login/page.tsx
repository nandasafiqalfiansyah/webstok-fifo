'use client';

import { Col, Row, Container } from "react-bootstrap";
import { useEffect, useState } from "react";
import LoginForm from "@/app/(authentication)/login/login";
import { SearchParams } from "@/types/next";

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  const { callbackUrl } = searchParams;
  const getCallbackUrl = () => (callbackUrl ? callbackUrl.toString() : "/");

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <Container
      fluid
      className="d-flex align-items-center justify-content-center min-vh-100 bg-light"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1)" : "scale(0.95)",
        transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
      }}

    >
      <Row
        className="shadow-lg rounded-4 overflow-hidden bg-white"
        style={{
          maxWidth: "900px",
          transform: isVisible ? "translateY(0)" : "translateY(30px)",
          transition: "transform 0.8s ease-out",
        }}
      >
        {/* Bagian Kiri - Welcome Message */}
        <Col
          md={5}
          className="bg-primary text-white d-flex align-items-center justify-content-center p-4"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateX(0)" : "translateX(-30px)",
            transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
          }}
        >
          <div className="text-center">
            <h2 className="fw-bold" style={{ animation: "fadeIn 1.5s ease-in-out" }}>
              SELAMAT DATANG
            </h2>
            <p className="fs-5">Sistem Manajemen Stok Toko Kelontong</p>
          </div>
        </Col>

        {/* Bagian Kanan - Login Form */}
        <Col md={7} className="p-5 bg-white">
          <div className="mb-4">
            <h1 className="fw-semibold text-dark">Login</h1>
            <p className="text-muted">Sign in to your account</p>
          </div>
          <LoginForm callbackUrl={getCallbackUrl()} />
        </Col>
      </Row>
    </Container>
  );
}
