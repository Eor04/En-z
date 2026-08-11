'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import {
  ShieldCheck,
  TrendingUp,
  ShoppingBag,
  Store,
  Bike,
  Users,
  CreditCard,
  QrCode,
  Banknote,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
  Edit3,
  Snowflake,
  Flame,
  Image as ImageIcon,
  Globe,
  Map,
  Compass,
  AlertTriangle,
  X,
  UserPlus,
  Key,
  Trash2,
  Lock,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useRealtimeEvents } from '@/presentation/hooks/useRealtimeEvents';
import { LiveConnectionBadge } from '@/presentation/components/common/LiveConnectionBadge';
import { CloudinaryUploader } from '@/presentation/components/common/CloudinaryUploader';
import { AnimatePresence, motion } from 'motion/react';
import { Badge, Panel, Stat, StaggerList, Tabs } from '@/presentation/components/ui';
import { bs } from '@/presentation/lib/utils';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'financials' | 'orders' | 'catalog' | 'users'>('financials');

  // Datos
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Filtros de órdenes
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  // Filtros y Búsqueda de Usuarios
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // Modales de Usuarios
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CUSTOMER' as 'ADMIN' | 'BUSINESS_OWNER' | 'DRIVER' | 'CUSTOMER',
    driverCode: '',
  });

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: 'CUSTOMER' as 'ADMIN' | 'BUSINESS_OWNER' | 'DRIVER' | 'CUSTOMER',
    driverCode: '',
    newPassword: '',
  });

  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modales/Formularios de Creación
  const [showNewSpaceModal, setShowNewSpaceModal] = useState(false);
  const [newSpaceForm, setNewSpaceForm] = useState({
    name: '',
    description: '',
    location: '',
    imageUrl: '',
    googleMapsUrl: '',
  });

  const [showNewBizModal, setShowNewBizModal] = useState(false);
  const [newBizForm, setNewBizForm] = useState({
    name: '',
    description: '',
    category: 'PATIO_COMIDA',
    spaceId: '',
    ownerId: '',
    phone: '',
    address: '',
    googleMapsUrl: '',
    logoUrl: '',
  });

  // Modales de Edición
  const [editingSpace, setEditingSpace] = useState<any | null>(null);
  const [editSpaceForm, setEditSpaceForm] = useState({
    id: '',
    name: '',
    description: '',
    imageUrl: '',
    address: '',
    googleMapsUrl: '',
  });

  const [editingBusiness, setEditingBusiness] = useState<any | null>(null);
  const [editBizForm, setEditBizForm] = useState({
    id: '',
    name: '',
    category: 'PATIO_COMIDA',
    spaceId: '',
    ownerPhone: '',
    logoUrl: '',
    bannerUrl: '',
    address: '',
    googleMapsUrl: '',
  });

  // Sugerencias de imágenes para Trinidad
  const TRINIDAD_IMAGE_PRESETS = [
    {
      title: 'Patio Moderno / Food Court',
      url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Plaza & Jardín Nocturno',
      url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Ambiente Tropical Amazónico',
      url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Food Park & Luces',
      url: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const fetchAllAdminData = async () => {
    setRefreshing(true);
    try {
      // 1. Métricas globales
      const mRes = await fetch('/api/admin/metrics');
      const mData = await mRes.json();
      setMetrics(mData);

      // 2. Órdenes globales
      const oUrl = `/api/admin/orders?search=${encodeURIComponent(orderSearch)}&status=${orderStatusFilter}`;
      const oRes = await fetch(oUrl);
      const oData = await oRes.json();
      setOrders(oData.orders || []);

      // 3. Espacios y comercios
      const sRes = await fetch('/api/admin/spaces');
      const sData = await sRes.json();
      setSpaces(sData.spaces || []);

      const bRes = await fetch('/api/admin/businesses');
      const bData = await bRes.json();
      setBusinesses(bData.businesses || []);

      // 4. Usuarios
      const uRes = await fetch('/api/admin/users');
      const uData = await uRes.json();
      setUsers(uData.users || []);
    } catch (err) {
      console.error('Error cargando panel admin:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Suscripción SSE global en tiempo real para administración
  const { connectionStatus, reconnect } = useRealtimeEvents({
    channels: ['admin:all'],
    enabled: Boolean(session?.user),
    enableAudioAlerts: false,
    onEvent: () => {
      fetchAllAdminData();
    },
  });

  useEffect(() => {
    if (status !== 'loading') {
      fetchAllAdminData();
    }
  }, [status, session, orderStatusFilter]);

  // Actualizar rol de usuario rápido
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setFeedback(`✓ Rol de usuario actualizado a ${newRole}`);
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Crear nuevo usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear usuario');
      }
      setFeedback(`✓ Usuario "${data.user?.email}" creado con éxito con rol ${data.user?.role}`);
      setShowNewUserModal(false);
      setNewUserForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'CUSTOMER',
        driverCode: '',
      });
      fetchAllAdminData();
    } catch (err: any) {
      alert(`Error al crear usuario: ${err.message}`);
    }
  };

  // Abrir modal de edición de usuario
  const handleOpenEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserForm({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'CUSTOMER',
      driverCode: user.driverCode || '',
      newPassword: '',
    });
  };

  // Guardar edición de usuario
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editUserForm.id,
          name: editUserForm.name,
          email: editUserForm.email,
          phone: editUserForm.phone,
          role: editUserForm.role,
          driverCode: editUserForm.driverCode || null,
          password: editUserForm.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar usuario');
      }
      setFeedback(`✓ Usuario "${data.user?.name || data.user?.email}" actualizado con éxito`);
      setEditingUser(null);
      fetchAllAdminData();
    } catch (err: any) {
      alert(`Error al actualizar usuario: ${err.message}`);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (user: any) => {
    const confirmMsg = `¿Estás seguro de que deseas ELIMINAR al usuario "${user.name || user.email}" (Rol: ${user.role})?\n\nEsta acción eliminará sus datos permanentemente.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users?userId=${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar usuario');
      }
      setFeedback(`🗑️ Usuario "${user.name || user.email}" eliminado correctamente`);
      fetchAllAdminData();
    } catch (err: any) {
      alert(`Error al eliminar usuario: ${err.message}`);
    }
  };

  // Congelar / Descongelar usuario
  const handleFreezeUser = async (user: any) => {
    const willFreeze = !user.isFrozen;
    let frozenReason: string | null = null;

    if (willFreeze) {
      frozenReason = window.prompt(
        `¿Cuál es el motivo para CONGELAR la cuenta de "${user.name || user.email}"?\n(Este mensaje se mostrará al usuario cuando intente iniciar sesión)`,
        'Cuenta suspendida por falta de pago o incumplimiento de términos.'
      );
      if (frozenReason === null) return; // Cancelado
    } else {
      if (!window.confirm(`¿Deseas DESCONGELAR la cuenta de "${user.name || user.email}"?`)) return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          isFrozen: willFreeze,
          frozenReason: willFreeze ? frozenReason : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar');

      const action = willFreeze ? '❄️ CONGELADA' : '✅ DESCONGELADA';
      setFeedback(`${action}: Cuenta de "${user.name || user.email}" ${willFreeze ? 'suspendida' : 'reactivada'} correctamente.`);
      fetchAllAdminData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Crear nuevo espacio
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSpaceForm),
      });
      if (res.ok) {
        setFeedback('✓ Nuevo Espacio Gastronómico creado con éxito en Trinidad');
        setShowNewSpaceModal(false);
        setNewSpaceForm({ name: '', description: '', location: '', imageUrl: '', googleMapsUrl: '' });
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Abrir Modal de Edición de Espacio
  const handleOpenEditSpace = (space: any) => {
    setEditingSpace(space);
    setEditSpaceForm({
      id: space.id,
      name: space.name,
      description: space.description || '',
      imageUrl: space.imageUrl || '',
      address: space.address || space.location || '',
      googleMapsUrl: space.googleMapsUrl || '',
    });
  };

  // Guardar Edición de Espacio
  const handleSaveEditSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpace) return;
    try {
      const res = await fetch(`/api/admin/spaces/${editingSpace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSpaceForm),
      });
      if (res.ok) {
        setFeedback(`✓ Espacio "${editSpaceForm.name}" actualizado correctamente con imagen y Google Maps`);
        setEditingSpace(null);
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Congelar / Descongelar Espacio por Mensualidad
  const handleToggleFreezeSpace = async (space: any) => {
    const willFreeze = space.isActive !== false;
    const confirmMsg = willFreeze
      ? `¿Deseas CONGELAR el espacio "${space.name}" por falta de pago de mensualidad?\n\nAl congelarlo, sus comercios no recibirán pedidos de clientes.`
      : `¿Deseas DESCONGELAR y reactivar el espacio "${space.name}"?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/spaces/${space.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_freeze',
          isActive: !willFreeze,
          frozenReason: willFreeze ? 'Mora en pago de mensualidad del espacio' : null,
        }),
      });
      if (res.ok) {
        setFeedback(willFreeze ? `❄️ Espacio "${space.name}" CONGELADO por mensualidad` : `🔥 Espacio "${space.name}" REACTIVADO con éxito`);
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Crear nuevo comercio
  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBizForm),
      });
      if (res.ok) {
        setFeedback('✓ Nuevo Comercio Gastronómico registrado con éxito');
        setShowNewBizModal(false);
        setNewBizForm({
          name: '',
          description: '',
          category: 'PATIO_COMIDA',
          spaceId: '',
          ownerId: '',
          phone: '',
          address: '',
          googleMapsUrl: '',
          logoUrl: '',
        });
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Abrir Modal de Edición de Comercio
  const handleOpenEditBusiness = (biz: any) => {
    setEditingBusiness(biz);
    setEditBizForm({
      id: biz.id,
      name: biz.name,
      category: biz.category || 'PATIO_COMIDA',
      spaceId: biz.spaceId || '',
      ownerPhone: biz.ownerPhone || '',
      logoUrl: biz.logoUrl || '',
      bannerUrl: biz.bannerUrl || '',
      address: biz.address || '',
      googleMapsUrl: biz.googleMapsUrl || '',
    });
  };

  // Guardar Edición de Comercio
  const handleSaveEditBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBusiness) return;
    try {
      const res = await fetch(`/api/admin/businesses/${editingBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editBizForm),
      });
      if (res.ok) {
        setFeedback(`✓ Comercio "${editBizForm.name}" actualizado correctamente`);
        setEditingBusiness(null);
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Congelar / Descongelar Comercio por Mora de Mensualidad
  const handleToggleFreezeBusiness = async (biz: any) => {
    const willFreeze = biz.isActive !== false;
    const confirmMsg = willFreeze
      ? `¿Deseas CONGELAR el comercio "${biz.name}" por falta de pago de suscripción mensual (100 Bs)?\n\nEl comercio no se mostrará a los clientes ni podrá vender.`
      : `¿Deseas DESCONGELAR y reactivar el comercio "${biz.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/businesses/${biz.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_freeze',
          isActive: !willFreeze,
          frozenReason: willFreeze ? 'Mora en suscripción mensual de 100 Bs' : null,
        }),
      });
      if (res.ok) {
        setFeedback(willFreeze ? `❄️ Comercio "${biz.name}" CONGELADO por mensualidad` : `🔥 Comercio "${biz.name}" REACTIVADO con éxito`);
        fetchAllAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-ink-mute">
        <div className="w-8 h-8 border-2 border-ember border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Cargando Panel de Administración Global...</p>
      </div>
    );
  }

  // Acceso guiado si no es ADMIN
  const userRole = (session?.user as any)?.role;
  if (!session?.user || userRole !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="rune-panel rounded-3xl p-8 border border-ember/30 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-ember/20 text-ember flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Panel de Administración General</h2>
          <p className="text-xs text-ink-mute mb-6 leading-relaxed">
            Se requieren permisos de Administrador para auditar transacciones, gestionar patios gastronómicos y supervisar el sistema.
          </p>
          <div className="space-y-3">
            <button
              onClick={() =>
                signIn('credentials', {
                  email: 'admin@pedidostrinidad.com',
                  password: 'password123',
                  callbackUrl: '/admin/dashboard',
                })
              }
              className="w-full py-3 px-4 rounded-xl bg-ember-deep hover:bg-ember text-white text-xs font-bold shadow-lg shadow-ember-deep/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Acceder como Administrador General (Demo)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/auth/login"
              className="block w-full py-3 px-4 rounded-xl bg-void-700 border border-surface-line hover:border-surface-line text-ink-soft text-xs font-semibold"
            >
              Iniciar sesión con otra cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Encabezado */}
      <Panel className="mb-8 flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-ember/35 bg-ember/12 text-ember">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <Badge tone="ember" icon={ShieldCheck}>
              Admin global
            </Badge>
            <h1 className="mt-1.5 font-display text-xl font-bold leading-tight text-white sm:text-3xl">
              Consola de administración
            </h1>
            <p className="mt-1 text-[12px] text-ink-mute">
              Operaciones, auditoría financiera y catálogo · Trinidad, Beni
            </p>
          </div>
        </div>

        <button
          onClick={fetchAllAdminData}
          disabled={refreshing}
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl border border-surface-line bg-void-800/70 px-4 py-2.5 text-[12px] font-semibold text-ink-soft transition-colors hover:border-violet-400/50 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </Panel>

      {/* KPIs */}
      <StaggerList className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="GMV transaccionado"
          value={`${bs(metrics?.financials?.totalGmv ?? 0)} Bs`}
          sub={`Ticket promedio ${bs(metrics?.financials?.avgTicket ?? 0)} Bs`}
          icon={TrendingUp}
          tone="arc"
        />
        <Stat
          label="Total pedidos"
          value={metrics?.orders?.total || 0}
          sub={`${metrics?.orders?.completed || 0} entregados · ${metrics?.orders?.active || 0} en curso`}
          icon={ShoppingBag}
          tone="violet"
        />
        <Stat
          label="Usuarios registrados"
          value={metrics?.users?.total || 0}
          sub={`${metrics?.users?.customers || 0} clientes · ${metrics?.users?.drivers || 0} repartidores`}
          icon={Users}
          tone="info"
        />
        <Stat
          label="Comercios y espacios"
          value={metrics?.catalog?.businesses || 0}
          sub={`En ${metrics?.catalog?.spaces || 0} espacios`}
          icon={Layers}
          tone="warn"
        />
      </StaggerList>

      <AnimatePresence>
        {feedback && (
          <motion.div
            role="status"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2.5 rounded-2xl border border-violet-400/35 bg-violet-500/10 p-4 text-[13px] text-violet-200">
              <Sparkles className="h-4 w-4 shrink-0" />
              {feedback}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pestañas */}
      <div className="mb-6">
        <Tabs
          layoutKey="admin-tabs"
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { value: 'financials', label: 'Finanzas', icon: TrendingUp },
            { value: 'orders', label: 'Pedidos', icon: ShoppingBag, count: orders.length },
            { value: 'catalog', label: 'Catálogo', icon: Layers, count: businesses.length },
            { value: 'users', label: 'Usuarios', icon: Users, count: users.length },
          ]}
        />
      </div>

      {/* TAB 1: RESUMEN FINANCIERO */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Payment Methods Breakdown */}
            <div className="p-6 rounded-3xl rune-panel border border-surface-line space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-ember" />
                <span>Métodos de Pago Utilizados</span>
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-void-700/70 border border-surface-line flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-arc/20 text-arc flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">QR Express (BNB/BCP)</div>
                      <div className="text-[10px] text-ink-mute">Transferencia Bancaria</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-white text-sm">
                      {metrics?.paymentMethods?.QR_MANUAL || 0}
                    </div>
                    <div className="text-[10px] text-arc">órdenes</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-void-700/70 border border-surface-line flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-info/20 text-info flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">Pasarela Online</div>
                      <div className="text-[10px] text-ink-mute">Débito / Crédito</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-white text-sm">
                      {metrics?.paymentMethods?.GATEWAY_ONLINE || 0}
                    </div>
                    <div className="text-[10px] text-info">órdenes</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-void-700/70 border border-surface-line flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">Efectivo contra Entrega</div>
                      <div className="text-[10px] text-ink-mute">Cobro en Puerta</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-white text-sm">
                      {metrics?.paymentMethods?.CASH || 0}
                    </div>
                    <div className="text-[10px] text-violet-400">órdenes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-6 rounded-3xl rune-panel border border-surface-line space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-400" />
                <span>Liquidación del GMV</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-void-700/70 border border-surface-line flex justify-between items-center">
                  <span className="text-ink-mute">Venta Neta de Platos:</span>
                  <span className="font-bold text-white">
                    {metrics?.financials?.totalProductsRevenue?.toFixed(2) || '0.00'} Bs
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-void-700/70 border border-surface-line flex justify-between items-center">
                  <span className="text-ink-mute">Recaudación Tarifas Delivery:</span>
                  <span className="font-bold text-violet-400">
                    +{metrics?.financials?.totalDeliveryFees?.toFixed(2) || '0.00'} Bs
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-violet-950/40 border border-violet-500/30 flex justify-between items-center text-sm font-bold">
                  <span className="text-violet-300">Total Transaccionado (GMV):</span>
                  <span className="text-violet-400 font-black">
                    {metrics?.financials?.totalGmv?.toFixed(2) || '0.00'} Bs
                  </span>
                </div>
              </div>
            </div>

            {/* Top Businesses */}
            <div className="p-6 rounded-3xl rune-panel border border-surface-line space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-warn" />
                <span>Comercios Top en Ventas</span>
              </h3>

              <div className="space-y-2.5">
                {(metrics?.topBusinesses || []).length === 0 ? (
                  <p className="text-xs text-ink-faint italic">No hay órdenes completadas aún.</p>
                ) : (
                  metrics.topBusinesses.map((b: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 rounded-2xl bg-void-700/70 border border-surface-line flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-warn/20 text-warn-soft font-bold text-[10px] flex items-center justify-center">
                          #{index + 1}
                        </span>
                        <span className="font-bold text-white">{b.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-warn">{b.total.toFixed(2)} Bs</div>
                        <div className="text-[10px] text-ink-faint">{b.count} pedidos</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIBRO GLOBAL DE ÓRDENES */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
              <input
                type="text"
                placeholder="Buscar por ID, cliente, teléfono, barrio o local..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAllAdminData()}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-void-700 border border-surface-line text-xs text-white placeholder-ink-faint focus:outline-none focus:border-ember"
              />
            </div>

            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="py-2.5 px-3 rounded-2xl bg-void-700 border border-surface-line text-xs text-ink-soft focus:outline-none focus:border-ember"
            >
              <option value="">Todos los Estados</option>
              <option value="esperando_pago">Esperando Pago</option>
              <option value="en_preparacion">En Preparación</option>
              <option value="buscando_driver">Buscando Repartidor</option>
              <option value="en_camino">En Camino</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Table */}
          <div className="rounded-3xl rune-panel border border-surface-line overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-ink-soft">
                <thead className="bg-void-700/80 text-[10px] uppercase font-bold text-ink-mute border-b border-surface-line">
                  <tr>
                    <th className="p-4">Pedido ID</th>
                    <th className="p-4">Comercio / Espacio</th>
                    <th className="p-4">Cliente & Destino</th>
                    <th className="p-4">Repartidor</th>
                    <th className="p-4">Monto</th>
                    <th className="p-4">Pago</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-line/60">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-void-700/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-white">
                        ORD-#{o.id.slice(0, 6).toUpperCase()}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{o.business?.name}</div>
                        <div className="text-[10px] text-ink-mute">{o.business?.space?.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-ink">{o.customer?.name}</div>
                        <div className="text-[10px] text-ink-mute">{o.deliveryAddress}</div>
                      </td>
                      <td className="p-4">
                        {o.driver ? (
                          <div className="flex items-center gap-1.5 text-violet-400 font-medium">
                            <Bike className="w-3.5 h-3.5" />
                            <span>{o.driver.name}</span>
                          </div>
                        ) : (
                          <span className="text-ink-faint italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-violet-400">
                        {o.totalPrice.toFixed(2)} Bs
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-surface-raised text-ink-soft">
                          {o.payment?.method || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            o.status === 'entregado'
                              ? 'bg-violet-500/20 text-violet-300'
                              : o.status === 'en_camino'
                              ? 'bg-info/20 text-info-soft'
                              : o.status === 'en_preparacion'
                              ? 'bg-warn/20 text-warn-soft'
                              : 'bg-surface-raised text-ink-mute'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/orders/${o.id}`}
                          target="_blank"
                          className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface-high text-ink text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Ver</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ESPACIOS & COMERCIOS */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-warn" />
                <span>Patios Gastronómicos & Comercios de Trinidad ({spaces.length})</span>
              </h3>
              <p className="text-[11px] text-ink-mute mt-0.5">
                Edita imágenes de portada, enlaces a Google Maps y gestiona el congelamiento por mora de mensualidades.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewSpaceModal(true)}
                className="py-2 px-3 rounded-xl bg-ember-deep hover:bg-ember text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-ember-deep/20"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Espacio</span>
              </button>
              <button
                onClick={() => setShowNewBizModal(true)}
                className="py-2 px-3 rounded-xl bg-warn-deep hover:bg-warn text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-warn-deep/20"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Comercio</span>
              </button>
            </div>
          </div>

          {/* Spaces Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {spaces.map((space) => {
              const isSpaceActive = space.isActive !== false;

              return (
                <div
                  key={space.id}
                  className={`rounded-3xl rune-panel border transition-all overflow-hidden flex flex-col justify-between shadow-xl ${
                    isSpaceActive
                      ? 'border-surface-line hover:border-surface-line'
                      : 'border-info/40 bg-violet-950/20'
                  }`}
                >
                  {/* Space Header with Cover Image */}
                  <div>
                    <div className="relative h-44 w-full bg-void-700 overflow-hidden">
                      {space.imageUrl ? (
                        <img
                          src={space.imageUrl}
                          alt={space.name}
                          className={`w-full h-full object-cover ${!isSpaceActive ? 'grayscale opacity-60' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-faint bg-void">
                          <Store className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />

                      {/* Status Badges on Image */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-md border ${
                            isSpaceActive
                              ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                              : 'bg-info/30 text-info-soft border-info animate-pulse'
                          }`}
                        >
                          {isSpaceActive ? '🟢 Espacio Activo' : '❄️ CONGELADO (MORA)'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditSpace(space)}
                            className="p-2 rounded-xl bg-void-700/90 hover:bg-surface-raised text-ink hover:text-white border border-surface-line backdrop-blur-md text-xs font-bold flex items-center gap-1 transition-all shadow-md"
                            title="Editar imagen, Maps y datos del espacio"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-warn" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => handleToggleFreezeSpace(space)}
                            className={`p-2 rounded-xl border backdrop-blur-md text-xs font-bold flex items-center gap-1 transition-all shadow-md ${
                              isSpaceActive
                                ? 'bg-violet-950/80 hover:bg-violet-900/90 text-info-soft border-info-deep hover:border-info'
                                : 'bg-violet-950/80 hover:bg-violet-900/90 text-violet-300 border-violet-700 hover:border-violet-500'
                            }`}
                            title={isSpaceActive ? 'Congelar espacio por mora de mensualidad' : 'Descongelar y reactivar espacio'}
                          >
                            {isSpaceActive ? (
                              <>
                                <Snowflake className="w-3.5 h-3.5 text-info" />
                                <span>Congelar</span>
                              </>
                            ) : (
                              <>
                                <Flame className="w-3.5 h-3.5 text-violet-400" />
                                <span>Descongelar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Space Name & Location on bottom */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <h4 className="font-black text-white text-lg drop-shadow-md">{space.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-ink-soft flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-ember shrink-0" />
                            <span className="truncate">{space.address || space.location || 'Trinidad, Beni'}</span>
                          </p>
                          {space.googleMapsUrl && (
                            <a
                              href={space.googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded-lg bg-ember/20 hover:bg-ember/40 text-ember-soft text-[10px] font-bold inline-flex items-center gap-1 border border-ember/30 transition-all shrink-0"
                            >
                              <span>Maps</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Space Content */}
                    <div className="p-5 space-y-4">
                      {space.description && (
                        <p className="text-xs text-ink-soft leading-relaxed bg-void-700/40 p-2.5 rounded-2xl border border-surface-line/60">
                          {space.description}
                        </p>
                      )}

                      {!isSpaceActive && (
                        <div className="p-3 rounded-2xl bg-violet-950/40 border border-info/40 flex items-center gap-2.5 text-xs text-info-soft">
                          <Snowflake className="w-4 h-4 text-info shrink-0" />
                          <span>
                            <strong>Espacio Congelado:</strong> {space.frozenReason || 'Mora en pago de mensualidad.'}
                          </span>
                        </div>
                      )}

                      {/* Businesses in space */}
                      <div className="pt-2 border-t border-surface-line/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block">
                            Comercios Registrados ({space.businesses?.length || 0}):
                          </span>
                          <span className="text-[10px] text-ink-faint">
                            Suscripción: 100 Bs/mes c/u
                          </span>
                        </div>

                        {space.businesses && space.businesses.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2.5">
                            {space.businesses.map((b: any) => {
                              const isBizActive = b.isActive !== false;

                              return (
                                <div
                                  key={b.id}
                                  className={`p-3 rounded-2xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    isBizActive
                                      ? 'bg-void-700/70 border-surface-line hover:border-surface-line'
                                      : 'bg-violet-950/30 border-info/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {b.logoUrl ? (
                                      <img
                                        src={b.logoUrl}
                                        alt={b.name}
                                        className="w-10 h-10 rounded-xl object-cover border border-surface-line"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-xl bg-surface-raised border border-surface-line flex items-center justify-center text-ink-mute font-bold">
                                        {b.name.slice(0, 2).toUpperCase()}
                                      </div>
                                    )}

                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-xs">{b.name}</span>
                                        <span
                                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                            isBizActive
                                              ? b.isOpen
                                                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                                : 'bg-surface-raised text-ink-mute border border-surface-line'
                                              : 'bg-info/20 text-info-soft border border-info/40'
                                          }`}
                                        >
                                          {isBizActive
                                            ? b.isOpen
                                              ? 'Abierto'
                                              : 'Cerrado'
                                            : '❄️ Mora 100 Bs'}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-ink-mute flex flex-wrap items-center gap-2 mt-0.5">
                                        <span>{b.products?.length || 0} platos</span>
                                        <span>•</span>
                                        <span>Dueño: {b.owner?.name || 'Admin'}</span>
                                        {b.googleMapsUrl && (
                                          <>
                                            <span>•</span>
                                            <a
                                              href={b.googleMapsUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-ember hover:underline inline-flex items-center gap-0.5"
                                            >
                                              <MapPin className="w-2.5 h-2.5" />
                                              <span>Maps</span>
                                            </a>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Business Individual Actions */}
                                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                    <button
                                      onClick={() => handleOpenEditBusiness(b)}
                                      className="px-2.5 py-1.5 rounded-xl bg-surface-raised hover:bg-surface-high text-ink text-[11px] font-semibold flex items-center gap-1 transition-colors border border-surface-line"
                                      title="Editar Maps, logo y teléfono"
                                    >
                                      <Edit3 className="w-3 h-3 text-warn" />
                                      <span>Editar</span>
                                    </button>

                                    <button
                                      onClick={() => handleToggleFreezeBusiness(b)}
                                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all border ${
                                        isBizActive
                                          ? 'bg-violet-950/70 hover:bg-violet-900 text-info-soft border-info-deep'
                                          : 'bg-violet-950/70 hover:bg-violet-900 text-violet-300 border-violet-700'
                                      }`}
                                      title={
                                        isBizActive
                                          ? 'Congelar comercio por falta de pago (100 Bs)'
                                          : 'Descongelar y reactivar comercio'
                                      }
                                    >
                                      {isBizActive ? (
                                        <>
                                          <Snowflake className="w-3 h-3 text-info" />
                                          <span>Congelar</span>
                                        </>
                                      ) : (
                                        <>
                                          <Flame className="w-3 h-3 text-violet-400" />
                                          <span>Descongelar</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-ink-faint text-xs italic bg-void-700/30 rounded-2xl border border-surface-line/40">
                            No hay comercios registrados en este espacio aún.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: USUARIOS & ROLES */}
      {activeTab === 'users' && (() => {
        const filteredUsers = users.filter((u) => {
          const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
          const query = userSearch.toLowerCase().trim();
          const matchesSearch =
            !query ||
            (u.name && u.name.toLowerCase().includes(query)) ||
            (u.email && u.email.toLowerCase().includes(query)) ||
            (u.phone && u.phone.toLowerCase().includes(query)) ||
            (u.driverCode && u.driverCode.toLowerCase().includes(query));
          return matchesRole && matchesSearch;
        });

        const adminsCount = users.filter((u) => u.role === 'ADMIN').length;
        const storeOwnersCount = users.filter((u) => u.role === 'BUSINESS_OWNER').length;
        const driversCount = users.filter((u) => u.role === 'DRIVER').length;
        const customersCount = users.filter((u) => u.role === 'CUSTOMER').length;

        const getRoleBadge = (role: string) => {
          switch (role) {
            case 'ADMIN':
              return {
                label: 'ADMINISTRADOR',
                badgeClass: 'bg-ember/20 text-ember-soft border-ember/40',
                icon: Shield,
              };
            case 'BUSINESS_OWNER':
              return {
                label: 'COMERCIO / TIENDA',
                badgeClass: 'bg-warn/20 text-warn-soft border-warn/40',
                icon: Store,
              };
            case 'DRIVER':
              return {
                label: 'REPARTIDOR',
                badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
                icon: Bike,
              };
            default:
              return {
                label: 'CLIENTE',
                badgeClass: 'bg-info/20 text-info-soft border-info/40',
                icon: Users,
              };
          }
        };

        return (
          <div className="space-y-6">
            {/* Header / Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-void-700/60 p-6 rounded-3xl border border-surface-line">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-ember" />
                  <span>Gestión Global de Usuarios & Roles ({users.length})</span>
                </h2>
                <p className="text-xs text-ink-mute mt-1">
                  Administra perfiles, contraseñas, permisos y credenciales operativas del sistema en Trinidad.
                </p>
              </div>

              <button
                onClick={() => setShowNewUserModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-ember-deep to-warn-deep hover:from-ember hover:to-warn text-white text-xs font-bold shadow-lg shadow-ember-deep/30 flex items-center justify-center gap-2 transition-all shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Crear Nuevo Usuario</span>
              </button>
            </div>

            {/* Quick Role Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Role filter pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setUserRoleFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    userRoleFilter === 'ALL'
                      ? 'bg-ink text-void border-surface-line shadow'
                      : 'bg-void-700/80 text-ink-mute border-surface-line hover:text-white'
                  }`}
                >
                  Todos ({users.length})
                </button>

                <button
                  onClick={() => setUserRoleFilter('ADMIN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border flex items-center gap-1.5 ${
                    userRoleFilter === 'ADMIN'
                      ? 'bg-ember-deep text-white border-ember shadow-md shadow-ember-deep/30'
                      : 'bg-void-700/80 text-ember-soft border-ember/20 hover:border-ember/40'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admins ({adminsCount})</span>
                </button>

                <button
                  onClick={() => setUserRoleFilter('BUSINESS_OWNER')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border flex items-center gap-1.5 ${
                    userRoleFilter === 'BUSINESS_OWNER'
                      ? 'bg-warn-deep text-white border-warn shadow-md shadow-warn-deep/30'
                      : 'bg-void-700/80 text-warn-soft border-warn/20 hover:border-warn/40'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Comercios ({storeOwnersCount})</span>
                </button>

                <button
                  onClick={() => setUserRoleFilter('DRIVER')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border flex items-center gap-1.5 ${
                    userRoleFilter === 'DRIVER'
                      ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/30'
                      : 'bg-void-700/80 text-violet-300 border-violet-500/20 hover:border-violet-500/40'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Drivers ({driversCount})</span>
                </button>

                <button
                  onClick={() => setUserRoleFilter('CUSTOMER')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border flex items-center gap-1.5 ${
                    userRoleFilter === 'CUSTOMER'
                      ? 'bg-info-deep text-white border-info shadow-md shadow-info-deep/30'
                      : 'bg-void-700/80 text-info-soft border-info/20 hover:border-info/40'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Clientes ({customersCount})</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, DRV..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-void-700 border border-surface-line text-xs text-white placeholder-ink-faint focus:border-ember focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-3xl rune-panel border border-surface-line overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-ink-soft">
                  <thead className="bg-void-700/90 text-[10px] uppercase font-bold text-ink-mute border-b border-surface-line">
                    <tr>
                      <th className="p-4">Usuario</th>
                      <th className="p-4">Contacto</th>
                      <th className="p-4">Rol & Permisos</th>
                      <th className="p-4">Código / Negocio</th>
                      <th className="p-4">Actividad</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-line/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-ink-faint text-xs italic">
                          No se encontraron usuarios con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const roleInfo = getRoleBadge(u.role);
                        const RoleIcon = roleInfo.icon;

                        return (
                          <tr
                            key={u.id}
                            className={`hover:bg-void-700/40 transition-colors ${
                              u.isFrozen ? 'bg-violet-950/20 border-l-2 border-l-blue-500/40' : ''
                            }`}
                          >
                            {/* User details */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-inner ${
                                   u.isFrozen
                                     ? 'bg-violet-900/40 border-info/40'
                                     : 'bg-gradient-to-tr from-surface-raised to-surface-high border-surface-line'
                                 }`}>
                                  {u.isFrozen ? '❄️' : (u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase())}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                    {u.name || 'Sin nombre'}
                                    {u.isFrozen && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-info/20 text-info-soft text-[9px] font-bold border border-info/30">
                                        CONGELADO
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-ink-mute font-mono text-[11px] truncate max-w-[200px]">
                                    {u.email}
                                  </div>
                                  {u.isFrozen && u.frozenReason && (
                                     <div className="text-[10px] text-info/70 mt-0.5 italic truncate max-w-[200px]">
                                       {u.frozenReason}
                                     </div>
                                   )}
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="p-4">
                              <span className="text-ink-soft text-xs font-mono">{u.phone || 'N/A'}</span>
                            </td>

                            {/* Role Badge & Quick Selector */}
                            <td className="p-4">
                              <div className="space-y-1.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.badgeClass}`}
                                >
                                  <RoleIcon className="w-3 h-3" />
                                  <span>{roleInfo.label}</span>
                                </span>
                                <div>
                                  <select
                                    value={u.role}
                                    onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                                    className="py-1 px-2 rounded-lg bg-void-700 border border-surface-line text-[10px] font-bold text-ink-soft focus:outline-none focus:border-ember"
                                  >
                                    <option value="CUSTOMER">Cambiar a: CLIENTE</option>
                                    <option value="BUSINESS_OWNER">Cambiar a: COMERCIO</option>
                                    <option value="DRIVER">Cambiar a: REPARTIDOR</option>
                                    <option value="ADMIN">Cambiar a: ADMINISTRADOR</option>
                                  </select>
                                </div>
                              </div>
                            </td>

                            {/* Extra details (DriverCode / Business) */}
                            <td className="p-4">
                              {u.driverCode && (
                                <span className="font-mono px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-[11px] font-bold border border-violet-500/30">
                                  {u.driverCode}
                                </span>
                              )}
                              {u.business && (
                                <div className="text-[11px] font-semibold text-warn-soft">
                                  🏪 {u.business.name}
                                  {u.business.space?.name && (
                                    <span className="text-[10px] text-ink-mute block font-normal">
                                      {u.business.space.name}
                                    </span>
                                  )}
                                </div>
                              )}
                              {!u.driverCode && !u.business && (
                                <span className="text-ink-faint">-</span>
                              )}
                            </td>

                            {/* Activity */}
                            <td className="p-4 text-ink-mute text-[11px]">
                              <div>{u._count?.ordersAsCustomer || 0} compras</div>
                              <div>{u._count?.ordersAsDriver || 0} entregas</div>
                            </td>

                            {/* Action Buttons */}
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Freeze / Unfreeze */}
                                <button
                                  onClick={() => handleFreezeUser(u)}
                                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border ${
                                    u.isFrozen
                                      ? 'bg-violet-950/40 hover:bg-violet-900/60 text-violet-300 border-violet-800/40'
                                      : 'bg-violet-950/40 hover:bg-violet-900/60 text-info-soft border-info-deep/40'
                                  }`}
                                  title={u.isFrozen ? 'Descongelar cuenta' : 'Congelar cuenta'}
                                >
                                  <Snowflake className={`w-3.5 h-3.5 ${u.isFrozen ? 'text-violet-400' : 'text-info'}`} />
                                  <span className="hidden sm:inline">{u.isFrozen ? 'Activar' : 'Congelar'}</span>
                                </button>

                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-2 rounded-xl bg-surface-raised hover:bg-surface-high text-ink text-xs font-semibold flex items-center gap-1 transition-colors border border-surface-line"
                                  title="Editar datos y contraseña"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-warn" />
                                  <span className="hidden sm:inline">Editar</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-2 rounded-xl bg-violet-950/40 hover:bg-violet-900/60 text-ember-soft text-xs font-semibold flex items-center gap-1 transition-colors border border-ember-deep/40"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-ember" />
                                  <span className="hidden sm:inline">Eliminar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Crear Espacio */}
      {showNewSpaceModal && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rune-panel p-6 rounded-3xl border border-surface-line max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-ember" />
                <span>Nuevo Patio / Espacio Gastronómico</span>
              </h3>
              <button
                onClick={() => setShowNewSpaceModal(false)}
                className="p-1.5 rounded-xl bg-surface-raised hover:bg-surface-high text-ink-mute hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="space-y-3 text-xs">
              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Nombre del Espacio</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Patio Pompeya Food Park"
                  value={newSpaceForm.name}
                  onChange={(e) => setNewSpaceForm({ ...newSpaceForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Ubicación / Dirección en Trinidad</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Av. Cipriano Barace y Calle 6 de Agosto"
                  value={newSpaceForm.location}
                  onChange={(e) => setNewSpaceForm({ ...newSpaceForm, location: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Enlace de Google Maps (Opcional)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={newSpaceForm.googleMapsUrl}
                    onChange={(e) => setNewSpaceForm({ ...newSpaceForm, googleMapsUrl: e.target.value })}
                    className="flex-1 p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none"
                  />
                  {newSpaceForm.googleMapsUrl && (
                    <a
                      href={newSpaceForm.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2.5 rounded-xl bg-ember-deep/20 text-ember-soft border border-ember/40 flex items-center gap-1 font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Probar</span>
                    </a>
                  )}
                </div>
              </div>

              <div>
                <CloudinaryUploader
                  label="Imagen de Portada del Espacio"
                  value={newSpaceForm.imageUrl}
                  onChange={(url) => setNewSpaceForm({ ...newSpaceForm, imageUrl: url })}
                  folder="pedidos_trinidad/spaces"
                  aspect="wide"
                  previewHeight={140}
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Descripción</label>
                <textarea
                  placeholder="Descripción atractiva del patio gastronómico..."
                  value={newSpaceForm.description}
                  onChange={(e) => setNewSpaceForm({ ...newSpaceForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSpaceModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-raised text-ink-soft font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-ember-deep hover:bg-ember text-white font-bold shadow-lg shadow-ember-deep/30"
                >
                  Crear Espacio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Espacio */}
      {editingSpace && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rune-panel p-6 rounded-3xl border border-surface-line max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-warn" />
                <span>Editar Espacio: {editingSpace.name}</span>
              </h3>
              <button
                onClick={() => setEditingSpace(null)}
                className="p-1.5 rounded-xl bg-surface-raised hover:bg-surface-high text-ink-mute hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSpace} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Nombre del Espacio</label>
                <input
                  type="text"
                  required
                  value={editSpaceForm.name}
                  onChange={(e) => setEditSpaceForm({ ...editSpaceForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Ubicación / Dirección Física en Trinidad</label>
                <input
                  type="text"
                  value={editSpaceForm.address}
                  onChange={(e) => setEditSpaceForm({ ...editSpaceForm, address: e.target.value })}
                  placeholder="ej: Av. Simón Bolívar esq. Calle La Paz"
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Enlace de Ubicación en Google Maps</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://maps.app.goo.gl/... o https://google.com/maps?q=..."
                    value={editSpaceForm.googleMapsUrl}
                    onChange={(e) => setEditSpaceForm({ ...editSpaceForm, googleMapsUrl: e.target.value })}
                    className="flex-1 p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none font-mono text-[11px]"
                  />
                  {editSpaceForm.googleMapsUrl && (
                    <a
                      href={editSpaceForm.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2.5 rounded-xl bg-ember-deep/20 text-ember-soft border border-ember/40 flex items-center gap-1 font-bold shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver Maps</span>
                    </a>
                  )}
                </div>
              </div>

              <div>
                <CloudinaryUploader
                  label="Imagen de Portada del Espacio"
                  value={editSpaceForm.imageUrl}
                  onChange={(url) => setEditSpaceForm({ ...editSpaceForm, imageUrl: url })}
                  folder="pedidos_trinidad/spaces"
                  aspect="wide"
                  previewHeight={140}
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Descripción del Espacio</label>
                <textarea
                  rows={2}
                  value={editSpaceForm.description}
                  onChange={(e) => setEditSpaceForm({ ...editSpaceForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSpace(null)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-raised text-ink-soft font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-warn-deep hover:bg-warn text-white font-bold shadow-lg shadow-warn-deep/30"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Comercio */}
      {showNewBizModal && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rune-panel p-6 rounded-3xl border border-surface-line max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-warn" />
                <span>Registrar Nuevo Comercio</span>
              </h3>
              <button
                onClick={() => setShowNewBizModal(false)}
                className="p-1.5 rounded-xl bg-surface-raised hover:bg-surface-high text-ink-mute hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBusiness} className="space-y-3 text-xs">
              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Nombre del Comercio</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Heladería Beni Tropical"
                  value={newBizForm.name}
                  onChange={(e) => setNewBizForm({ ...newBizForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Espacio Gastronómico</label>
                <select
                  required
                  value={newBizForm.spaceId}
                  onChange={(e) => setNewBizForm({ ...newBizForm, spaceId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none"
                >
                  <option value="">Seleccionar Espacio...</option>
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.address || s.location || 'Trinidad'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Usuario Propietario</label>
                <select
                  required
                  value={newBizForm.ownerId}
                  onChange={(e) => setNewBizForm({ ...newBizForm, ownerId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none"
                >
                  <option value="">Seleccionar Usuario...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email} - {u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="ej: 77889900"
                  value={newBizForm.phone}
                  onChange={(e) => setNewBizForm({ ...newBizForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Enlace de Google Maps del Local</label>
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={newBizForm.googleMapsUrl}
                  onChange={(e) => setNewBizForm({ ...newBizForm, googleMapsUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewBizModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-raised text-ink-soft font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-warn-deep hover:bg-warn text-white font-bold shadow-lg shadow-warn-deep/30"
                >
                  Registrar Comercio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Comercio & Maps */}
      {editingBusiness && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rune-panel p-6 rounded-3xl border border-surface-line max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-warn" />
                <span>Editar Comercio: {editingBusiness.name}</span>
              </h3>
              <button
                onClick={() => setEditingBusiness(null)}
                className="p-1.5 rounded-xl bg-surface-raised hover:bg-surface-high text-ink-mute hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBusiness} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Nombre del Comercio</label>
                <input
                  type="text"
                  required
                  value={editBizForm.name}
                  onChange={(e) => setEditBizForm({ ...editBizForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Espacio Gastronómico</label>
                <select
                  value={editBizForm.spaceId}
                  onChange={(e) => setEditBizForm({ ...editBizForm, spaceId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none"
                >
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.address || s.location || 'Trinidad'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Categoría</label>
                <select
                  value={editBizForm.category}
                  onChange={(e) => setEditBizForm({ ...editBizForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none"
                >
                  <option value="PATIO_COMIDA">PATIO DE COMIDA</option>
                  <option value="RESTAURANTE">RESTAURANTE</option>
                  <option value="COMIDA_RAPIDA">COMIDA RÁPIDA / HAMBURGUESAS</option>
                  <option value="LICORERIA">LICORERÍA 24H</option>
                  <option value="FARMACIA">FARMACIA EXPRESS</option>
                  <option value="CAFETERIA">CAFETERÍA & POSTRES</option>
                  <option value="HELADERIA">HELADERÍA</option>
                </select>
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Ubicación / Puesto Interno</label>
                <input
                  type="text"
                  placeholder="ej: Local #4 en Patio Pompeya, frente al escenario"
                  value={editBizForm.address}
                  onChange={(e) => setEditBizForm({ ...editBizForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Enlace de Google Maps del Comercio</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://maps.app.goo.gl/... o coordenadas"
                    value={editBizForm.googleMapsUrl}
                    onChange={(e) => setEditBizForm({ ...editBizForm, googleMapsUrl: e.target.value })}
                    className="flex-1 p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none font-mono text-[11px]"
                  />
                  {editBizForm.googleMapsUrl && (
                    <a
                      href={editBizForm.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2.5 rounded-xl bg-ember-deep/20 text-ember-soft border border-ember/40 flex items-center gap-1 font-bold shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver Maps</span>
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Teléfono / WhatsApp de Contacto</label>
                <input
                  type="text"
                  value={editBizForm.ownerPhone}
                  onChange={(e) => setEditBizForm({ ...editBizForm, ownerPhone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none"
                />
              </div>

              <div>
                <CloudinaryUploader
                  label="Logo del Comercio"
                  value={editBizForm.logoUrl}
                  onChange={(url) => setEditBizForm({ ...editBizForm, logoUrl: url })}
                  folder="pedidos_trinidad/logos"
                  aspect="logo"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBusiness(null)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-raised text-ink-soft font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-warn-deep hover:bg-warn text-white font-bold shadow-lg shadow-warn-deep/30"
                >
                  Guardar Comercio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Nuevo Usuario */}
      {showNewUserModal && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rune-panel p-6 rounded-3xl border border-surface-line max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-ember" />
                <span>Nuevo Usuario & Credenciales</span>
              </h3>
              <button
                onClick={() => setShowNewUserModal(false)}
                className="p-1.5 rounded-xl bg-surface-raised hover:bg-surface-high text-ink-mute hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Juan Carlos Pérez"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Correo Electrónico (Email)</label>
                <input
                  type="email"
                  required
                  placeholder="ej: juan@pedidostrinidad.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Contraseña Inicial</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none font-mono text-[11px]"
                />
                <span className="text-[10px] text-ink-faint mt-0.5 block">
                  Se encriptará con Bcrypt para máxima seguridad.
                </span>
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="ej: 78901234 o +591 78901234"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Rol Asignado</label>
                <select
                  value={newUserForm.role}
                  onChange={(e: any) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none font-bold"
                >
                  <option value="CUSTOMER">👤 CUSTOMER (Cliente)</option>
                  <option value="BUSINESS_OWNER">🏪 BUSINESS_OWNER (Dueño de Local)</option>
                  <option value="DRIVER">🛵 DRIVER (Repartidor)</option>
                  <option value="ADMIN">👑 ADMIN (Administrador Global)</option>
                </select>
              </div>

              {newUserForm.role === 'DRIVER' && (
                <div>
                  <label className="block text-ink-mute mb-1 font-semibold">
                    Código de Repartidor (Opcional - se autogenera)
                  </label>
                  <input
                    type="text"
                    placeholder="ej: DRV-888"
                    value={newUserForm.driverCode}
                    onChange={(e) => setNewUserForm({ ...newUserForm, driverCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-ember focus:outline-none font-mono uppercase text-[11px]"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-raised text-ink-soft font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-ember-deep to-warn-deep hover:from-ember hover:to-warn text-white font-bold shadow-lg shadow-ember-deep/30"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario & Reset Password */}
      {editingUser && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rune-panel p-6 rounded-3xl border border-surface-line max-w-md w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-warn" />
                <span>Editar Usuario: {editingUser.name || editingUser.email}</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-xl bg-surface-raised hover:bg-surface-high text-ink-mute hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Correo Electrónico (Email)</label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  placeholder="ej: 78901234"
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-ink-mute mb-1 font-semibold">Rol en la Plataforma</label>
                <select
                  value={editUserForm.role}
                  onChange={(e: any) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none font-bold"
                >
                  <option value="CUSTOMER">👤 CUSTOMER (Cliente)</option>
                  <option value="BUSINESS_OWNER">🏪 BUSINESS_OWNER (Dueño de Local)</option>
                  <option value="DRIVER">🛵 DRIVER (Repartidor)</option>
                  <option value="ADMIN">👑 ADMIN (Administrador Global)</option>
                </select>
              </div>

              {editUserForm.role === 'DRIVER' && (
                <div>
                  <label className="block text-ink-mute mb-1 font-semibold">Código de Repartidor</label>
                  <input
                    type="text"
                    value={editUserForm.driverCode}
                    onChange={(e) => setEditUserForm({ ...editUserForm, driverCode: e.target.value })}
                    placeholder="ej: DRV-777"
                    className="w-full p-2.5 rounded-xl bg-void-700 border border-surface-line text-white focus:border-warn focus:outline-none font-mono uppercase text-[11px]"
                  />
                </div>
              )}

              {/* Reset Password Section */}
              <div className="pt-2 border-t border-surface-line">
                <label className="block text-warn mb-1 font-bold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>Restablecer Contraseña (Opcional)</span>
                </label>
                <input
                  type="password"
                  placeholder="Dejar en blanco para mantener la actual"
                  value={editUserForm.newPassword}
                  onChange={(e) => setEditUserForm({ ...editUserForm, newPassword: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-void-700 border border-warn/30 text-white focus:border-warn focus:outline-none font-mono text-[11px]"
                />
                <span className="text-[10px] text-ink-faint mt-0.5 block">
                  Solo llena este campo si deseas cambiar la contraseña del usuario.
                </span>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-raised text-ink-soft font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-warn-deep hover:bg-warn text-white font-bold shadow-lg shadow-warn-deep/30"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
