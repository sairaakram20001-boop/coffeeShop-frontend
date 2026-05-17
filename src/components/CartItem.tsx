import type { CartItem as CartItemType } from '../contexts/CartContext'
import Button from './Button'
import { resolveImageUrl } from '../services/api'

type Props = {
  item: CartItemType
  onRemove: (id: number) => void
  onChangeQuantity: (id: number, delta: 1 | -1) => void
  isUpdating?: boolean
}

export default function CartItem({ item, onRemove, onChangeQuantity, isUpdating = false }: Props) {
  const fallbackImage = 'https://images.unsplash.com/photo-1518057111178-44a106bad636?auto=format&fit=crop&w=600&q=80'

  return (
    <div className="rounded-2xl border border-amber-100 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={resolveImageUrl(item.imageUrl) || fallbackImage}
            alt={item.productName}
            className="h-16 w-16 rounded-xl object-cover"
            loading="lazy"
          />
          <div>
          <p className="font-semibold text-[var(--ink)]">{item.productName}</p>
          <p className="text-xs text-amber-900/70">Qty {item.quantity} x ${item.price.toFixed(2)}</p>
          <div className="mt-2 inline-flex items-center rounded-full border border-[var(--stone)]/70 bg-white px-1 py-1">
            <button
              onClick={() => onChangeQuantity(item.id, -1)}
              disabled={item.quantity <= 1 || isUpdating}
              className="h-7 w-7 rounded-full text-base font-bold text-[var(--ink)] hover:bg-[var(--porcelain)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              -
            </button>
            <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
            <button
              onClick={() => onChangeQuantity(item.id, 1)}
              disabled={isUpdating}
              className="h-7 w-7 rounded-full text-base font-bold text-[var(--ink)] hover:bg-[var(--porcelain)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>
          </div>
        </div>
        <p className="font-bold text-[var(--ink)]">${item.total.toFixed(2)}</p>
      </div>
      <Button variant="ghost" className="mt-2 w-full" onClick={() => onRemove(item.id)} disabled={isUpdating}>
        Remove
      </Button>
    </div>
  )
}

