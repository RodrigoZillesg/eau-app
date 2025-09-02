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

// Event data with FUTURE dates (from August 2025 onwards)
const futureEvents = [
  {
    title: 'Academic Writing Excellence Workshop',
    short_description: 'Master the art of academic writing for research and publications',
    description: `
      <h3>Transform Your Academic Writing</h3>
      <p>Join us for an intensive workshop designed to elevate your academic writing skills to the next level. Whether you're working on research papers, dissertations, or journal articles, this workshop will provide you with the tools and techniques you need.</p>
      
      <h3>Key Learning Outcomes</h3>
      <ul>
        <li>Structure and organize academic papers effectively</li>
        <li>Master APA, MLA, and Chicago citation styles</li>
        <li>Develop clear and concise thesis statements</li>
        <li>Improve critical analysis and argumentation</li>
        <li>Avoid plagiarism and maintain academic integrity</li>
        <li>Edit and proofread like a professional</li>
      </ul>
      
      <h3>Workshop Materials</h3>
      <p>All participants will receive a comprehensive writing toolkit, including templates, checklists, and access to our online resource library with over 500 academic writing examples.</p>
      
      <h3>Target Audience</h3>
      <p>Perfect for postgraduate students, researchers, academics, and professionals who need to produce high-quality academic writing.</p>
    `,
    slug: 'academic-writing-excellence-workshop-2025',
    start_date: '2025-09-12T09:30:00+10:00',
    end_date: '2025-09-12T16:30:00+10:00',
    timezone: 'Australia/Brisbane',
    location_type: 'physical',
    venue_name: 'Queensland University Conference Center',
    address_line1: '234 University Drive',
    city: 'Brisbane',
    state: 'QLD',
    postal_code: '4000',
    country: 'Australia',
    capacity: 40,
    member_price_cents: 42000,
    non_member_price_cents: 52000,
    cpd_points: 6,
    cpd_category: 'Academic Development',
    status: 'published',
    visibility: 'public',
    featured: true,
    allow_guests: true,
    max_guests_per_registration: 1,
    tags: ['academic writing', 'research', 'professional development', 'workshop']
  },
  {
    title: 'English for Healthcare Professionals Conference',
    short_description: 'Specialized English training for medical and healthcare professionals',
    description: `
      <h3>Bridging Language and Healthcare</h3>
      <p>This comprehensive conference brings together healthcare professionals and language experts to address the unique communication challenges in medical settings. Learn specialized vocabulary, patient communication techniques, and cultural sensitivity in healthcare.</p>
      
      <h3>Conference Highlights</h3>
      <ul>
        <li><strong>Medical Terminology:</strong> Master essential medical vocabulary and abbreviations</li>
        <li><strong>Patient Communication:</strong> Develop empathetic and clear communication skills</li>
        <li><strong>Case Presentations:</strong> Practice presenting medical cases in English</li>
        <li><strong>Documentation:</strong> Write accurate medical reports and patient notes</li>
        <li><strong>Telemedicine English:</strong> Navigate virtual consultations effectively</li>
        <li><strong>Cultural Competency:</strong> Address diverse patient populations sensitively</li>
      </ul>
      
      <h3>Special Features</h3>
      <p>Interactive role-play sessions with simulated patients, real-world case studies, and networking opportunities with healthcare professionals from across Australia.</p>
      
      <h3>Continuing Education Credits</h3>
      <p>This conference is approved for 20 CPD points and includes a certificate of completion recognized by major healthcare institutions.</p>
    `,
    slug: 'english-healthcare-professionals-conference-2025',
    start_date: '2025-10-24T08:00:00+11:00',
    end_date: '2025-10-25T17:00:00+11:00',
    timezone: 'Australia/Sydney',
    location_type: 'hybrid',
    venue_name: 'Royal Prince Alfred Hospital Education Centre',
    address_line1: '50 Missenden Road',
    city: 'Sydney',
    state: 'NSW',
    postal_code: '2050',
    country: 'Australia',
    virtual_link: 'https://zoom.us/j/987654321',
    capacity: 80,
    member_price_cents: 85000,
    non_member_price_cents: 95000,
    cpd_points: 20,
    cpd_category: 'Healthcare Communication',
    status: 'published',
    visibility: 'public',
    featured: true,
    allow_guests: false,
    tags: ['healthcare', 'medical English', 'professional development', 'conference']
  },
  {
    title: 'AI in Language Education: Future Forward Teaching',
    short_description: 'Explore cutting-edge AI tools and methodologies for language education',
    description: `
      <h3>The Future of Language Teaching is Here</h3>
      <p>Discover how artificial intelligence is revolutionizing language education. This groundbreaking seminar explores practical applications of AI tools, from automated assessment to personalized learning paths.</p>
      
      <h3>What You'll Explore</h3>
      <ul>
        <li>ChatGPT and language learning: Best practices and limitations</li>
        <li>AI-powered language assessment tools</li>
        <li>Creating adaptive learning experiences with AI</li>
        <li>Automated feedback systems for writing and speaking</li>
        <li>Virtual AI tutors and conversation partners</li>
        <li>Ethical considerations in AI-assisted education</li>
        <li>Future trends and emerging technologies</li>
      </ul>
      
      <h3>Hands-On Sessions</h3>
      <p>Participants will have the opportunity to experiment with various AI tools, create sample lessons, and develop an AI integration strategy for their teaching context.</p>
      
      <h3>Take-Home Resources</h3>
      <p>Access to premium AI tools for 3 months, implementation guides, and membership in our AI in Education community forum.</p>
    `,
    slug: 'ai-language-education-future-teaching-2025',
    start_date: '2025-11-15T14:00:00+11:00',
    end_date: '2025-11-15T20:00:00+11:00',
    timezone: 'Australia/Melbourne',
    location_type: 'virtual',
    virtual_link: 'https://teams.microsoft.com/meet/aiconference2025',
    capacity: 150,
    member_price_cents: 25000,
    non_member_price_cents: 35000,
    cpd_points: 6,
    cpd_category: 'Technology Innovation',
    status: 'published',
    visibility: 'public',
    featured: true,
    allow_guests: true,
    max_guests_per_registration: 2,
    tags: ['AI', 'artificial intelligence', 'technology', 'innovation', 'future education']
  }
];

async function createFutureEvents() {
  console.log('🚀 Starting to create future events (from August 2025 onwards)...\n');
  console.log('Using Supabase URL:', supabaseUrl);
  console.log('\n');

  const results = [];

  for (const eventData of futureEvents) {
    console.log(`📝 Creating event: ${eventData.title}`);
    console.log(`   📅 Date: ${new Date(eventData.start_date).toLocaleDateString('pt-BR')}`);
    
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
        results.push({ title: eventData.title, success: true, id: data.id, date: eventData.start_date });
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
  
  console.log(`✅ Successfully created: ${successful.length} events with FUTURE dates`);
  if (successful.length > 0) {
    successful.forEach(r => {
      const date = new Date(r.date);
      console.log(`   - ${r.title}`);
      console.log(`     📅 Date: ${date.toLocaleDateString('pt-BR')} (${date.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})`);
      console.log(`     🔗 ID: ${r.id}`);
    });
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length} events`);
    failed.forEach(r => console.log(`   - ${r.title}: ${r.error}`));
  }

  console.log('\n🎉 Future events creation completed!');
  console.log('📧 These events are perfect for testing email notifications:');
  console.log('   - Registration confirmations');
  console.log('   - Event reminders (will be sent closer to event dates)');
  console.log('   - All dates are in the future, ensuring proper notification scheduling');
}

// Run the script
createFutureEvents().catch(console.error);