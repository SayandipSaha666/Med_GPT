"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatFolderController = void 0;
const chatFolder_dto_1 = require("../dto/chatFolder.dto");
const chatFolder_service_1 = require("../services/chatFolder.service");
async function handle(req, res, next, action, status = 200) {
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }
    try {
        res.status(status).json({ success: true, data: await action(req.user.id) });
    }
    catch (error) {
        if (error instanceof Error && (error.message === "Folder not found" || error.message === "Chat not found")) {
            res.status(404).json({ success: false, message: error.message });
            return;
        }
        next(error);
    }
}
function invalid(res) { res.status(400).json({ success: false, message: "Invalid folder request" }); }
exports.chatFolderController = {
    list(req, res, next) {
        return handle(req, res, next, (userId) => chatFolder_service_1.chatFolderService.list(userId));
    },
    create(req, res, next) {
        const body = chatFolder_dto_1.FolderBody.safeParse(req.body);
        if (!body.success)
            return invalid(res);
        return handle(req, res, next, (userId) => chatFolder_service_1.chatFolderService.create(userId, body.data), 201);
    },
    update(req, res, next) {
        const params = chatFolder_dto_1.FolderIdParams.safeParse(req.params);
        const body = chatFolder_dto_1.FolderBody.safeParse(req.body);
        if (!params.success || !body.success)
            return invalid(res);
        return handle(req, res, next, (userId) => chatFolder_service_1.chatFolderService.update(params.data.folderId, userId, body.data));
    },
    delete(req, res, next) {
        const params = chatFolder_dto_1.FolderIdParams.safeParse(req.params);
        if (!params.success)
            return invalid(res);
        return handle(req, res, next, (userId) => chatFolder_service_1.chatFolderService.delete(params.data.folderId, userId));
    },
    addChat(req, res, next) {
        const params = chatFolder_dto_1.FolderChatParams.safeParse(req.params);
        if (!params.success)
            return invalid(res);
        return handle(req, res, next, (userId) => chatFolder_service_1.chatFolderService.addChat(params.data.folderId, params.data.chatId, userId));
    },
    removeChat(req, res, next) {
        const params = chatFolder_dto_1.FolderChatParams.safeParse(req.params);
        if (!params.success)
            return invalid(res);
        return handle(req, res, next, (userId) => chatFolder_service_1.chatFolderService.removeChat(params.data.folderId, params.data.chatId, userId));
    },
};
