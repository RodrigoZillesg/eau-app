"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipFeeService = void 0;
const logger_1 = require("../utils/logger");
const database_1 = require("../config/database");
class MembershipFeeService {
    static GST_RATE = 0.10; // 10% GST
    /**
     * Get all available membership types
     */
    static async getMembershipTypes() {
        try {
            const { data: fees, error } = await database_1.supabaseAdmin
                .from('membership_fees')
                .select('*')
                .eq('is_active', true)
                .order('membership_type');
            if (error)
                throw error;
            return fees || [];
        }
        catch (error) {
            (0, logger_1.logError)(error);
            throw new Error('Failed to fetch membership types');
        }
    }
    /**
     * Calculate membership fee including GST
     */
    static async calculateFee(membershipType, numSites = 1, studentWeeks = 0) {
        try {
            (0, logger_1.logInfo)('Calculating fee for membership type', { membershipType, numSites, studentWeeks });
            const { data: fee, error } = await database_1.supabaseAdmin
                .from('membership_fees')
                .select('*')
                .eq('membership_type', membershipType)
                .eq('is_active', true)
                .single();
            if (error)
                throw error;
            if (!fee)
                throw new Error('Membership type not found');
            let baseFee = 0;
            // Calculate based on membership type
            if (membershipType === 'Full Provider' && fee.base_fee) {
                const additionalSites = Math.max(0, numSites - 1);
                const siteFees = additionalSites * (fee.per_site_fee || 0);
                const studentFees = studentWeeks * (fee.per_student_week_fee || 0);
                baseFee = fee.base_fee + siteFees + studentFees;
            }
            else if (fee.fixed_annual_fee) {
                baseFee = fee.fixed_annual_fee;
            }
            const gstAmount = baseFee * this.GST_RATE;
            const totalFee = baseFee + gstAmount;
            const calculation = {
                membershipType: fee.membership_type,
                baseFee,
                gstAmount,
                totalFee,
                gstRate: this.GST_RATE,
                description: fee.description,
                payment_terms: fee.payment_terms
            };
            (0, logger_1.logInfo)('Fee calculation completed', { calculation });
            return calculation;
        }
        catch (error) {
            (0, logger_1.logError)(error);
            throw new Error('Failed to calculate membership fee');
        }
    }
    /**
     * Get fee calculation for multiple membership types
     */
    static async calculateMultipleFees(membershipTypes) {
        try {
            const calculations = [];
            for (const type of membershipTypes) {
                const calculation = await this.calculateFee(type);
                calculations.push(calculation);
            }
            return calculations;
        }
        catch (error) {
            (0, logger_1.logError)(error);
            throw new Error('Failed to calculate fees');
        }
    }
}
exports.MembershipFeeService = MembershipFeeService;
//# sourceMappingURL=membershipFee.service.js.map