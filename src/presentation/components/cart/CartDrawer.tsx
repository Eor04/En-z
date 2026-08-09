'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Store,
  Bike,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useCart } from '@/presentation/context/CartContext';

export function CartDrawer() {
  const {
    items,
    groupedByBusiness,
    isMultiStore,
    businessCount,
    removeItem,
    removeBusinessItems,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryFee,
    total,
    totalItems,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  return (
    <>
      {/* Floating Cart Button (Visible when cart has items and drawer is closed) */}
      {totalItems > 0 && !isCartOpen && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold shadow-2xl shadow-emerald-500/40 flex items-center gap-3 border border-emerald-400/30 group animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950">
              {totalItems}
            </span>
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-emerald-100 font-semibold flex items-center gap-1">
              <span>Ver Pedido</span>
              {isMultiStore && (
                <span className="bg-amber-400/30 text-amber-200 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                  {businessCount} locales
                </span>
              )}
            </div>
            <div className="text-sm font-black">{total.toFixed(2)} Bs</div>
          </div>
        </button>
      )}

      {/* Cart Drawer Slide-over */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Tu Carrito de Pedido</h3>
                    {isMultiStore ? (
                      <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Pedido Multi-Comercio ({businessCount} locales)</span>
                      </p>
                    ) : groupedByBusiness[0] ? (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Store className="w-3 h-3 text-amber-400" />
                        <span>{groupedByBusiness[0].businessName}</span>
                      </p>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List (Grouped by Business) */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {items.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-300">Tu carrito está vacío</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Agrega productos desde el menú de tus locales favoritos.
                    </p>
                  </div>
                ) : (
                  groupedByBusiness.map((group) => (
                    <div
                      key={group.businessId}
                      className="rounded-2xl bg-slate-950/40 border border-slate-800/90 overflow-hidden"
                    >
                      {/* Store Group Header */}
                      <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-bold text-xs text-white truncate max-w-[200px]">
                            {group.businessName}
                          </span>
                          {group.spaceName && (
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                              {group.spaceName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-400">
                            {group.subtotal.toFixed(2)} Bs
                          </span>
                          {groupedByBusiness.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBusinessItems(group.businessId)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title={`Eliminar platos de ${group.businessName}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Store Group Items */}
                      <div className="p-3 space-y-3">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 flex items-center justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white text-xs truncate">{item.name}</h4>
                              <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                                {item.price.toFixed(2)} Bs
                              </div>
                              {item.notes && (
                                <div className="text-[10px] text-slate-400 italic mt-0.5 truncate">
                                  &quot;{item.notes}&quot;
                                </div>
                              )}
                            </div>

                            {/* Quantity & Delete Controls */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700 p-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                                title="Eliminar plato"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Summary & Checkout */}
              {items.length > 0 && (
                <div className="p-5 border-t border-slate-800 bg-slate-950/80 space-y-4">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal productos</span>
                      <span className="font-semibold text-white">{subtotal.toFixed(2)} Bs</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Costo de envío (Trinidad)</span>
                      </span>
                      <span className="font-semibold text-white">{deliveryFee.toFixed(2)} Bs</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                      <span>Total a pagar</span>
                      <span className="text-emerald-400 font-black">{total.toFixed(2)} Bs</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearCart}
                      className="px-3 py-3 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-rose-400 text-xs font-semibold transition-colors"
                      title="Vaciar carrito"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Link
                      href="/checkout"
                      onClick={() => setIsCartOpen(false)}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Proceder al Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
