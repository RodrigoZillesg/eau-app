"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openLearningSSOService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const OPENLEARNING_API_KEY = process.env.OPENLEARNING_API_KEY || '681bbb338d4d83608d1d6114.c9323f76014106f3a8f6531f958b541a80f3ce39afc3d33244a09b27c6d075bd';
const OPENLEARNING_INSTITUTION_ID = process.env.OPENLEARNING_INSTITUTION_ID || 'english-australia';
const OPENLEARNING_API_BASE = 'https://api.openlearning.com/v2.1';
class OpenLearningSSOService {
    apiKey;
    institutionId;
    constructor() {
        this.apiKey = OPENLEARNING_API_KEY;
        this.institutionId = OPENLEARNING_INSTITUTION_ID;
    }
    /**
     * Generate OAuth 1.0 signature for SSO
     */
    generateOAuthSignature(method, url, params, consumerSecret, tokenSecret = '') {
        // Sort parameters alphabetically
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');
        // Create signature base string
        const signatureBase = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
        // Create signing key
        const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
        // Generate HMAC-SHA1 signature
        const signature = crypto_1.default
            .createHmac('sha1', signingKey)
            .update(signatureBase)
            .digest('base64');
        return signature;
    }
    /**
     * Generate SSO link for a user
     */
    async generateSSOLink(params) {
        try {
            // Check if user already has OpenLearning ID
            const { data: member } = await database_1.supabaseAdmin
                .from('members')
                .select('openlearning_user_id, openlearning_external_id')
                .eq('user_id', params.userId)
                .single();
            let openlearningUserId = member?.openlearning_user_id;
            let externalId = member?.openlearning_external_id || params.userId;
            // If user doesn't have OpenLearning ID, provision them
            if (!openlearningUserId) {
                console.log('Provisioning new OpenLearning user for:', params.email);
                const provisionResult = await this.provisionUser({
                    externalId,
                    email: params.email,
                    fullName: params.fullName
                });
                if (provisionResult.success) {
                    openlearningUserId = provisionResult.userId;
                    // Update database with OpenLearning user ID
                    if (openlearningUserId) {
                        await database_1.supabaseAdmin
                            .from('members')
                            .update({
                            openlearning_user_id: openlearningUserId,
                            openlearning_external_id: externalId,
                            openlearning_provisioned_at: new Date().toISOString()
                        })
                            .eq('user_id', params.userId);
                        console.log('Updated member with OpenLearning user ID:', openlearningUserId);
                    }
                    else {
                        throw new Error('Failed to get OpenLearning user ID');
                    }
                }
                else {
                    throw new Error('Failed to provision user in OpenLearning');
                }
            }
            // Now get the sign-on URL from the API
            const signOnUrl = `${OPENLEARNING_API_BASE}/institutions/${this.institutionId}/managed-users/${openlearningUserId}/sign-on/`;
            console.log('Getting sign-on URL from:', signOnUrl);
            const response = await fetch(signOnUrl, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    return_url: params.returnUrl || 'http://localhost:5180/dashboard'
                }).toString()
            });
            if (!response.ok) {
                const error = await response.text();
                console.error('Sign-on API error:', error);
                throw new Error(`Failed to get sign-on URL: ${response.status}`);
            }
            const result = await response.json();
            console.log('Sign-on response:', JSON.stringify(result, null, 2));
            // Check if the response has the expected structure
            if (!result || !result.data) {
                throw new Error('Invalid response structure from OpenLearning API');
            }
            // Extract values from the data object
            const data = result.data;
            let ssoUrl = data.url;
            let ssoParams = data.params || {};
            let method = data.method || 'POST';
            console.log('Extracted values:');
            console.log('- URL:', ssoUrl);
            console.log('- Method:', method);
            console.log('- Params:', ssoParams);
            if (!ssoUrl) {
                console.error('Could not find SSO URL in response data');
                throw new Error('SSO URL not found in response data');
            }
            return {
                success: true,
                url: ssoUrl,
                method: method,
                params: ssoParams,
                openlearningUserId
            };
        }
        catch (error) {
            console.error('Failed to generate SSO link:', error);
            throw new Error(`SSO generation failed: ${error.message}`);
        }
    }
    /**
     * Search for existing user by email
     */
    async findUserByEmail(email) {
        try {
            const url = `${OPENLEARNING_API_BASE}/institutions/${this.institutionId}/managed-users/`;
            const response = await fetch(url, {
                headers: {
                    'X-API-Key': this.apiKey
                }
            });
            if (!response.ok) {
                console.error('Failed to fetch managed users');
                return null;
            }
            const result = await response.json();
            const users = result.data || [];
            // Find user by email
            const user = users.find((u) => u.primary_email_address === email ||
                u.email === email);
            return user?.id || null;
        }
        catch (error) {
            console.error('Error searching for user:', error);
            return null;
        }
    }
    /**
     * Provision a new user in OpenLearning
     */
    async provisionUser(params) {
        try {
            // First, check if user already exists
            console.log('Checking if user already exists with email:', params.email);
            const existingUserId = await this.findUserByEmail(params.email);
            if (existingUserId) {
                console.log('User already exists with ID:', existingUserId);
                return {
                    success: true,
                    userId: existingUserId,
                    externalId: params.externalId,
                    alreadyExists: true
                };
            }
            // Create new user
            console.log('Creating new user in OpenLearning...');
            const url = `${OPENLEARNING_API_BASE}/institutions/${this.institutionId}/managed-users/`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    external_id: params.externalId,
                    external_institution_id: this.institutionId, // Required parameter
                    primary_email_address: params.email, // Updated parameter name
                    full_name: params.fullName,
                    send_welcome_email: false // Don't send OpenLearning welcome email
                })
            });
            if (!response.ok) {
                const error = await response.text();
                console.error('Failed to provision user:', error);
                throw new Error(`Provisioning failed: ${error}`);
            }
            const result = await response.json();
            console.log('Provision response:', JSON.stringify(result, null, 2));
            // Extract user ID from response
            const userId = result.data?.id || result.id || null;
            if (!userId) {
                console.error('No user ID in response:', result);
                // If the user already exists, the response might be different
                // Return success but without userId
                return {
                    success: true,
                    userId: null, // Will be handled by the caller
                    externalId: params.externalId
                };
            }
            return {
                success: true,
                userId: userId,
                externalId: params.externalId
            };
        }
        catch (error) {
            console.error('Error provisioning user:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get user's course completions
     */
    async getUserCourseCompletions(openlearningUserId) {
        try {
            const url = `${OPENLEARNING_API_BASE}/institutions/${this.institutionId}/managed-users/${openlearningUserId}/completions/`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            if (!response.ok) {
                console.error('Failed to get course completions');
                return [];
            }
            const result = await response.json();
            return result.completions || [];
        }
        catch (error) {
            console.error('Error getting course completions:', error);
            return [];
        }
    }
    /**
     * Import course completions as CPD activities
     */
    async importCertificatesAsCPD(memberId, openlearningUserId) {
        try {
            console.log(`Starting certificate import for member ${memberId}, OpenLearning user ${openlearningUserId}`);
            // Get course completions from OpenLearning
            const completions = await this.getUserCourseCompletions(openlearningUserId);
            console.log(`Found ${completions.length} completions for user ${openlearningUserId}`);
            if (completions.length === 0) {
                return { success: true, imported: 0, message: 'No completions found' };
            }
            let importedCount = 0;
            for (const completion of completions) {
                // Check if this completion was already imported
                const { data: existingCPD } = await database_1.supabaseAdmin
                    .from('cpd_activities')
                    .select('id')
                    .eq('member_id', memberId)
                    .eq('openlearning_completion_id', completion.id)
                    .single();
                if (!existingCPD) {
                    // Create new CPD activity from completion
                    const { error: cpdError } = await database_1.supabaseAdmin
                        .from('cpd_activities')
                        .insert({
                        member_id: memberId,
                        category_id: 1, // Default category (adjust as needed)
                        category_name: 'Professional Development',
                        activity_title: completion.course_title || 'OpenLearning Course Completion',
                        description: `Certificate earned from OpenLearning course: ${completion.course_title}`,
                        provider: 'OpenLearning',
                        date_completed: completion.completed_at ? new Date(completion.completed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        hours: completion.duration_hours || 2, // Default to 2 hours
                        points: completion.cpd_points || 2, // Default to 2 points
                        status: 'approved', // Auto-approve OpenLearning certificates
                        evidence_url: completion.certificate_url,
                        openlearning_completion_id: completion.id,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                    if (!cpdError) {
                        importedCount++;
                        console.log(`✅ Imported completion: ${completion.course_title}`);
                    }
                    else {
                        console.error(`❌ Failed to import completion ${completion.id}:`, cpdError);
                    }
                }
                else {
                    console.log(`⏭️ Completion ${completion.id} already imported`);
                }
            }
            console.log(`✅ Certificate import completed: ${importedCount}/${completions.length} imported`);
            return {
                success: true,
                imported: importedCount,
                total: completions.length,
                message: `Imported ${importedCount} certificates as CPD activities`
            };
        }
        catch (error) {
            console.error('Certificate import failed:', error);
            return {
                success: false,
                imported: 0,
                error: error.message
            };
        }
    }
    /**
     * Sync all OpenLearning users with our database
     */
    async syncAllUsers() {
        try {
            console.log('Starting OpenLearning user sync...');
            // Get all managed users from OpenLearning
            const url = `${OPENLEARNING_API_BASE}/institutions/${this.institutionId}/managed-users/`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch managed users');
            }
            const result = await response.json();
            const openlearningUsers = result.users || [];
            console.log(`Found ${openlearningUsers.length} users in OpenLearning`);
            // Get all members from our database
            const { data: members } = await database_1.supabaseAdmin
                .from('members')
                .select('id, email, openlearning_user_id, openlearning_external_id');
            if (!members) {
                console.log('No members found in database');
                return 0;
            }
            let syncCount = 0;
            // Match users by email or external_id
            for (const olUser of openlearningUsers) {
                const member = members.find((m) => m.email === olUser.email ||
                    m.openlearning_external_id === olUser.external_id);
                if (member && !member.openlearning_user_id) {
                    // Update member with OpenLearning user ID
                    const { error } = await database_1.supabaseAdmin
                        .from('members')
                        .update({
                        openlearning_user_id: olUser.id,
                        openlearning_external_id: olUser.external_id,
                        openlearning_last_sync: new Date().toISOString()
                    })
                        .eq('id', member.id);
                    if (!error) {
                        syncCount++;
                        console.log(`Synced member ${member.email} with OpenLearning user ${olUser.id}`);
                    }
                }
            }
            // Log sync operation
            await database_1.supabaseAdmin
                .from('openlearning_sync_logs')
                .insert({
                sync_type: 'manual',
                status: 'completed',
                members_processed: syncCount,
                completed_at: new Date().toISOString(),
                result: {
                    total_openlearning_users: openlearningUsers.length,
                    total_members: members.length,
                    synced: syncCount
                }
            });
            console.log(`✅ Sync completed: ${syncCount} users synchronized`);
            return syncCount;
        }
        catch (error) {
            console.error('Sync failed:', error);
            // Log failed sync
            await database_1.supabaseAdmin
                .from('openlearning_sync_logs')
                .insert({
                sync_type: 'manual',
                status: 'failed',
                error_message: error.message,
                completed_at: new Date().toISOString()
            });
            throw error;
        }
    }
}
exports.openLearningSSOService = new OpenLearningSSOService();
//# sourceMappingURL=openlearningSSO.service.js.map