export interface SpaceProps {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  address?: string | null;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
  frozenReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Space {
  constructor(public readonly props: SpaceProps) {}

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null | undefined {
    return this.props.description;
  }
  get imageUrl(): string | null | undefined {
    return this.props.imageUrl;
  }
  get address(): string | null | undefined {
    return this.props.address;
  }
  get googleMapsUrl(): string | null | undefined {
    return this.props.googleMapsUrl;
  }
  get latitude(): number | null | undefined {
    return this.props.latitude;
  }
  get longitude(): number | null | undefined {
    return this.props.longitude;
  }
  get isActive(): boolean {
    return this.props.isActive ?? true;
  }
  get frozenReason(): string | null | undefined {
    return this.props.frozenReason;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): SpaceProps {
    return { ...this.props, isActive: this.isActive };
  }
}
