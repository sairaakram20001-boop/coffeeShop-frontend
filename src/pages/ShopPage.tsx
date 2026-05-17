import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'
import Button from '../components/Button'
import { resolveImageUrl } from '../services/api'

type Product = {
  id: number
  name: string
  price: number
  imageUrl?: string
  imageURL?: string
  ImageUrl?: string
  stockQuantity: number
  categoryId: number
  category?: { id: number; name: string }
}

type Category = { id: number; name: string }
type OrderLocationState = { orderSuccess?: boolean; orderMessage?: string } | null
const fallbackImage = 'https://images.unsplash.com/photo-1518057111178-44a106bad636?auto=format&fit=crop&w=900&q=80'

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { addToCart, refreshCart, setIsOpen } = useCart()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [showThanksDialog, setShowThanksDialog] = useState(
    Boolean((location.state as { orderSuccess?: boolean } | null)?.orderSuccess),
  )
  const [dialogMessage, setDialogMessage] = useState(
    (location.state as OrderLocationState)?.orderMessage ?? 'Thanks for your order.',
  )

  const loadShopData = useCallback(async () => {
    try {
      const [productRes, categoryRes] = await Promise.all([api.get('/api/product'), api.get('/api/category')])
      const mappedProducts = ((productRes.data ?? []) as Product[]).map((product) => ({
        ...product,
        imageUrl: product.imageUrl ?? product.imageURL ?? product.ImageUrl,
      }))
      setProducts(mappedProducts)
      setCategories(categoryRes.data ?? [])
    } catch {
      setProducts([])
      setCategories([])
    }
  }, [])

  useEffect(() => {
    loadShopData()
  }, [loadShopData])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (!categoryParam) {
      setSelectedCategory('all')
      return
    }
    const parsed = Number(categoryParam)
    setSelectedCategory(Number.isNaN(parsed) ? 'all' : parsed)
  }, [searchParams])

  useEffect(() => {
    const orderState = location.state as OrderLocationState
    if (!orderState?.orderSuccess) return

    setDialogMessage(orderState.orderMessage ?? 'Thanks for your order.')
    setShowThanksDialog(true)
    loadShopData()
  }, [location.key, location.state, loadShopData])

  const q = (searchParams.get('q') ?? '').toLowerCase()

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const passCategory = selectedCategory === 'all' || product.categoryId === selectedCategory
      const passSearch = q.length === 0 || product.name.toLowerCase().includes(q)
      return passCategory && passSearch
    })
  }, [products, selectedCategory, q])

  const selectedCategoryLabel =
    selectedCategory === 'all'
      ? 'All Products'
      : categories.find((category) => category.id === selectedCategory)?.name ?? 'Selected Category'

  const onAdd = async (productId: number) => {
    try {
      await addToCart(productId)
      notify('Added to cart', 'success')
      setIsOpen(true)
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
        navigate('/login', { state: { from: '/checkout', message: 'Please login to complete your order.' } })
      }
    }
  }

  const onView = (productId: number) => {
    navigate(`/shop/product/${productId}`)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-8">
      <section className="mx-auto max-w-4xl text-center">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--rosewood)]/80">Artisanal Craft</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold text-[var(--ink)] md:text-6xl">The Heritage Collection</h1>
        <p className="mx-auto mt-4 max-w-2xl font-serif text-2xl italic leading-10 text-[var(--rosewood)]/85">
          Curated selections from our roasting house to your home, crafted with time-honored traditions.
        </p>
      </section>

      <section className="mt-10">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <h2 className="font-serif text-5xl text-[var(--ink)]">{selectedCategoryLabel}</h2>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--rosewood)]">{filteredProducts.length} Items</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article key={product.id} className="group">
              <button onClick={() => onView(product.id)} className="block w-full text-left">
                <img
                  src={resolveImageUrl(product.imageUrl) || fallbackImage}
                  alt={product.name}
                  className="h-[340px] w-full object-cover transition duration-300 group-hover:brightness-95"
                  loading="lazy"
                />
              </button>
              <div className="mt-3 flex items-start justify-between gap-3">
                <h3 className="font-serif text-[42px] leading-[0.95] text-[var(--ink)]">{product.name}</h3>
                <p className="pt-2 text-lg font-semibold text-[var(--ink)]">${product.price.toFixed(2)}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--rosewood)]/90">
                {(product as { description?: string }).description?.trim() ||
                  'A concentrated burst of bold flavor, crafted in small batches for a rich finish.'}
              </p>
              <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rosewood)]/85">
                <p>In Stock: {product.stockQuantity ?? 0} Units</p>
                <button onClick={() => onAdd(product.id)} className="text-[var(--ink)] hover:opacity-80">
                  Add To Cart +
                </button>
              </div>
            </article>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <p className="mt-8 rounded-2xl bg-white/80 p-5 text-[var(--rosewood)]">No products available in this collection.</p>
        )}
      </section>

      <section className="mt-16 border-t border-[var(--stone)]/40 pt-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="font-serif text-2xl text-[var(--ink)]">TIM HORTONS</h3>
            <p className="mt-3 text-sm text-[var(--rosewood)]/90">Modern heritage. Artisanal quality since 1964.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--rosewood)]/85">Navigation</p>
            <div className="mt-3 space-y-2 text-sm text-[var(--ink)]">
              <p>Menu</p>
              <p>Rewards</p>
              <p>Our Story</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--rosewood)]/85">Support</p>
            <div className="mt-3 space-y-2 text-sm text-[var(--ink)]">
              <p>Contact Us</p>
              <p>FAQs</p>
              <p>Privacy Policy</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--rosewood)]/85">Newsletter</p>
            <p className="mt-3 text-sm text-[var(--rosewood)]/90">Receive updates for seasonal releases and tastings.</p>
            <input className="input mt-3" placeholder="Email Address" />
            <button className="mt-2 w-full rounded-xl border border-[var(--ink)]/30 bg-white py-2 text-sm font-semibold text-[var(--ink)]">
              Subscribe
            </button>
          </div>
        </div>
      </section>
      {showThanksDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
            <h2 className="text-2xl font-black text-[var(--ink)]">Thanks for your order</h2>
            <p className="mt-2 text-[var(--rosewood)]/90">{dialogMessage}</p>
            <Button
              className="mt-5 w-full"
              onClick={() => {
                setShowThanksDialog(false)
                navigate('/shop', { replace: true, state: null })
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
