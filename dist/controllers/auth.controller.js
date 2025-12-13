"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordController = exports.refreshTokenController = exports.loginController = exports.registerController = void 0;
const auth_service_1 = require("../services/auth.service");
const auth_schema_1 = require("../validations/auth.schema");
const zod_1 = require("zod");
const registerController = async (req, res) => {
    try {
        console.log("her is ", req.body);
        const validated = auth_schema_1.registerUserSchema.parse(req.body);
        const result = await (0, auth_service_1.registerService)(validated);
        console.log("Here is result after validation");
        if (result.error)
            return res.status(400).json({ success: false, message: result.error });
        return res.status(201).json({
            success: true,
            user: result.user,
            message: "Registration successful. Verify your email.",
        });
    }
    catch (err) {
        return res.status(400).json({ success: false, errors: err.errors });
    }
};
exports.registerController = registerController;
const loginController = async (req, res) => {
    const loginSchema = zod_1.z.object({
        identifier: zod_1.z.string().min(3),
        password: zod_1.z.string(),
    });
    try {
        const { identifier, password } = loginSchema.parse(req.body);
        const result = await (0, auth_service_1.loginService)(identifier, password);
        if (result.error)
            return res.status(400).json({ success: false, message: result.error });
        res
            .cookie("accessToken", result.accessToken)
            .cookie("refreshToken", result.refreshToken);
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: result.user,
        });
    }
    catch (err) {
        return res.status(400).json({ success: false, errors: err.errors });
    }
};
exports.loginController = loginController;
const refreshTokenController = async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token)
        return res.status(400).json({ success: false, message: "Token missing" });
    const result = await (0, auth_service_1.refreshTokenService)(token);
    if (result.error)
        return res.status(401).json({ success: false, message: result.error });
    res
        .cookie("accessToken", result.accessToken)
        .cookie("refreshToken", result.newRefreshToken)
        .json({ success: true, message: "Token refreshed" });
};
exports.refreshTokenController = refreshTokenController;
const changePasswordController = async (req, res) => {
    const schema = zod_1.z.object({
        oldPassword: zod_1.z.string(),
        newPassword: zod_1.z.string(),
    });
    const { oldPassword, newPassword } = schema.parse(req.body);
    const userId = req?.user?._id;
    if (!userId)
        return res.status(401).json({ success: false, message: "Unauthorized" });
    const result = await (0, auth_service_1.changePasswordService)(userId, oldPassword, newPassword);
    if (result.error)
        return res.status(400).json({ success: false, message: result.error });
    return res.status(200).json({
        success: true,
        message: "Password updated successfully",
    });
};
exports.changePasswordController = changePasswordController;
