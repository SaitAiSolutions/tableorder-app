//
// Hand-authored types that mirror the v3 Supabase schema exactly.
// Regenerate automatically at any time with:
//   npm run db:types
//
// The Database type at the bottom is consumed by createClient<Database>()
// in all three Supabase client files (client.ts, server.ts, middleware.ts).

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
// Domain enums — match DB CHECK constraints exactly
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

// ---------------------------------------------------------------------------
// Table row types — one interface per DB table
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
  trial_starts_at: string | null
  trial_ends_at: string | null
  subscription_status: string
  subscription_plan: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
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
// Insert types — DB-generated fields omitted, used in server actions
// ---------------------------------------------------------------------------

export type InsertBusiness = Omit<Business, 'id' | 'created_at' | 'updated_at'>
export type InsertBusinessUser = Omit<BusinessUser, 'id' | 'created_at'>
export type InsertTable = Omit<Table, 'id' | 'created_at' | 'updated_at'>
export type InsertCategory = Omit<Category, 'id' | 'created_at' | 'updated_at'>
export type InsertProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'>
export type InsertProductOptionGroup = Omit<ProductOptionGroup, 'id' | 'created_at'>
export type InsertProductOptionChoice = Omit<ProductOptionChoice, 'id' | 'created_at'>

// ---------------------------------------------------------------------------
// Update types — all partial, immutable fields excluded
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

/** Product with option groups and their choices — customer menu + product form */
export interface ProductWithOptions extends Product {
  product_option_groups: (ProductOptionGroup & {
    product_option_choices: ProductOptionChoice[]
  })[]
}

/** Category with its available products (and options) — full menu query */
export interface CategoryWithProducts extends Category {
  products: ProductWithOptions[]
}

/** Order item with chosen option snapshots — order display */
export interface OrderItemWithOptions extends OrderItem {
  order_item_options: OrderItemOption[]
}

/** Full order with items and options — dashboard order card */
export interface OrderWithItems extends Order {
  order_items: OrderItemWithOptions[]
}

/** Table session with all its orders — table detail view */
export interface SessionWithOrders extends TableSession {
  orders: OrderWithItems[]
  session_total: number
}

/** Table with its single active session (if occupied) — tables grid */
export interface TableWithActiveSession extends Table {
  active_session: SessionWithOrders | null
}

// ---------------------------------------------------------------------------
// RPC parameter and return types
//
// Matches the v3 place_order DB function signature exactly.
// Client sends: product_id, quantity, choice_ids[] only.
// The DB function resolves all prices and names — nothing financial
// or descriptive comes from the client.
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
// Cart types — client-side only, never written to the DB directly.
// Built in CustomerApp state, serialised into PlaceOrderItem[] on submit.
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
// Database generic type — passed to createClient<Database>()
// Matches Supabase's auto-generated type structure exactly so the
// generated version (npm run db:types) is a drop-in replacement.
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
    }
  }
}