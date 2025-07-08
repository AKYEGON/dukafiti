import { supabase } from './supabase';
import { Product, Customer, Sale, Notification, Setting } from '../types/database';

// Generic CRUD operations with automatic store_id handling
export class DatabaseService {
  // Get current user ID
  private async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  // Generic create function
  async create<T>(table: string, data: Omit<T, 'id' | 'created_at' | 'updated_at' | 'store_id'>): Promise<T | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data: result, error } = await supabase
      .from(table)
      .insert([{ ...data, store_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // Generic update function
  async update<T>(table: string, id: string, data: Partial<T>): Promise<T | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data: result, error } = await supabase
      .from(table)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('store_id', userId)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // Generic delete function
  async delete(table: string, id: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('store_id', userId);

    if (error) throw error;
    return true;
  }

  // Specific product methods
  async createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'store_id'>): Promise<Product | null> {
    return this.create<Product>('products', data);
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
    return this.update<Product>('products', id, data);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.delete('products', id);
  }

  // Specific customer methods
  async createCustomer(data: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'store_id'>): Promise<Customer | null> {
    return this.create<Customer>('customers', data);
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | null> {
    return this.update<Customer>('customers', id, data);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.delete('customers', id);
  }

  // Specific sale methods
  async createSale(data: Omit<Sale, 'id' | 'created_at' | 'updated_at' | 'store_id'>): Promise<Sale | null> {
    return this.create<Sale>('sales', data);
  }

  async updateSale(id: string, data: Partial<Sale>): Promise<Sale | null> {
    return this.update<Sale>('sales', id, data);
  }

  async deleteSale(id: string): Promise<boolean> {
    return this.delete('sales', id);
  }
}

export const db = new DatabaseService();