"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, Button, Form, Alert, Container, Spinner, Modal, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, 
  faLock, 
  faEdit, 
  faArrowLeft, 
  faTrash, 
  faPlus,
  faSync
} from "@fortawesome/free-solid-svg-icons";

interface UserData {
  id: number;
  nama: string;
  email: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserFormData {
  email: string;
  password: string;
  nama: string;
}

interface UserList {
  id: number;
  nama: string;
  email: string;
  role?: string; // tambahkan ini
}

export default function Profile() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState<UserData>({ 
    id: 0, 
    nama: "", 
    email: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [userFormData, setUserFormData] = useState<UserFormData>({
    email: "",
    password: "",
    nama: ""
  });
  const [userList, setUserList] = useState<UserList[]>([]);
  const [message, setMessage] = useState<{ text: string; variant: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUserData = async () => {
    try {
      if (status !== "authenticated" || !session?.user?.email) {
        setError(true);
        return;
      }

      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${session.user.id}`, {
        cache: "no-store",
      });

      if (!userRes.ok) {
        throw new Error(`HTTP error! Status: ${userRes.status}`);
      }

      const userData = await userRes.json();
      setFormData({
        id: userData?.id || 0,
        nama: userData?.nama || "",
        email: userData?.email || ""
      });

      await fetchUserList();
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserList = async () => {
    setIsRefreshing(true);
    try {
      const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
        cache: "no-store",
      });

      if (!usersRes.ok) {
        throw new Error(`HTTP error! Status: ${usersRes.status}`);
      }
      const usersData = await usersRes.json();
      setUserList(usersData || []);
    } catch (error) {
      setMessage({ text: "Gagal memuat daftar pengguna" , variant: "danger" });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchUserList();
  }, [session, status]);

  const handleResetPassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: "Password baru tidak cocok", variant: "danger" });
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reset-pass`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: formData.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ text: "Password berhasil diubah", variant: "success" });
        setShowResetModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        setMessage({ text: result.message || "Gagal mengubah password", variant: "danger" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan", variant: "danger" });
    }
  };

  const handleAddUser = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama: userFormData.nama,
          email: userFormData.email,
          password: userFormData.password,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ text: "Pengguna berhasil ditambahkan", variant: "success" });
        setShowUserModal(false);
        setUserFormData({
          email: "",
          password: "",
          nama: ""
        });
        await fetchUserList();
      } else {
        setMessage({ text: result.message || "Gagal menambahkan pengguna", variant: "danger" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan", variant: "danger" });
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ text: "Pengguna berhasil dihapus", variant: "success" });
        await fetchUserList();
      } else {
        const result = await res.json();
        setMessage({ text: result.message || "Gagal menghapus pengguna", variant: "danger" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Terjadi kesalahan", variant: "danger" });
    }
  };

  if (status === "loading" || loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
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
          Profil Pengguna
        </h2>
        <Button variant="outline-secondary" href="/">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Kembali
        </Button>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="row">
            <div className="col-md-6">
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Nama Lengkap</Form.Label>
                  <Form.Control type="text" value={formData.nama} disabled />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Email</Form.Label>
                  <Form.Control type="email" value={formData.email} disabled />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button variant="primary" href={`/profile/${formData.id}/edit`}>
                    <FontAwesomeIcon icon={faEdit} className="me-2" />
                    Edit Profil
                  </Button>
                  <Button variant="warning" onClick={() => setShowResetModal(true)}>
                    <FontAwesomeIcon icon={faLock} className="me-2" />
                    Reset Password
                  </Button>
                </div>
              </Form>
            </div>
            <div className="col-md-6">
              <Card className="border-1">
                <Card.Body>
                  <h5>Manajemen Pengguna</h5>
                  <p className="text-muted">Fitur manajemen pengguna sistem</p>
                  <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={() => setShowUserModal(true)}>
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      Tambah Pengguna
                    </Button>
                    <Button variant="outline-secondary" onClick={fetchUserList} disabled={isRefreshing}>
                      <FontAwesomeIcon icon={faSync} className={isRefreshing ? "fa-spin me-2" : "me-2"} />
                      {isRefreshing ? "Memuat..." : "Refresh"}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* User List Table */}
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="mb-0">
              Daftar Pengguna
            </h5>
            <div className="text-muted">
              Total: {userList.length} Pengguna
            </div>
          </div>
          
          {userList.length > 0 ? (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map((user, index) => (
                    <tr key={user.id}>
                      <td>{index + 1}</td>
                      <td>{user.nama}</td>
                      <td>{user.email}</td>
                      <td className="text-center">
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === formData.id}
                          title={user.id === formData.id ? "Tidak dapat menghapus akun sendiri" : "Hapus pengguna"}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="info">
              Tidak ada data pengguna
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Reset Password Modal */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faLock} className="me-2" />
            Reset Password
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Password Saat Ini</Form.Label>
              <Form.Control 
                type="password" 
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                required
                placeholder="Masukkan password saat ini"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password Baru</Form.Label>
              <Form.Control 
                type="password" 
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                required
                placeholder="Masukkan password baru"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Konfirmasi Password Baru</Form.Label>
              <Form.Control 
                type="password" 
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                required
                placeholder="Konfirmasi password baru"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleResetPassword}>
            Simpan Password Baru
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add User Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Tambah Pengguna Baru
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nama Lengkap</Form.Label>
              <Form.Control 
                type="text" 
                value={userFormData.nama}
                onChange={(e) => setUserFormData({...userFormData, nama: e.target.value})}
                required
                placeholder="Masukkan nama lengkap"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                value={userFormData.email}
                onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                required
                placeholder="Masukkan email"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                value={userFormData.password}
                onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                required
                placeholder="Masukkan password"
              />
              <Form.Text className="text-muted">
                Password minimal 8 karakter
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleAddUser}>
            Tambah Pengguna
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}