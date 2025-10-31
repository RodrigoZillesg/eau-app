import cron from 'node-cron';
import { openLearningCorrectService } from './openlearningCorrect.service';
import { supabaseAdmin as supabase } from '../config/database';
import { RetryHelper } from '../utils/retryHelper';

interface SyncResult {
  success: boolean;
  membersProcessed: number;
  coursesImported: number;
  cpdActivitiesCreated: number;
  errors: string[];
  executionTime: number;
}

interface SyncLog {
  id?: string;
  sync_type: 'scheduled' | 'manual' | 'webhook';
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  result?: SyncResult;
  error_message?: string;
  members_processed?: number;
  courses_imported?: number;
  cpd_activities_created?: number;
  execution_time_ms?: number;
}

interface ExistingCourse {
  id: string;
  cpd_activity_id?: string;
  completion_percentage?: number;
  completion_date?: string;
}

export class OpenLearningSyncScheduler {
  private static instance: OpenLearningSyncScheduler;
    private syncInProgress = false;
  private lastSyncTime: Date | null = null;

  private constructor() {
    console.log('🔧 Initializing OpenLearning Sync Scheduler...');
    openLearningCorrectService = new OpenLearningService();
    this.initializeScheduler();
  }

  public static getInstance(): OpenLearningSyncScheduler {
    if (!OpenLearningSyncScheduler.instance) {
      OpenLearningSyncScheduler.instance = new OpenLearningSyncScheduler();
    }
    return OpenLearningSyncScheduler.instance;
  }

  /**
   * Initialize the daily scheduler
   */
  private initializeScheduler(): void {
    // Run daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Starting scheduled OpenLearning sync...');
      await this.performSync('scheduled');
    }, {
      timezone: 'Australia/Sydney'
    });

    // Also run every 6 hours for more frequent updates
    cron.schedule('0 */6 * * *', async () => {
      console.log('🔄 Starting frequent OpenLearning sync...');
      await this.performSync('scheduled');
    }, {
      timezone: 'Australia/Sydney'
    });

    console.log('📅 OpenLearning sync scheduler initialized');
    console.log('   - Daily sync: 2:00 AM AEST (0 2 * * *)');
    console.log('   - Frequent sync: Every 6 hours (0 */6 * * *)');
    console.log('   - Timezone: Australia/Sydney');
  }

  /**
   * Perform manual sync
   */
  public async performManualSync(): Promise<SyncResult> {
    return await this.performSync('manual');
  }

  /**
   * Perform sync triggered by webhook
   */
  public async performWebhookSync(): Promise<SyncResult> {
    return await this.performSync('webhook');
  }

  /**
   * Main sync function
   */
  private async performSync(syncType: 'scheduled' | 'manual' | 'webhook'): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    const startTime = new Date();

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('openlearning_sync_logs')
      .insert({
        sync_type: syncType,
        started_at: startTime.toISOString(),
        status: 'running'
      })
      .select()
      .single();

    if (logError) {
      console.error('❌ Failed to create sync log:', logError);
    }

    const result: SyncResult = {
      success: false,
      membersProcessed: 0,
      coursesImported: 0,
      cpdActivitiesCreated: 0,
      errors: [],
      executionTime: 0
    };

    try {
      console.log(`🚀 Starting OpenLearning sync (${syncType})`);

      // Get all provisioned members (members with openlearning_user_id)
      const { data: provisionedMembers, error: membersError } = await supabase
        .from('members')
        .select('id, openlearning_user_id, first_name, last_name, email')
        .not('openlearning_user_id', 'is', null);

      if (membersError) {
        throw new Error(`Failed to fetch provisioned members: ${membersError.message}`);
      }

      console.log(`👥 Found ${provisionedMembers?.length || 0} provisioned members`);

      if (!provisionedMembers || provisionedMembers.length === 0) {
        result.success = true;
        result.executionTime = Date.now() - startTime.getTime();
        await this.updateSyncLog(syncLog?.id, result, 'completed');
        this.syncInProgress = false;
        return result;
      }

      // Process each member
      for (const member of provisionedMembers) {
        try {
          console.log(`🔄 Processing member: ${member.first_name} ${member.last_name}`);

          // Get courses for this member from OpenLearning with retry logic
          const coursesRetryResult = await RetryHelper.executeWithCondition(
            () => this.openLearningCorrectService.getCourseCompletions(member.id),
            RetryHelper.retryConditions.apiErrors,
            {
              maxAttempts: 3,
              baseDelay: 2000, // 2 seconds
              maxDelay: 15000  // 15 seconds
            }
          );

          if (!coursesRetryResult.success) {
            result.errors.push(`Failed to get courses for ${member.first_name} after ${coursesRetryResult.attempts} attempts: ${coursesRetryResult.error?.message}`);
            continue;
          }

          const coursesResult = coursesRetryResult.result!;
          const courses = coursesResult.success ? (coursesResult.courses || []) : [];

          result.membersProcessed++;

          // Process each course
          for (const course of courses) {
            // Check if course is already imported
            const { data: existingCourse } = await supabase
              .from('openlearning_courses')
              .select('id, cpd_activity_id, completion_percentage, completion_date')
              .eq('member_id', member.id)
              .eq('openlearning_course_id', course.course_id || course.id)
              .single();

            if (!existingCourse) {
              // Import new course with retry logic for database operations
              const importRetryResult = await RetryHelper.executeWithCondition(
                async () => {
                  const { data, error } = await supabase
                    .from('openlearning_courses')
                    .insert({
                      member_id: member.id,
                      openlearning_course_id: course.course_id || course.id,
                      openlearning_class_id: course.class_id,
                      course_name: course.course_name || course.name,
                      course_description: course.course_description || course.description,
                      completion_date: course.completion_date,
                      completion_percentage: course.completion_percentage || 100,
                      certificate_url: course.certificate_url,
                      synced_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                  if (error) throw error;
                  return data;
                },
                RetryHelper.retryConditions.dbErrors,
                {
                  maxAttempts: 2,
                  baseDelay: 1000,
                  maxDelay: 5000
                }
              );

              if (!importRetryResult.success) {
                result.errors.push(`Failed to import course ${course.course_name || course.name} for ${member.first_name} after ${importRetryResult.attempts} attempts: ${importRetryResult.error?.message}`);
                continue;
              }

              const importedCourse = importRetryResult.result!

              result.coursesImported++;

              // Create CPD activity if course is completed
              if ((course.completion_percentage || 100) >= 100 && course.completion_date) {
                const cpdRetryResult = await RetryHelper.executeWithCondition(
                  async () => {
                    const { data, error } = await supabase
                      .from('cpd_activities')
                      .insert({
                        user_id: member.id,
                        activity_name: `OpenLearning: ${course.course_name || course.name}`,
                        activity_type: 'online_course',
                        cpd_points: this.calculateCPDPoints(course),
                        activity_date: course.completion_date,
                        status: 'approved', // Auto-approve OpenLearning courses
                        cpd_category: 'professional_development',
                        description: course.course_description || course.description || `Completed OpenLearning course: ${course.course_name || course.name}`,
                        provider: 'OpenLearning',
                        certificate_url: course.certificate_url,
                        external_reference: course.course_id || course.id
                      })
                      .select()
                      .single();

                    if (error) throw error;
                    return data;
                  },
                  RetryHelper.retryConditions.dbErrors,
                  {
                    maxAttempts: 2,
                    baseDelay: 1000,
                    maxDelay: 5000
                  }
                );

                if (cpdRetryResult.success) {
                  const cpdActivity = cpdRetryResult.result!;

                  // Update course with CPD activity reference
                  await RetryHelper.executeWithCondition(
                    async () => {
                      const { error } = await supabase
                        .from('openlearning_courses')
                        .update({ cpd_activity_id: cpdActivity.id })
                        .eq('id', importedCourse.id);

                      if (error) throw error;
                    },
                    RetryHelper.retryConditions.dbErrors,
                    { maxAttempts: 2, baseDelay: 500 }
                  );

                  result.cpdActivitiesCreated++;
                  console.log(`✅ Created CPD activity for ${course.course_name || course.name} (${this.calculateCPDPoints(course)} points)`);
                } else {
                  result.errors.push(`Failed to create CPD activity for course ${course.course_name || course.name} after ${cpdRetryResult.attempts} attempts: ${cpdRetryResult.error?.message}`);
                }
              }

              console.log(`✅ Imported course: ${course.course_name || course.name}`);
            } else {
              // Update existing course if needed
              const updates: any = {};
              let needsUpdate = false;

              const existingCourseTyped = existingCourse as ExistingCourse;

              if ((course.completion_percentage || 100) !== existingCourseTyped.completion_percentage) {
                updates.completion_percentage = course.completion_percentage || 100;
                needsUpdate = true;
              }

              if (course.completion_date && course.completion_date !== existingCourseTyped.completion_date) {
                updates.completion_date = course.completion_date;
                needsUpdate = true;
              }

              if (needsUpdate) {
                updates.synced_at = new Date().toISOString();
                await supabase
                  .from('openlearning_courses')
                  .update(updates)
                  .eq('id', existingCourseTyped.id);

                // Create CPD activity if just completed and doesn't have one
                if (!existingCourseTyped.cpd_activity_id &&
                    (course.completion_percentage || 100) >= 100 &&
                    course.completion_date) {
                  // Same CPD creation logic as above
                  try {
                    const { data: cpdActivity, error: cpdError } = await supabase
                      .from('cpd_activities')
                      .insert({
                        user_id: member.id,
                        activity_name: `OpenLearning: ${course.course_name || course.name}`,
                        activity_type: 'online_course',
                        cpd_points: this.calculateCPDPoints(course),
                        activity_date: course.completion_date,
                        status: 'approved',
                        cpd_category: 'professional_development',
                        description: course.course_description || course.description || `Completed OpenLearning course: ${course.course_name || course.name}`,
                        provider: 'OpenLearning',
                        certificate_url: course.certificate_url,
                        external_reference: course.course_id || course.id
                      })
                      .select()
                      .single();

                    if (!cpdError && cpdActivity) {
                      await supabase
                        .from('openlearning_courses')
                        .update({ cpd_activity_id: cpdActivity.id })
                        .eq('id', existingCourseTyped.id);

                      result.cpdActivitiesCreated++;
                    }
                  } catch (error: any) {
                    result.errors.push(`Late CPD creation error for ${course.course_name || course.name}: ${error.message}`);
                  }
                }
              }
            }
          }

          // Update member's last sync time
          await supabase
            .from('members')
            .update({ openlearning_last_sync: new Date().toISOString() })
            .eq('id', member.id);

        } catch (memberError: any) {
          result.errors.push(`Error processing member ${member.first_name} ${member.last_name}: ${memberError.message}`);
          console.error(`❌ Error processing member ${member.first_name}:`, memberError);
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      result.success = result.errors.length === 0;
      result.executionTime = Date.now() - startTime.getTime();

      console.log(`✅ Sync completed:`);
      console.log(`   - Members processed: ${result.membersProcessed}`);
      console.log(`   - Courses imported: ${result.coursesImported}`);
      console.log(`   - CPD activities created: ${result.cpdActivitiesCreated}`);
      console.log(`   - Errors: ${result.errors.length}`);
      console.log(`   - Execution time: ${result.executionTime}ms`);

      await this.updateSyncLog(syncLog?.id, result, 'completed');
      this.lastSyncTime = new Date();

    } catch (error: any) {
      result.success = false;
      result.executionTime = Date.now() - startTime.getTime();
      result.errors.push(`Sync failed: ${error.message}`);

      console.error('❌ OpenLearning sync failed:', error);
      await this.updateSyncLog(syncLog?.id, result, 'failed', error.message);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  /**
   * Calculate CPD points for a course
   */
  private calculateCPDPoints(course: any): number {
    // Default to 1 point per course
    // Could be enhanced to calculate based on course duration, etc.
    if (course.duration_hours) {
      return Math.max(1, Math.floor(course.duration_hours));
    }
    return 1;
  }

  /**
   * Update sync log with results
   */
  private async updateSyncLog(
    logId: string | undefined,
    result: SyncResult,
    status: 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    if (!logId) return;

    try {
      await supabase
        .from('openlearning_sync_logs')
        .update({
          completed_at: new Date().toISOString(),
          status,
          members_processed: result.membersProcessed,
          courses_imported: result.coursesImported,
          cpd_activities_created: result.cpdActivitiesCreated,
          execution_time_ms: result.executionTime,
          error_message: errorMessage,
          result: result
        })
        .eq('id', logId);
    } catch (error) {
      console.error('Failed to update sync log:', error);
    }
  }

  /**
   * Get sync status
   */
  public getSyncStatus() {
    return {
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime
    };
  }

  /**
   * Get recent sync logs
   */
  public async getSyncLogs(limit = 10) {
    const { data, error } = await supabase
      .from('openlearning_sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch sync logs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get sync statistics
   */
  public async getSyncStats() {
    const { data: stats, error } = await supabase
      .rpc('get_openlearning_sync_stats');

    if (error) {
      console.error('Failed to fetch sync stats:', error);
      return {
        totalMembers: 0,
        provisionedMembers: 0,
        totalCourses: 0,
        totalCPDActivities: 0,
        lastSyncTime: null,
        avgExecutionTime: 0
      };
    }

    return stats || {
      totalMembers: 0,
      provisionedMembers: 0,
      totalCourses: 0,
      totalCPDActivities: 0,
      lastSyncTime: null,
      avgExecutionTime: 0
    };
  }
}

// Export singleton instance
export const openLearningSyncScheduler = OpenLearningSyncScheduler.getInstance();