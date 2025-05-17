'use client';
import { Container } from 'react-bootstrap';
import React from 'react';
import { motion } from 'framer-motion';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="min-vh-100 d-flex flex-row align-items-center position-relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1578916171728-46686eac8d58")', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1,
        }}
      />
      <Container style={{ zIndex: 2 }}>{children}</Container>
    </motion.div>
  );
}