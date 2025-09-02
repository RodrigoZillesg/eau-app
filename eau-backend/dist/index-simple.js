"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_simple_1 = __importDefault(require("./app-simple"));
const PORT = process.env.PORT || 3001;
app_simple_1.default.listen(PORT, () => {
    console.log(`🚀 Simplified EAU Backend running on port ${PORT}`);
    console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
});
exports.default = app_simple_1.default;
//# sourceMappingURL=index-simple.js.map