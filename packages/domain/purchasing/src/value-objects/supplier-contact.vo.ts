export interface SupplierContactProps {
  name: string;
  phone: string;
  email: string | null;
  role: string | null;
}

export class SupplierContact {
  public readonly name: string;
  public readonly phone: string;
  public readonly email: string | null;
  public readonly role: string | null;

  private constructor(props: SupplierContactProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Contact name is required');
    }
    if (!props.phone || props.phone.trim().length === 0) {
      throw new Error('Contact phone is required');
    }
    this.name = props.name.trim();
    this.phone = props.phone.trim();
    this.email = props.email?.trim() ?? null;
    this.role = props.role?.trim() ?? null;
  }

  public static create(props: SupplierContactProps): SupplierContact {
    return new SupplierContact(props);
  }

  public static reconstitute(props: SupplierContactProps): SupplierContact {
    return new SupplierContact(props);
  }
}
