import { api } from './api';
import { Address, CreateAddressRequest, UpdateAddressRequest } from '../types/user';

export class AddressService {
  static async getUserAddresses(userId: string): Promise<Address[]> {
    return api.get<Address[]>(`/api/users/${userId}/addresses`);
  }

  static async createAddress(addressData: CreateAddressRequest): Promise<Address> {
    return api.post<Address>('/api/addresses', addressData);
  }

  static async updateAddress(addressData: UpdateAddressRequest): Promise<Address> {
    const { id, ...updateData } = addressData;
    return api.put<Address>(`/api/addresses/${id}`, updateData);
  }

  static async deleteAddress(addressId: string): Promise<void> {
    return api.delete<void>(`/api/addresses/${addressId}`);
  }

  static async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    return api.post<void>(`/api/users/${userId}/addresses/${addressId}/default`, {});
  }
}
