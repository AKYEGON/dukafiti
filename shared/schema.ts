import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  description: text('description'),
  price: real('price').notNull(),
  stock: integer('stock'), // Allow null for unknown quantities
  category: text('category').notNull(),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
  salesCount: integer('sales_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  balance: real('balance').notNull().default(0.00),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  total: real('total').notNull(),
  paymentMethod: text('payment_method').notNull().default('cash'),
  status: text('status').notNull().default('pending'),
  reference: text('reference'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
})

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  phone: text('phone'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const businessProfiles = sqliteTable('business_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  businessName: text('business_name').notNull(),
  businessType: text('business_type').notNull(),
  location: text('location'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  amount: real('amount').notNull(),
  method: text('method').notNull(),
  reference: text('reference'),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const storeProfiles = sqliteTable('store_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  storeName: text('store_name').notNull(),
  ownerName: text('owner_name'),
  storeType: text('store_type').notNull(),
  location: text('location'),
  description: text('description'),
  paybillTillNumber: text('paybill_till_number'),
  consumerKey: text('consumer_key'),
  consumerSecret: text('consumer_secret'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const userSettings = sqliteTable('user_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  theme: text('theme').notNull().default('light'),
  currency: text('currency').notNull().default('KES'),
  language: text('language').notNull().default('en'),
  notifications: integer('notifications', { mode: 'boolean' }).notNull().default(true),
  mpesaEnabled: integer('mpesa_enabled', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('info'), // info, success, warning, error
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  payments: many(payments),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  orderItems: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
}))

// Insert schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  salesCount: true,
}).extend({
  // Allow for unknown quantity handling on frontend
  unknownQuantity: z.boolean().optional(),
})

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
})

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
})

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
})

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
})

export const insertBusinessProfileSchema = createInsertSchema(businessProfiles).omit({
  id: true,
  createdAt: true,
})

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
})

export const insertStoreProfileSchema = createInsertSchema(storeProfiles).omit({
  id: true,
  createdAt: true,
})

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
})

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
})

// Types
export type Product = typeof products.$inferSelect
export type InsertProduct = z.infer<typeof insertProductSchema>
export type Customer = typeof customers.$inferSelect
export type InsertCustomer = z.infer<typeof insertCustomerSchema>
export type Order = typeof orders.$inferSelect
export type InsertOrder = z.infer<typeof insertOrderSchema>
export type OrderItem = typeof orderItems.$inferSelect
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>
export type User = typeof users.$inferSelect
export type InsertUser = z.infer<typeof insertUserSchema>
export type BusinessProfile = typeof businessProfiles.$inferSelect
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>
export type Payment = typeof payments.$inferSelect
export type InsertPayment = z.infer<typeof insertPaymentSchema>
export type StoreProfile = typeof storeProfiles.$inferSelect
export type InsertStoreProfile = z.infer<typeof insertStoreProfileSchema>
export type UserSettings = typeof userSettings.$inferSelect
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>
export type Notification = typeof notifications.$inferSelect
export type InsertNotification = z.infer<typeof insertNotificationSchema>

export interface DashboardMetrics {
  totalRevenue: string
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  revenueGrowth: string
  ordersGrowth: string
  lowStockCount: number
  activeCustomersCount: number
}

export interface SearchResult {
  id: number
  type: 'product' | 'customer' | 'order'
  name: string
  subtitle?: string
  url: string
}