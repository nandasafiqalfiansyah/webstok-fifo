"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, Button, Form, Alert, Container, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSave, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

interface UserData {
  id: number;
  nama: string;
  email: string;
  role: string;
}

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  
  const [formData, setFormData] = useState<UserData>({ 
    id: 0,
    nama: "", 
    email: "", 
    role: "" 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState<{ text: string; variant: string } | null>(null);

  useEffect(() => {
    if (!userId) {
      setError(true);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const userData = await response.json();
        setFormData({
          id: userData?.id || 0,
          nama: userData?.nama || "",
          email: userData?.email || "",
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          nama: formData.nama,
          email: formData.email
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ text: "Profil berhasil diperbarui", variant: "success" });
        setTimeout(() => router.push("/profile"), 1500);
      } else {
        setMessage({ text: result.message || "Gagal memperbarui profil", variant: "danger" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan saat memperbarui profil", variant: "danger" });
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Error: Pengguna tidak ditemukan atau gagal memuat data.
        </Alert>
        <Button variant="secondary" onClick={() => router.back()}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Kembali
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {message && (
        <Alert variant={message.variant} onClose={() => setMessage(null)} dismissible>
          {message.text}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FontAwesomeIcon icon={faUser} className="me-2" />
          Edit Profil
        </h2>
        <Button variant="outline-secondary" onClick={() => router.back()}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Kembali
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nama Lengkap</Form.Label>
              <Form.Control
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Form.Group>


            <div className="d-grid gap-2">
              <Button variant="primary" type="submit">
                <FontAwesomeIcon icon={faSave} className="me-2" />
                Simpan Perubahan
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}