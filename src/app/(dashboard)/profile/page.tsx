import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/option";

export default async function Profile() {
  const session = await getServerSession(authOptions);

  if (!session) {
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
              <input
                type="text"
                className="form-control"
                value={session.user?.name || "Admin"}
                disabled
              />
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label fw-bold">Email:</label>
              <input
                type="email"
                className="form-control"
                value={session.user?.email || ""}
                disabled
              />
            </div>

            {/* Button Edit Profil */}
            <div className="mt-3">
              <a
                className="btn btn-primary py-2 mb-2 w-100"
                href={`/profile/${session.user?.id}/edit`}
              >
                Edit Profil
              </a>
            </div>
            <hr />

            {/* Button Delete Profil */}
            {/* <div className="mt-3">
              <button className="btn btn-danger py-2 w-100">Delete Profil</button>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
}