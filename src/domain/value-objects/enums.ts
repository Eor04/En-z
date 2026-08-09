export type Role = 'ADMIN' | 'BUSINESS_OWNER' | 'DRIVER' | 'CUSTOMER';

export type OrderStatus =
  | 'esperando_pago'
  | 'en_preparacion'
  | 'buscando_driver'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export type PaymentMethod = 'QR_MANUAL' | 'GATEWAY_ONLINE' | 'CASH';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type BusinessCategory =
  | 'PATIO_COMIDA'
  | 'LICORERIA'
  | 'FARMACIA'
  | 'RESTAURANTE'
  | 'OTRO';
