"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/config/cloudinary.ts
const cloudinary_1 = require("cloudinary");
const env_ts_1 = require("../../config/env.js");
cloudinary_1.v2.config({
    cloud_name: env_ts_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: env_ts_1.env.CLOUDINARY_API_KEY,
    api_secret: env_ts_1.env.CLOUDINARY_API_SECRET,
    secure: true,
});
exports.default = cloudinary_1.v2;
