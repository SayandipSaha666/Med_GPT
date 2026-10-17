// src/agents/departments/index.ts
// Instantiates all department agents using the factory + domain prompts.
// Each agent is a pre-configured singleton — created once, reused per request.

import { createDepartmentAgent } from "./department-agent.factory";
import { DEPARTMENT_PROMPTS } from "./prompts";
import type { Department } from "../types";

// ─── Instantiate Department Agents ───────────────────────────────────────────

export const generalAgent = createDepartmentAgent({
  name: "General Medicine Specialist",
  department: "general",
  systemPrompt: DEPARTMENT_PROMPTS.general,
});

export const cardiologyAgent = createDepartmentAgent({
  name: "Cardiology Specialist",
  department: "cardiology",
  systemPrompt: DEPARTMENT_PROMPTS.cardiology,
});

export const dentalAgent = createDepartmentAgent({
  name: "Dental Specialist",
  department: "dental",
  systemPrompt: DEPARTMENT_PROMPTS.dental,
});

export const gynecologyAgent = createDepartmentAgent({
  name: "Gynecology Specialist",
  department: "gynecology",
  systemPrompt: DEPARTMENT_PROMPTS.gynecology,
});

export const entAgent = createDepartmentAgent({
  name: "ENT Specialist",
  department: "ent",
  systemPrompt: DEPARTMENT_PROMPTS.ent,
});

export const dermatologyAgent = createDepartmentAgent({
  name: "Dermatology Specialist",
  department: "dermatology",
  systemPrompt: DEPARTMENT_PROMPTS.dermatology,
});

export const orthopedicAgent = createDepartmentAgent({
  name: "Orthopedic Specialist",
  department: "orthopedic",
  systemPrompt: DEPARTMENT_PROMPTS.orthopedic,
});

// ─── Department Agent Registry ───────────────────────────────────────────────

/**
 * Maps department names to their agent instances.
 * Used by the gateway agent to route queries to the right specialist.
 */
export const departmentAgentMap: Record<Department, ReturnType<typeof createDepartmentAgent>> = {
  general: generalAgent,
  cardiology: cardiologyAgent,
  dental: dentalAgent,
  gynecology: gynecologyAgent,
  ent: entAgent,
  dermatology: dermatologyAgent,
  orthopedic: orthopedicAgent,
};

/**
 * Get the department agent for a given department name.
 * Falls back to the general agent for unknown departments.
 */
export function getDepartmentAgent(department: string) {
  return departmentAgentMap[department as Department] || generalAgent;
}
