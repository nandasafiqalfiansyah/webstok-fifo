"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface UserData {
  nama: string;
  email: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const [formData, setFormData] = useState<UserData>({ nama: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) {
      setError(true);
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}`);

        if (!response.ok) {
          setError(true);
          return;
        }

        const userData = await response.json();

        // Hanya ambil `nama` & `email`, hapus `password`
        setFormData({
          nama: userData.data?.nama || "",
          email: userData.data?.email || "",
        });
      } catch (error) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Profile updated successfully!");
        router.push(`/profile`);
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      alert("An error occurred while updating profile.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: User not found or failed to load data.</div>;

  return (
    <div className="container">
      <h3 className="card-title mb-4">Edit Profile</h3>
      <div className="card p-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
