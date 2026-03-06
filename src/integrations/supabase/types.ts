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
      account_users: {
        Row: {
          accepted_at: string | null
          account_id: string
          id: string
          invited_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          account_id: string
          id?: string
          invited_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          account_id?: string
          id?: string
          invited_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_users_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_users_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          address: string | null
          admin_email: string | null
          cnpj: string | null
          company_name: string | null
          created_at: string
          currency: string | null
          id: string
          locale: string | null
          name: string
          phone: string | null
          responsible_name: string | null
          slug: string | null
          stripe_connect_account_id: string | null
          stripe_connect_status: string | null
          tax_rate: number | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          admin_email?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          locale?: string | null
          name: string
          phone?: string | null
          responsible_name?: string | null
          slug?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_status?: string | null
          tax_rate?: number | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          admin_email?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          locale?: string | null
          name?: string
          phone?: string | null
          responsible_name?: string | null
          slug?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_status?: string | null
          tax_rate?: number | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ad_accounts: {
        Row: {
          account_id: string
          created_at: string
          external_account_id: string
          id: string
          integration_id: string
          name: string | null
          platform: Database["public"]["Enums"]["ad_platform"]
        }
        Insert: {
          account_id: string
          created_at?: string
          external_account_id: string
          id?: string
          integration_id: string
          name?: string | null
          platform: Database["public"]["Enums"]["ad_platform"]
        }
        Update: {
          account_id?: string
          created_at?: string
          external_account_id?: string
          id?: string
          integration_id?: string
          name?: string | null
          platform?: Database["public"]["Enums"]["ad_platform"]
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_accounts_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_accounts_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_spend: {
        Row: {
          account_id: string
          ad_account_id: string | null
          ad_name: string | null
          adset_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          created_at: string
          date: string
          id: string
          impressions: number | null
          platform: Database["public"]["Enums"]["ad_platform"]
          spend: number | null
        }
        Insert: {
          account_id: string
          ad_account_id?: string | null
          ad_name?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number | null
          created_at?: string
          date: string
          id?: string
          impressions?: number | null
          platform: Database["public"]["Enums"]["ad_platform"]
          spend?: number | null
        }
        Update: {
          account_id?: string
          ad_account_id?: string | null
          ad_name?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number | null
          created_at?: string
          date?: string
          id?: string
          impressions?: number | null
          platform?: Database["public"]["Enums"]["ad_platform"]
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_spend_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_spend_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_spend_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_execution_logs: {
        Row: {
          account_id: string
          actions_executed: Json | null
          agent_id: string
          ai_response: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          status: string
          trigger_data: Json | null
        }
        Insert: {
          account_id: string
          actions_executed?: Json | null
          agent_id: string
          ai_response?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          status?: string
          trigger_data?: Json | null
        }
        Update: {
          account_id?: string
          actions_executed?: Json | null
          agent_id?: string
          ai_response?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          status?: string
          trigger_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_execution_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_execution_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_execution_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          account_id: string
          actions: Json
          ai_config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_executions_per_minute: number
          name: string
          project_id: string | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          account_id: string
          actions?: Json
          ai_config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_executions_per_minute?: number
          name: string
          project_id?: string | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          actions?: Json
          ai_config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_executions_per_minute?: number
          name?: string
          project_id?: string | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_api_keys: {
        Row: {
          account_id: string
          api_key_encrypted: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          provider: string
          updated_at: string
        }
        Insert: {
          account_id: string
          api_key_encrypted: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          provider: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          api_key_encrypted?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_api_keys_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_api_keys_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          account_id: string
          created_at: string
          description: string | null
          flow_connections: Json
          flow_nodes: Json
          id: string
          is_active: boolean
          name: string
          project_id: string | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          description?: string | null
          flow_connections?: Json
          flow_nodes?: Json
          id?: string
          is_active?: boolean
          name: string
          project_id?: string | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string | null
          flow_connections?: Json
          flow_nodes?: Json
          id?: string
          is_active?: boolean
          name?: string
          project_id?: string | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clicks: {
        Row: {
          account_id: string
          click_id: string
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip: string | null
          ip_hash: string | null
          project_id: string | null
          referrer: string | null
          smartlink_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          variant_id: string | null
        }
        Insert: {
          account_id: string
          click_id: string
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip?: string | null
          ip_hash?: string | null
          project_id?: string | null
          referrer?: string | null
          smartlink_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant_id?: string | null
        }
        Update: {
          account_id?: string
          click_id?: string
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip?: string | null
          ip_hash?: string | null
          project_id?: string | null
          referrer?: string | null
          smartlink_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clicks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clicks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clicks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clicks_smartlink_id_fkey"
            columns: ["smartlink_id"]
            isOneToOne: false
            referencedRelation: "smartlinks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clicks_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "smartlink_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          description: string | null
          id: string
          period_end: string | null
          period_start: string | null
          referral_id: string
          status: Database["public"]["Enums"]["payout_status"] | null
          stripe_transfer_id: string | null
        }
        Insert: {
          account_id: string
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          referral_id: string
          status?: Database["public"]["Enums"]["payout_status"] | null
          stripe_transfer_id?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          referral_id?: string
          status?: Database["public"]["Enums"]["payout_status"] | null
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          account_id: string | null
          created_at: string
          event_type: string
          id: string
          raw_payload: Json | null
          transaction_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          raw_payload?: Json | null
          transaction_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          raw_payload?: Json | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_items: {
        Row: {
          account_id: string | null
          amount: number | null
          conversion_id: string
          created_at: string
          id: string
          is_order_bump: boolean | null
          product_id: string | null
          product_name: string
        }
        Insert: {
          account_id?: string | null
          amount?: number | null
          conversion_id: string
          created_at?: string
          id?: string
          is_order_bump?: boolean | null
          product_id?: string | null
          product_name: string
        }
        Update: {
          account_id?: string | null
          amount?: number | null
          conversion_id?: string
          created_at?: string
          id?: string
          is_order_bump?: boolean | null
          product_id?: string | null
          product_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_items_conversion_id_fkey"
            columns: ["conversion_id"]
            isOneToOne: false
            referencedRelation: "conversions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      conversions: {
        Row: {
          account_id: string | null
          amount: number | null
          click_id: string | null
          created_at: string
          currency: string | null
          fees: number | null
          id: string
          is_order_bump: boolean | null
          net_amount: number | null
          paid_at: string | null
          payment_method: string | null
          platform: string | null
          product_name: string | null
          project_id: string | null
          raw_payload: Json | null
          ref_id: string | null
          smartlink_id: string | null
          status: Database["public"]["Enums"]["conversion_status"] | null
          transaction_id: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          variant_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount?: number | null
          click_id?: string | null
          created_at?: string
          currency?: string | null
          fees?: number | null
          id?: string
          is_order_bump?: boolean | null
          net_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          platform?: string | null
          product_name?: string | null
          project_id?: string | null
          raw_payload?: Json | null
          ref_id?: string | null
          smartlink_id?: string | null
          status?: Database["public"]["Enums"]["conversion_status"] | null
          transaction_id: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number | null
          click_id?: string | null
          created_at?: string
          currency?: string | null
          fees?: number | null
          id?: string
          is_order_bump?: boolean | null
          net_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          platform?: string | null
          product_name?: string | null
          project_id?: string | null
          raw_payload?: Json | null
          ref_id?: string | null
          smartlink_id?: string | null
          status?: Database["public"]["Enums"]["conversion_status"] | null
          transaction_id?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversions_smartlink_id_fkey"
            columns: ["smartlink_id"]
            isOneToOne: false
            referencedRelation: "smartlinks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversions_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "smartlink_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm2_activities: {
        Row: {
          account_id: string
          activity_type: string
          actor: string | null
          created_at: string | null
          data: Json | null
          id: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          account_id: string
          activity_type: string
          actor?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          account_id?: string
          activity_type?: string
          actor?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm2_activities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_activities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      crm2_contacts: {
        Row: {
          account_id: string
          created_at: string | null
          created_by: string | null
          email: string | null
          first_name: string
          gender: string | null
          id: string
          image_url: string | null
          job_title: string | null
          last_name: string | null
          linkedin_url: string | null
          mobile: string | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          id?: string
          image_url?: string | null
          job_title?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mobile?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          image_url?: string | null
          job_title?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mobile?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm2_contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "crm2_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_contacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm2_deal_contacts: {
        Row: {
          contact_id: string
          deal_id: string
          is_primary: boolean | null
        }
        Insert: {
          contact_id: string
          deal_id: string
          is_primary?: boolean | null
        }
        Update: {
          contact_id?: string
          deal_id?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "crm2_deal_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm2_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_deal_contacts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm2_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm2_deal_statuses: {
        Row: {
          account_id: string
          color: string | null
          created_at: string | null
          id: string
          name: string
          position: number | null
          probability: number | null
          type: string
        }
        Insert: {
          account_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          position?: number | null
          probability?: number | null
          type?: string
        }
        Update: {
          account_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          position?: number | null
          probability?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm2_deal_statuses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_deal_statuses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      crm2_deals: {
        Row: {
          account_id: string
          closed_date: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          deal_number: string | null
          deal_owner: string | null
          deal_value: number | null
          expected_closure_date: string | null
          id: string
          lead_id: string | null
          lost_notes: string | null
          lost_reason: string | null
          next_step: string | null
          organization_id: string | null
          probability: number | null
          project_id: string | null
          source: string | null
          status_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          closed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deal_number?: string | null
          deal_owner?: string | null
          deal_value?: number | null
          expected_closure_date?: string | null
          id?: string
          lead_id?: string | null
          lost_notes?: string | null
          lost_reason?: string | null
          next_step?: string | null
          organization_id?: string | null
          probability?: number | null
          project_id?: string | null
          source?: string | null
          status_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          closed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deal_number?: string | null
          deal_owner?: string | null
          deal_value?: number | null
          expected_closure_date?: string | null
          id?: string
          lead_id?: string | null
          lost_notes?: string | null
          lost_reason?: string | null
          next_step?: string | null
          organization_id?: string | null
          probability?: number | null
          project_id?: string | null
          source?: string | null
          status_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm2_deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "crm2_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_deals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_deals_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "crm2_deal_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      crm2_lead_statuses: {
        Row: {
          account_id: string
          color: string | null
          created_at: string | null
          id: string
          name: string
          position: number | null
          type: string
        }
        Insert: {
          account_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          position?: number | null
          type?: string
        }
        Update: {
          account_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          position?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm2_lead_statuses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_lead_statuses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      crm2_notes: {
        Row: {
          account_id: string
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm2_notes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_notes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      crm2_organizations: {
        Row: {
          account_id: string
          annual_revenue: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          no_of_employees: string | null
          notes: string | null
          project_id: string | null
          territory: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_id: string
          annual_revenue?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          no_of_employees?: string | null
          notes?: string | null
          project_id?: string | null
          territory?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_id?: string
          annual_revenue?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          no_of_employees?: string | null
          notes?: string | null
          project_id?: string | null
          territory?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm2_organizations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_organizations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_organizations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm2_scoring_rules: {
        Row: {
          account_id: string
          condition: string
          created_at: string | null
          field: string
          id: string
          is_active: boolean
          points: number
          value: string | null
        }
        Insert: {
          account_id: string
          condition: string
          created_at?: string | null
          field: string
          id?: string
          is_active?: boolean
          points?: number
          value?: string | null
        }
        Update: {
          account_id?: string
          condition?: string
          created_at?: string | null
          field?: string
          id?: string
          is_active?: boolean
          points?: number
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm2_scoring_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_scoring_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      crm2_tasks: {
        Row: {
          account_id: string
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          reference_id: string | null
          reference_type: string | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          reference_id?: string | null
          reference_type?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          reference_id?: string | null
          reference_type?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm2_tasks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm2_tasks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_domains: {
        Row: {
          account_id: string
          created_at: string
          domain: string
          id: string
          is_active: boolean
          is_verified: boolean
          project_id: string | null
          updated_at: string
          verification_token: string
        }
        Insert: {
          account_id: string
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          project_id?: string | null
          updated_at?: string
          verification_token?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          project_id?: string | null
          updated_at?: string
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_domains_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_domains_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_domains_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_metrics: {
        Row: {
          account_id: string
          conversions: number | null
          created_at: string
          date: string
          id: string
          revenue: number | null
          smartlink_id: string | null
          variant_id: string | null
          views: number | null
        }
        Insert: {
          account_id: string
          conversions?: number | null
          created_at?: string
          date: string
          id?: string
          revenue?: number | null
          smartlink_id?: string | null
          variant_id?: string | null
          views?: number | null
        }
        Update: {
          account_id?: string
          conversions?: number | null
          created_at?: string
          date?: string
          id?: string
          revenue?: number | null
          smartlink_id?: string | null
          variant_id?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_metrics_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_metrics_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_metrics_smartlink_id_fkey"
            columns: ["smartlink_id"]
            isOneToOne: false
            referencedRelation: "smartlinks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_metrics_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "smartlink_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          created_at: string
          id: string
          layout_json: Json
          page: string
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout_json?: Json
          page?: string
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          layout_json?: Json
          page?: string
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_layouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboards: {
        Row: {
          account_id: string
          config: Json | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          account_id: string
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_requests: {
        Row: {
          account_id: string
          created_at: string
          id: string
          project_id: string
          requested_by: string
          resource_id: string
          resource_name: string | null
          resource_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          project_id: string
          requested_by: string
          resource_id: string
          resource_name?: string | null
          resource_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          project_id?: string
          requested_by?: string
          resource_id?: string
          resource_name?: string | null
          resource_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deletion_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deletion_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deletion_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ga4_metrics: {
        Row: {
          account_id: string
          avg_session_duration: number | null
          bounce_rate: number | null
          campaign: string | null
          conversions: number | null
          created_at: string
          date: string
          device_category: string | null
          engagement_rate: number | null
          id: string
          medium: string | null
          new_users: number | null
          page_views: number | null
          property_id: string
          sessions: number | null
          source: string | null
          users: number | null
        }
        Insert: {
          account_id: string
          avg_session_duration?: number | null
          bounce_rate?: number | null
          campaign?: string | null
          conversions?: number | null
          created_at?: string
          date: string
          device_category?: string | null
          engagement_rate?: number | null
          id?: string
          medium?: string | null
          new_users?: number | null
          page_views?: number | null
          property_id: string
          sessions?: number | null
          source?: string | null
          users?: number | null
        }
        Update: {
          account_id?: string
          avg_session_duration?: number | null
          bounce_rate?: number | null
          campaign?: string | null
          conversions?: number | null
          created_at?: string
          date?: string
          device_category?: string | null
          engagement_rate?: number | null
          id?: string
          medium?: string | null
          new_users?: number | null
          page_views?: number | null
          property_id?: string
          sessions?: number | null
          source?: string | null
          users?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ga4_metrics_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ga4_metrics_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      global_alerts: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          severity: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          severity?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          severity?: string
          title?: string
        }
        Relationships: []
      }
      google_selected_accounts: {
        Row: {
          account_id: string
          created_at: string
          external_id: string
          id: string
          integration_id: string
          name: string | null
          type: string
        }
        Insert: {
          account_id: string
          created_at?: string
          external_id: string
          id?: string
          integration_id: string
          name?: string | null
          type: string
        }
        Update: {
          account_id?: string
          created_at?: string
          external_id?: string
          id?: string
          integration_id?: string
          name?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_selected_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_selected_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_selected_accounts_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_selected_accounts_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      hotmart_product_plan_mapping: {
        Row: {
          created_at: string
          hotmart_product_id: string
          hotmart_product_name: string | null
          id: string
          plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hotmart_product_id: string
          hotmart_product_name?: string | null
          id?: string
          plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hotmart_product_id?: string
          hotmart_product_name?: string | null
          id?: string
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotmart_product_plan_mapping_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotmart_product_plan_mapping_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hotmart_webhook_events: {
        Row: {
          created_at: string
          customer_email: string | null
          error_message: string | null
          event_id: string
          event_type: string
          hotmart_product_id: string | null
          hotmart_subscription_id: string | null
          id: string
          raw_payload: Json | null
          status: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          hotmart_product_id?: string | null
          hotmart_subscription_id?: string | null
          id?: string
          raw_payload?: Json | null
          status?: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          hotmart_product_id?: string | null
          hotmart_subscription_id?: string | null
          id?: string
          raw_payload?: Json | null
          status?: string
          transaction_id?: string | null
        }
        Relationships: []
      }
      hub_agent_knowledge_bases: {
        Row: {
          agent_id: string
          knowledge_base_id: string
          user_id: string | null
        }
        Insert: {
          agent_id: string
          knowledge_base_id: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          knowledge_base_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hub_agent_knowledge_bases_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "hub_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_agent_knowledge_bases_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "hub_knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_agent_logs: {
        Row: {
          agent_id: string
          conversation_id: string | null
          created_at: string | null
          error: string | null
          id: string
          inputs: Json | null
          latency_ms: number | null
          message_id: string | null
          outputs: Json | null
          run_id: string | null
          status: string
          tokens_input: number | null
          tokens_output: number | null
          total_tokens: number | null
          user_id: string
          workflow_trace: Json | null
        }
        Insert: {
          agent_id: string
          conversation_id?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          inputs?: Json | null
          latency_ms?: number | null
          message_id?: string | null
          outputs?: Json | null
          run_id?: string | null
          status: string
          tokens_input?: number | null
          tokens_output?: number | null
          total_tokens?: number | null
          user_id: string
          workflow_trace?: Json | null
        }
        Update: {
          agent_id?: string
          conversation_id?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          inputs?: Json | null
          latency_ms?: number | null
          message_id?: string | null
          outputs?: Json | null
          run_id?: string | null
          status?: string
          tokens_input?: number | null
          tokens_output?: number | null
          total_tokens?: number | null
          user_id?: string
          workflow_trace?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "hub_agent_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "hub_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_agent_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "hub_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_agent_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "hub_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_agent_settings: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          max_tokens: number | null
          memory_enabled: boolean | null
          memory_window: number | null
          model_name: string | null
          model_provider: string | null
          opening_statement: string | null
          rag_enabled: boolean | null
          rag_score_threshold: number | null
          rag_top_k: number | null
          suggested_questions: string[] | null
          system_prompt: string | null
          temperature: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          max_tokens?: number | null
          memory_enabled?: boolean | null
          memory_window?: number | null
          model_name?: string | null
          model_provider?: string | null
          opening_statement?: string | null
          rag_enabled?: boolean | null
          rag_score_threshold?: number | null
          rag_top_k?: number | null
          suggested_questions?: string[] | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          max_tokens?: number | null
          memory_enabled?: boolean | null
          memory_window?: number | null
          model_name?: string | null
          model_provider?: string | null
          opening_statement?: string | null
          rag_enabled?: boolean | null
          rag_score_threshold?: number | null
          rag_top_k?: number | null
          suggested_questions?: string[] | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_agent_settings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "hub_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_agent_tools: {
        Row: {
          agent_id: string
          created_at: string | null
          enabled: boolean | null
          id: string
          tool_config: Json | null
          tool_name: string
          tool_type: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          tool_config?: Json | null
          tool_name: string
          tool_type: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          tool_config?: Json | null
          tool_name?: string
          tool_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_agent_tools_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "hub_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_agent_workflows: {
        Row: {
          agent_id: string
          created_at: string | null
          graph: Json
          id: string
          is_active: boolean | null
          name: string | null
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          graph?: Json
          id?: string
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          graph?: Json
          id?: string
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hub_agent_workflows_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "hub_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_agents: {
        Row: {
          avatar_emoji: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          mode: string | null
          name: string
          public_token: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_emoji?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          mode?: string | null
          name: string
          public_token?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_emoji?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          mode?: string | null
          name?: string
          public_token?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hub_channels: {
        Row: {
          agent_id: string
          channel_name: string | null
          channel_type: string
          created_at: string | null
          credentials: Json | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          settings: Json | null
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          agent_id: string
          channel_name?: string | null
          channel_type: string
          created_at?: string | null
          credentials?: Json | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          settings?: Json | null
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          agent_id?: string
          channel_name?: string | null
          channel_type?: string
          created_at?: string | null
          credentials?: Json | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          settings?: Json | null
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hub_channels_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "hub_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_conversations: {
        Row: {
          agent_id: string
          channel_type: string | null
          channel_user_id: string | null
          created_at: string | null
          id: string
          message_count: number | null
          status: string | null
          title: string | null
          token_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          channel_type?: string | null
          channel_user_id?: string | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          status?: string | null
          title?: string | null
          token_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          channel_type?: string | null
          channel_user_id?: string | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          status?: string | null
          title?: string | null
          token_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "hub_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_knowledge_bases: {
        Row: {
          chunk_overlap: number | null
          chunk_size: number | null
          created_at: string | null
          description: string | null
          document_count: number | null
          embedding_model: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chunk_overlap?: number | null
          chunk_size?: number | null
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          embedding_model?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chunk_overlap?: number | null
          chunk_size?: number | null
          created_at?: string | null
          description?: string | null
          document_count?: number | null
          embedding_model?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hub_knowledge_documents: {
        Row: {
          chunk_count: number | null
          created_at: string | null
          error_message: string | null
          file_size: number | null
          file_type: string | null
          id: string
          knowledge_base_id: string
          metadata: Json | null
          name: string
          source_url: string | null
          status: string | null
          storage_path: string | null
          token_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chunk_count?: number | null
          created_at?: string | null
          error_message?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          knowledge_base_id: string
          metadata?: Json | null
          name: string
          source_url?: string | null
          status?: string | null
          storage_path?: string | null
          token_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chunk_count?: number | null
          created_at?: string | null
          error_message?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          knowledge_base_id?: string
          metadata?: Json | null
          name?: string
          source_url?: string | null
          status?: string | null
          storage_path?: string | null
          token_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_knowledge_documents_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "hub_knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_messages: {
        Row: {
          agent_id: string
          content: string | null
          content_type: string | null
          conversation_id: string
          created_at: string | null
          id: string
          latency_ms: number | null
          metadata: Json | null
          role: string
          tokens_input: number | null
          tokens_output: number | null
          user_id: string
        }
        Insert: {
          agent_id: string
          content?: string | null
          content_type?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          role: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id: string
        }
        Update: {
          agent_id?: string
          content?: string | null
          content_type?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          role?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "hub_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "hub_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_user_integrations: {
        Row: {
          created_at: string | null
          credentials: Json | null
          id: string
          is_active: boolean | null
          service_name: string | null
          service_type: string
          settings: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credentials?: Json | null
          id?: string
          is_active?: boolean | null
          service_name?: string | null
          service_type: string
          settings?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credentials?: Json | null
          id?: string
          is_active?: boolean | null
          service_name?: string | null
          service_type?: string
          settings?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      hub_user_quotas: {
        Row: {
          created_at: string | null
          plan: string | null
          tokens_limit: number | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          plan?: string | null
          tokens_limit?: number | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          plan?: string | null
          tokens_limit?: number | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          access_token_encrypted: string | null
          account_id: string
          config: Json | null
          created_at: string
          expires_at: string | null
          external_account_id: string | null
          id: string
          provider: Database["public"]["Enums"]["integration_provider"]
          refresh_token_encrypted: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          account_id: string
          config?: Json | null
          created_at?: string
          expires_at?: string | null
          external_account_id?: string | null
          id?: string
          provider: Database["public"]["Enums"]["integration_provider"]
          refresh_token_encrypted?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          account_id?: string
          config?: Json | null
          created_at?: string
          expires_at?: string | null
          external_account_id?: string | null
          id?: string
          provider?: Database["public"]["Enums"]["integration_provider"]
          refresh_token_encrypted?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          date_from: string
          date_to: string
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          amount?: number
          created_at?: string
          date_from: string
          date_to: string
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          date_from?: string
          date_to?: string
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_history: {
        Row: {
          account_id: string
          action: string
          created_at: string
          details: string | null
          id: string
          lead_id: string
          metadata: Json | null
        }
        Insert: {
          account_id: string
          action: string
          created_at?: string
          details?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
        }
        Update: {
          account_id?: string
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          account_id: string
          content: string
          created_at: string
          id: string
          lead_id: string
          user_id: string
        }
        Insert: {
          account_id: string
          content: string
          created_at?: string
          id?: string
          lead_id: string
          user_id: string
        }
        Update: {
          account_id?: string
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_purchases: {
        Row: {
          conversion_id: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          conversion_id: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          conversion_id?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_purchases_conversion_id_fkey"
            columns: ["conversion_id"]
            isOneToOne: false
            referencedRelation: "conversions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_purchases_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tag_assignments: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tag_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "lead_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          account_id: string
          color: string
          created_at: string
          id: string
          name: string
          project_id: string | null
        }
        Insert: {
          account_id: string
          color?: string
          created_at?: string
          id?: string
          name: string
          project_id?: string | null
        }
        Update: {
          account_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tags_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          account_id: string
          annual_revenue: number | null
          converted: boolean | null
          converted_at: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string | null
          id: string
          image_url: string | null
          industry: string | null
          job_title: string | null
          last_name: string | null
          lead_name: string | null
          lead_owner: string | null
          linkedin_url: string | null
          lost_notes: string | null
          lost_reason: string | null
          mobile_no: string | null
          name: string | null
          no_of_employees: string | null
          notes: string | null
          organization: string | null
          phone: string | null
          project_id: string | null
          score: number | null
          score_breakdown: Json | null
          source: string | null
          stage_id: string | null
          status_id: string | null
          territory: string | null
          total_value: number
          updated_at: string
          website: string | null
        }
        Insert: {
          account_id: string
          annual_revenue?: number | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          image_url?: string | null
          industry?: string | null
          job_title?: string | null
          last_name?: string | null
          lead_name?: string | null
          lead_owner?: string | null
          linkedin_url?: string | null
          lost_notes?: string | null
          lost_reason?: string | null
          mobile_no?: string | null
          name?: string | null
          no_of_employees?: string | null
          notes?: string | null
          organization?: string | null
          phone?: string | null
          project_id?: string | null
          score?: number | null
          score_breakdown?: Json | null
          source?: string | null
          stage_id?: string | null
          status_id?: string | null
          territory?: string | null
          total_value?: number
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_id?: string
          annual_revenue?: number | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          image_url?: string | null
          industry?: string | null
          job_title?: string | null
          last_name?: string | null
          lead_name?: string | null
          lead_owner?: string | null
          linkedin_url?: string | null
          lost_notes?: string | null
          lost_reason?: string | null
          mobile_no?: string | null
          name?: string | null
          no_of_employees?: string | null
          notes?: string | null
          organization?: string | null
          phone?: string | null
          project_id?: string | null
          score?: number | null
          score_breakdown?: Json | null
          source?: string | null
          stage_id?: string | null
          status_id?: string | null
          territory?: string | null
          total_value?: number
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "crm2_lead_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      motivational_messages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          account_id: string
          channel: Database["public"]["Enums"]["notification_channel"] | null
          created_at: string
          daily_report_time: string | null
          id: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          account_id: string
          channel?: Database["public"]["Enums"]["notification_channel"] | null
          created_at?: string
          daily_report_time?: string | null
          id?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          account_id?: string
          channel?: Database["public"]["Enums"]["notification_channel"] | null
          created_at?: string
          daily_report_time?: string | null
          id?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          requested_at: string | null
          status: Database["public"]["Enums"]["payout_status"] | null
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_product_links: {
        Row: {
          created_at: string
          id: string
          pipeline_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pipeline_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pipeline_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_product_links_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_product_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          account_id: string
          color: string
          created_at: string
          id: string
          name: string
          pipeline_id: string | null
          position: number
          project_id: string | null
        }
        Insert: {
          account_id: string
          color?: string
          created_at?: string
          id?: string
          name: string
          pipeline_id?: string | null
          position?: number
          project_id?: string | null
        }
        Update: {
          account_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          pipeline_id?: string | null
          position?: number
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          account_id: string
          created_at: string
          id: string
          name: string
          project_id: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipelines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipelines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pixels: {
        Row: {
          account_id: string
          config: Json | null
          created_at: string
          id: string
          name: string
          pixel_id: string
          platform: string
          updated_at: string
        }
        Insert: {
          account_id: string
          config?: Json | null
          created_at?: string
          id?: string
          name: string
          pixel_id: string
          platform: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          config?: Json | null
          created_at?: string
          id?: string
          name?: string
          pixel_id?: string
          platform?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pixels_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pixels_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_tabs: {
        Row: {
          account_id: string
          created_at: string
          data: Json
          id: string
          name: string
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          data?: Json
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          data?: Json
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_tabs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_tabs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_tabs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          checkout_url: string | null
          created_at: string
          features: Json | null
          id: string
          max_agents: number
          max_devices: number
          max_leads: number
          max_projects: number
          max_smartlinks: number
          max_surveys: number
          max_users: number
          max_variants: number
          max_webhooks: number
          name: string
          price: number
          stripe_price_id: string | null
          stripe_product_id: string | null
        }
        Insert: {
          checkout_url?: string | null
          created_at?: string
          features?: Json | null
          id?: string
          max_agents?: number
          max_devices?: number
          max_leads?: number
          max_projects?: number
          max_smartlinks?: number
          max_surveys?: number
          max_users?: number
          max_variants?: number
          max_webhooks?: number
          name: string
          price?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Update: {
          checkout_url?: string | null
          created_at?: string
          features?: Json | null
          id?: string
          max_agents?: number
          max_devices?: number
          max_leads?: number
          max_projects?: number
          max_smartlinks?: number
          max_surveys?: number
          max_users?: number
          max_variants?: number
          max_webhooks?: number
          name?: string
          price?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          id: string
          log_retention_days: number | null
          login_bg_url: string | null
          max_accounts: number | null
          max_free_events_monthly: number | null
          max_free_users: number | null
          max_projects_per_account: number | null
          max_smartlinks_free: number | null
          max_users_per_account: number | null
          max_webhooks_free: number | null
          motivational_message: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_retention_days?: number | null
          login_bg_url?: string | null
          max_accounts?: number | null
          max_free_events_monthly?: number | null
          max_free_users?: number | null
          max_projects_per_account?: number | null
          max_smartlinks_free?: number | null
          max_users_per_account?: number | null
          max_webhooks_free?: number | null
          motivational_message?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          log_retention_days?: number | null
          login_bg_url?: string | null
          max_accounts?: number | null
          max_free_events_monthly?: number | null
          max_free_users?: number | null
          max_projects_per_account?: number | null
          max_smartlinks_free?: number | null
          max_users_per_account?: number | null
          max_webhooks_free?: number | null
          motivational_message?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_costs: {
        Row: {
          account_id: string
          cost: number
          created_at: string
          effective_from: string
          id: string
          product_id: string
        }
        Insert: {
          account_id: string
          cost: number
          created_at?: string
          effective_from?: string
          id?: string
          product_id: string
        }
        Update: {
          account_id?: string
          cost?: number
          created_at?: string
          effective_from?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_costs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_costs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          account_id: string
          cost: number | null
          created_at: string
          external_id: string | null
          id: string
          name: string
          platform: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          cost?: number | null
          created_at?: string
          external_id?: string | null
          id?: string
          name: string
          platform?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          cost?: number | null
          created_at?: string
          external_id?: string | null
          id?: string
          name?: string
          platform?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_users: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string | null
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string | null
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string | null
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_users_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          account_id: string
          avatar_url: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          account_id: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          account_id: string
          code: string
          created_at: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          account_id: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          account_id?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_paid: boolean | null
          created_at: string
          id: string
          referral_code_id: string | null
          referred_account_id: string
          referrer_account_id: string
          stripe_transfer_id: string | null
        }
        Insert: {
          commission_paid?: boolean | null
          created_at?: string
          id?: string
          referral_code_id?: string | null
          referred_account_id: string
          referrer_account_id: string
          stripe_transfer_id?: string | null
        }
        Update: {
          commission_paid?: boolean | null
          created_at?: string
          id?: string
          referral_code_id?: string | null
          referred_account_id?: string
          referrer_account_id?: string
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_account_id_fkey"
            columns: ["referred_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_account_id_fkey"
            columns: ["referred_account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_account_id_fkey"
            columns: ["referrer_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_account_id_fkey"
            columns: ["referrer_account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_goals: {
        Row: {
          account_id: string
          created_at: string
          goal: number
          id: string
          period: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          goal?: number
          id?: string
          period?: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          goal?: number
          id?: string
          period?: string
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_goals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_goals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_goals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_view_tokens: {
        Row: {
          account_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          is_permanent: boolean
          label: string
          project_id: string
          token: string
        }
        Insert: {
          account_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_permanent?: boolean
          label?: string
          project_id: string
          token?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_permanent?: boolean
          label?: string
          project_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_view_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_view_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_view_tokens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      smartlink_variants: {
        Row: {
          account_id: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          smartlink_id: string
          url: string
          views_adjustment: number
          weight: number | null
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          smartlink_id: string
          url: string
          views_adjustment?: number
          weight?: number | null
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          smartlink_id?: string
          url?: string
          views_adjustment?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "smartlink_variants_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smartlink_variants_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smartlink_variants_smartlink_id_fkey"
            columns: ["smartlink_id"]
            isOneToOne: false
            referencedRelation: "smartlinks"
            referencedColumns: ["id"]
          },
        ]
      }
      smartlinks: {
        Row: {
          account_id: string
          auto_tags: string[] | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          project_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          account_id: string
          auto_tags?: string[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          project_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          auto_tags?: string[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          project_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smartlinks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smartlinks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smartlinks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          account_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          hotmart_subscription_id: string | null
          hotmart_transaction_id: string | null
          id: string
          plan_id: string | null
          plan_type: string | null
          provider: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          hotmart_subscription_id?: string | null
          hotmart_transaction_id?: string | null
          id?: string
          plan_id?: string | null
          plan_type?: string | null
          provider?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          hotmart_subscription_id?: string | null
          hotmart_transaction_id?: string | null
          id?: string
          plan_id?: string | null
          plan_type?: string | null
          provider?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans_public"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          sender_type?: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          body: string
          category: string
          closed_at: string | null
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          body: string
          category?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          body?: string
          category?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      survey_answers: {
        Row: {
          account_id: string
          answer_options: Json | null
          answer_value: string | null
          created_at: string
          id: string
          question_id: string
          response_id: string
          score: number | null
        }
        Insert: {
          account_id: string
          answer_options?: Json | null
          answer_value?: string | null
          created_at?: string
          id?: string
          question_id: string
          response_id: string
          score?: number | null
        }
        Update: {
          account_id?: string
          answer_options?: Json | null
          answer_value?: string | null
          created_at?: string
          id?: string
          question_id?: string
          response_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          account_id: string
          config: Json | null
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          logic: Json | null
          options: Json | null
          position: number
          scoring: Json | null
          survey_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          account_id: string
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          logic?: Json | null
          options?: Json | null
          position?: number
          scoring?: Json | null
          survey_id: string
          title?: string
          type?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          logic?: Json | null
          options?: Json | null
          position?: number
          scoring?: Json | null
          survey_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_questions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          account_id: string
          completed_at: string | null
          created_at: string
          id: string
          lead_id: string | null
          max_possible_score: number | null
          metadata: Json | null
          qualification: string | null
          respondent_email: string | null
          respondent_name: string | null
          survey_id: string
          total_score: number | null
        }
        Insert: {
          account_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          max_possible_score?: number | null
          metadata?: Json | null
          qualification?: string | null
          respondent_email?: string | null
          respondent_name?: string | null
          survey_id: string
          total_score?: number | null
        }
        Update: {
          account_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          max_possible_score?: number | null
          metadata?: Json | null
          qualification?: string | null
          respondent_email?: string | null
          respondent_name?: string | null
          survey_id?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          account_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          project_id: string
          scoring_enabled: boolean
          show_results: boolean
          slug: string
          thank_you_message: string | null
          theme_color: string | null
          title: string
          type: string
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          project_id: string
          scoring_enabled?: boolean
          show_results?: boolean
          slug?: string
          thank_you_message?: string | null
          theme_color?: string | null
          title?: string
          type?: string
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          project_id?: string
          scoring_enabled?: boolean
          show_results?: boolean
          slug?: string
          thank_you_message?: string | null
          theme_color?: string | null
          title?: string
          type?: string
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      system_announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "system_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      system_announcements: {
        Row: {
          body: string
          cover_image_url: string | null
          created_by: string | null
          id: string
          published_at: string | null
          title: string
          version: string | null
        }
        Insert: {
          body: string
          cover_image_url?: string | null
          created_by?: string | null
          id?: string
          published_at?: string | null
          title: string
          version?: string | null
        }
        Update: {
          body?: string
          cover_image_url?: string | null
          created_by?: string | null
          id?: string
          published_at?: string | null
          title?: string
          version?: string | null
        }
        Relationships: []
      }
      system_warnings: {
        Row: {
          account_id: string | null
          created_at: string
          id: string
          is_resolved: boolean
          message: string | null
          metadata: Json | null
          project_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string
          title: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean
          message?: string | null
          metadata?: Json | null
          project_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string
          title: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean
          message?: string | null
          metadata?: Json | null
          project_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_warnings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_warnings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_warnings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      taxes: {
        Row: {
          account_id: string
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          rate: number
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          rate: number
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "taxes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          account_id: string
          id: string
          max_agents: number
          max_dashboards: number | null
          max_devices: number
          max_leads: number
          max_projects: number | null
          max_smartlinks: number | null
          max_surveys: number
          max_users: number | null
          max_variants: number
          max_webhooks: number | null
        }
        Insert: {
          account_id: string
          id?: string
          max_agents?: number
          max_dashboards?: number | null
          max_devices?: number
          max_leads?: number
          max_projects?: number | null
          max_smartlinks?: number | null
          max_surveys?: number
          max_users?: number | null
          max_variants?: number
          max_webhooks?: number | null
        }
        Update: {
          account_id?: string
          id?: string
          max_agents?: number
          max_dashboards?: number | null
          max_devices?: number
          max_leads?: number
          max_projects?: number | null
          max_smartlinks?: number | null
          max_surveys?: number
          max_users?: number | null
          max_variants?: number
          max_webhooks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_limits_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_limits_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tour_completions: {
        Row: {
          completed_at: string
          id: string
          tour_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          tour_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          tour_id?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_form_tags: {
        Row: {
          created_at: string
          form_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_form_tags_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "webhook_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_form_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "lead_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_forms: {
        Row: {
          account_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          project_id: string | null
          redirect_type: string
          redirect_url: string | null
          webhook_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          project_id?: string | null
          redirect_type?: string
          redirect_url?: string | null
          webhook_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          project_id?: string | null
          redirect_type?: string
          redirect_url?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_forms_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_forms_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_forms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_forms_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          account_id: string | null
          attributed_click_id: string | null
          created_at: string
          event_type: string | null
          id: string
          ignore_reason: string | null
          is_attributed: boolean | null
          platform: string | null
          project_id: string | null
          raw_payload: Json | null
          status: string | null
          transaction_id: string | null
          webhook_id: string | null
        }
        Insert: {
          account_id?: string | null
          attributed_click_id?: string | null
          created_at?: string
          event_type?: string | null
          id?: string
          ignore_reason?: string | null
          is_attributed?: boolean | null
          platform?: string | null
          project_id?: string | null
          raw_payload?: Json | null
          status?: string | null
          transaction_id?: string | null
          webhook_id?: string | null
        }
        Update: {
          account_id?: string | null
          attributed_click_id?: string | null
          created_at?: string
          event_type?: string | null
          id?: string
          ignore_reason?: string | null
          is_attributed?: boolean | null
          platform?: string | null
          project_id?: string | null
          raw_payload?: Json | null
          status?: string | null
          transaction_id?: string | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_products: {
        Row: {
          created_at: string
          id: string
          product_id: string
          webhook_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          webhook_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_products_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_tags: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          webhook_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          webhook_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "lead_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_tags_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          account_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          platform: string | null
          platform_name: string | null
          project_id: string | null
          token: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          platform?: string | null
          platform_name?: string | null
          project_id?: string | null
          token?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          platform?: string | null
          platform_name?: string | null
          project_id?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_devices: {
        Row: {
          account_id: string
          api_key_encrypted: string
          api_url: string
          created_at: string
          id: string
          instance_name: string
          last_seen_at: string | null
          phone_number: string | null
          project_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_id: string
          api_key_encrypted: string
          api_url: string
          created_at?: string
          id?: string
          instance_name: string
          last_seen_at?: string | null
          phone_number?: string | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          api_key_encrypted?: string
          api_url?: string
          created_at?: string
          id?: string
          instance_name?: string
          last_seen_at?: string | null
          phone_number?: string | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_devices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_devices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      accounts_safe: {
        Row: {
          company_name: string | null
          created_at: string | null
          id: string | null
          name: string | null
          slug: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_api_keys_safe: {
        Row: {
          account_id: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          label: string | null
          provider: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          label?: string | null
          provider?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          label?: string | null
          provider?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_api_keys_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_api_keys_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations_safe: {
        Row: {
          account_id: string | null
          config: Json | null
          created_at: string | null
          expires_at: string | null
          external_account_id: string | null
          id: string | null
          provider: Database["public"]["Enums"]["integration_provider"] | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          config?: Json | null
          created_at?: string | null
          expires_at?: string | null
          external_account_id?: string | null
          id?: string | null
          provider?: Database["public"]["Enums"]["integration_provider"] | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          config?: Json | null
          created_at?: string | null
          expires_at?: string | null
          external_account_id?: string | null
          id?: string | null
          provider?: Database["public"]["Enums"]["integration_provider"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      plans_public: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string | null
          max_projects: number | null
          max_smartlinks: number | null
          max_users: number | null
          max_webhooks: number | null
          name: string | null
          price: number | null
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string | null
          max_projects?: number | null
          max_smartlinks?: number | null
          max_users?: number | null
          max_webhooks?: number | null
          name?: string | null
          price?: number | null
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string | null
          max_projects?: number | null
          max_smartlinks?: number | null
          max_users?: number | null
          max_webhooks?: number | null
          name?: string | null
          price?: number | null
        }
        Relationships: []
      }
      whatsapp_devices_safe: {
        Row: {
          account_id: string | null
          api_url: string | null
          created_at: string | null
          id: string | null
          instance_name: string | null
          last_seen_at: string | null
          phone_number: string | null
          project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          api_url?: string | null
          created_at?: string | null
          id?: string | null
          instance_name?: string | null
          last_seen_at?: string | null
          phone_number?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          api_url?: string | null
          created_at?: string | null
          id?: string | null
          instance_name?: string | null
          last_seen_at?: string | null
          phone_number?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_devices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_devices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          account_id: string
          account_name: string
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          last_sign_in_at: string
          phone: string
          plan_name: string
          plan_type: string
          subscription_created_at: string
          subscription_status: string
          user_id: string
        }[]
      }
      admin_update_user: {
        Args: { _full_name?: string; _phone?: string; _user_id: string }
        Returns: undefined
      }
      admin_update_user_plan: {
        Args: { _plan_name: string; _user_id: string }
        Returns: undefined
      }
      aggregate_daily_metrics: {
        Args: { p_target_date: string }
        Returns: undefined
      }
      cleanup_old_webhook_logs: { Args: never; Returns: undefined }
      create_default_pipeline: {
        Args: { p_account_id: string; p_name?: string; p_project_id: string }
        Returns: string
      }
      crm2_calculate_lead_score: {
        Args: { p_account_id: string; p_lead_id: string }
        Returns: number
      }
      crm2_convert_lead_to_deal: {
        Args: { p_account_id: string; p_lead_id: string; p_project_id: string }
        Returns: string
      }
      crm2_recalculate_all_scores: {
        Args: { p_account_id: string }
        Returns: undefined
      }
      crm2_seed_default_scoring_rules: {
        Args: { p_account_id: string }
        Returns: undefined
      }
      crm2_seed_default_statuses: {
        Args: { p_account_id: string }
        Returns: undefined
      }
      find_user_id_by_email: { Args: { _email: string }; Returns: string }
      get_usage_counts: { Args: { p_account_id: string }; Returns: Json }
      get_user_account_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_emails_by_ids: {
        Args: { _user_ids: string[] }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      upsert_lead_from_webhook: {
        Args: {
          p_account_id: string
          p_amount: number
          p_conversion_id: string
          p_email: string
          p_name: string
          p_payment_method: string
          p_phone: string
          p_product_name: string
          p_project_id: string
          p_source: string
          p_status: string
          p_utm_campaign: string
          p_utm_medium: string
          p_utm_source: string
        }
        Returns: string
      }
      user_has_admin_access: {
        Args: { _account_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      ad_platform: "meta" | "google" | "tiktok" | "other"
      app_role: "owner" | "admin" | "member"
      conversion_status:
        | "approved"
        | "refunded"
        | "chargedback"
        | "canceled"
        | "pending"
        | "waiting_payment"
        | "abandoned_cart"
        | "boleto_generated"
        | "pix_generated"
        | "declined"
      integration_provider:
        | "meta_ads"
        | "google_ads"
        | "hotmart"
        | "eduzz"
        | "kiwify"
        | "monetizze"
        | "other"
        | "google"
      notification_channel: "email" | "webhook"
      payout_status: "pending" | "approved" | "paid" | "rejected"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
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
      ad_platform: ["meta", "google", "tiktok", "other"],
      app_role: ["owner", "admin", "member"],
      conversion_status: [
        "approved",
        "refunded",
        "chargedback",
        "canceled",
        "pending",
        "waiting_payment",
        "abandoned_cart",
        "boleto_generated",
        "pix_generated",
        "declined",
      ],
      integration_provider: [
        "meta_ads",
        "google_ads",
        "hotmart",
        "eduzz",
        "kiwify",
        "monetizze",
        "other",
        "google",
      ],
      notification_channel: ["email", "webhook"],
      payout_status: ["pending", "approved", "paid", "rejected"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
    },
  },
} as const
