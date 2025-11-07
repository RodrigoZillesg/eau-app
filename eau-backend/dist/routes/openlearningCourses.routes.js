"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const openlearningCatalogSync_service_1 = require("../services/openlearningCatalogSync.service");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
let isSyncing = false;
router.get('/available', auth_1.authenticate, async (req, res) => {
    try {
        let courses = await (0, openlearningCatalogSync_service_1.getAvailableCourses)();
        // If cache is empty, perform immediate synchronous sync (first time only)
        if (courses.length === 0 && !isSyncing) {
            console.log('Cache is empty - performing initial sync...');
            console.log('This will take 1-2 minutes. Please wait...');
            isSyncing = true;
            const result = await (0, openlearningCatalogSync_service_1.syncCourseCatalog)(); // Synchronous!
            isSyncing = false;
            if (result.success) {
                console.log('Initial sync completed successfully');
                courses = await (0, openlearningCatalogSync_service_1.getAvailableCourses)();
            }
            else {
                console.error('Initial sync failed:', result.error);
                throw new Error(result.error || 'Failed to perform initial sync');
            }
        }
        // If cache exists, check if needs daily background sync
        else {
            const shouldSync = await (0, openlearningCatalogSync_service_1.needsSync)();
            if (shouldSync && !isSyncing) {
                isSyncing = true;
                console.log('Starting background sync...');
                (0, openlearningCatalogSync_service_1.syncCourseCatalog)()
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
        const formattedCourses = courses.map((course) => ({
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
    }
    catch (error) {
        console.error('Error fetching OpenLearning courses:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch courses'
        });
    }
});
// Admin: Get ALL courses (including disabled) for management
router.get('/all', auth_1.authenticate, async (req, res) => {
    try {
        const { data: courses, error } = await database_1.supabaseAdmin
            .from('openlearning_course_catalog')
            .select('*')
            .order('title', { ascending: true });
        if (error)
            throw error;
        const formattedCourses = (courses || []).map((course) => ({
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
    }
    catch (error) {
        console.error('Error fetching all courses:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch courses'
        });
    }
});
// Admin: Disable a course
router.patch('/:courseId/disable', auth_1.authenticate, async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user?.id;
        const { data, error } = await database_1.supabaseAdmin
            .from('openlearning_course_catalog')
            .update({
            is_manually_disabled: true,
            disabled_at: new Date().toISOString(),
            disabled_by: userId
        })
            .eq('course_id', courseId)
            .select()
            .single();
        if (error)
            throw error;
        res.json({
            success: true,
            message: 'Course disabled successfully',
            course: data
        });
    }
    catch (error) {
        console.error('Error disabling course:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to disable course'
        });
    }
});
// Admin: Enable a course
router.patch('/:courseId/enable', auth_1.authenticate, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { data, error } = await database_1.supabaseAdmin
            .from('openlearning_course_catalog')
            .update({
            is_manually_disabled: false,
            disabled_at: null,
            disabled_by: null
        })
            .eq('course_id', courseId)
            .select()
            .single();
        if (error)
            throw error;
        res.json({
            success: true,
            message: 'Course enabled successfully',
            course: data
        });
    }
    catch (error) {
        console.error('Error enabling course:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to enable course'
        });
    }
});
router.post('/sync', auth_1.authenticate, async (req, res) => {
    try {
        if (isSyncing) {
            return res.status(409).json({
                success: false,
                error: 'Sync already in progress'
            });
        }
        isSyncing = true;
        const result = await (0, openlearningCatalogSync_service_1.syncCourseCatalog)();
        isSyncing = false;
        res.json({
            success: result.success,
            result
        });
    }
    catch (error) {
        isSyncing = false;
        console.error('Error syncing courses:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to sync courses'
        });
    }
});
exports.default = router;
//# sourceMappingURL=openlearningCourses.routes.js.map