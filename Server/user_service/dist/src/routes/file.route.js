"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/file.routes.ts
const express_1 = require("express");
const file_controller_1 = require("../controllers/file.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const validate_midleware_1 = require("../middleware/validate.midleware");
const async_handler_middleware_1 = require("../middleware/async-handler.middleware");
const file_dto_1 = require("../dto/file.dto");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.post("/", upload_middleware_1.uploadSingle, (0, async_handler_middleware_1.asyncHandler)(file_controller_1.fileController.upload));
router.get("/", (0, async_handler_middleware_1.asyncHandler)(file_controller_1.fileController.list));
router.get("/:id", (0, validate_midleware_1.validate)(file_dto_1.FileIdParamDto, "params"), (0, async_handler_middleware_1.asyncHandler)(file_controller_1.fileController.getOne));
router.delete("/:id", (0, validate_midleware_1.validate)(file_dto_1.FileIdParamDto, "params"), (0, async_handler_middleware_1.asyncHandler)(file_controller_1.fileController.remove));
exports.default = router;
