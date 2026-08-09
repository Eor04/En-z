export interface OrderTrackingProps {
  id: string;
  orderId: string;
  acceptedAt?: Date | null;  // Hora en que el restaurante aceptó e inició preparación
  pickedUpAt?: Date | null;  // Hora en que el repartidor recogió el pedido
  deliveredAt?: Date | null; // Hora en que el repartidor entregó el pedido
  createdAt: Date;
}

export class OrderTracking {
  constructor(public readonly props: OrderTrackingProps) {}

  get id(): string {
    return this.props.id;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get acceptedAt(): Date | null | undefined {
    return this.props.acceptedAt;
  }
  get pickedUpAt(): Date | null | undefined {
    return this.props.pickedUpAt;
  }
  get deliveredAt(): Date | null | undefined {
    return this.props.deliveredAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Cálculo de duración en minutos
  getPreparationDurationMinutes(): number | null {
    if (!this.props.acceptedAt || !this.props.pickedUpAt) return null;
    return Math.round(
      (this.props.pickedUpAt.getTime() - this.props.acceptedAt.getTime()) / 60000
    );
  }

  getDeliveryDurationMinutes(): number | null {
    if (!this.props.pickedUpAt || !this.props.deliveredAt) return null;
    return Math.round(
      (this.props.deliveredAt.getTime() - this.props.pickedUpAt.getTime()) / 60000
    );
  }

  getTotalDurationMinutes(): number | null {
    if (!this.props.acceptedAt || !this.props.deliveredAt) return null;
    return Math.round(
      (this.props.deliveredAt.getTime() - this.props.acceptedAt.getTime()) / 60000
    );
  }

  toJSON(): OrderTrackingProps {
    return { ...this.props };
  }
}
