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

// Event data for testing - using correct schema
const testEvents = [
  {
    title: 'Business English Workshop - Advanced Communication Skills',
    short_description: 'Master professional English communication for the global business environment',
    description: '<h3>About This Workshop</h3><p>Join us for an intensive workshop designed to enhance your business English communication skills. This comprehensive program covers essential aspects of professional communication in English-speaking business environments.</p><h3>What You\'ll Learn</h3><ul><li>Professional email writing and correspondence</li><li>Effective presentation techniques</li><li>Business negotiation language</li><li>Conference call and meeting participation</li><li>Cross-cultural communication strategies</li></ul>',
    slug: 'business-english-workshop-2025',
    start_date: '2025-02-15T09:00:00+11:00',
    end_date: '2025-02-15T17:00:00+11:00',
    timezone: 'Australia/Sydney',
    location_type: 'physical',
    venue_name: 'Sydney Business Center',
    address_line1: '123 George Street',
    city: 'Sydney',
    state: 'NSW',
    postal_code: '2000',
    country: 'Australia',
    capacity: 30,
    member_price_cents: 35000,
    non_member_price_cents: 45000,
    cpd_points: 8,
    cpd_category: 'Professional Development',
    status: 'published',
    visibility: 'public',
    featured: true,
    allow_guests: true,
    max_guests_per_registration: 2,
    tags: ['business', 'communication', 'professional development', 'workshop']
  },
  {
    title: 'Advanced English Communication Workshop - Today 16h',
    short_description: 'Intensive workshop to enhance professional English communication skills with interactive activities and personalized feedback.',
    description: '<h2>Advanced English Communication Workshop</h2><p>Join us for an intensive workshop designed to enhance your professional English communication skills.</p><h3>What You\'ll Learn:</h3><ul><li>Advanced business vocabulary and expressions</li><li>Effective presentation techniques</li><li>Professional email writing</li><li>Negotiation and persuasion skills</li><li>Cross-cultural communication strategies</li></ul><h3>Workshop Format:</h3><ul><li>Interactive group activities</li><li>Real-world scenario practice</li><li>Personalized feedback sessions</li><li>Networking opportunities</li></ul><p><strong>Prerequisites:</strong> Intermediate to Advanced English level (B2-C1)</p><p><strong>Materials:</strong> All materials will be provided digitally</p>',
    slug: 'advanced-english-communication-workshop-today-' + Date.now(),
    start_date: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
    end_date: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
    timezone: 'Australia/Sydney',
    location_type: 'hybrid',
    venue_name: 'English Australia Training Center',
    address_line1: '123 Collins Street',
    address_line2: 'Level 15',
    city: 'Melbourne',
    state: 'VIC',
    postal_code: '3000',
    country: 'Australia',
    virtual_link: 'https://teams.microsoft.com/advanced-communication-workshop',
    location_instructions: 'Physical attendees: Enter via main lobby and take elevator to Level 15. Virtual attendees: Join link will be active 15 minutes before start time.',
    capacity: 25,
    member_price_cents: 18500,
    non_member_price_cents: 24500,
    early_bird_price_cents: 15500,
    early_bird_end_date: new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(),
    cpd_points: 4.5,
    cpd_category: 'Professional Communication',
    status: 'published',
    visibility: 'public',
    featured: true,
    allow_guests: true,
    max_guests_per_registration: 1,
    requires_approval: false,
    show_attendee_list: true,
    tags: ['communication', 'business-english', 'workshop', 'professional-development']
  },
  {
    title: 'IELTS Preparation Masterclass',
    short_description: 'Comprehensive preparation for IELTS Academic and General Training',
    description: '<h3>Course Overview</h3><p>Prepare for success in the IELTS exam with our expert-led masterclass. This intensive program covers all four components of the IELTS test with proven strategies and techniques.</p><h3>Course Structure</h3><ul><li><strong>Listening:</strong> Strategies for different question types and accent familiarization</li><li><strong>Reading:</strong> Time management and skimming/scanning techniques</li><li><strong>Writing:</strong> Task 1 and Task 2 templates and vocabulary enhancement</li><li><strong>Speaking:</strong> Mock interviews and fluency development</li></ul>',
    slug: 'ielts-preparation-masterclass-2025',
    start_date: '2025-03-01T09:00:00+11:00',
    end_date: '2025-03-02T17:00:00+11:00',
    timezone: 'Australia/Melbourne',
    location_type: 'hybrid',
    venue_name: 'Melbourne Education Hub',
    address_line1: '456 Collins Street',
    city: 'Melbourne',
    state: 'VIC',
    postal_code: '3000',
    country: 'Australia',
    virtual_link: 'https://zoom.us/j/123456789',
    capacity: 50,
    member_price_cents: 55000,
    non_member_price_cents: 65000,
    cpd_points: 16,
    cpd_category: 'Teaching Excellence',
    status: 'published',
    visibility: 'public',
    featured: true,
    allow_guests: false,
    tags: ['IELTS', 'exam preparation', 'academic', 'testing']
  },
  {
    title: 'Digital Teaching Tools & Technology Integration',
    short_description: 'Transform your classroom with cutting-edge educational technology',
    description: '<h3>Welcome to the Future of Education</h3><p>Discover how to effectively integrate technology into your teaching practice. This hands-on seminar explores the latest digital tools and platforms for engaging modern learners.</p><h3>Topics Covered</h3><ul><li>Interactive whiteboard applications and techniques</li><li>Learning Management Systems (LMS) optimization</li><li>Creating engaging multimedia content</li><li>Virtual Reality (VR) and Augmented Reality (AR) in education</li><li>AI-powered assessment and feedback tools</li><li>Gamification strategies for increased engagement</li></ul>',
    slug: 'digital-teaching-tools-2025',
    start_date: '2025-02-20T18:00:00+10:00',
    end_date: '2025-02-20T21:00:00+10:00',
    timezone: 'Australia/Brisbane',
    location_type: 'virtual',
    virtual_link: 'https://teams.microsoft.com/meet/123456',
    capacity: 100,
    member_price_cents: 15000,
    non_member_price_cents: 20000,
    cpd_points: 3,
    cpd_category: 'Digital Innovation',
    status: 'published',
    visibility: 'public',
    featured: false,
    allow_guests: true,
    max_guests_per_registration: 1,
    tags: ['technology', 'digital tools', 'online teaching', 'innovation']
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
        updated_at: now,
        published_at: now
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
        console.log(`   View at: http://localhost:5180/admin/events/${data.id}`);
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
  console.log('\n📧 Next steps:');
  console.log('1. Navigate to http://localhost:5180/events to view the events');
  console.log('2. Register for an event to test confirmation emails');
  console.log('3. Check the email server logs for sent notifications');
}

// Run the script
createTestEvents().catch(console.error);