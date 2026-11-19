
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "addresses": {
                  Row: {
                    "area": string,"city": string,"contact_phone": string | null,"created_at": string,"customer_id": string,"id": string,"is_default": boolean,"label": string,"landmark": string | null,"location": unknown,"state": string,"street": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "area": string,"city"?: string,"contact_phone"?: string | null,"created_at"?: string,"customer_id": string,"id"?: string,"is_default"?: boolean,"label"?: string,"landmark"?: string | null,"location"?: unknown,"state"?: string,"street": string,"updated_at"?: string
                  }
                  Update: {
                    "area"?: string,"city"?: string,"contact_phone"?: string | null,"created_at"?: string,"customer_id"?: string,"id"?: string,"is_default"?: boolean,"label"?: string,"landmark"?: string | null,"location"?: unknown,"state"?: string,"street"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "addresses_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "addresses_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "wallet_balances"
      referencedColumns: ["customer_id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "created_at": string,"customer_id": string,"id": string,"last_message_at": string | null,"pharmacy_id": string,"reservation_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"customer_id": string,"id"?: string,"last_message_at"?: string | null,"pharmacy_id": string,"reservation_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"customer_id"?: string,"id"?: string,"last_message_at"?: string | null,"pharmacy_id"?: string,"reservation_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "wallet_balances"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "conversations_pharmacy_id_fkey"
      columns: ["pharmacy_id"]
isOneToOne: false
      referencedRelation: "pharmacies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_reservation_id_fkey"
      columns: ["reservation_id"]
isOneToOne: false
      referencedRelation: "reservations"
      referencedColumns: ["id"]
    }
                  ]
                },"customer_locations": {
                  Row: {
                    "accuracy_m": number | null,"address_line": string | null,"customer_id": string,"label": string,"lat": number,"lng": number,"location": unknown,"source": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accuracy_m"?: number | null,"address_line"?: string | null,"customer_id": string,"label": string,"lat": number,"lng": number,"location"?: never,"source"?: string,"updated_at"?: string
                  }
                  Update: {
                    "accuracy_m"?: number | null,"address_line"?: string | null,"customer_id"?: string,"label"?: string,"lat"?: number,"lng"?: number,"location"?: never,"source"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "customer_locations_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: true
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "customer_locations_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: true
      referencedRelation: "wallet_balances"
      referencedColumns: ["customer_id"]
    }
                  ]
                },"customers": {
                  Row: {
                    "appearance": Database["public"]['Enums']["appearance"],"avatar_path": string | null,"created_at": string,"email": string | null,"full_name": string,"id": string,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "appearance"?: Database["public"]['Enums']["appearance"],"avatar_path"?: string | null,"created_at"?: string,"email"?: string | null,"full_name"?: string,"id": string,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "appearance"?: Database["public"]['Enums']["appearance"],"avatar_path"?: string | null,"created_at"?: string,"email"?: string | null,"full_name"?: string,"id"?: string,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"inventory": {
                  Row: {
                    "created_at": string,"expiry_date": string | null,"id": string,"is_listed": boolean,"low_stock_threshold": number,"medicine_id": string,"pharmacy_id": string,"price_kobo": number,"quantity_in_stock": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expiry_date"?: string | null,"id"?: string,"is_listed"?: boolean,"low_stock_threshold"?: number,"medicine_id": string,"pharmacy_id": string,"price_kobo": number,"quantity_in_stock"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"expiry_date"?: string | null,"id"?: string,"is_listed"?: boolean,"low_stock_threshold"?: number,"medicine_id"?: string,"pharmacy_id"?: string,"price_kobo"?: number,"quantity_in_stock"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventory_medicine_id_fkey"
      columns: ["medicine_id"]
isOneToOne: false
      referencedRelation: "medicines"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_pharmacy_id_fkey"
      columns: ["pharmacy_id"]
isOneToOne: false
      referencedRelation: "pharmacies"
      referencedColumns: ["id"]
    }
                  ]
                },"medicine_photos": {
                  Row: {
                    "created_at": string,"id": string,"medicine_id": string,"sort_order": number,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"medicine_id": string,"sort_order"?: number,"storage_path": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"medicine_id"?: string,"sort_order"?: number,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "medicine_photos_medicine_id_fkey"
      columns: ["medicine_id"]
isOneToOne: false
      referencedRelation: "medicines"
      referencedColumns: ["id"]
    }
                  ]
                },"medicine_tags": {
                  Row: {
                    "medicine_id": string,"tag_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "medicine_id": string,"tag_id": string
                  }
                  Update: {
                    "medicine_id"?: string,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "medicine_tags_medicine_id_fkey"
      columns: ["medicine_id"]
isOneToOne: false
      referencedRelation: "medicines"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "medicine_tags_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id"]
    }
                  ]
                },"medicines": {
                  Row: {
                    "brand_name": string,"created_at": string,"description": string | null,"form": Database["public"]['Enums']["medicine_form"],"generic_name": string,"id": string,"manufacturer": string | null,"pack_size": string | null,"requires_prescription": boolean,"strength": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand_name": string,"created_at"?: string,"description"?: string | null,"form": Database["public"]['Enums']["medicine_form"],"generic_name": string,"id"?: string,"manufacturer"?: string | null,"pack_size"?: string | null,"requires_prescription"?: boolean,"strength"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "brand_name"?: string,"created_at"?: string,"description"?: string | null,"form"?: Database["public"]['Enums']["medicine_form"],"generic_name"?: string,"id"?: string,"manufacturer"?: string | null,"pack_size"?: string | null,"requires_prescription"?: boolean,"strength"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"messages": {
                  Row: {
                    "attachment_path": string | null,"body": string | null,"conversation_id": string,"created_at": string,"id": string,"read_at": string | null,"sender": Database["public"]['Enums']["actor_kind"],"sender_staff_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attachment_path"?: string | null,"body"?: string | null,"conversation_id": string,"created_at"?: string,"id"?: string,"read_at"?: string | null,"sender": Database["public"]['Enums']["actor_kind"],"sender_staff_id"?: string | null
                  }
                  Update: {
                    "attachment_path"?: string | null,"body"?: string | null,"conversation_id"?: string,"created_at"?: string,"id"?: string,"read_at"?: string | null,"sender"?: Database["public"]['Enums']["actor_kind"],"sender_staff_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_staff_id_fkey"
      columns: ["sender_staff_id"]
isOneToOne: false
      referencedRelation: "pharmacy_staff"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string,"conversation_id": string | null,"created_at": string,"customer_id": string | null,"id": string,"pharmacy_id": string | null,"read_at": string | null,"reservation_id": string | null,"title": string,"type": Database["public"]['Enums']["notification_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"conversation_id"?: string | null,"created_at"?: string,"customer_id"?: string | null,"id"?: string,"pharmacy_id"?: string | null,"read_at"?: string | null,"reservation_id"?: string | null,"title": string,"type": Database["public"]['Enums']["notification_type"]
                  }
                  Update: {
                    "body"?: string,"conversation_id"?: string | null,"created_at"?: string,"customer_id"?: string | null,"id"?: string,"pharmacy_id"?: string | null,"read_at"?: string | null,"reservation_id"?: string | null,"title"?: string,"type"?: Database["public"]['Enums']["notification_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "wallet_balances"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "notifications_pharmacy_id_fkey"
      columns: ["pharmacy_id"]
isOneToOne: false
      referencedRelation: "pharmacies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_reservation_id_fkey"
      columns: ["reservation_id"]
isOneToOne: false
      referencedRelation: "reservations"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount_kobo": number,"created_at": string,"customer_id": string,"failure_reason": string | null,"id": string,"method": Database["public"]['Enums']["payment_method"],"paid_at": string | null,"paystack_reference": string | null,"refunded_at": string | null,"reservation_id": string,"status": Database["public"]['Enums']["payment_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_kobo": number,"created_at"?: string,"customer_id": string,"failure_reason"?: string | null,"id"?: string,"method": Database["public"]['Enums']["payment_method"],"paid_at"?: string | null,"paystack_reference"?: string | null,"refunded_at"?: string | null,"reservation_id": string,"status"?: Database["public"]['Enums']["payment_status"],"updated_at"?: string
                  }
                  Update: {
                    "amount_kobo"?: number,"created_at"?: string,"customer_id"?: string,"failure_reason"?: string | null,"id"?: string,"method"?: Database["public"]['Enums']["payment_method"],"paid_at"?: string | null,"paystack_reference"?: string | null,"refunded_at"?: string | null,"reservation_id"?: string,"status"?: Database["public"]['Enums']["payment_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "wallet_balances"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "payments_reservation_id_fkey"
      columns: ["reservation_id"]
isOneToOne: false
      referencedRelation: "reservations"
      referencedColumns: ["id"]
    }
                  ]
                },"payouts": {
                  Row: {
                    "commission_kobo": number,"counter_sales_kobo": number,"created_at": string,"id": string,"net_kobo": number,"online_sales_kobo": number,"order_count": number,"paid_at": string | null,"paystack_transfer_reference": string | null,"period_end": string,"period_start": string,"pharmacy_id": string,"scheduled_for": string,"status": Database["public"]['Enums']["payout_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "commission_kobo"?: number,"counter_sales_kobo"?: number,"created_at"?: string,"id"?: string,"net_kobo": number,"online_sales_kobo"?: number,"order_count"?: number,"paid_at"?: string | null,"paystack_transfer_reference"?: string | null,"period_end": string,"period_start": string,"pharmacy_id": string,"scheduled_for": string,"status"?: Database["public"]['Enums']["payout_status"],"updated_at"?: string
                  }
                  Update: {
                    "commission_kobo"?: number,"counter_sales_kobo"?: number,"created_at"?: string,"id"?: string,"net_kobo"?: number,"online_sales_kobo"?: number,"order_count"?: number,"paid_at"?: string | null,"paystack_transfer_reference"?: string | null,"period_end"?: string,"period_start"?: string,"pharmacy_id"?: string,"scheduled_for"?: string,"status"?: Database["public"]['Enums']["payout_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payouts_pharmacy_id_fkey"
      columns: ["pharmacy_id"]
isOneToOne: false
      referencedRelation: "pharmacies"
      referencedColumns: ["id"]
    }
                  ]
                },"pharmacies": {
                  Row: {
                    "area": string,"city": string,"created_at": string,"email": string | null,"id": string,"is_live": boolean,"licence_number": string | null,"location": unknown,"name": string,"offers_delivery": boolean,"open_24_hours": boolean,"opening_hours": NonNullable<Json>,"pharmacist_in_charge": string | null,"phone": string,"services": (string)[],"state": string,"street": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "area": string,"city"?: string,"created_at"?: string,"email"?: string | null,"id"?: string,"is_live"?: boolean,"licence_number"?: string | null,"location": unknown,"name": string,"offers_delivery"?: boolean,"open_24_hours"?: boolean,"opening_hours"?: NonNullable<Json>,"pharmacist_in_charge"?: string | null,"phone": string,"services"?: (string)[],"state"?: string,"street": string,"updated_at"?: string
                  }
                  Update: {
                    "area"?: string,"city"?: string,"created_at"?: string,"email"?: string | null,"id"?: string,"is_live"?: boolean,"licence_number"?: string | null,"location"?: unknown,"name"?: string,"offers_delivery"?: boolean,"open_24_hours"?: boolean,"opening_hours"?: NonNullable<Json>,"pharmacist_in_charge"?: string | null,"phone"?: string,"services"?: (string)[],"state"?: string,"street"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"pharmacy_payout_accounts": {
                  Row: {
                    "account_name": string,"account_number": string,"bank_name": string,"created_at": string,"paystack_recipient_code": string | null,"pharmacy_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_name": string,"account_number": string,"bank_name": string,"created_at"?: string,"paystack_recipient_code"?: string | null,"pharmacy_id": string,"updated_at"?: string
                  }
                  Update: {
                    "account_name"?: string,"account_number"?: string,"bank_name"?: string,"created_at"?: string,"paystack_recipient_code"?: string | null,"pharmacy_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pharmacy_payout_accounts_pharmacy_id_fkey"
      columns: ["pharmacy_id"]
isOneToOne: true
      referencedRelation: "pharmacies"
      referencedColumns: ["id"]
    }
                  ]
                },"pharmacy_staff": {
                  Row: {
                    "created_at": string,"email": string,"failed_passcode_attempts": number,"full_name": string,"id": string,"is_active": boolean,"locked_until": string | null,"passcode_hash": string | null,"pharmacy_id": string,"role": Database["public"]['Enums']["staff_role"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"failed_passcode_attempts"?: number,"full_name": string,"id"?: string,"is_active"?: boolean,"locked_until"?: string | null,"passcode_hash"?: string | null,"pharmacy_id": string,"role": Database["public"]['Enums']["staff_role"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"failed_passcode_attempts"?: number,"full_name"?: string,"id"?: string,"is_active"?: boolean,"locked_until"?: string | null,"passcode_hash"?: string | null,"pharmacy_id"?: string,"role"?: Database["public"]['Enums']["staff_role"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pharmacy_staff_pharmacy_id_fkey"
      columns: ["pharmacy_id"]
isOneToOne: false
      referencedRelation: "pharmacies"
      referencedColumns: ["id"]
    }
                  ]
                },"prescription_checks": {
                  Row: {
                    "check": Database["public"]['Enums']["prescription_check"],"checked_at": string,"checked_by_staff_id": string,"reservation_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "check": Database["public"]['Enums']["prescription_check"],"checked_at"?: string,"checked_by_staff_id": string,"reservation_id": string
                  }
                  Update: {
                    "check"?: Database["public"]['Enums']["prescription_check"],"checked_at"?: string,"checked_by_staff_id"?: string,"reservation_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "prescription_checks_checked_by_staff_id_fkey"
      columns: ["checked_by_staff_id"]
isOneToOne: false
      referencedRelation: "pharmacy_staff"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "prescription_checks_reservation_id_fkey"
      columns: ["reservation_id"]
isOneToOne: false
      referencedRelation: "reservations"
      referencedColumns: ["id"]
    }
                  ]
                },"prescriptions": {
                  Row: {
                    "created_at": string,"customer_id": string,"id": string,"patient_age_years": number | null,"patient_name": string | null,"prescriber_name": string | null,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"customer_id": string,"id"?: string,"patient_age_years"?: number | null,"patient_name"?: string | null,"prescriber_name"?: string | null,"storage_path": string
                  }
                  Update: {
                    "created_at"?: string,"customer_id"?: string,"id"?: string,"patient_age_years"?: number | null,"patient_name"?: string | null,"prescriber_name"?: string | null,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "prescriptions_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "prescriptions_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "wallet_balances"
      referencedColumns: ["customer_id"]
    }
                  ]
                },"ratings": {
                  Row: {
                    "comment": string | null,"created_at": string,"customer_id": string,"id": string,"pharmacy_id": string,"reservation_id": string,"stars": number
                  }
                  ComputedFields: never
                  Insert: {
                    "comment"?: string | null,"created_at"?: string,"customer_id": string,"id"?: string,"pharmacy_id": string,"reservation_id": string,"stars": number
                  }
                  Update: {
                    "comment"?: string | null,"created_at"?: string,"customer_id"?: string,"id"?: string,"pharmacy_id"?: string,"reservation_id"?: string,"stars"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "ratings_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ratings_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "wallet_balances"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "ratings_pharmacy_id_fkey"
      columns: ["pharmacy_id"]
isOneToOne: false
      referencedRelation: "pharmacies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ratings_reservation_id_fkey"
      columns: ["reservation_id"]
isOneToOne: true
      referencedRelation: "reservations"
      referencedColumns: ["id"]
    }
                  ]
                },"reservation_items": {
                  Row: {
                    "id": string,"inventory_id": string | null,"line_total_kobo": number | null,"medicine_id": string,"medicine_name": string,"quantity": number,"reservation_id": string,"unit_price_kobo": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"inventory_id"?: string | null,"line_total_kobo"?: never,"medicine_id": string,"medicine_name": string,"quantity": number,"reservation_id": string,"unit_price_kobo": number
                  }
                  Update: {
                    "id"?: string,"inventory_id"?: string | null,"line_total_kobo"?: never,"medicine_id"?: string,"medicine_name"?: string,"quantity"?: number,"reservation_id"?: string,"unit_price_kobo"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "reservation_items_inventory_id_fkey"
      columns: ["inventory_id"]
isOneToOne: false
      referencedRelation: "inventory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservation_items_medicine_id_fkey"
      columns: ["medicine_id"]
isOneToOne: false
      referencedRelation: "medicines"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservation_items_reservation_id_fkey"
      columns: ["reservation_id"]
isOneToOne: false
      referencedRelation: "reservations"
      referencedColumns: ["id"]
    }
                  ]
                },"reservation_status_history": {
                  Row: {
                    "actor": Database["public"]['Enums']["actor_kind"],"actor_staff_id": string | null,"created_at": string,"from_status": Database["public"]['Enums']["reservation_status"] | null,"id": string,"note": string | null,"reservation_id": string,"to_status": Database["public"]['Enums']["reservation_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actor": Database["public"]['Enums']["actor_kind"],"actor_staff_id"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["reservation_status"] | null,"id"?: string,"note"?: string | null,"reservation_id": string,"to_status": Database["public"]['Enums']["reservation_status"]
                  }
                  Update: {
                    "actor"?: Database["public"]['Enums']["actor_kind"],"actor_staff_id"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["reservation_status"] | null,"id"?: string,"note"?: string | null,"reservation_id"?: string,"to_status"?: Database["public"]['Enums']["reservation_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reservation_status_history_actor_staff_id_fkey"
      columns: ["actor_staff_id"]
isOneToOne: false
      referencedRelation: "pharmacy_staff"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservation_status_history_reservation_id_fkey"
      columns: ["reservation_id"]
isOneToOne: false
      referencedRelation: "reservations"
      referencedColumns: ["id"]
    }
                  ]
                },"reservations": {
                  Row: {
                    "approval_deadline": string,"approved_at": string | null,"approved_by_staff_id": string | null,"cancelled_at": string | null,"commission_kobo": number | null,"completed_at": string | null,"completed_by_staff_id": string | null,"created_at": string,"customer_id": string,"customer_note": string | null,"decline_reason": string | null,"declined_at": string | null,"declined_by_staff_id": string | null,"delivery_address": Json | null,"delivery_address_id": string | null,"delivery_fee_kobo": number,"expired_at": string | null,"fulfilment": Database["public"]['Enums']["fulfilment"],"handed_to_rider_at": string | null,"id": string,"kind": Database["public"]['Enums']["order_kind"],"payment_method": Database["public"]['Enums']["payment_method"],"payout_id": string | null,"pharmacy_id": string,"pickup_code": string | null,"pickup_deadline": string | null,"pickup_warned_15_at": string | null,"pickup_warned_30_at": string | null,"placed_at": string,"prescription_id": string | null,"ready_at": string | null,"ref_code": string,"rider_name": string | null,"rider_phone": string | null,"service_fee_kobo": number,"status": Database["public"]['Enums']["reservation_status"],"subtotal_kobo": number,"total_kobo": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approval_deadline": string,"approved_at"?: string | null,"approved_by_staff_id"?: string | null,"cancelled_at"?: string | null,"commission_kobo"?: number | null,"completed_at"?: string | null,"completed_by_staff_id"?: string | null,"created_at"?: string,"customer_id": string,"customer_note"?: string | null,"decline_reason"?: string | null,"declined_at"?: string | null,"declined_by_staff_id"?: string | null,"delivery_address"?: Json | null,"delivery_address_id"?: string | null,"delivery_fee_kobo": number,"expired_at"?: string | null,"fulfilment": Database["public"]['Enums']["fulfilment"],"handed_to_rider_at"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["order_kind"],"payment_method": Database["public"]['Enums']["payment_method"],"payout_id"?: string | null,"pharmacy_id": string,"pickup_code"?: string | null,"pickup_deadline"?: string | null,"pickup_warned_15_at"?: string | null,"pickup_warned_30_at"?: string | null,"placed_at"?: string,"prescription_id"?: string | null,"ready_at"?: string | null,"ref_code"?: string,"rider_name"?: string | null,"rider_phone"?: string | null,"service_fee_kobo"?: number,"status"?: Database["public"]['Enums']["reservation_status"],"subtotal_kobo": number,"total_kobo": number,"updated_at"?: string
                  }
                  Update: {
                    "approval_deadline"?: string,"approved_at"?: string | null,"approved_by_staff_id"?: string | null,"cancelled_at"?: string | null,"commission_kobo"?: number | null,"completed_at"?: string | null,"completed_by_staff_id"?: string | null,"created_at"?: string,"customer_id"?: string,"customer_note"?: string | null,"decline_reason"?: string | null,"declined_at"?: string | null,"declined_by_staff_id"?: string | null,"delivery_address"?: Json | null,"delivery_address_id"?: string | null,"delivery_fee_kobo"?: number,"expired_at"?: string | null,"fulfilment"?: Database["public"]['Enums']["fulfilment"],"handed_to_rider_at"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["order_kind"],"payment_method"?: Database["public"]['Enums']["payment_method"],"payout_id"?: string | null,"pharmacy_id"?: string,"pickup_code"?: string | null,"pickup_deadline"?: string | null,"pickup_warned_15_at"?: string | null,"pickup_warned_30_at"?: string | null,"placed_at"?: string,"prescription_id"?: string | null,"ready_at"?: string | null,"ref_code"?: string,"rider_name"?: string | null,"rider_phone"?: string | null,"service_fee_kobo"?: number,"status"?: Database["public"]['Enums']["reservation_status"],"subtotal_kobo"?: number,"total_kobo"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reservations_approved_by_staff_id_fkey"
      columns: ["approved_by_staff_id"]
isOneToOne: false
      referencedRelation: "pharmacy_staff"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservations_completed_by_staff_id_fkey"
      columns: ["completed_by_staff_id"]
isOneToOne: false
      referencedRelation: "pharmacy_staff"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservations_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservations_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "wallet_balances"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "reservations_declined_by_staff_id_fkey"
      columns: ["declined_by_staff_id"]
isOneToOne: false
      referencedRelation: "pharmacy_staff"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservations_delivery_address_id_fkey"
      columns: ["delivery_address_id"]
isOneToOne: false
      referencedRelation: "addresses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservations_payout_id_fkey"
      columns: ["payout_id"]
isOneToOne: false
      referencedRelation: "payouts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservations_pharmacy_id_fkey"
      columns: ["pharmacy_id"]
isOneToOne: false
      referencedRelation: "pharmacies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservations_prescription_id_fkey"
      columns: ["prescription_id"]
isOneToOne: false
      referencedRelation: "prescriptions"
      referencedColumns: ["id"]
    }
                  ]
                },"saved_medicines": {
                  Row: {
                    "created_at": string,"customer_id": string,"id": string,"medicine_id": string,"pharmacy_id": string | null,"usual_quantity": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"customer_id": string,"id"?: string,"medicine_id": string,"pharmacy_id"?: string | null,"usual_quantity"?: number
                  }
                  Update: {
                    "created_at"?: string,"customer_id"?: string,"id"?: string,"medicine_id"?: string,"pharmacy_id"?: string | null,"usual_quantity"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_medicines_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saved_medicines_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "wallet_balances"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "saved_medicines_medicine_id_fkey"
      columns: ["medicine_id"]
isOneToOne: false
      referencedRelation: "medicines"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saved_medicines_pharmacy_id_fkey"
      columns: ["pharmacy_id"]
isOneToOne: false
      referencedRelation: "pharmacies"
      referencedColumns: ["id"]
    }
                  ]
                },"shifts": {
                  Row: {
                    "clock_in_at": string,"clock_out_at": string | null,"created_at": string,"id": string,"pharmacy_id": string,"staff_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "clock_in_at"?: string,"clock_out_at"?: string | null,"created_at"?: string,"id"?: string,"pharmacy_id": string,"staff_id": string,"updated_at"?: string
                  }
                  Update: {
                    "clock_in_at"?: string,"clock_out_at"?: string | null,"created_at"?: string,"id"?: string,"pharmacy_id"?: string,"staff_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shifts_pharmacy_id_fkey"
      columns: ["pharmacy_id"]
isOneToOne: false
      referencedRelation: "pharmacies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "shifts_staff_id_fkey"
      columns: ["staff_id"]
isOneToOne: false
      referencedRelation: "pharmacy_staff"
      referencedColumns: ["id"]
    }
                  ]
                },"staff_sessions": {
                  Row: {
                    "auth_session_id": string,"id": string,"staff_id": string,"unlocked_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auth_session_id": string,"id"?: string,"staff_id": string,"unlocked_at"?: string
                  }
                  Update: {
                    "auth_session_id"?: string,"id"?: string,"staff_id"?: string,"unlocked_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "staff_sessions_staff_id_fkey"
      columns: ["staff_id"]
isOneToOne: false
      referencedRelation: "pharmacy_staff"
      referencedColumns: ["id"]
    }
                  ]
                },"tags": {
                  Row: {
                    "created_at": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"wallet_transactions": {
                  Row: {
                    "amount_kobo": number,"balance_after_kobo": number,"created_at": string,"customer_id": string,"description": string,"id": string,"kind": Database["public"]['Enums']["wallet_tx_kind"],"payment_id": string | null,"paystack_reference": string | null,"reservation_id": string | null,"seq": number
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_kobo": number,"balance_after_kobo": number,"created_at"?: string,"customer_id": string,"description": string,"id"?: string,"kind": Database["public"]['Enums']["wallet_tx_kind"],"payment_id"?: string | null,"paystack_reference"?: string | null,"reservation_id"?: string | null,"seq"?: never
                  }
                  Update: {
                    "amount_kobo"?: number,"balance_after_kobo"?: number,"created_at"?: string,"customer_id"?: string,"description"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["wallet_tx_kind"],"payment_id"?: string | null,"paystack_reference"?: string | null,"reservation_id"?: string | null,"seq"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "wallet_transactions_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "wallet_transactions_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "wallet_balances"
      referencedColumns: ["customer_id"]
    },{
      foreignKeyName: "wallet_transactions_payment_id_fkey"
      columns: ["payment_id"]
isOneToOne: false
      referencedRelation: "payments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "wallet_transactions_reservation_id_fkey"
      columns: ["reservation_id"]
isOneToOne: false
      referencedRelation: "reservations"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "pharmacy_rating_summary": {
                  Row: {
                    "average_stars": number | null,"pharmacy_id": string,"rating_count": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "ratings_pharmacy_id_fkey"
      columns: ["pharmacy_id"]
isOneToOne: false
      referencedRelation: "pharmacies"
      referencedColumns: ["id"]
    }
                  ]
                },"wallet_balances": {
                  Row: {
                    "balance_kobo": number | null,"customer_id": string
                  }
                  ComputedFields: never
                  Insert: {
                           "balance_kobo"?: never,"customer_id"?: string | null
                         }
                        Update: {
                           "balance_kobo"?: never,"customer_id"?: string | null
                         }
                        Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "approve_reservation":
{ Args: { "p_reservation_id": string }; Returns: {
              "approval_deadline": string,
"approved_at": string | null,
"approved_by_staff_id": string | null,
"cancelled_at": string | null,
"commission_kobo": number | null,
"completed_at": string | null,
"completed_by_staff_id": string | null,
"created_at": string,
"customer_id": string,
"customer_note": string | null,
"decline_reason": string | null,
"declined_at": string | null,
"declined_by_staff_id": string | null,
"delivery_address": Json | null,
"delivery_address_id": string | null,
"delivery_fee_kobo": number,
"expired_at": string | null,
"fulfilment": Database["public"]['Enums']["fulfilment"],
"handed_to_rider_at": string | null,
"id": string,
"kind": Database["public"]['Enums']["order_kind"],
"payment_method": Database["public"]['Enums']["payment_method"],
"payout_id": string | null,
"pharmacy_id": string,
"pickup_code": string | null,
"pickup_deadline": string | null,
"pickup_warned_15_at": string | null,
"pickup_warned_30_at": string | null,
"placed_at": string,
"prescription_id": string | null,
"ready_at": string | null,
"ref_code": string,
"rider_name": string | null,
"rider_phone": string | null,
"service_fee_kobo": number,
"status": Database["public"]['Enums']["reservation_status"],
"subtotal_kobo": number,
"total_kobo": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "reservations"
        isOneToOne: true
        isSetofReturn: false
      } },
"cancel_reservation":
{ Args: { "p_reservation_id": string }; Returns: {
              "approval_deadline": string,
"approved_at": string | null,
"approved_by_staff_id": string | null,
"cancelled_at": string | null,
"commission_kobo": number | null,
"completed_at": string | null,
"completed_by_staff_id": string | null,
"created_at": string,
"customer_id": string,
"customer_note": string | null,
"decline_reason": string | null,
"declined_at": string | null,
"declined_by_staff_id": string | null,
"delivery_address": Json | null,
"delivery_address_id": string | null,
"delivery_fee_kobo": number,
"expired_at": string | null,
"fulfilment": Database["public"]['Enums']["fulfilment"],
"handed_to_rider_at": string | null,
"id": string,
"kind": Database["public"]['Enums']["order_kind"],
"payment_method": Database["public"]['Enums']["payment_method"],
"payout_id": string | null,
"pharmacy_id": string,
"pickup_code": string | null,
"pickup_deadline": string | null,
"pickup_warned_15_at": string | null,
"pickup_warned_30_at": string | null,
"placed_at": string,
"prescription_id": string | null,
"ready_at": string | null,
"ref_code": string,
"rider_name": string | null,
"rider_phone": string | null,
"service_fee_kobo": number,
"status": Database["public"]['Enums']["reservation_status"],
"subtotal_kobo": number,
"total_kobo": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "reservations"
        isOneToOne: true
        isSetofReturn: false
      } },
"clock_in":
{ Args: { "p_pharmacy_id": string }; Returns: {
              "clock_in_at": string,
"clock_out_at": string | null,
"created_at": string,
"id": string,
"pharmacy_id": string,
"staff_id": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "shifts"
        isOneToOne: true
        isSetofReturn: false
      } },
"clock_out":
{ Args: { "p_pharmacy_id": string }; Returns: {
              "clock_in_at": string,
"clock_out_at": string | null,
"created_at": string,
"id": string,
"pharmacy_id": string,
"staff_id": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "shifts"
        isOneToOne: true
        isSetofReturn: false
      } },
"complete_delivery":
{ Args: { "p_reservation_id": string }; Returns: {
              "approval_deadline": string,
"approved_at": string | null,
"approved_by_staff_id": string | null,
"cancelled_at": string | null,
"commission_kobo": number | null,
"completed_at": string | null,
"completed_by_staff_id": string | null,
"created_at": string,
"customer_id": string,
"customer_note": string | null,
"decline_reason": string | null,
"declined_at": string | null,
"declined_by_staff_id": string | null,
"delivery_address": Json | null,
"delivery_address_id": string | null,
"delivery_fee_kobo": number,
"expired_at": string | null,
"fulfilment": Database["public"]['Enums']["fulfilment"],
"handed_to_rider_at": string | null,
"id": string,
"kind": Database["public"]['Enums']["order_kind"],
"payment_method": Database["public"]['Enums']["payment_method"],
"payout_id": string | null,
"pharmacy_id": string,
"pickup_code": string | null,
"pickup_deadline": string | null,
"pickup_warned_15_at": string | null,
"pickup_warned_30_at": string | null,
"placed_at": string,
"prescription_id": string | null,
"ready_at": string | null,
"ref_code": string,
"rider_name": string | null,
"rider_phone": string | null,
"service_fee_kobo": number,
"status": Database["public"]['Enums']["reservation_status"],
"subtotal_kobo": number,
"total_kobo": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "reservations"
        isOneToOne: true
        isSetofReturn: false
      } },
"complete_pickup":
{ Args: { "p_pickup_code": string,"p_reservation_id": string }; Returns: {
              "approval_deadline": string,
"approved_at": string | null,
"approved_by_staff_id": string | null,
"cancelled_at": string | null,
"commission_kobo": number | null,
"completed_at": string | null,
"completed_by_staff_id": string | null,
"created_at": string,
"customer_id": string,
"customer_note": string | null,
"decline_reason": string | null,
"declined_at": string | null,
"declined_by_staff_id": string | null,
"delivery_address": Json | null,
"delivery_address_id": string | null,
"delivery_fee_kobo": number,
"expired_at": string | null,
"fulfilment": Database["public"]['Enums']["fulfilment"],
"handed_to_rider_at": string | null,
"id": string,
"kind": Database["public"]['Enums']["order_kind"],
"payment_method": Database["public"]['Enums']["payment_method"],
"payout_id": string | null,
"pharmacy_id": string,
"pickup_code": string | null,
"pickup_deadline": string | null,
"pickup_warned_15_at": string | null,
"pickup_warned_30_at": string | null,
"placed_at": string,
"prescription_id": string | null,
"ready_at": string | null,
"ref_code": string,
"rider_name": string | null,
"rider_phone": string | null,
"service_fee_kobo": number,
"status": Database["public"]['Enums']["reservation_status"],
"subtotal_kobo": number,
"total_kobo": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "reservations"
        isOneToOne: true
        isSetofReturn: false
      } },
"create_staff_passcode":
{ Args: { "p_staff_id": string }; Returns: string
                           },
"decline_reservation":
{ Args: { "p_reason": string,"p_reservation_id": string }; Returns: {
              "approval_deadline": string,
"approved_at": string | null,
"approved_by_staff_id": string | null,
"cancelled_at": string | null,
"commission_kobo": number | null,
"completed_at": string | null,
"completed_by_staff_id": string | null,
"created_at": string,
"customer_id": string,
"customer_note": string | null,
"decline_reason": string | null,
"declined_at": string | null,
"declined_by_staff_id": string | null,
"delivery_address": Json | null,
"delivery_address_id": string | null,
"delivery_fee_kobo": number,
"expired_at": string | null,
"fulfilment": Database["public"]['Enums']["fulfilment"],
"handed_to_rider_at": string | null,
"id": string,
"kind": Database["public"]['Enums']["order_kind"],
"payment_method": Database["public"]['Enums']["payment_method"],
"payout_id": string | null,
"pharmacy_id": string,
"pickup_code": string | null,
"pickup_deadline": string | null,
"pickup_warned_15_at": string | null,
"pickup_warned_30_at": string | null,
"placed_at": string,
"prescription_id": string | null,
"ready_at": string | null,
"ref_code": string,
"rider_name": string | null,
"rider_phone": string | null,
"service_fee_kobo": number,
"status": Database["public"]['Enums']["reservation_status"],
"subtotal_kobo": number,
"total_kobo": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "reservations"
        isOneToOne: true
        isSetofReturn: false
      } },
"expire_overdue_reservations":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"generate_payouts":
{ Args: { "p_date"?: string }; Returns: number
                           },
"lock_staff":
{ Args: { "p_pharmacy_id": string }; Returns: undefined
                           },
"mark_payment_failed":
{ Args: { "p_payment_id": string,"p_reason": string }; Returns: {
              "amount_kobo": number,
"created_at": string,
"customer_id": string,
"failure_reason": string | null,
"id": string,
"method": Database["public"]['Enums']["payment_method"],
"paid_at": string | null,
"paystack_reference": string | null,
"refunded_at": string | null,
"reservation_id": string,
"status": Database["public"]['Enums']["payment_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "payments"
        isOneToOne: true
        isSetofReturn: false
      } },
"mark_payment_succeeded":
{ Args: { "p_payment_id": string,"p_paystack_reference": string }; Returns: {
              "amount_kobo": number,
"created_at": string,
"customer_id": string,
"failure_reason": string | null,
"id": string,
"method": Database["public"]['Enums']["payment_method"],
"paid_at": string | null,
"paystack_reference": string | null,
"refunded_at": string | null,
"reservation_id": string,
"status": Database["public"]['Enums']["payment_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "payments"
        isOneToOne: true
        isSetofReturn: false
      } },
"mark_payout_paid":
{ Args: { "p_payout_id": string,"p_transfer_reference": string }; Returns: {
              "commission_kobo": number,
"counter_sales_kobo": number,
"created_at": string,
"id": string,
"net_kobo": number,
"online_sales_kobo": number,
"order_count": number,
"paid_at": string | null,
"paystack_transfer_reference": string | null,
"period_end": string,
"period_start": string,
"pharmacy_id": string,
"scheduled_for": string,
"status": Database["public"]['Enums']["payout_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "payouts"
        isOneToOne: true
        isSetofReturn: false
      } },
"mark_ready":
{ Args: { "p_reservation_id": string,"p_rider_name"?: string,"p_rider_phone"?: string }; Returns: {
              "approval_deadline": string,
"approved_at": string | null,
"approved_by_staff_id": string | null,
"cancelled_at": string | null,
"commission_kobo": number | null,
"completed_at": string | null,
"completed_by_staff_id": string | null,
"created_at": string,
"customer_id": string,
"customer_note": string | null,
"decline_reason": string | null,
"declined_at": string | null,
"declined_by_staff_id": string | null,
"delivery_address": Json | null,
"delivery_address_id": string | null,
"delivery_fee_kobo": number,
"expired_at": string | null,
"fulfilment": Database["public"]['Enums']["fulfilment"],
"handed_to_rider_at": string | null,
"id": string,
"kind": Database["public"]['Enums']["order_kind"],
"payment_method": Database["public"]['Enums']["payment_method"],
"payout_id": string | null,
"pharmacy_id": string,
"pickup_code": string | null,
"pickup_deadline": string | null,
"pickup_warned_15_at": string | null,
"pickup_warned_30_at": string | null,
"placed_at": string,
"prescription_id": string | null,
"ready_at": string | null,
"ref_code": string,
"rider_name": string | null,
"rider_phone": string | null,
"service_fee_kobo": number,
"status": Database["public"]['Enums']["reservation_status"],
"subtotal_kobo": number,
"total_kobo": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "reservations"
        isOneToOne: true
        isSetofReturn: false
      } },
"nearby_pharmacies":
{ Args: { "p_lat": number,"p_lng": number,"p_medicine_id"?: string,"p_radius_km"?: number }; Returns: {
              "area": string,"average_stars": number,"distance_km": number,"in_stock": boolean,"inventory_id": string,"name": string,"offers_delivery": boolean,"open_24_hours": boolean,"pharmacy_id": string,"price_kobo": number
            }[]
                           },
"place_reservation":
{ Args: { "p_delivery_address_id"?: string,"p_fulfilment": Database["public"]['Enums']["fulfilment"],"p_items": Json,"p_note"?: string,"p_payment_method": Database["public"]['Enums']["payment_method"],"p_pharmacy_id": string,"p_prescription_id"?: string }; Returns: {
              "approval_deadline": string,
"approved_at": string | null,
"approved_by_staff_id": string | null,
"cancelled_at": string | null,
"commission_kobo": number | null,
"completed_at": string | null,
"completed_by_staff_id": string | null,
"created_at": string,
"customer_id": string,
"customer_note": string | null,
"decline_reason": string | null,
"declined_at": string | null,
"declined_by_staff_id": string | null,
"delivery_address": Json | null,
"delivery_address_id": string | null,
"delivery_fee_kobo": number,
"expired_at": string | null,
"fulfilment": Database["public"]['Enums']["fulfilment"],
"handed_to_rider_at": string | null,
"id": string,
"kind": Database["public"]['Enums']["order_kind"],
"payment_method": Database["public"]['Enums']["payment_method"],
"payout_id": string | null,
"pharmacy_id": string,
"pickup_code": string | null,
"pickup_deadline": string | null,
"pickup_warned_15_at": string | null,
"pickup_warned_30_at": string | null,
"placed_at": string,
"prescription_id": string | null,
"ready_at": string | null,
"ref_code": string,
"rider_name": string | null,
"rider_phone": string | null,
"service_fee_kobo": number,
"status": Database["public"]['Enums']["reservation_status"],
"subtotal_kobo": number,
"total_kobo": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "reservations"
        isOneToOne: true
        isSetofReturn: false
      } },
"record_wallet_top_up":
{ Args: { "p_amount_kobo": number,"p_customer_id": string,"p_paystack_reference": string }; Returns: {
              "amount_kobo": number,
"balance_after_kobo": number,
"created_at": string,
"customer_id": string,
"description": string,
"id": string,
"kind": Database["public"]['Enums']["wallet_tx_kind"],
"payment_id": string | null,
"paystack_reference": string | null,
"reservation_id": string | null,
"seq": number
            }
                          SetofOptions: {
        from: "*"
        to: "wallet_transactions"
        isOneToOne: true
        isSetofReturn: false
      } },
"send_pickup_warnings":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"set_prescription_check":
{ Args: { "p_check": Database["public"]['Enums']["prescription_check"],"p_reservation_id": string,"p_ticked"?: boolean }; Returns: undefined
                           },
"unlock_staff":
{ Args: { "p_passcode": string,"p_pharmacy_id": string }; Returns: string
                           }
          }
          Enums: {
            "actor_kind": "customer"|"staff"|"system","appearance": "system"|"light"|"dark","fulfilment": "pickup"|"delivery","medicine_form": "tablet"|"capsule"|"syrup"|"suspension"|"injection"|"inhaler"|"cream"|"drops"|"sachet"|"other","notification_type": "new_reservation"|"reservation_approved"|"reservation_declined"|"reservation_ready"|"out_for_delivery"|"reservation_completed"|"reservation_expired"|"reservation_cancelled"|"pickup_30_min_left"|"pickup_15_min_left"|"refund_issued"|"new_message"|"payout_sent"|"low_stock","order_kind": "otc"|"prescription","payment_method": "wallet"|"card"|"bank_transfer"|"at_pharmacy","payment_status": "pending"|"succeeded"|"failed"|"refunded","payout_status": "scheduled"|"processing"|"paid"|"failed"|"pharmacy_owes","prescription_check": "medicine_and_dosage"|"patient_name_and_age"|"prescriber_name_and_signature"|"dose_suits_patient_age","reservation_status": "pending"|"approved"|"ready_for_pickup"|"out_for_delivery"|"completed"|"declined"|"expired"|"cancelled","staff_role": "owner"|"manager"|"pharmacist"|"assistant","wallet_tx_kind": "top_up"|"payment"|"refund"|"adjustment"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "actor_kind": ["customer", "staff", "system"],"appearance": ["system", "light", "dark"],"fulfilment": ["pickup", "delivery"],"medicine_form": ["tablet", "capsule", "syrup", "suspension", "injection", "inhaler", "cream", "drops", "sachet", "other"],"notification_type": ["new_reservation", "reservation_approved", "reservation_declined", "reservation_ready", "out_for_delivery", "reservation_completed", "reservation_expired", "reservation_cancelled", "pickup_30_min_left", "pickup_15_min_left", "refund_issued", "new_message", "payout_sent", "low_stock"],"order_kind": ["otc", "prescription"],"payment_method": ["wallet", "card", "bank_transfer", "at_pharmacy"],"payment_status": ["pending", "succeeded", "failed", "refunded"],"payout_status": ["scheduled", "processing", "paid", "failed", "pharmacy_owes"],"prescription_check": ["medicine_and_dosage", "patient_name_and_age", "prescriber_name_and_signature", "dose_suits_patient_age"],"reservation_status": ["pending", "approved", "ready_for_pickup", "out_for_delivery", "completed", "declined", "expired", "cancelled"],"staff_role": ["owner", "manager", "pharmacist", "assistant"],"wallet_tx_kind": ["top_up", "payment", "refund", "adjustment"]
          }
        }
} as const
