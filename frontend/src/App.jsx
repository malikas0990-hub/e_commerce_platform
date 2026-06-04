import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import CustomerPanel from './pages/CustomerPanel.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/account"
            element={<ProtectedRoute roles={['customer', 'admin', 'manager']}><CustomerPanel /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<ProtectedRoute roles={['admin', 'manager']}><AdminDashboard /></ProtectedRoute>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
