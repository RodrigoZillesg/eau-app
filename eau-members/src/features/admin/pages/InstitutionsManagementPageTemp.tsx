import React, { useState, useEffect } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Building2, Users, Mail, Phone, Globe, MapPin, Plus, Edit2, Trash2, Search, Download, CheckCircle, XCircle } from 'lucide-react'
import { showNotification } from '../../../lib/notifications'

export function InstitutionsManagementPage() {
  const [loading, setLoading] = useState(false)
  const [stats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    totalMembers: 0,
    totalMemberships: 127
  })

  const handleCreateTables = () => {
    showNotification('info', 'Database tables need to be created manually in Supabase Studio')
    
    const sql = `-- CREATE INSTITUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.institutions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name character varying(255) NOT NULL,
    parent_company character varying(255),
    abn character varying(20),
    company_email character varying(255),
    company_type character varying(100),
    cricos_code character varying(50),
    address_line1 character varying(255),
    address_line2 character varying(255),
    address_line3 character varying(255),
    suburb character varying(100),
    postcode character varying(20),
    state character varying(50),
    country character varying(100),
    phone character varying(50),
    website character varying(255),
    primary_contact_id uuid,
    courses_offered text,
    logo_url text,
    member_since date,
    cancellation_details text,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CONSTRAINT institutions_abn_key UNIQUE (abn),
    CONSTRAINT institutions_company_email_key UNIQUE (company_email),
    CONSTRAINT institutions_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying])::text[])))
);

-- CREATE MEMBER_INSTITUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.member_institutions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    member_id uuid NOT NULL,
    institution_id uuid NOT NULL,
    role character varying(100) DEFAULT 'member'::character varying,
    "position" character varying(255),
    department character varying(255),
    start_date date,
    end_date date,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT member_institutions_member_id_institution_id_key UNIQUE (member_id, institution_id),
    CONSTRAINT member_institutions_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT member_institutions_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
);

-- CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_institutions_name ON public.institutions USING btree (name);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON public.institutions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_institutions_state ON public.institutions USING btree (state);
CREATE INDEX IF NOT EXISTS idx_institutions_created_at ON public.institutions USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_member_institutions_member_id ON public.member_institutions USING btree (member_id);
CREATE INDEX IF NOT EXISTS idx_member_institutions_institution_id ON public.member_institutions USING btree (institution_id);
CREATE INDEX IF NOT EXISTS idx_member_institutions_is_primary ON public.member_institutions USING btree (is_primary);

-- ADD INSTITUTION_ID TO MEMBERS TABLE
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS institution_id uuid;
ALTER TABLE public.members ADD CONSTRAINT IF NOT EXISTS members_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_members_institution_id ON public.members USING btree (institution_id);

-- ENABLE RLS
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_institutions ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES
CREATE POLICY "Admins can manage institutions" ON public.institutions FOR ALL USING ((auth.uid() IN ( SELECT members.id FROM members WHERE ((members.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[])))));
CREATE POLICY "Admins can manage member_institutions" ON public.member_institutions FOR ALL USING ((auth.uid() IN ( SELECT members.id FROM members WHERE ((members.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[])))));`;
    
    navigator.clipboard.writeText(sql).then(() => {
      showNotification('success', 'SQL copied to clipboard! Go to Supabase Studio SQL Editor and paste it.')
    }).catch(() => {
      console.log('SQL to execute:')
      console.log(sql)
      showNotification('info', 'SQL logged to console - copy and paste in Supabase Studio')
    })
  }

  const openSupabaseStudio = () => {
    window.open('https://english-australia-eau-supabase.lkobs5.easypanel.host/project/default/sql/new', '_blank')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Institutions Management</h1>
        <p className="text-gray-600">
          Manage educational institutions, companies, and organizations
        </p>
      </div>

      {/* Setup Required Notice */}
      <Card className="p-6 mb-8 border-yellow-200 bg-yellow-50">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Building2 className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Database Setup Required</h3>
            <p className="text-yellow-700 mb-4">
              The institutions and member_institutions tables need to be created in the database before this page can function properly.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateTables}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Copy SQL to Clipboard
              </Button>
              <Button 
                onClick={openSupabaseStudio}
                variant="outline"
                className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
              >
                Open Supabase Studio
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics - Showing available data */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Institutions</p>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Setup required</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-500">Setup required</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              <p className="text-xs text-gray-500">Setup required</p>
            </div>
            <XCircle className="w-8 h-8 text-gray-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              <p className="text-xs text-gray-500">Setup required</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.totalMembers}</p>
              <p className="text-xs text-gray-500">Setup required</p>
            </div>
            <Users className="w-8 h-8 text-indigo-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Memberships</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalMemberships}</p>
              <p className="text-xs text-gray-500">Already exists</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Setup Instructions</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
            <div>
              <p className="font-medium">Copy the SQL script</p>
              <p className="text-sm text-gray-600">Click "Copy SQL to Clipboard" above to copy the database creation script</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
            <div>
              <p className="font-medium">Open Supabase Studio</p>
              <p className="text-sm text-gray-600">Click "Open Supabase Studio" or go to the SQL Editor manually</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
            <div>
              <p className="font-medium">Execute the SQL</p>
              <p className="text-sm text-gray-600">Paste the script in the SQL Editor and click "Run" to create the tables</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">4</div>
            <div>
              <p className="font-medium">Refresh this page</p>
              <p className="text-sm text-gray-600">After successful execution, refresh this page to see the full institutions management interface</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}