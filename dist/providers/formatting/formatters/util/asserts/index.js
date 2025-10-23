"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertAtLeastOnePart = assertAtLeastOnePart;
const assert_1 = __importDefault(require("assert"));
function assertAtLeastOnePart(parts) {
    (0, assert_1.default)(parts.length !== 0, "Expected at least one part");
    return true;
}
//# sourceMappingURL=index.js.map