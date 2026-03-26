// Path: src/types/database.types.ts
//
// Hand-authored types that mirror the current Supabase schema.
// Replace this file entirely when schema fields change.

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ---------------------------------------------------------------------------
// Domain enums
// ---------------------------------------------------------------------------

export type UserRole = 'owner' | 'manager' | 'staff'

export type OrderStatus =
  | 'new'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export type SessionStatus = 'active' | 'cleared'
export type Language = 'el' | 'en'

export type AccountStatus =
  | 'trialing'
  | 'active'
  | 'grace_period'
  | 'suspended'
  | 'cancelled'

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'cancelled'

export type SubscriptionPlan = 'trial' | 'starter' | 'growth' | 'pro'

// ---------------------------------------------------------------------------
// Table row types
// ---------------------------------------------------------------------------

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Business {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  currency: string
  default_language: Language
  is_active: boolean

  account_status: AccountStatus
  subscription_status: SubscriptionStatus
  subscription_plan: SubscriptionPlan | null

  trial_starts_at: string | null
  trial_ends_at: string | null

  current_period_starts_at: string | null
  current_period_ends_at: string | null
  grace_period_ends_at: string | null
  suspended_at: string | null

  outstanding_balance: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  last_payment_failed_at: string | null

  created_at: string
  updated_at: string
}

export interface BusinessUser {
  id: string
  business_id: string
  user_id: string
  role: UserRole
  created_at: string
}

export interface Table {
  id: string
  business_id: string
  table_number: string
  name: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  business_id: string
  name_el: string
  name_en: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  business_id: string
  category_id: string
  name_el: string
  name_en: string | null
  description_el: string | null
  description_en: string | null
  price: number
  image_url: string | null
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProductOptionGroup {
  id: string
  business_id: string
  product_id: string
  name_el: string
  name_en: string | null
  is_required: boolean
  sort_order: number
  created_at: string
}

export interface ProductOptionChoice {
  id: string
  business_id: string
  group_id: string
  name_el: string
  name_en: string | null
  price_delta: number
  sort_order: number
  created_at: string
}

export interface TableSession {
  id: string
  business_id: string
  table_id: string
  status: SessionStatus
  is_active: boolean
  started_at: string
  cleared_at: string | null
  created_at: string
}

export interface Order {
  id: string
  business_id: string
  table_id: string
  table_session_id: string
  status: OrderStatus
  notes: string | null
  total_amount: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  business_id: string
  order_id: string
  product_id: string | null
  product_name_snapshot_el: string
  product_name_snapshot_en: string | null
  unit_price: number
  quantity: number
  line_total: number
}

export interface OrderItemOption {
  id: string
  business_id: string
  order_item_id: string
  option_group_name_el: string
  option_group_name_en: string | null
  option_choice_name_el: string
  option_choice_name_en: string | null
  price_delta: number
}

// ---------------------------------------------------------------------------
// Insert types
// ---------------------------------------------------------------------------

export type InsertBusiness = Omit<Business, 'id' | 'created_at' | 'updated_at'>
export type InsertBusinessUser = Omit<BusinessUser, 'id' | 'created_at'>
export type InsertTable = Omit<Table, 'id' | 'created_at' | 'updated_at'>
export type InsertCategory = Omit<Category, 'id' | 'created_at' | 'updated_at'>
export type InsertProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'>
export type InsertProductOptionGroup = Omit<ProductOptionGroup, 'id' | 'created_at'>
export type InsertProductOptionChoice = Omit<ProductOptionChoice, 'id' | 'created_at'>

// ---------------------------------------------------------------------------
// Update types
// ---------------------------------------------------------------------------

export type UpdateBusiness = Partial<
  Omit<Business, 'id' | 'created_at' | 'updated_at'>
>

export type UpdateTable = Partial<
  Omit<Table, 'id' | 'business_id' | 'created_at' | 'updated_at'>
>

export type UpdateCategory = Partial<
  Omit<Category, 'id' | 'business_id' | 'created_at' | 'updated_at'>
>

export type UpdateProduct = Partial<
  Omit<Product, 'id' | 'business_id' | 'created_at' | 'updated_at'>
>

// ---------------------------------------------------------------------------
// Joined / enriched query return types
// ---------------------------------------------------------------------------

export interface ProductWithOptions extends Product {
  product_option_groups: (ProductOptionGroup & {
    product_option_choices: ProductOptionChoice[]
  })[]
}

export interface CategoryWithProducts extends Category {
  products: ProductWithOptions[]
}

export interface OrderItemWithOptions extends OrderItem {
  order_item_options: OrderItemOption[]
}

export interface OrderWithItems extends Order {
  order_items: OrderItemWithOptions[]
}

export interface SessionWithOrders extends TableSession {
  orders: OrderWithItems[]
  session_total: number
}

export interface TableWithActiveSession extends Table {
  active_session: SessionWithOrders | null
}

// ---------------------------------------------------------------------------
// RPC parameter and return types
// ---------------------------------------------------------------------------

export interface PlaceOrderItem {
  product_id: string
  quantity: number
  choice_ids: string[]
}

export interface PlaceOrderParams {
  p_business_id: string
  p_table_id: string
  p_notes?: string | null
  p_items: PlaceOrderItem[]
}

export interface PlaceOrderResult {
  order_id: string
  session_id: string
  total: number
}

export interface ClearTableParams {
  p_business_id: string
  p_table_id: string
}

export interface ClearTableResult {
  success: boolean
  session_id?: string
  message?: string
}

export interface TransferOrderParams {
  p_business_id: string
  p_order_id: string
  p_target_table_id: string
}

export interface TransferOrderResult {
  success: boolean
  order_id: string
  new_table_id: string
  new_session_id: string
}

export interface CustomerMenuData {
  business: Business
  table: Table
  categories: CategoryWithProducts[]
}

// ---------------------------------------------------------------------------
// Cart types
// ---------------------------------------------------------------------------

export interface CartItemOption {
  choice_id: string
  group_id: string
  group_name: string
  choice_name: string
  price_delta: number
}

export interface CartItem {
  key: string
  product_id: string
  name: string
  base_price: number
  quantity: number
  options: CartItemOption[]
  line_total: number
}

// ---------------------------------------------------------------------------
// Database generic type
// ---------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Profile>
      }
      businesses: {
        Row: Business
        Insert: InsertBusiness
        Update: UpdateBusiness
      }
      business_users: {
        Row: BusinessUser
        Insert: InsertBusinessUser
        Update: Partial<BusinessUser>
      }
      tables: {
        Row: Table
        Insert: InsertTable
        Update: UpdateTable
      }
      categories: {
        Row: Category
        Insert: InsertCategory
        Update: UpdateCategory
      }
      products: {
        Row: Product
        Insert: InsertProduct
        Update: UpdateProduct
      }
      product_option_groups: {
        Row: ProductOptionGroup
        Insert: InsertProductOptionGroup
        Update: Partial<ProductOptionGroup>
      }
      product_option_choices: {
        Row: ProductOptionChoice
        Insert: InsertProductOptionChoice
        Update: Partial<ProductOptionChoice>
      }
      table_sessions: {
        Row: TableSession
        Insert: Omit<TableSession, 'id' | 'created_at'>
        Update: Partial<TableSession>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Order>
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id'>
        Update: Partial<OrderItem>
      }
      order_item_options: {
        Row: OrderItemOption
        Insert: Omit<OrderItemOption, 'id'>
        Update: Partial<OrderItemOption>
      }
    }
    Functions: {
      place_order: {
        Args: PlaceOrderParams
        Returns: PlaceOrderResult
      }
      clear_table: {
        Args: ClearTableParams
        Returns: ClearTableResult
      }
      transfer_order: {
        Args: TransferOrderParams
        Returns: TransferOrderResult
      }
      set_current_business: {
        Args: { p_id: string }
        Returns: void
      }
      get_business_ids_for_user: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      get_plan_from_table_count: {
        Args: { p_table_count: number }
        Returns: string
      }
      get_price_from_table_count: {
        Args: { p_table_count: number }
        Returns: number
      }
      get_active_table_count_for_business: {
        Args: { p_business_id: string }
        Returns: number
      }
      refresh_business_plan_from_tables: {
        Args: { p_business_id: string }
        Returns: void
      }
      mark_business_payment_failed: {
        Args: { p_business_id: string; p_amount?: number }
        Returns: void
      }
      suspend_overdue_businesses: {
        Args: Record<string, never>
        Returns: number
      }
      reactivate_business_after_payment: {
        Args: {
          p_business_id: string
          p_period_start: string
          p_period_end: string
          p_plan: string
        }
        Returns: void
      }
      business_access_allowed: {
        Args: {
          p_account_status: string
          p_trial_ends_at: string | null
          p_subscription_status: string
        }
        Returns: boolean
      }
    }
  }
}