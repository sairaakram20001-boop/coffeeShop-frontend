import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import api from '../services/api'

type Category = { id: number; name: string }

const banners = [
  {
    title: 'Freshly Roasted Coffee',
    text: 'Small-batch roasts, smooth flavors, and warm cafe vibes in every cup.',
    image:
      'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Top Milk Shakes',
    text: 'Creamy coffee shakes and cold specials for your afternoon cravings.',
    image: '/shake-slider.jpeg',
  },
  {
    title: 'Desserts & Pairings',
    text: 'Cakes and sweet bites that match perfectly with espresso classics.',
    image:
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1400&q=80',
  },
]

const catalogCards = [
  {
    title: 'Coffee Menu',
    subtitle: 'Hot and cold coffee picks',
    to: '/menu/coffee',
    image:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Drinks Catalog',
    subtitle: 'Shakes and signature drinks',
    to: '/catalog/drinks',
    image:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Desserts Catalog',
    subtitle: 'Cakes and sweet moments',
    to: '/catalog/desserts',
    image:
      'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80',
  },
]

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    api.get('/api/category').then((res) => setCategories(res.data ?? [])).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length)
    }, 3500)

    return () => clearInterval(intervalId)
  }, [])

  const highlightedCategories = useMemo(() => categories.slice(0, 6), [categories])

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-8">
      <section className="relative overflow-hidden rounded-[2rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0.3, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.2 }}
            className="relative h-[24rem]"
          >
            <img src={banners[activeSlide].image} alt={banners[activeSlide].title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(41,28,14,0.38),rgba(41,28,14,0.22))]" />
            <div className="absolute left-6 top-6 max-w-lg md:left-10 md:top-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f2e8da]">Coffee House</p>
              <h1 className="mt-3 text-5xl font-black text-[#f8f1e6] md:text-6xl">{banners[activeSlide].title}</h1>
              <p className="mt-4 text-2xl text-[#f2e8da]">{banners[activeSlide].text}</p>
              <Link to="/shop" className="mt-6 inline-block rounded-full bg-[#f6eee1] px-6 py-2.5 text-sm font-bold text-[var(--rosewood)]">
                Shop Now
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`h-2 rounded-full transition-all ${index === activeSlide ? 'w-8 bg-white' : 'w-2 bg-white/60'}`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-4xl font-semibold text-[var(--ink)]">Top Categories</h2>
        <p className="mt-1 text-[var(--rosewood)]/80">Explore menu sections crafted for your mood.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {catalogCards.map((card) => (
            <Link key={card.title} to={card.to} className="group overflow-hidden rounded-3xl border border-[var(--stone)]/40 bg-white shadow-sm">
              <img src={card.image} alt={card.title} className="h-40 w-full object-cover transition group-hover:scale-105" />
              <div className="p-4">
                <h3 className="font-serif text-3xl leading-tight text-[var(--ink)]">{card.title}</h3>
                <p className="text-sm text-[var(--rosewood)]/80">{card.subtitle}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--rosewood)]">View Catalog</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-[var(--stone)]/35 bg-white p-6 md:p-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--rosewood)]/85">Discover</p>
            <h3 className="mt-1 font-serif text-4xl text-[var(--ink)]">All Categories</h3>
          </div>
          <Link
            to="/shop"
            className="rounded-full border border-[var(--stone)]/70 bg-[var(--porcelain)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink)] transition hover:border-[var(--rosewood)]/60"
          >
            View All
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {highlightedCategories.map((category) => (
            <Link
              key={category.id}
              to={`/shop?category=${category.id}`}
              className="group relative overflow-hidden rounded-2xl border border-[var(--stone)]/50 bg-[var(--porcelain)] px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--rosewood)]/60 hover:shadow-sm"
            >
              <span className="absolute inset-y-0 left-0 w-1 bg-[var(--rosewood)]/30 transition group-hover:bg-[var(--rosewood)]/70" />
              <div className="flex items-center justify-between pl-2">
                <span className="text-2xl font-semibold text-[var(--ink)]">{category.name}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rosewood)]/80">Explore</span>
              </div>
            </Link>
          ))}
        </div>
        {highlightedCategories.length === 0 && (
          <p className="mt-5 rounded-2xl bg-[var(--porcelain)] p-4 text-sm text-[var(--rosewood)]">No categories available right now.</p>
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
    </main>
  )
}
