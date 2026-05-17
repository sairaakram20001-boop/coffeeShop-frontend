import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import api, { resolveImageUrl } from '../services/api'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'

type Product = {
  id: number
  name: string
  title?: string
  description?: string
  price: number
  imageUrl?: string
  imageURL?: string
  ImageUrl?: string
  stockQuantity?: number
  stock?: number
  category?: { id: number; name: string }
}

const fallbackImage = 'https://images.unsplash.com/photo-1518057111178-44a106bad636?auto=format&fit=crop&w=1200&q=80'

export default function ProductDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, setIsOpen } = useCart()
  const { notify } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    api
      .get(`/api/product/${id}`)
      .then((res) => {
        const p = (res.data ?? {}) as Product
        setProduct({
          ...p,
          imageUrl: p.imageUrl ?? p.imageURL ?? p.ImageUrl,
        })
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  const imageSrc = useMemo(() => resolveImageUrl(product?.imageUrl) || fallbackImage, [product?.imageUrl])
  const availableStock = product?.stockQuantity ?? product?.stock ?? 0
  const maxQuantity = Math.max(1, availableStock)

  useEffect(() => {
    setQuantity((prev) => Math.min(Math.max(1, prev), maxQuantity))
  }, [maxQuantity])

  const onAdd = async () => {
    if (!product) return
    try {
      await addToCart(product.id, quantity)
      notify('Added to cart', 'success')
      setIsOpen(true)
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
        navigate('/login', { state: { from: `/shop/product/${product.id}`, message: 'Please login to continue.' } })
      }
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        <p className="rounded-2xl bg-white p-5 text-[var(--rosewood)]">Loading product...</p>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        <p className="rounded-2xl bg-white p-5 text-[var(--rosewood)]">Product not found.</p>
        <Button className="mt-4" onClick={() => navigate('/shop')}>
          Back to Shop
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">
      <button
        onClick={() => navigate('/shop')}
        className="mb-5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-sm"
      >
        Back to Shop
      </button>

      <section className="grid gap-6 rounded-3xl border border-[var(--stone)]/40 bg-white/90 p-5 shadow-sm md:grid-cols-2 md:p-8">
        <img src={imageSrc} alt={product.name} className="h-80 w-full rounded-2xl object-cover md:h-[460px]" />

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--rosewood)]/80">
            {product.category?.name ?? 'Coffee'}
          </p>
          <h1 className="mt-2 font-serif text-6xl leading-none text-[var(--ink)]">{product.name}</h1>
          <p className="mt-3 text-3xl font-black text-[var(--rosewood)]">${product.price.toFixed(2)}</p>
          <p className="mt-2 text-sm text-[var(--rosewood)]/90">Stock: {availableStock}</p>
          <p className="mt-5 leading-7 text-[var(--ink)]/85">
            {product.description?.trim() || 'Freshly prepared and crafted for rich flavor in every sip.'}
          </p>
          <div className="mt-6 flex flex-col items-start gap-4">
            <div className="inline-flex items-center rounded-full border border-[var(--stone)]/70 bg-white px-1 py-1">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
                className="h-8 w-8 rounded-full text-base font-bold text-[var(--ink)] hover:bg-[var(--porcelain)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                -
              </button>
              <span className="min-w-10 text-center text-sm font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity((prev) => Math.min(maxQuantity, prev + 1))}
                disabled={quantity >= maxQuantity}
                className="h-8 w-8 rounded-full text-base font-bold text-[var(--ink)] hover:bg-[var(--porcelain)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>
            <Button className="w-full md:w-auto" onClick={onAdd} disabled={availableStock <= 0}>
              Add to Cart
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
