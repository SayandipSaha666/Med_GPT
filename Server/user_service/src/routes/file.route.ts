// src/routes/file.routes.ts
import { Router } from "express";
import { fileController } from "../controllers/file.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { uploadSingle } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.midleware";
import { asyncHandler } from "../middleware/async-handler.middleware";
import { FileIdParamDto } from "../dto/file.dto";

const router = Router();
router.use(authMiddleware);

router.post("/", uploadSingle, asyncHandler(fileController.upload));
router.get("/", asyncHandler(fileController.list));
router.get("/:id", validate(FileIdParamDto, "params"), asyncHandler(fileController.getOne));
router.delete("/:id", validate(FileIdParamDto, "params"), asyncHandler(fileController.remove));

export default router;