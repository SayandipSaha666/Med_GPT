import type { Request, Response, NextFunction } from "express";
import { PinChatParams } from "../dto/chatPin.dto";
import { chatPinService } from "../services/chatPin.service";

function auth(req: Request, res: Response): number | null {
  if (!req.user?.id) { res.status(401).json({ success: false, message: "Unauthorized" }); return null; }
  return req.user.id;
}

export const chatPinController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = auth(req, res); if (!userId) return;
    try { res.json({ success: true, data: await chatPinService.list(userId) }); } catch (error) { next(error); }
  },
  async pin(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = auth(req, res); if (!userId) return;
    const parsed = PinChatParams.safeParse(req.params);
    if (!parsed.success) { res.status(400).json({ success: false, message: "Invalid chat ID" }); return; }
    try {
      res.json({ success: true, data: await chatPinService.pin(parsed.data.chatId, userId) });
    } catch (error) {
      if (error instanceof Error && error.message === "Chat not found") { res.status(404).json({ success: false, message: error.message }); return; }
      next(error);
    }
  },
  async unpin(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = auth(req, res); if (!userId) return;
    const parsed = PinChatParams.safeParse(req.params);
    if (!parsed.success) { res.status(400).json({ success: false, message: "Invalid chat ID" }); return; }
    try {
      await chatPinService.unpin(parsed.data.chatId, userId);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message === "Chat not found") { res.status(404).json({ success: false, message: error.message }); return; }
      next(error);
    }
  },
};
