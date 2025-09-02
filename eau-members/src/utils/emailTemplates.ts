/**
 * Professional Email Templates for EAU Members
 * Branded templates with consistent design and colors
 */

export interface EmailTemplateData {
  user_name: string;
  event_title: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_link: string;
  registration_id?: string;
  cpd_points?: number;
  cpd_category?: string;
}

// Brand colors and styling
const BRAND_COLORS = {
  primary: '#0f172a',      // Dark slate
  secondary: '#059669',    // Emerald
  accent: '#0284c7',       // Blue
  warning: '#d97706',      // Amber
  success: '#059669',      // Emerald
  danger: '#dc2626',       // Red
  gray: '#64748b',         // Slate gray
  lightGray: '#f8fafc'     // Very light slate
};

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: ${BRAND_COLORS.primary};
  margin: 0;
  padding: 0;
`;

const CONTAINER_STYLES = `
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const HEADER_STYLES = `
  background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.secondary} 100%);
  color: white;
  padding: 30px 40px;
  text-align: center;
`;

const CONTENT_STYLES = `
  padding: 40px;
`;

const FOOTER_STYLES = `
  background: ${BRAND_COLORS.lightGray};
  padding: 20px 40px;
  text-align: center;
  font-size: 14px;
  color: ${BRAND_COLORS.gray};
`;

const BUTTON_STYLES = `
  background: ${BRAND_COLORS.secondary};
  color: white;
  padding: 14px 28px;
  text-decoration: none;
  border-radius: 8px;
  display: inline-block;
  font-weight: 600;
  margin: 20px 0;
  transition: background-color 0.3s ease;
`;

const EVENT_CARD_STYLES = `
  background: ${BRAND_COLORS.lightGray};
  border: 2px solid ${BRAND_COLORS.secondary};
  border-radius: 12px;
  padding: 24px;
  margin: 24px 0;
`;

export class EmailTemplates {
  
  static getBaseTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EAU Members</title>
      </head>
      <body style="${BASE_STYLES}">
        <div style="${CONTAINER_STYLES}">
          ${content}
          
          <div style="${FOOTER_STYLES}">
            <div style="border-bottom: 1px solid #e2e8f0; margin-bottom: 16px; padding-bottom: 16px;">
              <strong>EAU Members</strong><br>
              English Australia Professional Development System
            </div>
            <p style="margin: 8px 0; font-size: 12px;">
              This email was sent to you because you are registered in our system.<br>
              Need help? Contact us at support@eaumembers.com
            </p>
            <p style="margin: 8px 0; font-size: 12px; color: #94a3b8;">
              © 2025 EAU Members. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static registrationConfirmation(data: EmailTemplateData): string {
    const content = `
      <div style="${HEADER_STYLES}">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">
          🎉 Registration Confirmed
        </h1>
        <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 16px;">
          You're all set for the event!
        </p>
      </div>
      
      <div style="${CONTENT_STYLES}">
        <p style="font-size: 18px; margin-bottom: 24px;">
          Hello <strong>${data.user_name}</strong>,
        </p>
        
        <p style="margin-bottom: 24px;">
          We're excited to confirm your registration for this upcoming event. 
          Mark your calendar and prepare for an engaging experience!
        </p>
        
        <div style="${EVENT_CARD_STYLES}">
          <h2 style="margin: 0 0 16px 0; color: ${BRAND_COLORS.primary}; font-size: 22px;">
            📅 ${data.event_title}
          </h2>
          <div style="display: grid; gap: 12px; font-size: 16px;">
            <div><strong>📆 Date:</strong> ${data.event_date}</div>
            <div><strong>🕐 Time:</strong> ${data.event_time}</div>
            <div><strong>📍 Location:</strong> ${data.event_location}</div>
            ${data.registration_id ? `<div><strong>🎫 Registration ID:</strong> ${data.registration_id}</div>` : ''}
          </div>
        </div>
        
        <div style="background: #ecfdf5; border-left: 4px solid ${BRAND_COLORS.success}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
          <h3 style="margin: 0 0 8px 0; color: ${BRAND_COLORS.success};">What's Next?</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>You'll receive reminder emails before the event</li>
            <li>A "Join Live Event" button will appear 10 minutes before start time</li>
            <li>CPD points will be automatically awarded upon attendance</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${data.event_link}" style="${BUTTON_STYLES}">
            📖 View Event Details
          </a>
        </div>
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  static reminder7Days(data: EmailTemplateData): string {
    const content = `
      <div style="${HEADER_STYLES}">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">
          📅 Event in 7 Days
        </h1>
        <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 16px;">
          Don't forget to prepare!
        </p>
      </div>
      
      <div style="${CONTENT_STYLES}">
        <p style="font-size: 18px; margin-bottom: 24px;">
          Hello <strong>${data.user_name}</strong>,
        </p>
        
        <p style="margin-bottom: 24px; font-size: 16px;">
          Just a friendly reminder that <strong>${data.event_title}</strong> is coming up in exactly <strong>one week</strong>!
        </p>
        
        <div style="${EVENT_CARD_STYLES}">
          <h2 style="margin: 0 0 16px 0; color: ${BRAND_COLORS.accent}; font-size: 22px;">
            📅 ${data.event_title}
          </h2>
          <div style="display: grid; gap: 12px; font-size: 16px;">
            <div><strong>📆 Date:</strong> ${data.event_date}</div>
            <div><strong>🕐 Time:</strong> ${data.event_time}</div>
            <div><strong>📍 Location:</strong> ${data.event_location}</div>
          </div>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid ${BRAND_COLORS.warning}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
          <h3 style="margin: 0 0 8px 0; color: ${BRAND_COLORS.warning};">💡 Preparation Tips</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Add the event to your calendar</li>
            <li>Test your internet connection and audio/video setup</li>
            <li>Prepare any questions you'd like to ask</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${data.event_link}" style="${BUTTON_STYLES}">
            📖 Event Details
          </a>
        </div>
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  static reminder1Day(data: EmailTemplateData): string {
    const content = `
      <div style="${HEADER_STYLES}">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">
          ⏰ Tomorrow's Event
        </h1>
        <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 16px;">
          Final reminder - see you tomorrow!
        </p>
      </div>
      
      <div style="${CONTENT_STYLES}">
        <p style="font-size: 18px; margin-bottom: 24px;">
          Hello <strong>${data.user_name}</strong>,
        </p>
        
        <p style="margin-bottom: 24px; font-size: 16px;">
          <strong>${data.event_title}</strong> is <strong>tomorrow</strong>! We're looking forward to seeing you there.
        </p>
        
        <div style="${EVENT_CARD_STYLES}">
          <h2 style="margin: 0 0 16px 0; color: ${BRAND_COLORS.danger}; font-size: 22px;">
            🔥 ${data.event_title}
          </h2>
          <div style="display: grid; gap: 12px; font-size: 16px;">
            <div><strong>📆 Date:</strong> <span style="color: ${BRAND_COLORS.danger};">${data.event_date}</span></div>
            <div><strong>🕐 Time:</strong> <span style="color: ${BRAND_COLORS.danger};">${data.event_time}</span></div>
            <div><strong>📍 Location:</strong> ${data.event_location}</div>
          </div>
        </div>
        
        <div style="background: #fef2f2; border-left: 4px solid ${BRAND_COLORS.danger}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
          <h3 style="margin: 0 0 8px 0; color: ${BRAND_COLORS.danger};">🚨 Final Checklist</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Stable internet connection ready</li>
            <li>Audio and video equipment tested</li>
            <li>Login credentials ready</li>
            <li>Notebook or materials prepared</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${data.event_link}" style="${BUTTON_STYLES}">
            🎯 Join Event Page
          </a>
        </div>
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  static reminder30Minutes(data: EmailTemplateData): string {
    const content = `
      <div style="${HEADER_STYLES}">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">
          🚀 Starting Soon
        </h1>
        <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 16px;">
          30 minutes to go!
        </p>
      </div>
      
      <div style="${CONTENT_STYLES}">
        <p style="font-size: 18px; margin-bottom: 24px;">
          Hello <strong>${data.user_name}</strong>,
        </p>
        
        <p style="margin-bottom: 24px; font-size: 16px;">
          <strong>${data.event_title}</strong> starts in just <strong>30 minutes</strong>! 
          Get ready to join us.
        </p>
        
        <div style="${EVENT_CARD_STYLES}">
          <h2 style="margin: 0 0 16px 0; color: ${BRAND_COLORS.warning}; font-size: 22px;">
            ⚡ ${data.event_title}
          </h2>
          <div style="display: grid; gap: 12px; font-size: 16px;">
            <div><strong>📆 Starting:</strong> <span style="color: ${BRAND_COLORS.warning};">${data.event_time}</span></div>
            <div><strong>📍 Location:</strong> ${data.event_location}</div>
          </div>
        </div>
        
        <div style="background: #fffbeb; border-left: 4px solid ${BRAND_COLORS.warning}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
          <h3 style="margin: 0 0 8px 0; color: ${BRAND_COLORS.warning};">⏱️ Last Minute Prep</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>The "Join Live Event" button will appear in 20 minutes</li>
            <li>Make sure you're logged into the EAU Members system</li>
            <li>Close unnecessary applications to ensure smooth performance</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${data.event_link}" style="${BUTTON_STYLES.replace(BRAND_COLORS.secondary, BRAND_COLORS.warning)}">
            🎯 Go to Event Page
          </a>
        </div>
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  static eventLive(data: EmailTemplateData): string {
    const content = `
      <div style="${HEADER_STYLES.replace(BRAND_COLORS.secondary, BRAND_COLORS.danger)}">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">
          🔴 We're Live!
        </h1>
        <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 16px;">
          Join us now!
        </p>
      </div>
      
      <div style="${CONTENT_STYLES}">
        <p style="font-size: 18px; margin-bottom: 24px;">
          Hello <strong>${data.user_name}</strong>,
        </p>
        
        <p style="margin-bottom: 24px; font-size: 16px;">
          <strong>${data.event_title}</strong> is <strong>starting now</strong>! 
          Don't miss out - join us live.
        </p>
        
        <div style="${EVENT_CARD_STYLES.replace(BRAND_COLORS.secondary, BRAND_COLORS.danger)}">
          <h2 style="margin: 0 0 16px 0; color: ${BRAND_COLORS.danger}; font-size: 22px;">
            🔴 LIVE: ${data.event_title}
          </h2>
          <div style="display: grid; gap: 12px; font-size: 16px;">
            <div><strong>🔴 Status:</strong> <span style="color: ${BRAND_COLORS.danger};">LIVE NOW</span></div>
            <div><strong>📍 Location:</strong> ${data.event_location}</div>
          </div>
        </div>
        
        <div style="background: #fef2f2; border-left: 4px solid ${BRAND_COLORS.danger}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
          <h3 style="margin: 0 0 8px 0; color: ${BRAND_COLORS.danger};">🎯 How to Join</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Click the "Join Live Event" button below</li>
            <li>You'll be automatically checked in</li>
            <li>Redirected to the live event</li>
            <li>CPD points will be awarded automatically</li>
          </ol>
        </div>
        
        <div style="text-align: center;">
          <a href="${data.event_link}" style="${BUTTON_STYLES.replace(BRAND_COLORS.secondary, BRAND_COLORS.danger)} font-size: 18px; padding: 18px 36px;">
            🚀 JOIN LIVE EVENT
          </a>
        </div>
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  static cpdPointsAwarded(data: EmailTemplateData): string {
    const content = `
      <div style="${HEADER_STYLES.replace('linear-gradient(135deg, #0f172a 0%, #059669 100%)', `linear-gradient(135deg, ${BRAND_COLORS.secondary} 0%, #10b981 100%)`)}">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">
          🏆 CPD Points Awarded!
        </h1>
        <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 16px;">
          Congratulations on your learning achievement
        </p>
      </div>
      
      <div style="${CONTENT_STYLES}">
        <p style="font-size: 18px; margin-bottom: 24px;">
          Hello <strong>${data.user_name}</strong>,
        </p>
        
        <p style="margin-bottom: 24px; font-size: 16px;">
          Great news! You have successfully earned CPD points for attending <strong>${data.event_title}</strong>.
        </p>
        
        <div style="${EVENT_CARD_STYLES.replace(BRAND_COLORS.secondary, BRAND_COLORS.success)}">
          <h2 style="margin: 0 0 16px 0; color: ${BRAND_COLORS.success}; font-size: 22px;">
            🎓 CPD Points Earned
          </h2>
          <div style="display: grid; gap: 12px; font-size: 16px;">
            <div><strong>📚 Event:</strong> ${data.event_title}</div>
            <div><strong>📆 Date Attended:</strong> ${data.event_date}</div>
            <div><strong>⭐ Points Earned:</strong> <span style="color: ${BRAND_COLORS.success}; font-size: 20px; font-weight: bold;">${data.cpd_points || 0} CPD Points</span></div>
            ${data.cpd_category ? `<div><strong>📂 Category:</strong> ${data.cpd_category}</div>` : ''}
          </div>
        </div>
        
        <div style="background: #ecfdf5; border-left: 4px solid ${BRAND_COLORS.success}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
          <h3 style="margin: 0 0 8px 0; color: ${BRAND_COLORS.success};">✅ What This Means</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>These points have been added to your CPD record</li>
            <li>You can view your progress in your dashboard</li>
            <li>Keep track of your professional development journey</li>
            <li>These count towards your annual CPD requirements</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="http://localhost:5180/cpd" style="${BUTTON_STYLES}">
            📊 View My CPD Record
          </a>
        </div>
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }

  static reminder3Days(data: EmailTemplateData): string {
    return this.getGenericReminder(data, '3 days', '📍', BRAND_COLORS.accent, 'Almost here!');
  }

  static reminder1Hour(data: EmailTemplateData): string {
    return this.getGenericReminder(data, '1 hour', '⏰', BRAND_COLORS.warning, 'Final countdown!');
  }

  private static getGenericReminder(data: EmailTemplateData, timeframe: string, icon: string, color: string, subtitle: string): string {
    const content = `
      <div style="${HEADER_STYLES.replace(BRAND_COLORS.secondary, color)}">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">
          ${icon} Event in ${timeframe}
        </h1>
        <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 16px;">
          ${subtitle}
        </p>
      </div>
      
      <div style="${CONTENT_STYLES}">
        <p style="font-size: 18px; margin-bottom: 24px;">
          Hello <strong>${data.user_name}</strong>,
        </p>
        
        <p style="margin-bottom: 24px; font-size: 16px;">
          <strong>${data.event_title}</strong> is in ${timeframe}. We're excited to see you there!
        </p>
        
        <div style="${EVENT_CARD_STYLES.replace(BRAND_COLORS.secondary, color)}">
          <h2 style="margin: 0 0 16px 0; color: ${color}; font-size: 22px;">
            ${icon} ${data.event_title}
          </h2>
          <div style="display: grid; gap: 12px; font-size: 16px;">
            <div><strong>📆 Date:</strong> ${data.event_date}</div>
            <div><strong>🕐 Time:</strong> ${data.event_time}</div>
            <div><strong>📍 Location:</strong> ${data.event_location}</div>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="${data.event_link}" style="${BUTTON_STYLES.replace(BRAND_COLORS.secondary, color)}">
            📖 Event Details
          </a>
        </div>
      </div>
    `;
    
    return this.getBaseTemplate(content);
  }
}