async function testCourseCheck() {
  const testUrl = 'https://www.openlearning.com/english-australia/courses/learning-design-trial/?cl=1';

  console.log('Testing course availability check...');
  console.log('URL:', testUrl);

  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      redirect: 'follow'
    });

    console.log('HTTP Status:', response.status);

    const html = await response.text();
    console.log('HTML Length:', html.length);

    const htmlLower = html.toLowerCase();
    const checks = {
      'this course is currently unavailable': htmlLower.includes('this course is currently unavailable'),
      'course is currently unavailable': htmlLower.includes('course is currently unavailable'),
      'course is not available': htmlLower.includes('course is not available'),
      'course not found': htmlLower.includes('course not found'),
      'no longer available': htmlLower.includes('no longer available'),
      'has been removed': htmlLower.includes('has been removed'),
      'cannot be found': htmlLower.includes('cannot be found')
    };

    console.log('\nAvailability checks:');
    Object.entries(checks).forEach(([check, res]) => {
      console.log('  ' + (res ? 'TRUE' : 'FALSE') + ' - "' + check + '"');
    });

    const isUnavailable = Object.values(checks).some(v => v);
    console.log('\nFinal result:', isUnavailable ? 'UNAVAILABLE' : 'AVAILABLE');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCourseCheck();
