import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';
import { needsSync, syncCourseCatalog, getAvailableCourses } from '../services/openlearningCatalogSync.service';
import { supabaseAdmin } from '../config/database';

const router = Router();

let isSyncing = false;

router.get('/available', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let courses = await getAvailableCourses();

    // If cache is empty, perform immediate synchronous sync (first time only)
    if (courses.length === 0 && !isSyncing) {
      console.log('Cache is empty - performing initial sync...');
      console.log('This will take 1-2 minutes. Please wait...');

      isSyncing = true;
      const result = await syncCourseCatalog(); // Synchronous!
      isSyncing = false;

      if (result.success) {
        console.log('Initial sync completed successfully');
        courses = await getAvailableCourses();
      } else {
        console.error('Initial sync failed:', result.error);
        throw new Error(result.error || 'Failed to perform initial sync');
      }
    }
    // If cache exists, check if needs daily background sync
    else {
      const shouldSync = await needsSync();

      if (shouldSync && !isSyncing) {
        isSyncing = true;
        console.log('Starting background sync...');

        syncCourseCatalog()
          .then(() => {
            console.log('Background sync completed');
            isSyncing = false;
          })
          .catch((error) => {
            console.error('Background sync failed:', error);
            isSyncing = false;
          });
      }
    }

    const formattedCourses = courses.map((course: any) => ({
      id: course.course_id,
      title: course.title,
      description: course.description,
      imageUrl: course.image_url,
      url: course.course_url,
      price: course.price,
      selfPaced: course.self_paced
    }));

    res.json({
      success: true,
      courses: formattedCourses,
      meta: {
        total: formattedCourses.length,
        source: 'cache',
        syncing: isSyncing,
        lastChecked: courses[0]?.last_checked || null
      }
    });
  } catch (error: any) {
    console.error('Error fetching OpenLearning courses:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch courses'
    });
  }
});

// Admin: Get ALL courses (including disabled) for management
router.get('/all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { data: courses, error } = await supabaseAdmin
      .from('openlearning_course_catalog')
      .select('*')
      .order('title', { ascending: true });

    if (error) throw error;

    const formattedCourses = (courses || []).map((course: any) => ({
      id: course.id,
      courseId: course.course_id,
      title: course.title,
      description: course.description,
      imageUrl: course.image_url,
      url: course.course_url,
      price: course.price,
      selfPaced: course.self_paced,
      isAvailable: course.is_available,
      isManuallyDisabled: course.is_manually_disabled,
      disabledAt: course.disabled_at,
      lastChecked: course.last_checked
    }));

    res.json({
      success: true,
      courses: formattedCourses,
      meta: {
        total: formattedCourses.length,
        enabled: formattedCourses.filter(c => !c.isManuallyDisabled).length,
        disabled: formattedCourses.filter(c => c.isManuallyDisabled).length
      }
    });
  } catch (error: any) {
    console.error('Error fetching all courses:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch courses'
    });
  }
});

// Admin: Disable a course
router.patch('/:courseId/disable', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    const { data, error } = await supabaseAdmin
      .from('openlearning_course_catalog')
      .update({
        is_manually_disabled: true,
        disabled_at: new Date().toISOString(),
        disabled_by: userId
      })
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Course disabled successfully',
      course: data
    });
  } catch (error: any) {
    console.error('Error disabling course:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to disable course'
    });
  }
});

// Admin: Enable a course
router.patch('/:courseId/enable', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('openlearning_course_catalog')
      .update({
        is_manually_disabled: false,
        disabled_at: null,
        disabled_by: null
      })
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Course enabled successfully',
      course: data
    });
  } catch (error: any) {
    console.error('Error enabling course:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to enable course'
    });
  }
});

router.post('/sync', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (isSyncing) {
      return res.status(409).json({
        success: false,
        error: 'Sync already in progress'
      });
    }

    isSyncing = true;
    const result = await syncCourseCatalog();
    isSyncing = false;

    res.json({
      success: result.success,
      result
    });
  } catch (error: any) {
    isSyncing = false;
    console.error('Error syncing courses:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync courses'
    });
  }
});

export default router;
