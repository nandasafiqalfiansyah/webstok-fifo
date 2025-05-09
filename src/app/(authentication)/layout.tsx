'use client';
import { Container } from 'react-bootstrap';
import React from 'react';
import { motion } from 'framer-motion';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="min-vh-100 d-flex flex-row align-items-center"
      initial={{ background: 'linear-gradient(135deg, #1e88e5 0%, #0d47a1 50%)' }}
      animate={{
        background: [
          'linear-gradient(135deg, #1e88e5 0%, #0d47a1 50%)', // Biru muda ke biru tua
          'linear-gradient(135deg, #0d47a1 0%, #1976d2 50%)', // Biru tua ke biru medium
          'linear-gradient(135deg, #1976d2 0%, #1e88e5 50%)', // Biru medium ke biru muda
        ],
      }}
      transition={{
        duration: 15, // Diperlambat untuk efek yang lebih tenang
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        backgroundSize: '200% 200%', // Untuk efek pergeseran yang lebih smooth
      }}
    >
      <Container>{children}</Container>
    </motion.div>
  );
}