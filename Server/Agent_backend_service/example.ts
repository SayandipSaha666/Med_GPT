import { Agent, Runner, OpenAIProvider } from "@openai/agents"
import "dotenv/config";
import fs from "node:fs/promises";
import { marked } from "marked";

console.log("API KEY: ", process.env.GROQ_API_KEY);

const groqProvider = new OpenAIProvider({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    useResponses: false
});

// Agent definitions
const agents = [
    new Agent({
        name: 'Storyteller',
        instructions: 'You are a storyteller. You will be given a topic and you will tell a story about it.',
    }),
    new Agent({
        name: 'Analyst',
        instructions: 'You are a data analyst. You provide detailed analysis and insights on given topics.',
    }),
    new Agent({
        name: 'Developer',
        instructions: 'You are a software developer. You write clean, efficient code and explain technical concepts.',
    }),
];

const runner = new Runner({
    modelProvider: groqProvider
});

interface StreamChunk {
    agentName: string;
    isCompleted: boolean;
    value: string;
    isPartial: boolean;
}

async function* streamAgentResponse(agent: Agent, query: string, agentName: string): AsyncGenerator<StreamChunk> {
    const result = await runner.run(agent, query, { stream: true });
    const stream = result.toTextStream();

    for await (const val of stream) {
        yield {
            agentName,
            isCompleted: false,
            value: val,
            isPartial: true
        };
    }

    yield {
        agentName,
        isCompleted: true,
        value: result.finalOutput,
        isPartial: false
    };
}

async function* streamMultipleAgents(queries: Record<string, string>) {
    const agentsToRun = Object.entries(queries).map(([agentName, query]) => {
        const agent = agents.find(a => a.name.toLowerCase() === agentName.toLowerCase());
        if (!agent) {
            throw new Error(`Agent "${agentName}" not found`);
        }
        return streamAgentResponse(agent, query, agentName);
    });

    // Run all agent streams concurrently and merge their output
    const streams = agentsToRun.map(stream => stream[Symbol.asyncIterator]());

    const activeStreams = new Map<number, { stream: any, agentName: string }>();
    let streamId = 0;

    for (const stream of streams) {
        activeStreams.set(streamId++, { stream, agentName: '' });
    }

    // Get agent names for each stream
    const agentNames = Object.keys(queries);
    let nameIdx = 0;
    for (const [id, entry] of activeStreams) {
        entry.agentName = agentNames[nameIdx++] || `Agent-${id}`;
    }

    // Read from all streams until complete
    const results: Record<string, string> = {};

    while (activeStreams.size > 0) {
        const pending: Array<{ id: number; stream: any; promise: Promise<IteratorResult<any>> }> = [];

        for (const [id, entry] of activeStreams) {
            pending.push({
                id,
                stream: entry.stream,
                promise: entry.stream.next()
            });
        }

        const completed = await Promise.race(pending.map(p => p.promise.then(result => ({ result, id: pending.findIndex(p2 => p2.promise === promise) }))));

        for (const { id, promise } of pending) {
            if (promise === completed?.promise) {
                const result = completed?.result;
                if (result?.done) {
                    activeStreams.delete(id);
                } else {
                    const entry = activeStreams.get(id);
                    if (entry) {
                        yield {
                            agentName: entry.agentName,
                            isCompleted: false,
                            value: result.value as string,
                            isPartial: true
                        };
                    }
                }
                break;
            }
        }
    }

    // Final outputs
    for (const agentName of agentNames) {
        const result = await runner.run(
            agents.find(a => a.name.toLowerCase() === agentName.toLowerCase())!,
            queries[agentName],
            { stream: false }
        );
        yield {
            agentName,
            isCompleted: true,
            value: result.finalOutput,
            isPartial: false
        };
    }
}

async function* streamOutput(query: string, agentName?: string) {
    if (agentName) {
        // Stream a specific agent
        const agent = agents.find(a => a.name.toLowerCase() === agentName.toLowerCase());
        if (!agent) {
            throw new Error(`Agent "${agentName}" not found`);
        }
        yield* streamAgentResponse(agent, query, agentName);
    } else {
        // Default: stream the first agent (Storyteller)
        yield* streamAgentResponse(agents[0], query, agents[0].name);
    }
}

async function main(query: string, agentName?: string) {
    console.log(`Streaming response from agent: ${agentName || agents[0].name}\n`);

    let fullResponse = "";
    for await (const o of streamOutput(query, agentName)) {
        if (o.isPartial) {
            process.stdout.write(o.value);  // Stream output in real-time
            fullResponse += o.value;
        } else {
            console.log(`\n\n[${o.agentName} complete]`);
        }
    }

    return fullResponse;
}

// Example usage:
// main('Tell me a story about space travel', 'Storyteller');
// main('Analyze the benefits of cloud computing', 'Analyst');
// main('Explain how React works', 'Developer');

// Default run:
if (require.main === module) {
    main('In 300 words tell me story about macbook');
}