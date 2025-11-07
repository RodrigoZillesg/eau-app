"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
const path_1 = require("path");
// Load environment variables
dotenv.config({ path: (0, path_1.resolve)(__dirname, '../../.env') });
const API_BASE_URL = 'http://localhost:3001/api/v1';
class SSOTester {
    results = [];
    authToken = '';
    async login(email, password) {
        try {
            console.log('\n📝 Step 1: Logging in...');
            const response = await axios_1.default.post(`${API_BASE_URL}/auth/login`, {
                email,
                password
            });
            // Check for different response formats
            if (response.data.data?.tokens?.accessToken) {
                // New format with nested data
                this.authToken = response.data.data.tokens.accessToken;
                console.log('✅ Login successful (new format)');
                this.results.push({
                    step: 'Login',
                    success: true,
                    data: {
                        userId: response.data.data.user.id,
                        email: response.data.data.user.email
                    }
                });
                return true;
            }
            else if (response.data.success && response.data.token) {
                // Old format
                this.authToken = response.data.token;
                console.log('✅ Login successful (old format)');
                this.results.push({
                    step: 'Login',
                    success: true,
                    data: { userId: response.data.user.id, email: response.data.user.email }
                });
                return true;
            }
            throw new Error('Login failed - unexpected response format');
        }
        catch (error) {
            console.error('❌ Login failed:', error.response?.data || error.message);
            this.results.push({
                step: 'Login',
                success: false,
                error: error.response?.data?.error || error.message
            });
            return false;
        }
    }
    async checkProvisionStatus(memberId) {
        try {
            console.log('\n🔍 Step 2: Checking provision status...');
            const response = await axios_1.default.get(`${API_BASE_URL}/openlearning/status/${memberId}`, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });
            const status = response.data.status;
            console.log('📊 Provision Status:');
            console.log(`  - Is Provisioned: ${status.isProvisioned ? '✅' : '❌'}`);
            console.log(`  - OpenLearning User ID: ${status.openLearningUserId || 'N/A'}`);
            console.log(`  - External ID: ${status.externalId || 'N/A'}`);
            console.log(`  - Last Synced: ${status.lastSynced || 'Never'}`);
            this.results.push({
                step: 'Check Provision Status',
                success: true,
                data: status
            });
            return status;
        }
        catch (error) {
            console.error('❌ Failed to check status:', error.response?.data || error.message);
            this.results.push({
                step: 'Check Provision Status',
                success: false,
                error: error.response?.data?.error || error.message
            });
            return null;
        }
    }
    async provisionUser(memberId) {
        try {
            console.log('\n🔧 Step 3: Provisioning user in OpenLearning...');
            const response = await axios_1.default.post(`${API_BASE_URL}/openlearning/provision`, { memberId }, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });
            if (response.data.success) {
                console.log('✅ User provisioned successfully');
                console.log(`  - OpenLearning User ID: ${response.data.openLearningUserId}`);
                this.results.push({
                    step: 'Provision User',
                    success: true,
                    data: response.data
                });
                return true;
            }
            throw new Error('Provisioning failed');
        }
        catch (error) {
            console.error('❌ Provisioning failed:', error.response?.data || error.message);
            this.results.push({
                step: 'Provision User',
                success: false,
                error: error.response?.data?.error || error.message
            });
            return false;
        }
    }
    async generateSSOUrl(memberId) {
        try {
            console.log('\n🔗 Step 4: Generating SSO Launch URL...');
            const response = await axios_1.default.post(`${API_BASE_URL}/openlearning/sso/launch`, {
                memberId,
                // Optional: specify a class ID if needed
                // classId: 'specific-class-id'
            }, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });
            if (response.data.success && response.data.launchUrl) {
                console.log('✅ SSO URL generated successfully');
                console.log(`  - Launch URL: ${response.data.launchUrl}`);
                if (response.data.sessionToken) {
                    console.log(`  - Session Token: ${response.data.sessionToken.substring(0, 20)}...`);
                }
                this.results.push({
                    step: 'Generate SSO URL',
                    success: true,
                    data: {
                        launchUrl: response.data.launchUrl,
                        sessionToken: response.data.sessionToken
                    }
                });
                return response.data.launchUrl;
            }
            throw new Error('SSO URL generation failed');
        }
        catch (error) {
            console.error('❌ SSO URL generation failed:', error.response?.data || error.message);
            this.results.push({
                step: 'Generate SSO URL',
                success: false,
                error: error.response?.data?.error || error.message
            });
            return null;
        }
    }
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        const successCount = this.results.filter(r => r.success).length;
        const totalCount = this.results.length;
        console.log(`\n✅ Successful: ${successCount}/${totalCount}`);
        console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
        console.log('\n📝 Detailed Results:');
        this.results.forEach((result, index) => {
            const icon = result.success ? '✅' : '❌';
            console.log(`\n${index + 1}. ${icon} ${result.step}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
            if (result.data && result.success) {
                console.log(`   Data:`, JSON.stringify(result.data, null, 2).split('\n').map(line => '   ' + line).join('\n'));
            }
        });
        console.log('\n' + '='.repeat(60));
    }
}
// Main test function
async function testSSOFlow() {
    const tester = new SSOTester();
    // Test credentials - usando um membro real
    const testEmail = 'rrzillesg@gmail.com'; // Admin user
    const testPassword = 'Salmo119:97';
    let memberId = '';
    try {
        console.log('🚀 Starting OpenLearning SSO Test');
        console.log('='.repeat(60));
        // Step 1: Login
        const loginSuccess = await tester.login(testEmail, testPassword);
        if (!loginSuccess) {
            throw new Error('Login failed - cannot continue test');
        }
        // Get member ID from login response
        const loginResult = tester['results'].find(r => r.step === 'Login');
        memberId = loginResult?.data?.userId;
        if (!memberId) {
            throw new Error('Could not get member ID from login');
        }
        console.log(`\n👤 Testing with Member ID: ${memberId}`);
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Step 2: Check provision status
        const status = await tester.checkProvisionStatus(memberId);
        // Add small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Step 3: Provision if needed
        if (status && !status.isProvisioned) {
            console.log('\n⚠️ User not provisioned, provisioning now...');
            const provisionSuccess = await tester.provisionUser(memberId);
            if (!provisionSuccess) {
                console.log('⚠️ Provisioning failed, but continuing to try SSO...');
            }
            // Add delay after provisioning
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        else if (status?.isProvisioned) {
            console.log('\n✅ User already provisioned, skipping provision step');
        }
        // Step 4: Generate SSO URL
        const ssoUrl = await tester.generateSSOUrl(memberId);
        if (ssoUrl) {
            console.log('\n🎉 SUCCESS! SSO URL Generated:');
            console.log('='.repeat(60));
            console.log(ssoUrl);
            console.log('='.repeat(60));
            console.log('\n📌 You can now:');
            console.log('1. Copy this URL and open it in a browser');
            console.log('2. It should log you directly into OpenLearning');
            console.log('3. The session will be valid for the configured duration');
        }
    }
    catch (error) {
        console.error('\n💥 Test failed with error:', error.message);
    }
    finally {
        // Print summary
        tester.printSummary();
        // Clean exit
        console.log('\n✨ Test completed');
        process.exit(0);
    }
}
// Run the test
console.log('🔄 Starting test in 2 seconds...');
setTimeout(() => {
    testSSOFlow().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}, 2000);
//# sourceMappingURL=test-sso-optimized.js.map