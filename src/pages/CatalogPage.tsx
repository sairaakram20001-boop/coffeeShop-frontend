import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'
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

type Props = {
  title: string
  subtitle: string
  categoryKeywords: string[]
}
const fallbackImage = 'https://images.unsplash.com/photo-1518057111178-44a106bad636?auto=format&fit=crop&w=900&q=80'

export default function CatalogPage({ title, subtitle, categoryKeywords }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const { addToCart, setIsOpen } = useCart()
  const { notify } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get('/api/product')
      .then((res) => {
        const mappedProducts = ((res.data ?? []) as Product[]).map((product) => ({
          ...product,
          imageUrl: product.imageUrl ?? product.imageURL ?? product.ImageUrl,
        }))
        setProducts(mappedProducts)
      })
      .catch(() => setProducts([]))
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const name = (product.category?.name ?? '').toLowerCase()
      return categoryKeywords.some((keyword) => name.includes(keyword.toLowerCase()))
    })
  }, [products, categoryKeywords])

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

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-10">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--rosewood)]/80">Seasonal Selection</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold text-[var(--ink)]">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl font-serif text-lg italic leading-8 text-[var(--rosewood)]/85">{subtitle}</p>
      </section>
      <section className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <article key={product.id} className="group">
            <button onClick={() => navigate(`/shop/product/${product.id}`)} className="block w-full text-left">
              <img
                src={resolveImageUrl(product.imageUrl) || fallbackImage}
                alt={product.name}
                className="h-[320px] w-full object-cover transition duration-300 group-hover:brightness-95"
                loading="lazy"
              />
            </button>
            <div className="mt-3 flex items-start justify-between gap-3">
              <h3 className="font-serif text-[38px] leading-[0.95] text-[var(--ink)]">{product.name}</h3>
              <p className="pt-2 text-lg font-semibold text-[var(--ink)]">${product.price.toFixed(2)}</p>
            </div>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rosewood)]/85">
              In Stock: {product.stockQuantity ?? 0} Units
            </p>
            <button onClick={() => onAdd(product.id)} className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink)]">
              Add To Cart +
            </button>
          </article>
        ))}
      </section>
      {filteredProducts.length === 0 && (
        <p className="mt-8 rounded-2xl bg-white p-5 text-[var(--rosewood)]">No products available in this catalog yet.</p>
      )}
    </main>
  )
}
