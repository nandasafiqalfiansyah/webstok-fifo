import React from 'react'
import { Container } from 'react-bootstrap'

export default function Footer() {
  return (
    <footer className="footer border-top px-sm-2 py-2">
      <Container fluid className="text-center align-items-center flex-column flex-md-row d-flex justify-content-between">
        <div>
          Syeda Aliya Bukhari © {new Date().getFullYear()}
        </div>
        <div className="ms-md-auto">
          versi&nbsp;
          <a
            className="text-decoration-none"
            href="@app/ui/dashboard/AdminLayout"
          >
           0.1
          </a>
        </div>
      </Container>
    </footer>
  )
}
