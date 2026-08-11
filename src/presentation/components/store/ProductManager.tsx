'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Package,
  Layers,
  Sparkles,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Link,
  Loader2,
} from 'lucide-react';

interface ProductManagerProps {
  businessId: string;
  initialProducts: any[];
}

export function ProductManager({ businessId, initialProducts }: ProductManagerProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State for New/Edit Product
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('50');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoriesInput, setCategoriesInput] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const uploadToCloudinary = useCallback(async (file: File) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setErrorMsg('Cloudinary no está configurado. Usa el campo URL manual.');
      setImageTab('url');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Solo se permiten archivos de imagen (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('La imagen no puede superar 5MB.');
      return;
    }

    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'pedidos_trinidad/products');

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      if (!res.ok) throw new Error('Error al subir imagen a Cloudinary');
      const data = await res.json();
      setImageUrl(data.secure_url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  }, [CLOUD_NAME, UPLOAD_PRESET]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadToCloudinary(file);
  }, [uploadToCloudinary]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadToCloudinary(file);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setStock('50');
    setDescription('');
    setImageUrl('');
    setCategoriesInput('Especialidades, Popular');
    setIsAvailable(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(p.price.toString());
    setStock(p.stock?.toString() || '50');
    setDescription(p.description);
    setImageUrl(p.imageUrl || '');
    setCategoriesInput(p.categories?.join(', ') || '');
    setIsAvailable(p.isAvailable);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const categoriesArray = categoriesInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const payload = {
      name,
      price: parseFloat(price),
      stock: parseInt(stock, 10) || 50,
      description,
      imageUrl: imageUrl.trim().length > 0 ? imageUrl.trim() : null,
      categories: categoriesArray.length > 0 ? categoriesArray : ['General'],
      isAvailable,
    };

    try {
      if (editingProduct) {
        // Edit existing product
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error al actualizar producto');
        }

        const data = await res.json();
        setProducts(products.map((p) => (p.id === editingProduct.id ? data.product : p)));
      } else {
        // Create new product
        const res = await fetch(`/api/businesses/${businessId}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error al crear producto');
        }

        const data = await res.json();
        setProducts([data.product, ...products]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto del menú?')) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar producto');
      }

      setProducts(products.filter((p) => p.id !== productId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleAvailability = async (product: any) => {
    const nextState = !product.isAvailable;
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: nextState }),
      });

      if (!res.ok) {
        throw new Error('Error al actualizar disponibilidad');
      }

      setProducts(
        products.map((p) => (p.id === product.id ? { ...p, isAvailable: nextState } : p))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.categories?.some((cat: string) => cat.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por plato, ingrediente o categoría..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-void-700 border border-surface-line focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-xs text-white placeholder-ink-faint outline-none transition-all"
          />
        </div>

        {/* Add Product Button */}
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-violet-500 to-arc hover:from-violet-500 hover:to-arc text-white font-bold text-xs shadow-lg shadow-violet-600/20 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Nuevo Plato / Producto</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="rune-panel rounded-2xl overflow-hidden border border-surface-line">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-line bg-void-700/60 text-ink-mute">
                <th className="py-3 px-4 font-semibold">Producto</th>
                <th className="py-3 px-4 font-semibold">Categorías</th>
                <th className="py-3 px-4 font-semibold">Precio (Bs)</th>
                <th className="py-3 px-4 font-semibold">Stock</th>
                <th className="py-3 px-4 font-semibold">Disponibilidad</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-line/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink-faint">
                    No se encontraron productos en el menú con ese criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-void-700/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-surface-raised shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-raised flex items-center justify-center text-ink-faint shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white text-xs">{p.name}</div>
                          <div className="text-[11px] text-ink-mute line-clamp-1 max-w-xs">
                            {p.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {p.categories?.map((cat: string) => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 rounded bg-surface-raised text-ink-soft text-[10px] border border-surface-line"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-violet-400 font-mono">
                      {p.price.toFixed(2)} Bs
                    </td>

                    <td className="py-3 px-4 font-mono text-ink-soft">
                      {p.stock ?? '999'} un.
                    </td>

                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(p)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                          p.isAvailable
                            ? 'bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/30'
                            : 'bg-ember/20 text-ember-soft border-ember/30 hover:bg-ember/30'
                        }`}
                      >
                        {p.isAvailable ? '🟢 Activo' : '🔴 Agotado'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg bg-void-700 border border-surface-line text-ink-mute hover:text-white hover:border-surface-line transition-colors"
                          title="Editar producto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg bg-void-700 border border-surface-line text-ink-mute hover:text-ember hover:border-ember-deep/40 hover:bg-violet-950/20 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rune-panel rounded-3xl p-6 shadow-2xl border border-surface-line animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>{editingProduct ? 'Editar Producto' : 'Nuevo Producto en el Menú'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-ink-mute hover:text-white hover:bg-surface-raised"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-ember/10 border border-ember/20 text-ember-soft text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-ember shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Nombre del Plato / Producto
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Hamburguesa Triple Cheddar"
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line focus:border-violet-500 text-xs text-white placeholder-ink-faint outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">
                    Precio (Bs)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="35.00"
                    className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line focus:border-violet-500 text-xs text-white placeholder-ink-faint outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">
                    Stock Diario
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="50"
                    className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line focus:border-violet-500 text-xs text-white placeholder-ink-faint outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Categorías (separadas por coma)
                </label>
                <input
                  type="text"
                  required
                  value={categoriesInput}
                  onChange={(e) => setCategoriesInput(e.target.value)}
                  placeholder="Hamburguesas, Especialidades, Combos"
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line focus:border-violet-500 text-xs text-white placeholder-ink-faint outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-ink-soft">
                    Fotografía del Producto
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setImageTab('upload')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        imageTab === 'upload'
                          ? 'bg-violet-600/20 text-violet-400 border border-violet-500/40'
                          : 'text-ink-faint hover:text-ink-soft'
                      }`}
                    >
                      <Upload className="w-3 h-3 inline mr-1" />
                      Subir foto
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        imageTab === 'url'
                          ? 'bg-violet-600/20 text-violet-400 border border-violet-500/40'
                          : 'text-ink-faint hover:text-ink-soft'
                      }`}
                    >
                      <Link className="w-3 h-3 inline mr-1" />
                      URL
                    </button>
                  </div>
                </div>

                {imageTab === 'upload' ? (
                  <div className="space-y-2">
                    {/* Preview */}
                    {imageUrl && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-surface-line group">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Drop zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative w-full rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-2 py-5 ${
                        isDragging
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-surface-line hover:border-violet-600/50 hover:bg-surface-raised/30'
                      } ${uploadingImage ? 'pointer-events-none opacity-60' : ''}`}
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                          <span className="text-xs text-ink-mute">Subiendo imagen...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-ink-faint" />
                          <span className="text-xs text-ink-mute text-center">
                            {imageUrl ? 'Cambiar imagen' : 'Arrastra una foto aquí'}<br />
                            <span className="text-ink-faint">o haz clic para seleccionar · JPG, PNG, WEBP · máx 5MB</span>
                          </span>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line focus:border-violet-500 text-xs text-white placeholder-ink-faint outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Descripción / Ingredientes
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles de la preparación, salsas, acompañamientos..."
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line focus:border-violet-500 text-xs text-white placeholder-ink-faint outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-500 focus:ring-violet-500 bg-void-700 border-surface-line"
                />
                <label htmlFor="isAvailable" className="text-xs text-ink-soft">
                  Producto disponible para ordenar inmediatamente
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-void-700 border border-surface-line text-ink-soft text-xs font-semibold hover:bg-surface-raised"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingProduct ? 'Guardar Cambios' : 'Crear Producto'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
