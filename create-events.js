const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://english-australia-eau-supabase.lkobs5.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Event data for testing
const testEvents = [
  {
    title: 'Business English Workshop - Advanced Communication Skills',
    short_description: 'Master professional English communication for the global business environment',
    description: '<h3>About This Workshop</h3><p>Join us for an intensive workshop designed to enhance your business English communication skills. This comprehensive program covers essential aspects of professional communication in English-speaking business environments.</p><h3>What You\'ll Learn</h3><ul><li>Professional email writing and correspondence</li><li>Effective presentation techniques</li><li>Business negotiation language</li><li>Conference call and meeting participation</li><li>Cross-cultural communication strategies</li></ul>',
    category: 'workshop',
    format: 'in_person',
    start_date: '2025-02-15',
    end_date: '2025-02-15',
    start_time: '09:00',
    end_time: '17:00',
    timezone: 'Australia/Sydney',
    venue_name: 'Sydney Business Center',
    venue_address: '123 George Street, Sydney NSW 2000',
    city: 'Sydney',
    state: 'NSW',
    postal_code: '2000',
    country: 'Australia',
    total_capacity: 30,
    member_price_cents: 35000,
    non_member_price_cents: 45000,
    cpd_points: 8,
    cpd_hours: 8,
    registration_deadline: '2025-02-10',
    status: 'published',
    allow_guests: true,
    max_guests: 2,
    show_attendee_count: true,
    send_reminder: true,
    reminder_days: 3,
    featured: true
  },
  {
    title: 'IELTS Preparation Masterclass',
    short_description: 'Comprehensive preparation for IELTS Academic and General Training',
    description: '<h3>Course Overview</h3><p>Prepare for success in the IELTS exam with our expert-led masterclass. This intensive program covers all four components of the IELTS test with proven strategies and techniques.</p><h3>Course Structure</h3><ul><li><strong>Listening:</strong> Strategies for different question types and accent familiarization</li><li><strong>Reading:</strong> Time management and skimming/scanning techniques</li><li><strong>Writing:</strong> Task 1 and Task 2 templates and vocabulary enhancement</li><li><strong>Speaking:</strong> Mock interviews and fluency development</li></ul>',
    category: 'conference',
    format: 'hybrid',
    start_date: '2025-03-01',
    end_date: '2025-03-02',
    start_time: '09:00',
    end_time: '17:00',
    timezone: 'Australia/Melbourne',
    venue_name: 'Melbourne Education Hub',
    venue_address: '456 Collins Street, Melbourne VIC 3000',
    city: 'Melbourne',
    state: 'VIC',
    postal_code: '3000',
    country: 'Australia',
    online_meeting_url: 'https://zoom.us/j/123456789',
    total_capacity: 50,
    member_price_cents: 55000,
    non_member_price_cents: 65000,
    cpd_points: 16,
    cpd_hours: 16,
    registration_deadline: '2025-02-25',
    status: 'published',
    allow_guests: false,
    show_attendee_count: true,
    send_reminder: true,
    reminder_days: 5,
    featured: true
  },
  {
    title: 'Digital Teaching Tools & Technology Integration',
    short_description: 'Transform your classroom with cutting-edge educational technology',
    description: '<h3>Welcome to the Future of Education</h3><p>Discover how to effectively integrate technology into your teaching practice. This hands-on seminar explores the latest digital tools and platforms for engaging modern learners.</p><h3>Topics Covered</h3><ul><li>Interactive whiteboard applications and techniques</li><li>Learning Management Systems (LMS) optimization</li><li>Creating engaging multimedia content</li><li>Virtual Reality (VR) and Augmented Reality (AR) in education</li><li>AI-powered assessment and feedback tools</li><li>Gamification strategies for increased engagement</li></ul>',
    category: 'seminar',
    format: 'online',
    start_date: '2025-02-20',
    end_date: '2025-02-20',
    start_time: '18:00',
    end_time: '21:00',
    timezone: 'Australia/Brisbane',
    online_meeting_url: 'https://teams.microsoft.com/meet/123456',
    total_capacity: 100,
    member_price_cents: 15000,
    non_member_price_cents: 20000,
    cpd_points: 3,
    cpd_hours: 3,
    registration_deadline: '2025-02-18',
    status: 'published',
    allow_guests: true,
    max_guests: 1,
    show_attendee_count: true,
    send_reminder: true,
    reminder_days: 2,
    featured: false
  }
];

async function createTestEvents() {
  console.log('🚀 Starting to create test events...\n');
  console.log('Using Supabase URL:', supabaseUrl);
  console.log('\n');

  const results = [];

  for (const eventData of testEvents) {
    console.log(`📝 Creating event: ${eventData.title}`);
    
    try {
      // Add timestamps
      const now = new Date().toISOString();
      const eventWithTimestamps = {
        ...eventData,
        created_at: now,
        updated_at: now
      };

      // Insert the event
      const { data, error } = await supabase
        .from('events')
        .insert(eventWithTimestamps)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating event "${eventData.title}":`, error.message);
        console.error('Error details:', error);
        results.push({ title: eventData.title, success: false, error: error.message });
      } else {
        console.log(`✅ Successfully created event with ID: ${data.id}`);
        results.push({ title: eventData.title, success: true, id: data.id });
      }
    } catch (err) {
      console.error(`❌ Unexpected error for "${eventData.title}":`, err.message);
      results.push({ title: eventData.title, success: false, error: err.message });
    }
    
    console.log('');
  }

  // Summary
  console.log('📊 Summary:');
  console.log('===========');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully created: ${successful.length} events`);
  if (successful.length > 0) {
    successful.forEach(r => console.log(`   - ${r.title} (ID: ${r.id})`));
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length} events`);
    failed.forEach(r => console.log(`   - ${r.title}: ${r.error}`));
  }

  console.log('\n🎉 Event creation process completed!');
  console.log('You can now use these events to test the email notification system.');
}

// Run the script
createTestEvents().catch(console.error);