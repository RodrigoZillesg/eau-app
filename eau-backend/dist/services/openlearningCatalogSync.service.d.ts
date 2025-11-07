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
 * Verifica se precisa sincronizar (última sincronização foi ontem ou antes)
 */
export declare function needsSync(): Promise<boolean>;
/**
 * Sincroniza o catálogo de cursos com verificação de disponibilidade
 */
export declare function syncCourseCatalog(): Promise<SyncResult>;
/**
 * Busca cursos disponíveis do cache (banco de dados)
 * Filtra cursos que estão disponíveis E não foram desabilitados manualmente
 */
export declare function getAvailableCourses(): Promise<any[]>;
export {};
//# sourceMappingURL=openlearningCatalogSync.service.d.ts.map