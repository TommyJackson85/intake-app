export interface Profile {
  id: string
  role: 'lawyer' | 'client' | 'admin'
  full_name: string
  email: string
  phone?: string
  firm_name?: string
  citizenship_country?: string
  is_us_citizen_or_resident: boolean
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  email: string
  source: string
  created_at: string
}

export interface IntakeSurvey {
  id: string
  client_id: string
  lawyer_id?: string
  survey_data: Record<string, any>
  status: 'new' | 'qualified' | 'closed' | 'rejected'
  risk_level: 'low' | 'medium' | 'high'
  aml_notes?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  client_id: string
  stripe_session_id: string
  stripe_payment_intent_id?: string
  amount_cents: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  intake_survey_id?: string
  created_at: string
  updated_at: string
}

export interface KYCProfile {
  id: string
  profile_id: string
  legal_name: string
  date_of_birth: string
  nationality: string
  id_type: 'passport' | 'driver_license' | 'national_id'
  id_number: string
  id_expiration_date?: string
  address_street: string
  address_city: string
  address_state: string
  address_zip: string
  address_country: string
  verification_status: 'pending' | 'verified' | 'rejected'
  created_at: string
  updated_at: string
}

export interface AuditEvent {
  id: string
  user_id: string
  action: string
  resource_type?: string
  resource_id?: string
  details?: Record<string, any>
  ip_address?: string
  created_at: string
}
