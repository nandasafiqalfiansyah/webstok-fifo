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
    <div className="position-relative min-vh-100 overflow-hidden">
      <Container
        fluid
        className="d-flex align-items-center justify-content-center min-vh-100 position-relative p-3"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1)" : "scale(0.95)",
          transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
        }}
      >
        <Row
          className="shadow-lg rounded-4 overflow-hidden w-100"
          style={{
            maxWidth: "800px",
            transform: isVisible ? "translateY(0)" : "translateY(30px)",
            transition: "transform 0.8s ease-out",
          }}
        >
          {/* Left Side - Welcome Message */}
          <Col
            md={5}
            className="text-white d-flex align-items-center justify-content-center p-4 p-md-5 position-relative"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateX(0)" : "translateX(-30px)",
              transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
              minHeight: "200px"
            }}
          >
            <div className="text-center position-relative z-index-1">
              <h2 className="fw-bold mb-3" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}>
                SELAMAT DATANG
              </h2>
              <p className="fs-5 mb-0" style={{ fontSize: "clamp(1rem, 1.5vw, 1.25rem)" }}>
                Sistem Manajemen Stok <br /> Toko Kelontong Anda
              </p>
            </div>
            <div className="position-absolute bottom-0 end-0 p-3">
              <small className="text-white-50">v1.0.0</small>
            </div>
          </Col>

          {/* Right Side - Login Form */}
          <Col 
            md={7} 
            className="p-4 p-md-5 bg-white"
            style={{
              backdropFilter: "blur(5px)",
              backgroundColor: "rgba(255, 255, 255, 0.95)"
            }}
          >
            <div className="mb-4 mb-md-5">
              <h1 className="fw-semibold text-dark mb-2 mb-md-3" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}>
                Masuk ke Akun
              </h1>
              <p className="text-dark">Kelola stok toko kelontong Anda</p>
            </div>
            <LoginForm callbackUrl={getCallbackUrl()} />
          </Col>
        </Row>
      </Container>
    </div>
  );
}