"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentClient = exports.AgentServiceClient = void 0;
const env_1 = require("../../config/env");
const AGENT_SERVICE_URL = (env_1.env.AGENT_SERVICE_URL || "http://localhost:4000").replace(/\/+$/, "");
function buildHeaders() {
    const headers = {
        "Content-Type": "application/json",
    };
    if (env_1.env.AGENT_SERVICE_API_KEY) {
        headers["x-internal-api-key"] = env_1.env.AGENT_SERVICE_API_KEY;
    }
    return headers;
}
class AgentServiceClient {
    async generate(query, context) {
        const response = await fetch(`${AGENT_SERVICE_URL}/agent/respond`, {
            method: "POST",
            headers: buildHeaders(),
            body: JSON.stringify({ query, context }),
        });
        if (!response.ok) {
            const detail = await response.text().catch(() => "");
            throw new Error(`Agent service request failed (${response.status})${detail ? `: ${detail}` : ""}`);
        }
        return (await response.json());
    }
    async *stream(query, context) {
        const response = await fetch(`${AGENT_SERVICE_URL}/agent/stream`, {
            method: "POST",
            headers: buildHeaders(),
            body: JSON.stringify({ query, context }),
        });
        if (!response.ok || !response.body) {
            const detail = await response.text().catch(() => "");
            throw new Error(`Agent service stream failed (${response.status})${detail ? `: ${detail}` : ""}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed)
                        continue;
                    yield JSON.parse(trimmed);
                }
            }
            const remaining = buffer.trim();
            if (remaining) {
                yield JSON.parse(remaining);
            }
        }
        finally {
            reader.releaseLock();
        }
    }
}
exports.AgentServiceClient = AgentServiceClient;
exports.agentClient = new AgentServiceClient();
