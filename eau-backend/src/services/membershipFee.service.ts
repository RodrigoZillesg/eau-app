import { logError, logInfo } from '../utils/logger';
import { supabaseAdmin } from '../config/database';

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

export class MembershipFeeService {
  private static GST_RATE = 0.10; // 10% GST

  /**
   * Get all available membership types
   */
  static async getMembershipTypes(): Promise<MembershipFee[]> {
    try {
      const { data: fees, error } = await supabaseAdmin
        .from('membership_fees')
        .select('*')
        .eq('is_active', true)
        .order('membership_type');

      if (error) throw error;

      return fees || [];
    } catch (error) {
      logError(error as Error);
      throw new Error('Failed to fetch membership types');
    }
  }

  /**
   * Calculate membership fee including GST
   */
  static async calculateFee(membershipType: string, numSites: number = 1, studentWeeks: number = 0): Promise<FeeCalculation> {
    try {
      logInfo('Calculating fee for membership type', { membershipType, numSites, studentWeeks });

      const { data: fee, error } = await supabaseAdmin
        .from('membership_fees')
        .select('*')
        .eq('membership_type', membershipType)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      if (!fee) throw new Error('Membership type not found');

      let baseFee = 0;
      
      // Calculate based on membership type
      if (membershipType === 'Full Provider' && fee.base_fee) {
        const additionalSites = Math.max(0, numSites - 1);
        const siteFees = additionalSites * (fee.per_site_fee || 0);
        const studentFees = studentWeeks * (fee.per_student_week_fee || 0);
        baseFee = fee.base_fee + siteFees + studentFees;
      } else if (fee.fixed_annual_fee) {
        baseFee = fee.fixed_annual_fee;
      }

      const gstAmount = baseFee * this.GST_RATE;
      const totalFee = baseFee + gstAmount;

      const calculation: FeeCalculation = {
        membershipType: fee.membership_type,
        baseFee,
        gstAmount,
        totalFee,
        gstRate: this.GST_RATE,
        description: fee.description,
        payment_terms: fee.payment_terms
      };

      logInfo('Fee calculation completed', { calculation });
      return calculation;

    } catch (error) {
      logError(error as Error);
      throw new Error('Failed to calculate membership fee');
    }
  }

  /**
   * Get fee calculation for multiple membership types
   */
  static async calculateMultipleFees(membershipTypes: string[]): Promise<FeeCalculation[]> {
    try {
      const calculations: FeeCalculation[] = [];
      
      for (const type of membershipTypes) {
        const calculation = await this.calculateFee(type);
        calculations.push(calculation);
      }

      return calculations;
    } catch (error) {
      logError(error as Error);
      throw new Error('Failed to calculate fees');
    }
  }
}