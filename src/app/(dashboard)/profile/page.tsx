"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface UserData {
  id : number;
  nama: string;
  email: string;
}

export default function Profile() {
  const [formData, setFormData] = useState<UserData>({id: 0, nama: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {

    const fetchUserData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/1`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const userData = await res.json();
        setFormData({
          id: userData.data?.id || 0,
          nama: userData.data?.nama || "",
          email: userData.data?.email || "",
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (status === "loading" || loading) return <div>Loading...</div>;
  if (error) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <h2 className="text-danger">Anda belum login.</h2>
      </div>
    );
  }

  return (
    <div className="container align-items-center">
      <h3 className="card-title mb-4">Profil</h3>
      <div className="card p-4" style={{ maxWidth: "100%", width: "100%" }}>
        <div className="card-body">
          <form>
            {/* Nama */}
            <div className="mb-3">
              <label className="form-label fw-bold">Nama:</label>
              <input type="text" className="form-control" value={formData.nama} disabled />
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label fw-bold">Email:</label>
              <input type="email" className="form-control" value={formData.email} disabled />
            </div>

            {/* Button Edit Profil */}
            <div className="mt-3">
              <a className="btn btn-primary py-2 mb-2 w-100" href={`/profile/${formData.id}/edit`}>
                Edit Profil
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
