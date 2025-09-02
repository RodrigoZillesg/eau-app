export type CPDActivity = {
  id: string
  member_id?: string
  user_id: string
  
  // Activity details
  category_id: number
  category_name: string
  activity_title: string
  description?: string
  provider?: string
  date_completed: string
  
  // Time and points
  hours: number
  minutes: number
  points: number
  
  // Evidence
  evidence_url?: string
  evidence_filename?: string
  
  // Status
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export type CPDCategory = {
  id: number
  name: string
  points_per_hour?: number
}

export const CPD_CATEGORIES: CPDCategory[] = [
  { id: 25, name: 'Learning Circle Interactive Course', points_per_hour: 1 },
  { id: 24, name: 'Mentor TESOL teacher', points_per_hour: 1 },
  { id: 23, name: 'Attend industry webinar', points_per_hour: 1 },
  { id: 15, name: 'Attend industry PD event', points_per_hour: 1 },
  { id: 14, name: 'Attend English Australia PD event', points_per_hour: 1 },
  { id: 17, name: 'Present at industry event (include preparation time)', points_per_hour: 2 },
  { id: 21, name: 'Attend in-house PD or Training event', points_per_hour: 1 },
  { id: 22, name: 'Present at in-house PD event (include preparation time)', points_per_hour: 2 },
  { id: 9, name: 'Attend English Australia webinar', points_per_hour: 1 },
  { id: 12, name: 'Watch recorded webinar', points_per_hour: 1 },
  { id: 18, name: 'Peer-observe someone\'s lesson', points_per_hour: 1 },
  { id: 19, name: 'Be observed teaching (including feedback)', points_per_hour: 1 },
  { id: 20, name: 'Complete professional course', points_per_hour: 1 },
  { id: 10, name: 'Attend Industry Training', points_per_hour: 1 },
  { id: 13, name: 'Read journal article', points_per_hour: 0.5 },
  { id: 11, name: 'Read professional article', points_per_hour: 0.5 },
]

export type CPDFormData = {
  category_id: number
  activity_title: string
  description?: string
  provider?: string
  date_completed: string
  hours: number
  minutes: number
  evidence?: File
}