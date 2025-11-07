export interface MembershipFee {
    id: string;
    membership_type: string;
    base_fee: number | null;
    per_site_fee: number | null;
    per_student_week_fee: number | null;
    fixed_annual_fee: number | null;
    gst_rate: number;
    description: string | null;
    payment_terms: string | null;
    is_active: boolean;
}
export interface FeeCalculation {
    membershipType: string;
    baseFee: number;
    gstAmount: number;
    totalFee: number;
    gstRate: number;
    description: string | null;
    payment_terms: string | null;
}
export declare class MembershipFeeService {
    private static GST_RATE;
    /**
     * Get all available membership types
     */
    static getMembershipTypes(): Promise<MembershipFee[]>;
    /**
     * Calculate membership fee including GST
     */
    static calculateFee(membershipType: string, numSites?: number, studentWeeks?: number): Promise<FeeCalculation>;
    /**
     * Get fee calculation for multiple membership types
     */
    static calculateMultipleFees(membershipTypes: string[]): Promise<FeeCalculation[]>;
}
//# sourceMappingURL=membershipFee.service.d.ts.map