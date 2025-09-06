import { ApiService } from './api';
import { Address, CreateAddressRequest, UpdateAddressRequest } from '../types/user';

export class AddressService {
  static async getUserAddresses(userId: string): Promise<Address[]> {
    return ApiService.get<Address[]>(`/api/users/${userId}/addresses`);
  }

  static async createAddress(addressData: CreateAddressRequest): Promise<Address> {
    return ApiService.post<Address>('/api/addresses', addressData);
  }

  static async updateAddress(addressData: UpdateAddressRequest): Promise<Address> {
    const { id, ...updateData } = addressData;
    return ApiService.put<Address>(`/api/addresses/${id}`, updateData);
  }

  static async deleteAddress(addressId: string): Promise<void> {
    return ApiService.delete<void>(`/api/addresses/${addressId}`);
  }

  static async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    return ApiService.post<void>(`/api/users/${userId}/addresses/${addressId}/default`, {});
  }
}
