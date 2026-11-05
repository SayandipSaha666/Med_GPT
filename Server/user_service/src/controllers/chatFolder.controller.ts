import type { Request, Response, NextFunction } from "express";
import { FolderBody, FolderChatParams, FolderIdParams } from "../dto/chatFolder.dto";
import { chatFolderService } from "../services/chatFolder.service";

type FolderAction = (userId: number) => Promise<unknown>;

async function handle(req: Request, res: Response, next: NextFunction, action: FolderAction, status = 200) {
  if (!req.user?.id) { res.status(401).json({ success: false, message: "Unauthorized" }); return; }
  try { res.status(status).json({ success: true, data: await action(req.user.id) }); }
  catch (error) {
    if (error instanceof Error && (error.message === "Folder not found" || error.message === "Chat not found")) {
      res.status(404).json({ success: false, message: error.message }); return;
    }
    next(error);
  }
}

function invalid(res: Response) { res.status(400).json({ success: false, message: "Invalid folder request" }); }

export const chatFolderController = {
  list(req: Request, res: Response, next: NextFunction) {
    return handle(req, res, next, (userId) => chatFolderService.list(userId));
  },
  create(req: Request, res: Response, next: NextFunction) {
    const body = FolderBody.safeParse(req.body);
    if (!body.success) return invalid(res);
    return handle(req, res, next, (userId) => chatFolderService.create(userId, body.data), 201);
  },
  update(req: Request, res: Response, next: NextFunction) {
    const params = FolderIdParams.safeParse(req.params);
    const body = FolderBody.safeParse(req.body);
    if (!params.success || !body.success) return invalid(res);
    return handle(req, res, next, (userId) => chatFolderService.update(params.data.folderId, userId, body.data));
  },
  delete(req: Request, res: Response, next: NextFunction) {
    const params = FolderIdParams.safeParse(req.params);
    if (!params.success) return invalid(res);
    return handle(req, res, next, (userId) => chatFolderService.delete(params.data.folderId, userId));
  },
  addChat(req: Request, res: Response, next: NextFunction) {
    const params = FolderChatParams.safeParse(req.params);
    if (!params.success) return invalid(res);
    return handle(req, res, next, (userId) => chatFolderService.addChat(params.data.folderId, params.data.chatId, userId));
  },
  removeChat(req: Request, res: Response, next: NextFunction) {
    const params = FolderChatParams.safeParse(req.params);
    if (!params.success) return invalid(res);
    return handle(req, res, next, (userId) => chatFolderService.removeChat(params.data.folderId, params.data.chatId, userId));
  },
};
