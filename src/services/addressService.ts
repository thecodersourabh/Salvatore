import { api } from './api';
import { Address, CreateAddressRequest, UpdateAddressRequest } from '../types/user';

export class AddressService {
  static async getUserAddresses(userId: string): Promise<Address[]> {
    return api.get<Address[]>(`/api/users/${userId}/addresses`);
  }

  static async createAddress(userId: string, addressData: CreateAddressRequest): Promise<Address> {
    return api.post<Address>(`/api/users/${userId}/addresses`, addressData);
  }

  static async updateAddress(addressData: UpdateAddressRequest): Promise<Address> {
    const { id, userId, ...updateData } = addressData as UpdateAddressRequest & { userId: string };
    return api.put<Address>(`/api/users/${userId}/addresses/${id}`, updateData);
  }

  static async deleteAddress(userId: string, addressId: string): Promise<void> {
    return api.delete<void>(`/api/users/${userId}/addresses/${addressId}`);
  }

  static async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    return api.post<void>(`/api/users/${userId}/addresses/${addressId}/default`, {});
  }
}
