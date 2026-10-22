// src/providers/storage.provider.ts
import cloudinary from "../config/cloudinary";
import type { UploadedAsset } from "../types/file.types";

export interface StorageProvider {
    upload(buffer: Buffer, folder?: string): Promise<UploadedAsset>;
    remove(publicId: string, resourceType: string): Promise<void>;
}

export class CloudinaryStorageProvider implements StorageProvider {
    upload(buffer: Buffer, folder = "medgpt"): Promise<UploadedAsset> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream({ folder, resource_type: "auto" }, (err, result) => {
                    if (err || !result) return reject(err ?? new Error("Cloud upload failed"));
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        resourceType: result.resource_type,
                    });
                })
                .end(buffer);
        });
    }

    async remove(publicId: string, resourceType: string): Promise<void> {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    }
}

export const storageProvider: StorageProvider = new CloudinaryStorageProvider();