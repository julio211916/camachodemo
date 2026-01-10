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
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
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
