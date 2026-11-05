"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatPinController = void 0;
const chatPin_dto_1 = require("../dto/chatPin.dto");
const chatPin_service_1 = require("../services/chatPin.service");
function auth(req, res) {
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return null;
    }
    return req.user.id;
}
exports.chatPinController = {
    async list(req, res, next) {
        const userId = auth(req, res);
        if (!userId)
            return;
        try {
            res.json({ success: true, data: await chatPin_service_1.chatPinService.list(userId) });
        }
        catch (error) {
            next(error);
        }
    },
    async pin(req, res, next) {
        const userId = auth(req, res);
        if (!userId)
            return;
        const parsed = chatPin_dto_1.PinChatParams.safeParse(req.params);
        if (!parsed.success) {
            res.status(400).json({ success: false, message: "Invalid chat ID" });
            return;
        }
        try {
            res.json({ success: true, data: await chatPin_service_1.chatPinService.pin(parsed.data.chatId, userId) });
        }
        catch (error) {
            if (error instanceof Error && error.message === "Chat not found") {
                res.status(404).json({ success: false, message: error.message });
                return;
            }
            next(error);
        }
    },
    async unpin(req, res, next) {
        const userId = auth(req, res);
        if (!userId)
            return;
        const parsed = chatPin_dto_1.PinChatParams.safeParse(req.params);
        if (!parsed.success) {
            res.status(400).json({ success: false, message: "Invalid chat ID" });
            return;
        }
        try {
            await chatPin_service_1.chatPinService.unpin(parsed.data.chatId, userId);
            res.json({ success: true });
        }
        catch (error) {
            if (error instanceof Error && error.message === "Chat not found") {
                res.status(404).json({ success: false, message: error.message });
                return;
            }
            next(error);
        }
    },
};
