import { Role } from '../value-objects/enums';

export interface UserProps {
  id: string;
  email: string;
  name?: string | null;
  password?: string | null;
  image?: string | null;
  role: Role;
  driverCode?: string | null;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(public readonly props: UserProps) {}

  get id(): string {
    return this.props.id;
  }
  get email(): string {
    return this.props.email;
  }
  get name(): string | null | undefined {
    return this.props.name;
  }
  get password(): string | null | undefined {
    return this.props.password;
  }
  get image(): string | null | undefined {
    return this.props.image;
  }
  get role(): Role {
    return this.props.role;
  }
  get driverCode(): string | null | undefined {
    return this.props.driverCode;
  }
  get phone(): string | null | undefined {
    return this.props.phone;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isAdmin(): boolean {
    return this.props.role === 'ADMIN';
  }

  isBusinessOwner(): boolean {
    return this.props.role === 'BUSINESS_OWNER';
  }

  isDriver(): boolean {
    return this.props.role === 'DRIVER';
  }

  isCustomer(): boolean {
    return this.props.role === 'CUSTOMER';
  }

  toJSON() {
    const { password, ...safeUser } = this.props;
    return safeUser;
  }
}
