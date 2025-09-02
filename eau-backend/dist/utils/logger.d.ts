import { Request, Response } from 'express';
export declare const developmentFormat = ":method :url :status :response-time ms - :res[content-length] - user: :user-id";
export declare const productionFormat = ":remote-addr - :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] \":referrer\" \":user-agent\" - :response-time ms - user: :user-id - institution: :institution-id";
export declare const logError: (error: Error, req?: Request, res?: Response) => void;
export declare const logInfo: (message: string, data?: any) => void;
export declare const logWarning: (message: string, data?: any) => void;
//# sourceMappingURL=logger.d.ts.map