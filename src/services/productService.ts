import { supabase } from '../lib/supabase';
import { Product } from '../types/database.types';

export const productService = {
  // Get all products for the current user
  async getProducts(): Promise<Product[]> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      return products || [];
    } catch (error) {
      console.error('Product service error:', error);
      throw error;
    }
  },

  // Get a single product by ID
  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Product service error:', error);
      throw error;
    }
  },

  // Create a new product
  async createProduct(productData: Partial<Product>): Promise<Product> {
    try {
      // Get the current user's ID
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      // Add default values for required fields
      const newProduct = {
        ...productData,
        user_id: userData.user.id,
        status: productData.stock && productData.stock > 0 ? 'In Stock' : 'Out of Stock',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Product service error:', error);
      throw error;
    }
  },

  // Update an existing product
  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    try {
      // Update status based on stock if stock is being updated
      let updateData = { ...productData };
      
      if ('stock' in productData) {
        const stock = productData.stock || 0;
        if (stock <= 0) {
          updateData.status = 'Out of Stock';
        } else if (stock <= 10) { // Assuming 10 is the low stock threshold
          updateData.status = 'Low Stock';
        } else {
          updateData.status = 'In Stock';
        }
      }
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Product service error:', error);
      throw error;
    }
  },

  // Delete a product
  async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        throw error;
      }
    } catch (error) {
      console.error('Product service error:', error);
      throw error;
    }
  },
  
  // Update product stock
  async updateStock(id: string, quantity: number): Promise<Product> {
    try {
      // First get the current product
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching product for stock update:', fetchError);
        throw fetchError;
      }
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Calculate new stock level
      const currentStock = product.stock || 0;
      const newStock = currentStock + quantity;
      
      // Determine status based on new stock level
      let status: 'In Stock' | 'Low Stock' | 'Out of Stock';
      if (newStock <= 0) {
        status = 'Out of Stock';
      } else if (newStock <= 10) {
        status = 'Low Stock';
      } else {
        status = 'In Stock';
      }
      
      // Update the product
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({
          stock: newStock,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating product stock:', updateError);
        throw updateError;
      }
      
      return updatedProduct;
    } catch (error) {
      console.error('Product service error:', error);
      throw error;
    }
  }
};