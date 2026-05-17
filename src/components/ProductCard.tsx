import { motion } from 'framer-motion'
import Button from './Button'
import { resolveImageUrl } from '../services/api'

type Product = {
  id: number
  name: string
  price: number
  imageUrl?: string
  imageURL?: string
  ImageUrl?: string
  category?: { name?: string }
  stockQuantity?: number
}

type Props = {
  product: Product
  onAdd: (productId: number) => void
  onView?: (productId: number) => void
}

const fallbackImage = 'https://images.unsplash.com/photo-1518057111178-44a106bad636?auto=format&fit=crop&w=900&q=80'

export default function ProductCard({ product, onAdd, onView }: Props) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      onClick={() => onView?.(product.id)}
      className={`overflow-hidden rounded-3xl border border-[var(--stone)]/40 bg-white/90 shadow-sm ${onView ? 'cursor-pointer' : ''}`}
    >
      <img
        src={resolveImageUrl(product.imageUrl ?? product.imageURL ?? product.ImageUrl) || fallbackImage}
        alt={product.name}
        className="h-44 w-full object-cover"
        loading="lazy"
      />
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--rosewood)]/80">{product.category?.name ?? 'Coffee'}</p>
        <h3 className="mt-2 text-xl font-bold text-[var(--ink)]">{product.name}</h3>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--rosewood)]/80">Stock: {product.stockQuantity ?? 0}</p>
            <p className="text-2xl font-black text-[var(--rosewood)]">${product.price.toFixed(2)}</p>
          </div>
          <Button
            onClick={(event) => {
              event.stopPropagation()
              onAdd(product.id)
            }}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </motion.article>
  )
}
