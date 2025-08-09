export interface User {
  id: string;
  auth0Id: string;
  email: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  addressId: string;
  userId: string;
  type: 'home' | 'office' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  phoneNumber?: string;
  auth0Id?: string;
  password?: string;
}

export interface CreateAddressRequest {
  userId: string;
  type: 'home' | 'office' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {
  id: string;
}
