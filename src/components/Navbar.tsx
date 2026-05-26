import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, Menu, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import api from '../services/api'

type Category = { id: number; name: string }
type Product = { categoryId?: number; CategoryId?: number }

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth()
  const { items, setIsOpen } = useCart()
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [categoryCounts, setCategoryCounts] = useState<Record<number, number>>({})
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get('/api/category')
      .then((categoryRes) => {
        setCategories((categoryRes.data ?? []) as Category[])
      })
      .catch(() => {
        setCategories([])
      })

    api
      .get('/api/product')
      .then((productRes) => {
        const fetchedProducts = (productRes.data ?? []) as Product[]
        const nextCounts: Record<number, number> = {}

        fetchedProducts.forEach((product) => {
          const categoryId = product.categoryId ?? product.CategoryId
          if (typeof categoryId === 'number') {
            nextCounts[categoryId] = (nextCounts[categoryId] ?? 0) + 1
          }
        })

        setCategoryCounts(nextCounts)
        setTotalProducts(fetchedProducts.length)
      })
      .catch(() => {
        setCategoryCounts({})
        setTotalProducts(0)
      })
  }, [])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault()
    navigate(`/shop?q=${encodeURIComponent(search)}`)
  }

  const drawerUi = (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/45 backdrop-blur-[1px] transition-opacity ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={`fixed left-0 top-0 z-[70] h-dvh w-[min(90vw,420px)] overflow-y-auto border-r border-[var(--stone)]/40 bg-[#efe6da] p-6 shadow-xl transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--rosewood)]/85">Shop</p>
            <h2 className="font-serif text-3xl font-semibold text-[var(--ink)]">TIM HORTONS</h2>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="rounded-lg border border-[var(--stone)]/60 p-2 text-[var(--ink)]"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--rosewood)]/85">Collections</p>
        <div className="mt-4 space-y-2">
          <button
            onClick={() => {
              setDrawerOpen(false)
              navigate('/shop')
            }}
            className="flex w-full items-center justify-between text-left text-lg font-semibold text-[var(--ink)]"
          >
            <span>All Items</span>
            <span className="text-xs">{totalProducts}</span>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setDrawerOpen(false)
                navigate(`/shop?category=${category.id}`)
              }}
              className="flex w-full items-center justify-between text-left text-lg text-[var(--rosewood)]/90"
            >
              <span>{category.name}</span>
              <span className="text-xs">{categoryCounts[category.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  )

  return (
    <>
      {typeof document !== 'undefined' ? createPortal(drawerUi, document.body) : null}
      <header className="sticky top-0 z-40 border-b border-[var(--stone)]/40 bg-[#efe6da]/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--stone)]/60 bg-white p-2.5 text-[var(--ink)] shadow-sm"
            aria-label="Open collections menu"
          >
            <Menu size={18} />
          </button>
          <Link to="/" className="font-serif text-3xl font-semibold text-[var(--ink)]">TIM HORTONS</Link>
          <div className="hidden items-center gap-4 text-sm font-semibold text-[var(--ink)] md:flex">
            <Link to="/">Home</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/menu/coffee">Coffee</Link>
            <Link to="/catalog/drinks">Drinks</Link>
            <Link to="/catalog/desserts">Desserts</Link>
            <Link to="/checkout">Checkout</Link>
            {isAuthenticated && <Link to="/orders">Orders</Link>}
          </div>
          <form onSubmit={onSearch} className="ml-auto hidden items-center rounded-full border border-[var(--stone)]/50 bg-white px-3 md:flex">
            <Search size={16} className="text-[var(--rosewood)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="w-40 bg-transparent px-2 py-2 text-sm outline-none"
            />
          </form>
          <button onClick={() => setIsOpen(true)} className="relative rounded-full border border-[var(--stone)]/50 p-2">
            <ShoppingCart size={18} className="text-[var(--ink)]" />
            {items.length > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-[var(--rosewood)] px-1.5 text-[10px] font-bold text-[var(--porcelain)]">
                {items.length}
              </span>
            )}
          </button>
          {isAuthenticated ? (
            <Button variant="secondary" onClick={logout}>Logout</Button>
          ) : (
            <Button variant="secondary" onClick={() => navigate('/login')}>Login</Button>
          )}
        </nav>
      </header>
    </>
  )
}
