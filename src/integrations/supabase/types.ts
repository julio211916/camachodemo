export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_chat_history: {
        Row: {
          conversation_type: string
          created_at: string
          id: string
          messages: Json
          patient_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          conversation_type?: string
          created_at?: string
          id?: string
          messages?: Json
          patient_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          conversation_type?: string
          created_at?: string
          id?: string
          messages?: Json
          patient_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          context: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string
          doctor_id: string | null
          id: string
          location_id: string
          location_name: string
          notes: string | null
          patient_email: string
          patient_name: string
          patient_phone: string
          referral_code: string | null
          referred_by: string | null
          reminder_sent: string | null
          review_sent_at: string | null
          review_token: string | null
          service_id: string
          service_name: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          location_id: string
          location_name: string
          notes?: string | null
          patient_email: string
          patient_name: string
          patient_phone: string
          referral_code?: string | null
          referred_by?: string | null
          reminder_sent?: string | null
          review_sent_at?: string | null
          review_token?: string | null
          service_id: string
          service_name: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          location_id?: string
          location_name?: string
          notes?: string | null
          patient_email?: string
          patient_name?: string
          patient_phone?: string
          referral_code?: string | null
          referred_by?: string | null
          reminder_sent?: string | null
          review_sent_at?: string | null
          review_token?: string | null
          service_id?: string
          service_name?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          author_name: string | null
          content: string
          cover_image: string | null
          created_at: string
          display_order: number | null
          excerpt: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          content: string
          cover_image?: string | null
          created_at?: string
          display_order?: number | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          display_order?: number | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      branch_settings: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          location_id: string
          razon_social: string | null
          rfc: string | null
          timezone: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          location_id: string
          razon_social?: string | null
          rfc?: string | null
          timezone?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          location_id?: string
          razon_social?: string | null
          rfc?: string | null
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_settings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          client_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          session_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          session_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_amount: number | null
          difference: number | null
          expected_amount: number | null
          id: string
          location_id: string
          notes: string | null
          opened_at: string
          opened_by: string | null
          opening_amount: number
          status: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          difference?: number | null
          expected_amount?: number | null
          id?: string
          location_id: string
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_amount?: number
          status?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          difference?: number | null
          expected_amount?: number | null
          id?: string
          location_id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_amount?: number
          status?: string
        }
        Relationships: []
      }
      cash_registers: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          current_amount: number | null
          id: string
          location_id: string | null
          name: string
          opened_at: string | null
          opened_by: string | null
          opening_amount: number | null
          status: string | null
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          current_amount?: number | null
          id?: string
          location_id?: string | null
          name: string
          opened_at?: string | null
          opened_by?: string | null
          opening_amount?: number | null
          status?: string | null
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          current_amount?: number | null
          id?: string
          location_id?: string | null
          name?: string
          opened_at?: string | null
          opened_by?: string | null
          opening_amount?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_transactions: {
        Row: {
          amount: number
          cash_register_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          payment_method: string
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          cash_register_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          payment_method?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          cash_register_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          payment_method?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_register"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cephalometry_analysis: {
        Row: {
          analysis_type: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          landmarks: Json | null
          measurements: Json | null
          notes: string | null
          patient_id: string
        }
        Insert: {
          analysis_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          landmarks?: Json | null
          measurements?: Json | null
          notes?: string | null
          patient_id: string
        }
        Update: {
          analysis_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          landmarks?: Json | null
          measurements?: Json | null
          notes?: string | null
          patient_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          client_type: string | null
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          discount_percentage: number | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          loyalty_points: number | null
          phone: string | null
          postal_code: string | null
          rfc: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_type?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          discount_percentage?: number | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          phone?: string | null
          postal_code?: string | null
          rfc?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          client_type?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          discount_percentage?: number | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          phone?: string | null
          postal_code?: string | null
          rfc?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          is_default: boolean | null
          legal_name: string | null
          logo_url: string | null
          name: string
          phone: string | null
          rfc: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_default?: boolean | null
          legal_name?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          rfc?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_default?: boolean | null
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          rfc?: string | null
        }
        Relationships: []
      }
      conventions: {
        Row: {
          contact_info: string | null
          created_at: string
          discount_percent: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      demand_forecasts: {
        Row: {
          actual_demand: number | null
          confidence_level: number | null
          created_at: string | null
          forecast_date: string
          id: string
          predicted_demand: number
          product_id: string
        }
        Insert: {
          actual_demand?: number | null
          confidence_level?: number | null
          created_at?: string | null
          forecast_date: string
          id?: string
          predicted_demand: number
          product_id: string
        }
        Update: {
          actual_demand?: number | null
          confidence_level?: number | null
          created_at?: string | null
          forecast_date?: string
          id?: string
          predicted_demand?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      distributors: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          business_name: string
          city: string | null
          contact_name: string | null
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          discount_percentage: number | null
          email: string
          id: string
          is_active: boolean | null
          legal_name: string | null
          phone: string | null
          postal_code: string | null
          rfc: string | null
          state: string | null
          updated_at: string | null
          user_id: string
          zone: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_name: string
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          discount_percentage?: number | null
          email: string
          id?: string
          is_active?: boolean | null
          legal_name?: string | null
          phone?: string | null
          postal_code?: string | null
          rfc?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
          zone?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          discount_percentage?: number | null
          email?: string
          id?: string
          is_active?: boolean | null
          legal_name?: string | null
          phone?: string | null
          postal_code?: string | null
          rfc?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
          zone?: string | null
        }
        Relationships: []
      }
      doctor_patients: {
        Row: {
          assigned_at: string | null
          doctor_id: string
          id: string
          is_primary: boolean | null
          patient_profile_id: string
        }
        Insert: {
          assigned_at?: string | null
          doctor_id: string
          id?: string
          is_primary?: boolean | null
          patient_profile_id: string
        }
        Update: {
          assigned_at?: string | null
          doctor_id?: string
          id?: string
          is_primary?: boolean | null
          patient_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_patients_patient_profile_id_fkey"
            columns: ["patient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_payments: {
        Row: {
          bonus: number | null
          commission_amount: number
          commission_rate: number | null
          created_at: string
          deductions: number | null
          doctor_id: string
          id: string
          net_payment: number
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          total_appointments: number | null
          total_treatments: number | null
        }
        Insert: {
          bonus?: number | null
          commission_amount: number
          commission_rate?: number | null
          created_at?: string
          deductions?: number | null
          doctor_id: string
          id?: string
          net_payment: number
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
          total_appointments?: number | null
          total_treatments?: number | null
        }
        Update: {
          bonus?: number | null
          commission_amount?: number
          commission_rate?: number | null
          created_at?: string
          deductions?: number | null
          doctor_id?: string
          id?: string
          net_payment?: number
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_appointments?: number | null
          total_treatments?: number | null
        }
        Relationships: []
      }
      doctors: {
        Row: {
          available_days: string[] | null
          bio: string | null
          consultation_fee: number | null
          created_at: string
          id: string
          is_active: boolean | null
          license_number: string
          specialty: string
          updated_at: string
          user_id: string
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          available_days?: string[] | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          license_number: string
          specialty: string
          updated_at?: string
          user_id: string
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          available_days?: string[] | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          license_number?: string
          specialty?: string
          updated_at?: string
          user_id?: string
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          template_type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          client_id: string | null
          content: Json | null
          created_at: string | null
          created_by: string | null
          distributor_id: string | null
          document_number: string
          document_type: string
          id: string
          order_id: string | null
          pdf_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          distributor_id?: string | null
          document_number: string
          document_type: string
          id?: string
          order_id?: string | null
          pdf_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          distributor_id?: string | null
          document_number?: string
          document_type?: string
          id?: string
          order_id?: string | null
          pdf_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          blocks: Json
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          global_styles: Json
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          blocks?: Json
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          global_styles?: Json
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          blocks?: Json
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          global_styles?: Json
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          base_salary: number | null
          commission_rate: number | null
          created_at: string | null
          email: string
          employee_code: string | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          location_id: string | null
          phone: string | null
          position: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_salary?: number | null
          commission_rate?: number | null
          created_at?: string | null
          email: string
          employee_code?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_salary?: number | null
          commission_rate?: number | null
          created_at?: string | null
          email?: string
          employee_code?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          id: string
          location_id: string | null
          payment_method: string | null
          receipt_url: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          id?: string
          location_id?: string | null
          payment_method?: string | null
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          location_id?: string | null
          payment_method?: string | null
          receipt_url?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          location_id: string | null
          min_stock: number
          name: string
          quantity: number
          supplier: string | null
          unit: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          location_id?: string | null
          min_stock?: number
          name: string
          quantity?: number
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          location_id?: string | null
          min_stock?: number
          name?: string
          quantity?: number
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          movement_type: string
          performed_by: string | null
          quantity: number
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          movement_type: string
          performed_by?: string | null
          quantity: number
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          movement_type?: string
          performed_by?: string | null
          quantity?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number
          treatment_id: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total: number
          treatment_id?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          treatment_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string | null
          discount_amount: number | null
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          patient_email: string | null
          patient_id: string
          patient_name: string
          pdf_url: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          patient_email?: string | null
          patient_id: string
          patient_name: string
          pdf_url?: string | null
          status?: string
          subtotal: number
          tax_amount?: number | null
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          patient_email?: string | null
          patient_id?: string
          patient_name?: string
          pdf_url?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      lab_orders: {
        Row: {
          color_shade: string | null
          cost: number | null
          created_at: string
          delivery_date: string | null
          description: string | null
          doctor_id: string | null
          estimated_date: string | null
          id: string
          lab_name: string
          notes: string | null
          patient_id: string
          patient_name: string
          status: string
          updated_at: string
          work_type: string
        }
        Insert: {
          color_shade?: string | null
          cost?: number | null
          created_at?: string
          delivery_date?: string | null
          description?: string | null
          doctor_id?: string | null
          estimated_date?: string | null
          id?: string
          lab_name: string
          notes?: string | null
          patient_id: string
          patient_name: string
          status?: string
          updated_at?: string
          work_type: string
        }
        Update: {
          color_shade?: string | null
          cost?: number | null
          created_at?: string
          delivery_date?: string | null
          description?: string | null
          doctor_id?: string | null
          estimated_date?: string | null
          id?: string
          lab_name?: string
          notes?: string | null
          patient_id?: string
          patient_name?: string
          status?: string
          updated_at?: string
          work_type?: string
        }
        Relationships: []
      }
      lead_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          lead_id: string
          notes: string | null
          performed_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          lead_id: string
          notes?: string | null
          performed_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          lead_id?: string
          notes?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          converted_at: string | null
          converted_patient_id: string | null
          created_at: string
          email: string | null
          follow_up_date: string | null
          id: string
          interest: string | null
          last_contact_at: string | null
          location_id: string | null
          name: string
          notes: string | null
          phone: string | null
          score: number | null
          source: string
          source_detail: string | null
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          assigned_to?: string | null
          converted_at?: string | null
          converted_patient_id?: string | null
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          id?: string
          interest?: string | null
          last_contact_at?: string | null
          location_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: string
          source_detail?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          assigned_to?: string | null
          converted_at?: string | null
          converted_patient_id?: string | null
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          id?: string
          interest?: string | null
          last_contact_at?: string | null
          location_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: string
          source_detail?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string
          city: string | null
          created_at: string
          directions_url: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          map_url: string | null
          name: string
          phone: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string
          directions_url?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          map_url?: string | null
          name: string
          phone: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string
          directions_url?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          map_url?: string | null
          name?: string
          phone?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      medical_history: {
        Row: {
          allergies: string[] | null
          blood_type: string | null
          conditions: string[] | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          medications: string[] | null
          notes: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          blood_type?: string | null
          conditions?: string[] | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          medications?: string[] | null
          notes?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          blood_type?: string | null
          conditions?: string[] | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          medications?: string[] | null
          notes?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      odontogram: {
        Row: {
          condition: string
          id: string
          notes: string | null
          patient_id: string
          recorded_at: string
          recorded_by: string | null
          surface: string | null
          tooth_number: number
          treatment_done: string | null
        }
        Insert: {
          condition: string
          id?: string
          notes?: string | null
          patient_id: string
          recorded_at?: string
          recorded_by?: string | null
          surface?: string | null
          tooth_number: number
          treatment_done?: string | null
        }
        Update: {
          condition?: string
          id?: string
          notes?: string | null
          patient_id?: string
          recorded_at?: string
          recorded_by?: string | null
          surface?: string | null
          tooth_number?: number
          treatment_done?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_sku: string | null
          quantity: number
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_sku?: string | null
          quantity: number
          subtotal: number
          tax_amount?: number | null
          tax_rate?: number | null
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_sku?: string | null
          quantity?: number
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          balance: number | null
          client_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          discount_amount: number | null
          discount_code: string | null
          distributor_id: string | null
          employee_id: string | null
          id: string
          internal_notes: string | null
          location_id: string | null
          notes: string | null
          order_number: string
          paid_amount: number | null
          payment_status: string | null
          payment_type: string | null
          shipped_at: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_cost: number | null
          shipping_method: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          client_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          distributor_id?: string | null
          employee_id?: string | null
          id?: string
          internal_notes?: string | null
          location_id?: string | null
          notes?: string | null
          order_number: string
          paid_amount?: number | null
          payment_status?: string | null
          payment_type?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_cost?: number | null
          shipping_method?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          client_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          distributor_id?: string | null
          employee_id?: string | null
          id?: string
          internal_notes?: string | null
          location_id?: string | null
          notes?: string | null
          order_number?: string
          paid_amount?: number | null
          payment_status?: string | null
          payment_type?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_cost?: number | null
          shipping_method?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      orthodontics_cases: {
        Row: {
          actual_end_date: string | null
          bracket_type: string | null
          case_type: string
          created_at: string
          current_phase: string | null
          doctor_id: string | null
          estimated_end_date: string | null
          id: string
          initial_diagnosis: string | null
          notes: string | null
          patient_id: string
          start_date: string
          status: string
          total_visits: number | null
          treatment_objectives: string | null
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          bracket_type?: string | null
          case_type: string
          created_at?: string
          current_phase?: string | null
          doctor_id?: string | null
          estimated_end_date?: string | null
          id?: string
          initial_diagnosis?: string | null
          notes?: string | null
          patient_id: string
          start_date?: string
          status?: string
          total_visits?: number | null
          treatment_objectives?: string | null
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          bracket_type?: string | null
          case_type?: string
          created_at?: string
          current_phase?: string | null
          doctor_id?: string | null
          estimated_end_date?: string | null
          id?: string
          initial_diagnosis?: string | null
          notes?: string | null
          patient_id?: string
          start_date?: string
          status?: string
          total_visits?: number | null
          treatment_objectives?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orthodontics_visits: {
        Row: {
          case_id: string
          created_at: string
          created_by: string | null
          id: string
          next_appointment_notes: string | null
          notes: string | null
          photos_urls: string[] | null
          procedure_done: string | null
          visit_date: string
          wire_used: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          next_appointment_notes?: string | null
          notes?: string | null
          photos_urls?: string[] | null
          procedure_done?: string | null
          visit_date?: string
          wire_used?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          next_appointment_notes?: string | null
          notes?: string | null
          photos_urls?: string[] | null
          procedure_done?: string | null
          visit_date?: string
          wire_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orthodontics_visits_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "orthodontics_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_consents: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          consent_type: string
          content: string
          created_at: string
          id: string
          is_cancelled: boolean | null
          patient_id: string
          signature_data: string | null
          signature_url: string | null
          signed_at: string | null
          template_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          consent_type: string
          content: string
          created_at?: string
          id?: string
          is_cancelled?: boolean | null
          patient_id: string
          signature_data?: string | null
          signature_url?: string | null
          signed_at?: string | null
          template_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          consent_type?: string
          content?: string
          created_at?: string
          id?: string
          is_cancelled?: boolean | null
          patient_id?: string
          signature_data?: string | null
          signature_url?: string | null
          signed_at?: string | null
          template_id?: string | null
        }
        Relationships: []
      }
      patient_documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          patient_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          patient_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          patient_id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      patient_evolutions: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          content: string
          created_at: string
          doctor_id: string | null
          evolution_type: string | null
          id: string
          is_cancelled: boolean | null
          is_private: boolean | null
          patient_id: string
          treatment_id: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          content: string
          created_at?: string
          doctor_id?: string | null
          evolution_type?: string | null
          id?: string
          is_cancelled?: boolean | null
          is_private?: boolean | null
          patient_id: string
          treatment_id?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          content?: string
          created_at?: string
          doctor_id?: string | null
          evolution_type?: string | null
          id?: string
          is_cancelled?: boolean | null
          is_private?: boolean | null
          patient_id?: string
          treatment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_evolutions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_evolutions_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_private: boolean | null
          note: string
          note_type: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_private?: boolean | null
          note: string
          note_type?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_private?: boolean | null
          note?: string
          note_type?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_prescriptions: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          doctor_id: string | null
          id: string
          is_cancelled: boolean | null
          medications: Json | null
          patient_id: string
          prescription_html: string
          treatment_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          is_cancelled?: boolean | null
          medications?: Json | null
          patient_id: string
          prescription_html: string
          treatment_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          is_cancelled?: boolean | null
          medications?: Json | null
          patient_id?: string
          prescription_html?: string
          treatment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_prescriptions_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          installment_number: number | null
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string
          received_by: string | null
          total_installments: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          installment_number?: number | null
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          received_by?: string | null
          total_installments?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          installment_number?: number | null
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          received_by?: string | null
          total_installments?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          base_salary: number
          bonus: number | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          created_by: string | null
          deductions: number | null
          id: string
          net_payment: number
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          professional_id: string
          services_amount: number | null
          status: string
          total_services: number | null
          updated_at: string
        }
        Insert: {
          base_salary?: number
          bonus?: number | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          id?: string
          net_payment: number
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          professional_id: string
          services_amount?: number | null
          status?: string
          total_services?: number | null
          updated_at?: string
        }
        Update: {
          base_salary?: number
          bonus?: number | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          id?: string
          net_payment?: number
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          professional_id?: string
          services_amount?: number | null
          status?: string
          total_services?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      periodontogram: {
        Row: {
          bleeding: boolean | null
          furcation: number | null
          id: string
          mobility: number | null
          patient_id: string
          pocket_depth_lingual: number[] | null
          pocket_depth_vestibular: number[] | null
          recession_lingual: number[] | null
          recession_vestibular: number[] | null
          recorded_at: string
          recorded_by: string | null
          suppuration: boolean | null
          tooth_number: number
        }
        Insert: {
          bleeding?: boolean | null
          furcation?: number | null
          id?: string
          mobility?: number | null
          patient_id: string
          pocket_depth_lingual?: number[] | null
          pocket_depth_vestibular?: number[] | null
          recession_lingual?: number[] | null
          recession_vestibular?: number[] | null
          recorded_at?: string
          recorded_by?: string | null
          suppuration?: boolean | null
          tooth_number: number
        }
        Update: {
          bleeding?: boolean | null
          furcation?: number | null
          id?: string
          mobility?: number | null
          patient_id?: string
          pocket_depth_lingual?: number[] | null
          pocket_depth_vestibular?: number[] | null
          recession_lingual?: number[] | null
          recession_vestibular?: number[] | null
          recorded_at?: string
          recorded_by?: string | null
          suppuration?: boolean | null
          tooth_number?: number
        }
        Relationships: []
      }
      periodontogram_history: {
        Row: {
          data: Json
          id: string
          patient_id: string
          recorded_at: string
          recorded_by: string | null
          version_number: number | null
        }
        Insert: {
          data: Json
          id?: string
          patient_id: string
          recorded_at?: string
          recorded_by?: string | null
          version_number?: number | null
        }
        Update: {
          data?: Json
          id?: string
          patient_id?: string
          recorded_at?: string
          recorded_by?: string | null
          version_number?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          brand_id: string | null
          category_id: string | null
          cost_price: number
          created_at: string | null
          description: string | null
          distributor_price: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          max_stock: number | null
          min_stock: number | null
          name: string
          reorder_point: number | null
          retail_price: number
          short_description: string | null
          sku: string
          slug: string
          supplier_id: string | null
          unit: string | null
          updated_at: string | null
          weight: number | null
          wholesale_price: number | null
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string | null
          description?: string | null
          distributor_price?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_stock?: number | null
          min_stock?: number | null
          name: string
          reorder_point?: number | null
          retail_price: number
          short_description?: string | null
          sku: string
          slug: string
          supplier_id?: string | null
          unit?: string | null
          updated_at?: string | null
          weight?: number | null
          wholesale_price?: number | null
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string | null
          description?: string | null
          distributor_price?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_stock?: number | null
          min_stock?: number | null
          name?: string
          reorder_point?: number | null
          retail_price?: number
          short_description?: string | null
          sku?: string
          slug?: string
          supplier_id?: string | null
          unit?: string | null
          updated_at?: string | null
          weight?: number | null
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          beneficiary_type: string | null
          birth_year: number | null
          convention_id: string | null
          created_at: string
          curp_rfc: string | null
          date_of_birth: string | null
          email: string
          employer: string | null
          full_name: string
          gender: string | null
          guardian_curp: string | null
          guardian_name: string | null
          id: string
          internal_number: string | null
          is_admin_master: boolean | null
          is_archived: boolean | null
          location_id: string | null
          notes: string | null
          occupation: string | null
          patient_code: string | null
          phone: string | null
          reference_source: string | null
          referral_code: string | null
          referral_discount_percent: number | null
          tags: string[] | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          beneficiary_type?: string | null
          birth_year?: number | null
          convention_id?: string | null
          created_at?: string
          curp_rfc?: string | null
          date_of_birth?: string | null
          email: string
          employer?: string | null
          full_name: string
          gender?: string | null
          guardian_curp?: string | null
          guardian_name?: string | null
          id?: string
          internal_number?: string | null
          is_admin_master?: boolean | null
          is_archived?: boolean | null
          location_id?: string | null
          notes?: string | null
          occupation?: string | null
          patient_code?: string | null
          phone?: string | null
          reference_source?: string | null
          referral_code?: string | null
          referral_discount_percent?: number | null
          tags?: string[] | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          beneficiary_type?: string | null
          birth_year?: number | null
          convention_id?: string | null
          created_at?: string
          curp_rfc?: string | null
          date_of_birth?: string | null
          email?: string
          employer?: string | null
          full_name?: string
          gender?: string | null
          guardian_curp?: string | null
          guardian_name?: string | null
          id?: string
          internal_number?: string | null
          is_admin_master?: boolean | null
          is_archived?: boolean | null
          location_id?: string | null
          notes?: string | null
          occupation?: string | null
          patient_code?: string | null
          phone?: string | null
          reference_source?: string | null
          referral_code?: string | null
          referral_discount_percent?: number | null
          tags?: string[] | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          patient_email: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          patient_email?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          patient_email?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          discount_amount: number | null
          discount_applied_at: string | null
          discount_percentage: number | null
          id: string
          referral_code: string
          referred_email: string
          referred_patient_id: string | null
          referrer_email: string
          referrer_patient_id: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_applied_at?: string | null
          discount_percentage?: number | null
          id?: string
          referral_code: string
          referred_email: string
          referred_patient_id?: string | null
          referrer_email: string
          referrer_patient_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_applied_at?: string | null
          discount_percentage?: number | null
          id?: string
          referral_code?: string
          referred_email?: string
          referred_patient_id?: string | null
          referrer_email?: string
          referrer_patient_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string
          id: string
          is_published: boolean | null
          location_id: string
          location_name: string
          patient_email: string
          patient_name: string
          rating: number
          review_token: string | null
          service_id: string
          service_name: string
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          location_id: string
          location_name: string
          patient_email: string
          patient_name: string
          rating: number
          review_token?: string | null
          service_id: string
          service_name: string
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          location_id?: string
          location_name?: string
          patient_email?: string
          patient_name?: string
          rating?: number
          review_token?: string | null
          service_id?: string
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_emails: {
        Row: {
          created_at: string
          created_by: string | null
          html_content: string
          id: string
          name: string
          result: Json | null
          scheduled_at: string
          sent_at: string | null
          status: string
          subject: string
          target_emails: string[] | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          html_content: string
          id?: string
          name: string
          result?: Json | null
          scheduled_at: string
          sent_at?: string | null
          status?: string
          subject: string
          target_emails?: string[] | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          html_content?: string
          id?: string
          name?: string
          result?: Json | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string
          target_emails?: string[] | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_emails_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      services_catalog: {
        Row: {
          base_price: number
          category: string
          code: string
          commission_rate: number | null
          convention_price: number | null
          cost: number | null
          created_at: string
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          is_active: boolean
          iva_rate: number | null
          lab_cost: number | null
          name: string
          requires_lab: boolean
          updated_at: string
        }
        Insert: {
          base_price: number
          category?: string
          code: string
          commission_rate?: number | null
          convention_price?: number | null
          cost?: number | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          iva_rate?: number | null
          lab_cost?: number | null
          name: string
          requires_lab?: boolean
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string
          code?: string
          commission_rate?: number | null
          convention_price?: number | null
          cost?: number | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          iva_rate?: number | null
          lab_cost?: number | null
          name?: string
          requires_lab?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      smile_simulations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          original_image_url: string
          patient_id: string
          settings: Json | null
          simulated_image_url: string | null
          template_used: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          original_image_url: string
          patient_id: string
          settings?: Json | null
          simulated_image_url?: string | null
          template_used?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          original_image_url?: string
          patient_id?: string
          settings?: Json | null
          simulated_image_url?: string | null
          template_used?: string | null
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          product_id: string
          threshold: number | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id: string
          threshold?: number | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string
          threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          location_id: string | null
          movement_type: string
          new_quantity: number | null
          notes: string | null
          previous_quantity: number | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          location_id?: string | null
          movement_type: string
          new_quantity?: number | null
          notes?: string | null
          previous_quantity?: number | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          location_id?: string | null
          movement_type?: string
          new_quantity?: number | null
          notes?: string | null
          previous_quantity?: number | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          cash_register_id: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string
          doctor_id: string | null
          id: string
          location_id: string | null
          notes: string | null
          patient_id: string | null
          patient_name: string | null
          payment_method: string
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          cash_register_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          doctor_id?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          patient_id?: string | null
          patient_name?: string | null
          payment_method?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cash_register_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          doctor_id?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          patient_id?: string | null
          patient_name?: string | null
          payment_method?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_register"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          appointment_id: string | null
          cost: number | null
          created_at: string
          description: string | null
          diagnosis: string | null
          doctor_id: string | null
          end_date: string | null
          id: string
          name: string
          notes: string | null
          patient_id: string
          start_date: string
          status: string | null
          treatment_plan: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          patient_id: string
          start_date?: string
          status?: string | null
          treatment_plan?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          patient_id?: string
          start_date?: string
          status?: string | null
          treatment_plan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vademecum: {
        Row: {
          active_ingredient: string | null
          category: string | null
          contraindications: string | null
          created_at: string
          dosage: string | null
          id: string
          indications: string | null
          is_active: boolean | null
          name: string
          presentation: string | null
        }
        Insert: {
          active_ingredient?: string | null
          category?: string | null
          contraindications?: string | null
          created_at?: string
          dosage?: string | null
          id?: string
          indications?: string | null
          is_active?: boolean | null
          name: string
          presentation?: string | null
        }
        Update: {
          active_ingredient?: string | null
          category?: string | null
          contraindications?: string | null
          created_at?: string
          dosage?: string | null
          id?: string
          indications?: string | null
          is_active?: boolean | null
          name?: string
          presentation?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      reviews_public: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string | null
          id: string | null
          is_published: boolean | null
          location_id: string | null
          location_name: string | null
          patient_name: string | null
          rating: number | null
          service_id: string | null
          service_name: string | null
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string | null
          is_published?: boolean | null
          location_id?: string | null
          location_name?: string | null
          patient_name?: string | null
          rating?: number | null
          service_id?: string | null
          service_name?: string | null
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string | null
          is_published?: boolean | null
          location_id?: string | null
          location_name?: string | null
          patient_name?: string | null
          rating?: number | null
          service_id?: string | null
          service_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_patient_profile: {
        Args: { p_user_id: string }
        Returns: {
          address: string | null
          avatar_url: string | null
          beneficiary_type: string | null
          birth_year: number | null
          convention_id: string | null
          created_at: string
          curp_rfc: string | null
          date_of_birth: string | null
          email: string
          employer: string | null
          full_name: string
          gender: string | null
          guardian_curp: string | null
          guardian_name: string | null
          id: string
          internal_number: string | null
          is_admin_master: boolean | null
          is_archived: boolean | null
          location_id: string | null
          notes: string | null
          occupation: string | null
          patient_code: string | null
          phone: string | null
          reference_source: string | null
          referral_code: string | null
          referral_discount_percent: number | null
          tags: string[] | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_patient_profiles: {
        Args: { p_limit?: number; p_search?: string; p_show_archived?: boolean }
        Returns: {
          address: string | null
          avatar_url: string | null
          beneficiary_type: string | null
          birth_year: number | null
          convention_id: string | null
          created_at: string
          curp_rfc: string | null
          date_of_birth: string | null
          email: string
          employer: string | null
          full_name: string
          gender: string | null
          guardian_curp: string | null
          guardian_name: string | null
          id: string
          internal_number: string | null
          is_admin_master: boolean | null
          is_archived: boolean | null
          location_id: string | null
          notes: string | null
          occupation: string | null
          patient_code: string | null
          phone: string | null
          reference_source: string | null
          referral_code: string | null
          referral_discount_percent: number | null
          tags: string[] | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_lead_as_won: { Args: { p_lead_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "staff" | "user" | "patient" | "doctor"
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "user", "patient", "doctor"],
      appointment_status: ["pending", "confirmed", "cancelled", "completed"],
    },
  },
} as const
