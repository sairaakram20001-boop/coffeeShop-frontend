import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import LoginPage from './pages/LoginPage'
import CheckoutPage from './pages/CheckoutPage'
import ProductDetailsPage from './pages/ProductDetailsPage'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ToastProvider } from './contexts/ToastContext'
import CartDrawer from './components/CartDrawer'
import CoffeeMenuPage from './pages/CoffeeMenuPage'
import DrinksCatalogPage from './pages/DrinksCatalogPage'
import DessertsCatalogPage from './pages/DessertsCatalogPage'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen bg-[var(--porcelain)]">
              <Navbar />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/shop/product/:id" element={<ProductDetailsPage />} />
                <Route path="/menu/coffee" element={<CoffeeMenuPage />} />
                <Route path="/catalog/drinks" element={<DrinksCatalogPage />} />
                <Route path="/catalog/desserts" element={<DessertsCatalogPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <CartDrawer />
            </div>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
