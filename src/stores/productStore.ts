import { create } from 'zustand';
import { productService } from '../services/productService';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database.types';
import { useActivityStore } from './activitiesStore';

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProducts: () => Promise<void>;
  getProductById: (id: string) => Promise<Product | null>;
  createProduct: (data: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (id: string, quantity: number) => Promise<Product>;
  clearError: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  totalProducts: 0,
  
  clearError: () => set({ error: null }),
  
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
      }

      const products = await productService.getProducts();
      set({ 
        products, 
        totalProducts: products.length,
        loading: false 
      });
    } catch (error: any) {
      console.error('Error in fetchProducts:', error);
      set({ 
        error: error.message === 'User not authenticated' 
          ? 'Please sign in to access products'
          : error.message || 'Failed to fetch products',
        loading: false 
      });
      throw error;
    }
  },
  
  getProductById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const product = await productService.getProductById(id);
      set({ loading: false });
      return product;
    } catch (error: any) {
      console.error('Error in getProductById:', error);
      set({ 
        error: error.message || 'Failed to fetch product details', 
        loading: false 
      });
      return null;
    }
  },
  
  createProduct: async (data: Partial<Product>) => {
    set({ loading: true, error: null });
    try {
      const newProduct = await productService.createProduct(data);

      // Update the products list with the new product
      const products = [...get().products, newProduct];
      set({ 
        products, 
        totalProducts: products.length,
        loading: false 
      });
      
      return newProduct;
    } catch (error: any) {
      console.error('Error in createProduct:', error);
      set({ 
        error: error.message || 'Failed to create product', 
        loading: false 
      });
      throw error;
    }
  },
  
  updateProduct: async (id: string, data: Partial<Product>) => {
    set({ loading: true, error: null });
    try {
      //const oldProduct = get().products.find(p => p.id === id);
      const updatedProduct = await productService.updateProduct(id, data);
      
      // Log activity if stock changed
      // if ('stock' in data && oldProduct) {
      //   const stockChange = (data.stock || 0) - (oldProduct.stock || 0);
      //   await supabase.rpc('add_activity', {
      //     p_user_id: (await supabase.auth.getUser()).data.user?.id,
      //     p_type: 'product',
      //     p_title: `Stock ${stockChange > 0 ? 'Increased' : 'Decreased'}`,
      //     p_product: oldProduct.name,
      //     p_quantity: Math.abs(stockChange)
      //   });
      // }

      // Update the products list with the updated product
      const products = get().products.map(product => 
        product.id === id ? updatedProduct : product
      );
      
      set({ 
        products,
        totalProducts: products.length,
        loading: false 
      });
      return updatedProduct;
    } catch (error: any) {
      console.error('Error in updateProduct:', error);
      set({ 
        error: error.message || 'Failed to update product', 
        loading: false 
      });
      throw error;
    }
  },
  
  deleteProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await productService.deleteProduct(id);
      
      // Remove the deleted product from the list
      const products = get().products.filter(product => product.id !== id);
      set({ 
        products,
        totalProducts: products.length,
        loading: false 
      });
    } catch (error: any) {
      console.error('Error in deleteProduct:', error);
      set({ 
        error: error.message || 'Failed to delete product', 
        loading: false 
      });
      throw error;
    }
  },
  
  updateStock: async (id: string, quantity: number) => {
    set({ loading: true, error: null });
    try {
      const updatedProduct = await productService.updateStock(id, quantity);
      
      // Update the products list with the updated product
      const products = get().products.map(product => 
        product.id === id ? updatedProduct : product
      );
      
      set({ 
        products,
        totalProducts: products.length,
        loading: false 
      });
      return updatedProduct;
    } catch (error: any) {
      console.error('Error in updateStock:', error);
      set({ 
        error: error.message || 'Failed to update product stock', 
        loading: false 
      });
      throw error;
    }
  }
}));