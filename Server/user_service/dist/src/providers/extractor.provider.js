"use strict";
// src/providers/extractor.provider.ts
// OCR and text extraction provider supporting multiple providers:
// - Gemini (Google Vision API) - Default
// - Groq (Qwen via OpenAI-compatible endpoint)
// - OpenAI (GPT-4o Vision)
//
// Configuration via:
// - OCR_PROVIDER: "gemini" | "groq" | "openai"
// - GEMINI_OCR_API_KEY / GEMINI_OCR_MODEL
// - GROQ_OCR_API_KEY / GROQ_OCR_MODEL
// - OPENAI_OCR_API_KEY / OPENAI_OCR_MODEL
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractorProvider = exports.DefaultExtractorProvider = void 0;
const pdf_parse_1 = require("pdf-parse");
const mammoth_1 = __importDefault(require("mammoth"));
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const OCR_PROMPT = `You are an expert clinical OCR and medical transcription AI specializing in reading handwritten prescriptions, clinical notes, and medical documents.

Carefully examine this document:
1. Transcribe ALL handwritten and printed text accurately (verbatim), deciphering doctor handwriting, standard medical abbreviations (e.g. BID, TID, OD, QHS, PRN, PO, stat), dosages, and instructions.
2. Determine if this document is a medical prescription or medication order.
3. Extract structured prescription details if present.

Return ONLY a valid JSON object (no markdown fences, no explanatory text) with this structure:
{
  "rawText": "Complete transcribed verbatim text from the document...",
  "isPrescription": true,
  "doctorName": "Doctor name or null",
  "patientName": "Patient name or null",
  "dateIssued": "YYYY-MM-DD or null",
  "medications": [
    {
      "name": "Drug / Medication name",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. twice daily / BID",
      "duration": "e.g. 7 days",
      "route": "e.g. oral",
      "notes": "e.g. after meals"
    }
  ],
  "warnings": ["Contraindications, warnings, or allergies noted"],
  "recommendations": ["Doctor recommendations, diet, lifestyle, or follow-up"],
  "overallAssessment": "Brief clinical summary of the prescription and condition",
  "confidenceScore": 0.95
}`;
function cleanJsonResponse(raw) {
    let cleaned = raw.trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    }
    else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return cleaned.trim();
}
function parseExtractionJson(jsonStr, modelName) {
    try {
        const parsed = JSON.parse(cleanJsonResponse(jsonStr));
        const rawText = (typeof parsed.rawText === "string" && parsed.rawText.trim().length > 0)
            ? parsed.rawText.trim()
            : jsonStr;
        const hasMedications = Array.isArray(parsed.medications) && parsed.medications.length > 0;
        const isPrescription = Boolean(parsed.isPrescription || hasMedications);
        const prescriptionData = isPrescription
            ? {
                doctorName: parsed.doctorName || null,
                patientName: parsed.patientName || null,
                dateIssued: parsed.dateIssued || null,
                medications: hasMedications
                    ? parsed.medications.map((m) => ({
                        name: String(m.name || "").trim(),
                        dosage: String(m.dosage || "").trim(),
                        frequency: String(m.frequency || "").trim(),
                        duration: m.duration ? String(m.duration).trim() : undefined,
                        route: m.route ? String(m.route).trim() : undefined,
                        notes: m.notes ? String(m.notes).trim() : undefined,
                    })).filter((m) => m.name.length > 0)
                    : [],
                warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [],
                recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : [],
                overallAssessment: parsed.overallAssessment ? String(parsed.overallAssessment) : null,
                confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 0.85,
                extractionModel: modelName,
                isPrescription: true,
            }
            : null;
        return { rawText, prescriptionData };
    }
    catch (err) {
        console.warn(`[OCR] Failed to parse model JSON response (${modelName}), falling back to raw text:`, err);
        return {
            rawText: jsonStr,
            prescriptionData: null,
        };
    }
}
// ─── Gemini OCR Provider ─────────────────────────────────────────────────────
async function extractWithGemini(buffer, mime) {
    const apiKey = env_1.env.GEMINI_OCR_API_KEY || process.env.GEMINI_OCR_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_OCR_API_KEY is not configured");
    }
    const modelName = env_1.env.GEMINI_OCR_MODEL || "gemini-2.0-flash-exp";
    const mimeType = mime === "application/pdf" ? "application/pdf" : (mime || "image/jpeg");
    const payload = {
        contents: [
            {
                parts: [
                    { text: OCR_PROMPT },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: buffer.toString("base64"),
                        },
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
        },
    };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    console.log(`[OCR] Using Gemini with model: ${modelName}`);
    const response = await axios_1.default.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 45000,
    });
    const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) {
        throw new Error("No candidate returned from Gemini API");
    }
    return parseExtractionJson(candidate, modelName);
}
// ─── Groq OCR Provider (OpenAI-compatible) ───────────────────────────────────
async function extractWithGroq(buffer, mime) {
    const apiKey = env_1.env.GROQ_OCR_API_KEY || process.env.GROQ_OCR_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_OCR_API_KEY is not configured");
    }
    const modelName = env_1.env.GROQ_OCR_MODEL || "qwen/qwen-2.5-32b";
    const mimeType = mime || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
    const payload = {
        model: modelName,
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: OCR_PROMPT },
                    { type: "image_url", image_url: { url: dataUri } },
                ],
            },
        ],
        temperature: 0.1,
    };
    console.log(`[OCR] Using Groq with model: ${modelName}`);
    const response = await axios_1.default.post("https://api.groq.com/openai/v1/chat/completions", payload, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        timeout: 45000,
    });
    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("No content returned from Groq API");
    }
    return parseExtractionJson(content, modelName);
}
// ─── OpenAI OCR Provider ─────────────────────────────────────────────────────
async function extractWithOpenAI(buffer, mime) {
    const apiKey = env_1.env.OPENAI_OCR_API_KEY || process.env.OPENAI_OCR_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_OCR_API_KEY is not configured");
    }
    const modelName = env_1.env.OPENAI_OCR_MODEL || "gpt-4o-2024-11-20";
    const mimeType = mime || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
    const payload = {
        model: modelName,
        response_format: { type: "json_object" },
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: OCR_PROMPT },
                    { type: "image_url", image_url: { url: dataUri } },
                ],
            },
        ],
        temperature: 0.1,
    };
    console.log(`[OCR] Using OpenAI with model: ${modelName}`);
    const response = await axios_1.default.post(`${env_1.env.OPENAI_API_URL}/chat/completions`, payload, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        timeout: 45000,
    });
    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("No content returned from OpenAI API");
    }
    return parseExtractionJson(content, modelName);
}
// ─── Main OCR Router ─────────────────────────────────────────────────────────
async function performOcr(buffer, mime) {
    const provider = env_1.env.OCR_PROVIDER || "gemini";
    switch (provider) {
        case "gemini":
            return await extractWithGemini(buffer, mime);
        case "groq":
            return await extractWithGroq(buffer, mime);
        case "openai":
            return await extractWithOpenAI(buffer, mime);
        default:
            console.warn(`[OCR] Unknown OCR provider "${provider}", defaulting to Gemini`);
            return await extractWithGemini(buffer, mime);
    }
}
// ─── Text-based Prescription Extraction ──────────────────────────────────────
async function extractPrescriptionFromTextIfRelevant(text) {
    const prescriptionPattern = /(?:prescri(?:ption|bed)|medicat(?:ion|ions)|dosage|take\s+\d+|capsule|tablet|\bmg\b|\bml\b|refill|\brx\b)/i;
    if (!prescriptionPattern.test(text)) {
        return null;
    }
    const provider = env_1.env.OCR_PROVIDER || "gemini";
    const prompt = `Analyze this digital document text and extract structured medical prescription information if present:
${text.slice(0, 8000)}

Return ONLY valid JSON matching this structure:
{
  "rawText": "...",
  "isPrescription": true,
  "doctorName": "...",
  "patientName": "...",
  "dateIssued": "YYYY-MM-DD or null",
  "medications": [{ "name": "...", "dosage": "...", "frequency": "...", "duration": "...", "route": "...", "notes": "..." }],
  "warnings": ["..."],
  "recommendations": ["..."],
  "overallAssessment": "...",
  "confidenceScore": 0.95
}`;
    try {
        // Gemini OCR
        if (provider === "gemini") {
            const apiKey = env_1.env.GEMINI_OCR_API_KEY || process.env.GEMINI_OCR_API_KEY;
            const modelName = env_1.env.GEMINI_OCR_MODEL || "gemini-2.0-flash-exp";
            if (!apiKey) {
                console.warn("[OCR] GEMINI_OCR_API_KEY not set for text-based extraction");
                return null;
            }
            console.log(`[OCR] Using Gemini for text extraction with model: ${modelName}`);
            const res = await axios_1.default.post(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
            }, { timeout: 30000 });
            const content = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
                return parseExtractionJson(content, modelName).prescriptionData || null;
            }
        }
        // Groq OCR
        else if (provider === "groq") {
            const apiKey = env_1.env.GROQ_OCR_API_KEY || process.env.GROQ_OCR_API_KEY;
            const modelName = env_1.env.GROQ_OCR_MODEL || "qwen/qwen-2.5-32b";
            if (!apiKey) {
                console.warn("[OCR] GROQ_OCR_API_KEY not set for text-based extraction");
                return null;
            }
            console.log(`[OCR] Using Groq for text extraction with model: ${modelName}`);
            const res = await axios_1.default.post("https://api.groq.com/openai/v1/chat/completions", {
                model: modelName,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1,
            }, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
                timeout: 30000,
            });
            const content = res.data?.choices?.[0]?.message?.content;
            if (content) {
                return parseExtractionJson(content, modelName).prescriptionData || null;
            }
        }
        // OpenAI OCR
        else if (provider === "openai") {
            const apiKey = env_1.env.OPENAI_OCR_API_KEY || process.env.OPENAI_OCR_API_KEY;
            const modelName = env_1.env.OPENAI_OCR_MODEL || "gpt-4o-2024-11-20";
            if (!apiKey) {
                console.warn("[OCR] OPENAI_OCR_API_KEY not set for text-based extraction");
                return null;
            }
            console.log(`[OCR] Using OpenAI for text extraction with model: ${modelName}`);
            const res = await axios_1.default.post("https://api.openai.com/v1/chat/completions", {
                model: modelName,
                response_format: { type: "json_object" },
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1,
            }, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
                timeout: 30000,
            });
            const content = res.data?.choices?.[0]?.message?.content;
            if (content) {
                return parseExtractionJson(content, modelName).prescriptionData || null;
            }
        }
    }
    catch (err) {
        console.warn(`[OCR] Error extracting structured prescription from text using ${provider}:`, err);
    }
    return null;
}
// ─── Default Extractor Provider Implementation ───────────────────────────────
class DefaultExtractorProvider {
    async extract(buffer, mime) {
        const provider = env_1.env.OCR_PROVIDER || "gemini";
        console.log(`[Extractor] Using OCR provider: ${provider}`);
        switch (mime) {
            case "application/pdf": {
                let digitalText = "";
                try {
                    const parser = new pdf_parse_1.PDFParse({ data: buffer });
                    const result = await parser.getText();
                    digitalText = result.text || "";
                }
                catch (pdfErr) {
                    console.warn("[Extractor] PDF digital parse failed, falling back to OCR:", pdfErr);
                }
                // If sufficient digital text was extracted (born-digital PDF)
                if (digitalText.trim().length >= 40) {
                    console.log("[Extractor] PDF has sufficient digital text, skipping OCR");
                    const prescriptionData = await extractPrescriptionFromTextIfRelevant(digitalText);
                    return {
                        rawText: digitalText,
                        prescriptionData,
                    };
                }
                // Otherwise, it's a scanned or image-based PDF -> invoke OCR
                return await performOcr(buffer, mime);
            }
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            case "application/msword": {
                const docxText = (await mammoth_1.default.extractRawText({ buffer })).value || "";
                const prescriptionData = await extractPrescriptionFromTextIfRelevant(docxText);
                return {
                    rawText: docxText,
                    prescriptionData,
                };
            }
            case "text/plain":
            case "text/markdown":
            case "text/csv": {
                const text = buffer.toString("utf-8");
                const prescriptionData = await extractPrescriptionFromTextIfRelevant(text);
                return {
                    rawText: text,
                    prescriptionData,
                };
            }
            case "image/png":
            case "image/jpeg":
            case "image/gif":
            case "image/webp":
            default: {
                // Images and scanned documents: run OCR with configured provider
                return await performOcr(buffer, mime);
            }
        }
    }
    async extractText(buffer, mime) {
        const result = await this.extract(buffer, mime);
        return result.rawText;
    }
    chunk(text, size = 1500, overlap = 200) {
        if (!text)
            return [];
        const chunks = [];
        for (let i = 0; i < text.length; i += size - overlap) {
            chunks.push(text.slice(i, i + size));
        }
        return chunks;
    }
}
exports.DefaultExtractorProvider = DefaultExtractorProvider;
exports.extractorProvider = new DefaultExtractorProvider();
