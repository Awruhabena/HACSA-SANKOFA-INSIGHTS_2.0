import type { RegionType } from './constants';

export type Role = 'admin' | 'backup_admin' | 'staff';

export interface Person {
  id: string;
  full_name: string;
  email: string;
  current_country: string;
  region_type: RegionType;
  heritage_country: string | null;
  industry: string;
  occupation_status: string;
  organization: string | null;
  consent_data: boolean;
  consent_marketing: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string;
  event_date: string;
  is_published: boolean;
  created_at: string;
  registration_count?: number;
  feedback_count?: number;
  ai_summary?: {
    summary: string;
    key_themes: string[];
    recommendations: string[];
    generated_at: string;
  } | null;
}

export interface Registration {
  id: string;
  event_id: string;
  person_id: string;
  consent_data: boolean;
  consent_marketing: boolean;
  created_at: string;
  person?: Person;
}

export interface Feedback {
  id: string;
  event_id: string;
  person_id: string | null;
  email: string;
  rating: number;
  what_stood_out: string | null;
  what_to_improve: string | null;
  created_at: string;
  person?: Person | null;
}

export interface RegistrationFormData {
  full_name: string;
  email: string;
  current_country: string;
  heritage_country: string;
  industry: string;
  occupation_status: string;
  organization: string;
  consent_data: boolean;
  consent_marketing: boolean;
}

export interface FeedbackFormData {
  email: string;
  rating: number;
  what_stood_out: string;
  what_to_improve: string;
}

export interface StaffProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  backup_admin_pending?: boolean;
}

export interface StaffLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_email?: string;
  action: string;
  target_name?: string;
  target_label?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface DashboardStats {
  total_registrations: number;
  unique_people: number;
  feedback_responses: number;
  response_rate: number;
  average_rating: number;
}

export interface DashboardGeography {
  regions: {
    region_type: RegionType;
    count: number;
    percentage: number;
  }[];
  countries: {
    country: string;
    count: number;
  }[];
}

export interface DashboardComposition {
  industries: {
    label: string;
    count: number;
  }[];
  occupations: {
    label: string;
    count: number;
  }[];
}

export interface DashboardFeedback {
  average_rating: number;
  rating_distribution: {
    rating: number;
    count: number;
  }[];
  rating_by_region: {
    region_type: RegionType;
    avg_rating: number;
    count: number;
  }[];
  comments: {
    region_type: RegionType;
    rating: number;
    what_stood_out: string | null;
    what_to_improve: string | null;
  }[];
  matched_count: number;
  total_count: number;
  unmatched_count: number;
}

export interface EventDeleteImpact {
  title?: string;
  registrations: number;
  feedback: number;
}

export interface RegisterAttendeeParams {
  p_event_slug: string;
  p_full_name: string;
  p_email: string;
  p_current_country: string;
  p_heritage_country: string | null;
  p_industry: string;
  p_occupation_status: string;
  p_organization: string | null;
  p_consent_data: boolean;
  p_consent_marketing: boolean;
}

export interface RegisterAttendeeResult {
  status: 'registered' | 'already_registered';
  person_id?: string;
  registration_id?: string;
}

export interface SubmitFeedbackParams {
  p_event_slug: string;
  p_email: string;
  p_rating: number;
  p_what_stood_out: string | null;
  p_what_to_improve: string | null;
}

export interface SubmitFeedbackResult {
  status: 'submitted' | 'already_submitted';
  matched: boolean;
}
