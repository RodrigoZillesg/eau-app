import { supabaseAdmin } from '../config/database';

const OPENLEARNING_API_KEY = '681bbb338d4d83608d1d6114.c9323f76014106f3a8f6531f958b541a80f3ce39afc3d33244a09b27c6d075bd';
const INSTITUTION_ID = 'english-australia';

interface Course {
  id: string;
  url: string;
  title: string;
  summary: string | null;
  image: string;
  self_paced: boolean;
  price: number | null;
  slug?: string;
}

interface SyncResult {
  success: boolean;
  totalCourses: number;
  availableCourses: number;
  unavailableCourses: number;
  newCourses: number;
  updatedCourses: number;
  removedCourses: number;
  error?: string;
}

/**
 * Verifica se um curso está disponível fazendo GET e analisando o HTML
 */
async function checkCourseAvailability(courseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(courseUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      console.log(`❌ Course unavailable (HTTP ${response.status}): ${courseUrl}`);
      return false;
    }

    const html = await response.text();

    // Detectar mensagem de curso indisponível (case insensitive)
    const htmlLower = html.toLowerCase();
    const isUnavailable =
      htmlLower.includes('this course is currently unavailable') ||
      htmlLower.includes('course is currently unavailable') ||
      htmlLower.includes('course is not available') ||
      htmlLower.includes('course not found') ||
      htmlLower.includes('no longer available') ||
      htmlLower.includes('has been removed') ||
      htmlLower.includes('cannot be found');

    if (isUnavailable) {
      console.log(`❌ Course unavailable (content check): ${courseUrl}`);
    }

    return !isUnavailable;
  } catch (error) {
    console.error(`❌ Error checking course availability: ${courseUrl}`, error);
    return false;
  }
}

/**
 * Extrai slug da URL do curso
 */
function extractSlug(course: Course): string {
  if (course.slug) {
    return course.slug;
  }

  if (course.url) {
    const parts = course.url.split('/').filter(part => part.length > 0);
    return parts[parts.length - 1] || course.id;
  }

  return course.id;
}

/**
 * Verifica se precisa sincronizar (última sincronização foi ontem ou antes)
 */
export async function needsSync(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('openlearning_catalog_sync_log')
      .select('sync_started_at, status')
      .eq('status', 'completed')
      .order('sync_started_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return true;
    }

    const lastSync = new Date(data.sync_started_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return lastSync < today;
  } catch (error) {
    console.error('Error checking if needs sync:', error);
    return true;
  }
}

/**
 * Sincroniza o catálogo de cursos com verificação de disponibilidade
 */
export async function syncCourseCatalog(): Promise<SyncResult> {
  const syncStartTime = new Date();
  let syncLogId: string | null = null;

  try {
    console.log('🔄 Starting OpenLearning catalog sync...');

    const { data: syncLog, error: logError } = await supabaseAdmin
      .from('openlearning_catalog_sync_log')
      .insert({
        sync_started_at: syncStartTime.toISOString(),
        status: 'running'
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`Failed to create sync log: ${logError.message}`);
    }

    syncLogId = syncLog.id;

    console.log('📡 Fetching courses from OpenLearning API...');
    const apiUrl = `https://api.openlearning.com/v2.2/institutions/${INSTITUTION_ID}/courses/?api_key=${OPENLEARNING_API_KEY}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`OpenLearning API request failed: ${response.status}`);
    }

    const apiData: any = await response.json();
    const apiCourses: Course[] = apiData.data || [];

    console.log(`📚 Found ${apiCourses.length} courses in API`);

    console.log('🔍 Checking availability of each course...');

    const BATCH_SIZE = 10;
    const coursesWithAvailability: Array<Course & { isAvailable: boolean; slug: string }> = [];

    for (let i = 0; i < apiCourses.length; i += BATCH_SIZE) {
      const batch = apiCourses.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (course) => {
          const slug = extractSlug(course);
          const courseUrl = `https://www.openlearning.com/${INSTITUTION_ID}/courses/${slug}/`;
          const isAvailable = await checkCourseAvailability(courseUrl);

          return {
            ...course,
            slug,
            isAvailable
          };
        })
      );

      coursesWithAvailability.push(...batchResults);
      const checked = i + BATCH_SIZE > apiCourses.length ? apiCourses.length : i + BATCH_SIZE;
      console.log(`✅ Checked ${checked}/${apiCourses.length} courses`);
    }

    const availableCourses = coursesWithAvailability.filter(c => c.isAvailable);
    const unavailableCourses = coursesWithAvailability.filter(c => !c.isAvailable);

    console.log(`✅ Available: ${availableCourses.length}, ❌ Unavailable: ${unavailableCourses.length}`);

    const { data: existingCourses } = await supabaseAdmin
      .from('openlearning_course_catalog')
      .select('course_id');

    const existingCourseIds = new Set(
      (existingCourses || []).map((c: any) => c.course_id)
    );

    let newCourses = 0;
    let updatedCourses = 0;

    for (const course of coursesWithAvailability) {
      const courseData = {
        course_id: course.id,
        title: course.title || 'Untitled Course',
        description: course.summary || '',
        image_url: course.image || null,
        course_url: `https://www.openlearning.com/${INSTITUTION_ID}/courses/${course.slug}/?cl=1`,
        price: course.price,
        self_paced: course.self_paced !== false,
        is_available: course.isAvailable,
        slug: course.slug,
        last_checked: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (existingCourseIds.has(course.id)) {
        await supabaseAdmin
          .from('openlearning_course_catalog')
          .update(courseData)
          .eq('course_id', course.id);

        updatedCourses++;
      } else {
        await supabaseAdmin
          .from('openlearning_course_catalog')
          .insert(courseData);

        newCourses++;
      }
    }

    const apiCourseIds = new Set(coursesWithAvailability.map(c => c.id));
    const coursesToRemove = Array.from(existingCourseIds).filter(
      id => !apiCourseIds.has(id)
    );

    let removedCourses = 0;
    if (coursesToRemove.length > 0) {
      await supabaseAdmin
        .from('openlearning_course_catalog')
        .delete()
        .in('course_id', coursesToRemove);

      removedCourses = coursesToRemove.length;
    }

    await supabaseAdmin
      .from('openlearning_catalog_sync_log')
      .update({
        sync_completed_at: new Date().toISOString(),
        total_courses: coursesWithAvailability.length,
        available_courses: availableCourses.length,
        unavailable_courses: unavailableCourses.length,
        new_courses: newCourses,
        updated_courses: updatedCourses,
        removed_courses: removedCourses,
        status: 'completed'
      })
      .eq('id', syncLogId);

    const result: SyncResult = {
      success: true,
      totalCourses: coursesWithAvailability.length,
      availableCourses: availableCourses.length,
      unavailableCourses: unavailableCourses.length,
      newCourses,
      updatedCourses,
      removedCourses
    };

    console.log('✅ Sync completed:', result);
    return result;

  } catch (error: any) {
    console.error('❌ Sync failed:', error);

    if (syncLogId) {
      await supabaseAdmin
        .from('openlearning_catalog_sync_log')
        .update({
          sync_completed_at: new Date().toISOString(),
          status: 'failed',
          error_message: error.message
        })
        .eq('id', syncLogId);
    }

    return {
      success: false,
      totalCourses: 0,
      availableCourses: 0,
      unavailableCourses: 0,
      newCourses: 0,
      updatedCourses: 0,
      removedCourses: 0,
      error: error.message
    };
  }
}

/**
 * Busca cursos disponíveis do cache (banco de dados)
 * Filtra cursos que estão disponíveis E não foram desabilitados manualmente
 */
export async function getAvailableCourses() {
  const { data, error } = await supabaseAdmin
    .from('openlearning_course_catalog')
    .select('*')
    .eq('is_available', true)
    .eq('is_manually_disabled', false)
    .order('title', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch courses from cache: ${error.message}`);
  }

  return data || [];
}
