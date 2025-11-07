export interface MembershipApplicationData {
    institutionName: string;
    institutionType: string;
    website?: string;
    establishedYear?: number;
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    contactPersonName: string;
    contactPersonTitle: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
    membershipType: string;
    motivationStatement: string;
    numberOfStudents?: number;
    accreditations?: string[];
    specialPrograms?: string;
}
export interface MembershipApplication {
    id: string;
    status: 'pending' | 'under_review' | 'approved' | 'rejected';
    institution_name: string;
    contact_person_email: string;
    membership_type: string;
    application_data: MembershipApplicationData;
    submitted_at: string;
    reviewed_at?: string;
    reviewed_by?: string;
    review_notes?: string;
    approved_at?: string;
    rejected_at?: string;
}
export declare class MembershipApplicationService {
    /**
     * Submit a new membership application
     */
    static submitApplication(applicationData: MembershipApplicationData): Promise<string>;
    /**
     * Get all membership applications (admin only)
     */
    static getAllApplications(): Promise<MembershipApplication[]>;
    /**
     * Get application by ID
     */
    static getApplicationById(applicationId: string): Promise<MembershipApplication | null>;
    /**
     * Update application status
     */
    static updateApplicationStatus(applicationId: string, status: 'under_review' | 'approved' | 'rejected', reviewedBy: string, reviewNotes?: string): Promise<void>;
    /**
     * Approve application and create institution + member
     */
    static approveApplication(applicationId: string, reviewedBy: string, reviewNotes?: string): Promise<{
        institutionId: string;
        memberId: string;
    }>;
    /**
     * Reject application
     */
    static rejectApplication(applicationId: string, reviewedBy: string, reviewNotes?: string): Promise<void>;
}
//# sourceMappingURL=membershipApplication.service.d.ts.map