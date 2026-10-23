"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWebSource = exports.isFileSource = void 0;
// Type guards, handy in services and the UI
const isFileSource = (s) => s.type === "file";
exports.isFileSource = isFileSource;
const isWebSource = (s) => s.type === "web";
exports.isWebSource = isWebSource;
