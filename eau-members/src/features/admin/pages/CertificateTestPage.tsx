import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { EventRegistrationService } from '../../../services/eventRegistrationService';
import { CertificatePdfService } from '../../../services/certificatePdfService';
import { showNotification } from '../../../lib/notifications';
import { Download, FileText, CheckCircle, XCircle, Eye } from 'lucide-react';

interface TestRegistration {
  id: string;
  event_id: string;
  user_id: string;
  event: {
    title: string;
    start_date: string;
    cpd_points: number;
    cpd_category: string;
  };
  user: {
    email: string;
  };
  certificate_issued: boolean;
  cpd_activity_created: boolean;
}

export const CertificateTestPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<TestRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadTestRegistrations();
  }, []);

  const loadTestRegistrations = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get recent registrations for testing
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id,
          event_id,
          user_id,
          certificate_issued,
          cpd_activity_created,
          attended,
          checked_in,
          events!inner (
            title,
            start_date,
            cpd_points,
            cpd_category
          )
        `)
        .or('attended.eq.true,checked_in.eq.true')
        .limit(10);

      if (error) {
        console.error('Error loading registrations:', error);
        return;
      }

      // Transform data to match interface
      const transformed = data?.map(reg => ({
        id: reg.id,
        event_id: reg.event_id,
        user_id: reg.user_id,
        event: reg.events,
        user: { email: user.email || 'test@example.com' },
        certificate_issued: reg.certificate_issued,
        cpd_activity_created: reg.cpd_activity_created
      })) || [];

      setRegistrations(transformed);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testCertificateGeneration = async (registrationId: string) => {
    setProcessing(registrationId);
    try {
      // Generate certificate and CPD
      const certificate = await EventRegistrationService.generateCertificateAndCPD(registrationId);
      
      showNotification('success', 'Certificate generated successfully!');
      console.log('Certificate generated:', certificate);
      
      // Reload registrations to show updated status
      await loadTestRegistrations();
    } catch (error: any) {
      showNotification('error', `Error: ${error.message}`);
      console.error('Certificate generation error:', error);
    } finally {
      setProcessing(null);
    }
  };

  const testPDFGeneration = () => {
    try {
      // Generate and download a sample PDF
      CertificatePdfService.downloadPDF({
        recipientName: 'Test User',
        eventTitle: 'Sample Event for Testing',
        eventDate: '10 January 2025',
        certificateNumber: 'TEST-' + Date.now(),
        issueDate: new Date().toLocaleDateString('en-AU'),
        cpdPoints: 2,
        cpdCategory: 'Professional Development'
      });
      
      showNotification('success', 'Sample PDF downloaded!');
    } catch (error: any) {
      showNotification('error', `PDF generation error: ${error.message}`);
    }
  };

  const checkStorageBucket = async () => {
    try {
      // List files in the certificates bucket
      const { data, error } = await supabase.storage
        .from('event-certificates')
        .list('certificates', {
          limit: 10
        });

      if (error) {
        console.error('Storage error:', error);
        showNotification('error', 'Storage bucket not configured or accessible');
      } else {
        console.log('Storage bucket contents:', data);
        showNotification('success', `Storage bucket accessible. Files: ${data?.length || 0}`);
      }
    } catch (error: any) {
      showNotification('error', `Storage check error: ${error.message}`);
    }
  };

  const runDatabaseTests = async () => {
    try {
      // Test 1: Check if table exists
      const { data: tableTest, error: tableError } = await supabase
        .from('event_certificates')
        .select('count')
        .limit(1);

      if (tableError) {
        showNotification('error', `Table access error: ${tableError.message}`);
        console.log('SQL to fix:\n', 
          '-- Run fix-certificates-simple-rls.sql in Supabase Studio');
        return;
      }

      showNotification('success', 'Database table accessible!');

      // Test 2: Try to insert a test certificate
      // Generate proper UUIDs for test
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const testData = {
        registration_id: generateUUID(), // Proper UUID
        event_id: registrations[0]?.event_id || generateUUID(), // Use real event or generate UUID
        user_id: (await supabase.auth.getUser()).data.user?.id || generateUUID(),
        certificate_number: 'TEST-DB-' + Date.now(),
        recipient_name: 'Test User',
        event_title: 'Test Event',
        event_date: '2025-01-10',
        cpd_points: 1,
        is_valid: true
      };

      const { data: insertTest, error: insertError } = await supabase
        .from('event_certificates')
        .insert([testData])
        .select();

      if (insertError) {
        showNotification('error', `Insert test failed: ${insertError.message}`);
        console.log('Try running fix-certificates-simple-rls.sql');
      } else {
        showNotification('success', 'Database insert test passed!');
        // Clean up test data
        await supabase
          .from('event_certificates')
          .delete()
          .eq('certificate_number', testData.certificate_number);
      }
    } catch (error: any) {
      showNotification('error', `Database test error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eau-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Certificate System Test Page
        </h1>

        {/* Test Controls */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">System Tests</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testPDFGeneration}
              className="px-4 py-2 bg-eau-blue text-white rounded hover:bg-eau-blue-dark transition-colors"
            >
              <Download className="inline-block w-4 h-4 mr-2" />
              Test PDF Generation
            </button>
            
            <button
              onClick={checkStorageBucket}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <FileText className="inline-block w-4 h-4 mr-2" />
              Check Storage Bucket
            </button>
            
            <button
              onClick={runDatabaseTests}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              <CheckCircle className="inline-block w-4 h-4 mr-2" />
              Test Database Access
            </button>
          </div>
        </div>

        {/* Registrations List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Test Registrations (Attended Events)
          </h2>
          
          {registrations.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No attended registrations found. Mark yourself as attended in an event first.
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => (
                <div key={reg.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {reg.event.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(reg.event.start_date).toLocaleDateString('en-AU')}
                      </p>
                      <p className="text-sm text-gray-600">
                        CPD Points: {reg.event.cpd_points || 1} | 
                        Category: {reg.event.cpd_category || 'Professional Development'}
                      </p>
                      
                      <div className="flex gap-4 mt-2">
                        <span className={`text-sm ${reg.certificate_issued ? 'text-green-600' : 'text-gray-400'}`}>
                          {reg.certificate_issued ? (
                            <><CheckCircle className="inline w-4 h-4" /> Certificate Issued</>
                          ) : (
                            <><XCircle className="inline w-4 h-4" /> No Certificate</>
                          )}
                        </span>
                        <span className={`text-sm ${reg.cpd_activity_created ? 'text-green-600' : 'text-gray-400'}`}>
                          {reg.cpd_activity_created ? (
                            <><CheckCircle className="inline w-4 h-4" /> CPD Created</>
                          ) : (
                            <><XCircle className="inline w-4 h-4" /> No CPD</>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => testCertificateGeneration(reg.id)}
                      disabled={processing === reg.id}
                      className="ml-4 px-4 py-2 bg-eau-blue text-white rounded hover:bg-eau-blue-dark transition-colors disabled:opacity-50"
                    >
                      {processing === reg.id ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </span>
                      ) : (
                        'Generate Certificate & CPD'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>First, run "Test Database Access" to check RLS policies</li>
            <li>If database test fails, execute the SQL files in Supabase Studio</li>
            <li>Run "Check Storage Bucket" to verify storage is configured</li>
            <li>Test "Generate Certificate & CPD" on a registration</li>
            <li>Check if both certificate and CPD activity are created</li>
            <li>Use "Test PDF Generation" to download a sample certificate</li>
          </ol>
        </div>
      </div>
    </div>
  );
};