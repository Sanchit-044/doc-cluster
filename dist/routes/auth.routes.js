"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validate_1 = require("../middlewares/validate");
const validate_2 = require("../middlewares/validate");
const login_controller_1 = __importDefault(require("../controllers/auth/login.controller"));
const register_1 = __importDefault(require("../controllers/auth/register"));
const router = (0, express_1.Router)();
router.post('/register', (0, validate_1.validateRequest)(validate_2.registerSchema), register_1.default);
router.post('/login', (0, validate_1.validateRequest)(validate_2.loginSchema), login_controller_1.default);
exports.default = router;
