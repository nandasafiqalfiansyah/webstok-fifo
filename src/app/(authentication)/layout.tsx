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
        backgroundImage: 'url("https://i.pinimg.com/736x/65/d6/b6/65d6b6447e454e4d6a45a4e056d5cb6e.jpg")', 
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