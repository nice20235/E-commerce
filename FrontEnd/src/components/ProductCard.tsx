import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addToCart } from '../api/cart'
import { useAuthStore } from '../store/auth'
import { useNavigate } from 'react-router-dom'
import type { Product } from '../types'
import { useLang } from '../store/lang'

export default function ProductCard({ product }: { product: Product }) {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLang()

  const addMutation = useMutation({
    mutationFn: () => addToCart(product.id, 1),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) { navigate('/login'); return }
    if (!product.is_available) return
    addMutation.mutate()
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="product-card flex flex-col rounded-2xl overflow-hidden"
      style={{ background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #f0ede8, #ede9e3)', aspectRatio: '1/1' }}>
        {product.image ? (
          <img src={product.image} alt={product.name} className="card-img w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ fontSize: 52, opacity: 0.2 }}>🥿</div>
        )}

        {!product.is_available && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(3px)' }}>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white" style={{ color: '#888', border: '1px solid #e8e5e0' }}>
              {t('outOfStock')}
            </span>
          </div>
        )}

        {/* Hover CTA */}
        {product.is_available && (
          <div className="card-overlay absolute bottom-0 inset-x-0 p-3">
            <button
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="w-full text-white text-xs font-bold py-2.5 rounded-xl transition-all"
              style={{
                background: addMutation.isSuccess
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                  : 'linear-gradient(135deg, #ff4d1c, #ff6a3c)',
                boxShadow: addMutation.isSuccess
                  ? '0 4px 14px rgba(34,197,94,0.4)'
                  : '0 4px 14px rgba(255,77,28,0.4)',
              }}
            >
              {addMutation.isPending ? t('adding') : addMutation.isSuccess ? t('added') : t('addToCart')}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1" style={{ color: '#1a2f4e' }}>{product.name}</h3>
        <p className="text-xs mb-3" style={{ color: '#999' }}>{t('size')} {product.size}</p>
        <div className="mt-auto flex items-end justify-between">
          <div>
            <span className="font-extrabold text-base" style={{ color: '#1a2f4e' }}>{product.price.toLocaleString()}</span>
            <span className="text-xs ml-1" style={{ color: '#bbb' }}>UZS</span>
          </div>
          {product.quantity > 0 && product.quantity <= 5 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fff7ed', color: '#c2410c' }}>
              {product.quantity} {t('left')}
            </span>
          )}
          {product.quantity > 5 && (
            <span className="text-[11px]" style={{ color: '#bbb' }}>{product.quantity} {t('left')}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
