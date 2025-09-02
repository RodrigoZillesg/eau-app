"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
// Minimal middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Single health route directly in app
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Ultra-simple EAU Backend',
        timestamp: new Date().toISOString()
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not found' });
});
exports.default = app;
//# sourceMappingURL=app-simple.js.map