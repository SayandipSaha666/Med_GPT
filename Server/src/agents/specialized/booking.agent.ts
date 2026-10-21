// src/agents/specialized/booking.agent.ts
// Appointment booking agent: helps users find hospitals,
// check availability, and book appointments.

import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import type { AgentContext } from "../types";
import { getAgentModelName } from "../../config/model.provider";
import { prisma } from "../../lib/prisma";

const MODEL_NAME = getAgentModelName();

/**
 * Tool to search for hospitals by specialty and location.
 * In production, this would query a hospital database or
 * the Hospital MCP Server.
 */
const searchHospitalsTool = tool({
  name: "search_hospitals",
  description:
    "Search for hospitals or clinics by medical specialty and location. " +
    "Returns a list of hospitals with contact information and ratings.",
  parameters: z.object({
    specialty: z
      .string()
      .describe("Medical specialty (e.g., cardiology, dental, general)"),
    city: z.string().describe("City or area name"),
    maxResults: z
      .number()
      .default(5)
      .describe("Maximum number of results"),
  }),
  async execute({ specialty, city, maxResults }) {
    // TODO: Replace with actual hospital database query or Google Places API
    // For MVP, this returns a structured message asking the agent to
    // inform the user that hospital search integration is coming soon.
    return JSON.stringify({
      status: "integration_pending",
      message:
        `Hospital search for ${specialty} in ${city} is being set up. ` +
        `In the meantime, you can suggest the user search on Google Maps ` +
        `or Practo for "${specialty} hospitals near ${city}".`,
      suggestion: `https://www.google.com/maps/search/${encodeURIComponent(specialty + " hospital " + city)}`,
    });
  },
});

/**
 * Tool to check appointment availability.
 */
const checkAvailabilityTool = tool({
  name: "check_availability",
  description:
    "Check appointment availability at a specific hospital or clinic. " +
    "Returns available time slots for the requested department.",
  parameters: z.object({
    hospitalName: z.string().describe("Name of the hospital"),
    department: z.string().describe("Department or specialty"),
    preferredDate: z
      .string()
      .optional()
      .describe("Preferred date in YYYY-MM-DD format"),
  }),
  async execute({ hospitalName, department, preferredDate }) {
    // TODO: Integrate with hospital booking APIs or MCP server
    return JSON.stringify({
      status: "integration_pending",
      message:
        `Availability check for ${department} at ${hospitalName} ` +
        `${preferredDate ? `on ${preferredDate} ` : ""}` +
        `requires hospital API integration. Please suggest the user ` +
        `call the hospital directly or check their website.`,
    });
  },
});

/**
 * Tool to create an appointment booking in the database.
 */
const createBookingTool = tool({
  name: "create_booking",
  description:
    "Create an appointment booking record. Only use this after " +
    "confirming all details with the user.",
  parameters: z.object({
    hospitalName: z.string(),
    department: z.string(),
    doctorName: z.string().optional(),
    scheduledDate: z
      .string()
      .describe("Appointment date/time in ISO 8601 format"),
    reason: z.string().optional().describe("Reason for the appointment"),
    userId: z.number().describe("The user's ID"),
  }),
  async execute({ hospitalName, department, doctorName, scheduledDate, reason, userId }) {
    try {
      // Go through controller Don't directly access DB 
      const appointment = await prisma.appointment.create({
        data: {
          userId,
          hospitalName,
          department,
          doctorName,
          scheduledAt: new Date(scheduledDate),
          status: "PENDING",
          notes: reason,
        },
      });

      return JSON.stringify({
        status: "booked",
        bookingId: appointment.id,
        message:
          `Appointment created successfully!\n` +
          `Hospital: ${hospitalName}\n` +
          `Department: ${department}\n` +
          `${doctorName ? `Doctor: ${doctorName}\n` : ""}` +
          `Date: ${new Date(scheduledDate).toLocaleDateString()}\n` +
          `Time: ${new Date(scheduledDate).toLocaleTimeString()}\n` +
          `Status: Pending confirmation`,
      });
    } catch (error) {
      console.error("[Booking Tool] Error creating appointment:", error);
      return JSON.stringify({
        status: "error",
        message: "Failed to create booking. Please try again or contact support.",
      });
    }
  },
});

/**
 * Appointment Booking Agent.
 * Guides users through finding hospitals and booking appointments.
 */
export const bookingAgent = new Agent<AgentContext>({
  name: "Appointment Booking Assistant",
  model: MODEL_NAME,

  instructions: ({context}) => {
    return `You are MedGPT's Appointment Booking specialist.
      Users local context can be found in ${JSON.stringify(context)}
      Your job is to help users find hospitals, check availability, and book appointments.

      WORKFLOW:
      1. Understand what the user needs:
        - What specialty/department?
        - What location/city?
        - Any date/time preference?
        - How urgent is it?
      2. Search for hospitals matching their criteria
      3. Present top options with relevant details
      4. Check availability for their preferred choice
      5. ALWAYS confirm all details with the user BEFORE booking
      6. Create the booking only after explicit user confirmation

      CONVERSATION STYLE:
      - Be helpful and proactive (suggest nearby options)
      - Ask clarifying questions when needed
      - Present options in a clear, numbered list
      - Confirm date, time, and hospital before finalizing

      RULES:
      - NEVER book without explicit user confirmation
      - If hospital search integration is pending, suggest alternatives
        (Google Maps, Practo, direct hospital websites)
      - Include Google Maps links when helpful
      - Remind users to bring relevant documents to their appointment`;
  },
  tools: [searchHospitalsTool, checkAvailabilityTool, createBookingTool],
});
