"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageProvider = exports.CloudinaryStorageProvider = void 0;
// src/providers/storage.provider.ts
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
class CloudinaryStorageProvider {
    upload(buffer, folder = "medgpt") {
        return new Promise((resolve, reject) => {
            cloudinary_1.default.uploader
                .upload_stream({ folder, resource_type: "auto" }, (err, result) => {
                if (err || !result)
                    return reject(err ?? new Error("Cloud upload failed"));
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    resourceType: result.resource_type,
                });
            })
                .end(buffer);
        });
    }
    async remove(publicId, resourceType) {
        await cloudinary_1.default.uploader.destroy(publicId, { resource_type: resourceType });
    }
}
exports.CloudinaryStorageProvider = CloudinaryStorageProvider;
exports.storageProvider = new CloudinaryStorageProvider();
