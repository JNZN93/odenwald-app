import { z } from 'zod';

/**
 * Zod Schemas für API Response Validierung
 * Diese Schemas stellen sicher, dass die API-Antworten dem erwarteten Format entsprechen
 */

// Order Item Schema
export const OrderItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  menu_item_id: z.union([z.string(), z.number()]).transform(String),
  name: z.string(),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  total_price: z.number().nonnegative(),
  price_cents: z.number().optional(),
  image_url: z.string().optional(),
  special_instructions: z.string().optional(),
  selected_variant_options: z.array(z.object({
    variant_group_id: z.string(),
    variant_option_id: z.string(),
    price_modifier_cents: z.number()
  })).optional()
});

// Order Schema
export const OrderSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  user_id: z.union([z.string(), z.number()]).transform(String),
  restaurant_id: z.union([z.string(), z.number()]).transform(String),
  restaurant_name: z.string(),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional(),
  items: z.array(OrderItemSchema).default([]),
  subtotal: z.number().nonnegative(),
  delivery_fee: z.number().nonnegative(),
  total_price: z.number().nonnegative(),
  loyalty_discount_amount: z.number().optional(),
  loyalty_redeemed: z.boolean().optional(),
  loyalty_redemption_stamps_used: z.number().optional(),
  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'picked_up',
    'delivered',
    'cancelled',
    'open',
    'in_progress',
    'out_for_delivery'
  ]),
  payment_status: z.enum(['pending', 'paid', 'failed']),
  payment_method: z.enum(['cash', 'card', 'paypal', 'bank_transfer']).optional(),
  delivery_address: z.string(),
  delivery_instructions: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  driver_id: z.union([z.string(), z.number()]).transform(String).optional(),
  driver_name: z.string().optional(),
  // Table order fields
  table_id: z.string().optional(),
  table_number: z.string().optional(),
  session_id: z.string().optional(),
  party_size: z.number().optional(),
  order_type: z.enum(['delivery', 'pickup', 'dine_in']).optional(),
  table_status: z.enum(['ordered', 'confirmed', 'preparing', 'ready', 'served', 'paid']).optional()
});

// Create Order Request Schema
export const CreateOrderRequestSchema = z.object({
  restaurant_id: z.string(),
  delivery_address: z.string().min(1),
  delivery_instructions: z.string().optional(),
  payment_method: z.string().optional(),
  items: z.array(z.object({
    menu_item_id: z.string(),
    quantity: z.number().positive(),
    unit_price: z.number().nonnegative(),
    special_instructions: z.string().optional(),
    selected_variant_options: z.array(z.any()).optional()
  })).min(1)
});

// Create Order Response Schema
export const CreateOrderResponseSchema = z.object({
  message: z.string(),
  order: OrderSchema
});

// Get Orders Response Schema
export const GetOrdersResponseSchema = z.object({
  count: z.number().nonnegative(),
  orders: z.array(OrderSchema)
});

// Update Order Status Response Schema
export const UpdateOrderStatusResponseSchema = z.object({
  message: z.string(),
  order: OrderSchema
});

// Loyalty Data Schema
export const LoyaltyDataSchema = z.object({
  restaurant_id: z.string(),
  restaurant_name: z.string(),
  customer_id: z.string(),
  current_stamps: z.number().nonnegative(),
  lifetime_earned: z.number().nonnegative(),
  lifetime_redeemed: z.number().nonnegative(),
  can_redeem: z.boolean(),
  stamps_required: z.number().positive(),
  discount_percent: z.number().nonnegative(),
  last_updated: z.string().optional()
});

// Type Exports
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;
export type GetOrdersResponse = z.infer<typeof GetOrdersResponseSchema>;
export type LoyaltyData = z.infer<typeof LoyaltyDataSchema>;
