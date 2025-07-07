// Profit tracking data operations using Supabase
import { supabase } from './supabase';

export interface ProfitData {
  totalProfit: number;
  marginPercent: number;
  byProduct: ProductProfit[];
  byCategory: CategoryProfit[];
}

export interface ProductProfit {
  productId: number;
  productName: string;
  quantitySold: number;
  totalProfit: number;
  marginPercent: number;
  averageSellingPrice: number;
  averageCostPrice: number;
}

export interface CategoryProfit {
  category: string;
  totalProfit: number;
  marginPercent: number;
  quantitySold: number;
}

export interface RestockItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  supplier?: string;
  note?: string;
  createdAt: string;
  createdBy?: number;
}

export interface RestockRequest {
  productId: number;
  quantity: number;
  supplier?: string;
  note?: string;
}

// Get profit data for specified period
export const getProfitData = async (period: 'daily' | 'weekly' | 'monthly'): Promise<ProfitData> => {
  try {
    let dateFilter = '';
    const now = new Date();
    
    switch (period) {
      case 'daily':
        dateFilter = now.toISOString().split('T')[0]; // Today
        break;
      case 'weekly':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = weekAgo.toISOString();
        break;
      case 'monthly':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = monthAgo.toISOString();
        break;
    }

    // Get order items with profit calculations
    let query = supabase
      .from('order_items')
      .select(`
        *,
        orders!inner(created_at, customer_name, status),
        products!inner(name, category)
      `);

    if (period === 'daily') {
      query = query.gte('orders.created_at', dateFilter + 'T00:00:00');
      query = query.lt('orders.created_at', dateFilter + 'T23:59:59');
    } else {
      query = query.gte('orders.created_at', dateFilter);
    }

    const { data: orderItems, error } = await query;

    if (error) {
      console.error('Error fetching profit data:', error);
      throw error;
    }

    if (!orderItems || orderItems.length === 0) {
      return {
        totalProfit: 0,
        marginPercent: 0,
        byProduct: [],
        byCategory: []
      };
    }

    // Calculate total profit and metrics
    let totalProfit = 0;
    let totalRevenue = 0;
    const productProfits = new Map<number, ProductProfit>();
    const categoryProfits = new Map<string, CategoryProfit>();

    orderItems.forEach((item: any) => {
      const sellingPrice = item.price || 0;
      const costPrice = item.cost_price_at_sale || 0;
      const quantity = item.quantity || 0;
      
      const itemProfit = (sellingPrice - costPrice) * quantity;
      const itemRevenue = sellingPrice * quantity;
      
      totalProfit += itemProfit;
      totalRevenue += itemRevenue;

      // By product
      const productId = item.product_id;
      const productName = item.products?.name || 'Unknown Product';
      
      if (productProfits.has(productId)) {
        const existing = productProfits.get(productId)!;
        existing.quantitySold += quantity;
        existing.totalProfit += itemProfit;
        existing.averageSellingPrice = ((existing.averageSellingPrice * (existing.quantitySold - quantity)) + (sellingPrice * quantity)) / existing.quantitySold;
        existing.averageCostPrice = ((existing.averageCostPrice * (existing.quantitySold - quantity)) + (costPrice * quantity)) / existing.quantitySold;
        existing.marginPercent = existing.averageSellingPrice > 0 ? ((existing.averageSellingPrice - existing.averageCostPrice) / existing.averageSellingPrice) * 100 : 0;
      } else {
        productProfits.set(productId, {
          productId,
          productName,
          quantitySold: quantity,
          totalProfit: itemProfit,
          marginPercent: sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0,
          averageSellingPrice: sellingPrice,
          averageCostPrice: costPrice
        });
      }

      // By category
      const category = item.products?.category || 'Uncategorized';
      if (categoryProfits.has(category)) {
        const existing = categoryProfits.get(category)!;
        existing.quantitySold += quantity;
        existing.totalProfit += itemProfit;
        const totalCategoryRevenue = ((existing.marginPercent / 100) * existing.totalProfit) + existing.totalProfit;
        existing.marginPercent = totalCategoryRevenue > 0 ? (existing.totalProfit / totalCategoryRevenue) * 100 : 0;
      } else {
        categoryProfits.set(category, {
          category,
          totalProfit: itemProfit,
          marginPercent: itemRevenue > 0 ? (itemProfit / itemRevenue) * 100 : 0,
          quantitySold: quantity
        });
      }
    });

    const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalProfit,
      marginPercent,
      byProduct: Array.from(productProfits.values()).sort((a, b) => b.totalProfit - a.totalProfit),
      byCategory: Array.from(categoryProfits.values()).sort((a, b) => b.totalProfit - a.totalProfit)
    };

  } catch (error) {
    console.error('Error in getProfitData:', error);
    throw error;
  }
};

// Create a restock entry
export const createRestock = async (restockData: RestockRequest): Promise<RestockItem> => {
  try {
    // First, update the product quantity
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock, name')
      .eq('id', restockData.productId)
      .single();

    if (productError) {
      throw new Error(`Failed to fetch product: ${productError.message}`);
    }

    const newStock = (product.stock || 0) + restockData.quantity;

    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', restockData.productId);

    if (updateError) {
      throw new Error(`Failed to update product stock: ${updateError.message}`);
    }

    // Then, record the restock history
    const { data: restockRecord, error: restockError } = await supabase
      .from('restock_history')
      .insert([{
        product_id: restockData.productId,
        quantity: restockData.quantity,
        supplier: restockData.supplier || null,
        note: restockData.note || null,
        created_by: 1 // Default user for now
      }])
      .select(`
        *,
        products!inner(name)
      `)
      .single();

    if (restockError) {
      throw new Error(`Failed to record restock: ${restockError.message}`);
    }

    return {
      id: restockRecord.id,
      productId: restockRecord.product_id,
      productName: restockRecord.products?.name || 'Unknown Product',
      quantity: restockRecord.quantity,
      supplier: restockRecord.supplier,
      note: restockRecord.note,
      createdAt: restockRecord.created_at,
      createdBy: restockRecord.created_by
    };

  } catch (error) {
    console.error('Error in createRestock:', error);
    throw error;
  }
};

// Get restock history
export const getRestockHistory = async (period?: 'today' | 'week' | 'month'): Promise<RestockItem[]> => {
  try {
    let query = supabase
      .from('restock_history')
      .select(`
        *,
        products!inner(name)
      `)
      .order('created_at', { ascending: false });

    if (period) {
      const now = new Date();
      let dateFilter = '';
      
      switch (period) {
        case 'today':
          dateFilter = now.toISOString().split('T')[0] + 'T00:00:00';
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = weekAgo.toISOString();
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = monthAgo.toISOString();
          break;
      }
      
      query = query.gte('created_at', dateFilter);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.products?.name || 'Unknown Product',
      quantity: item.quantity,
      supplier: item.supplier,
      note: item.note,
      createdAt: item.created_at,
      createdBy: item.created_by
    }));

  } catch (error) {
    console.error('Error in getRestockHistory:', error);
    throw error;
  }
};

// Get daily profit trend for charts
export const getDailyProfitTrend = async (days: number = 7): Promise<{ date: string; profit: number }[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        price,
        cost_price_at_sale,
        quantity,
        orders!inner(created_at)
      `)
      .gte('orders.created_at', startDate.toISOString());

    if (error) {
      throw error;
    }

    // Group by date and calculate daily profits
    const dailyProfits = new Map<string, number>();
    
    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyProfits.set(dateStr, 0);
    }

    orderItems?.forEach((item: any) => {
      const date = new Date(item.orders.created_at).toISOString().split('T')[0];
      const profit = (item.price - item.cost_price_at_sale) * item.quantity;
      
      if (dailyProfits.has(date)) {
        dailyProfits.set(date, dailyProfits.get(date)! + profit);
      }
    });

    return Array.from(dailyProfits.entries())
      .map(([date, profit]) => ({ date, profit }))
      .sort((a, b) => a.date.localeCompare(b.date));

  } catch (error) {
    console.error('Error in getDailyProfitTrend:', error);
    return [];
  }
};