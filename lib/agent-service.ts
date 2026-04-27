import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { prisma } from "./prisma";

export interface ActivationBriefInput {
  productName: string;
  productDescription: string;
  targetAudience: string;
  primaryGoal?: string;
  budget?: number | null;
  city?: string;
  timing?: string;
}

export interface ActivationPlan {
  title: string;
  concept: string;
  summary: string;
  audienceFit: string;
  experienceHighlights: string[];
  objectives: string[];
  workflow: Array<{ stage: string; summary: string }>;
  checklist: Array<{ title: string; category: string }>;
  staffing: Array<{ roleName: string; quantity: number; notes?: string }>;
  vendors: Array<{ vendorName: string; category: string; notes?: string }>;
  budgetItems: Array<{ category: string; description: string; estimated: number }>;
  agentMessage: string;
}

const SYSTEM_PROMPT = `You are EpicenTra's Planning Agent — an expert event planning assistant for experiential marketing and brand activations.

You are participating in a collaborative planning conversation for a specific event. You have access to the current event details and should reference them in your responses.

Your capabilities:
- Suggest venue options, staffing plans, and logistics timelines
- Identify risks and flag potential issues
- Recommend budget allocations based on event type and scale
- Generate checklist items for different event phases
- Provide best practices for brand activations and experiential marketing
- Help with vendor selection criteria and outreach templates

Your tone:
- Professional but conversational — you're a team member, not a chatbot
- Concise and actionable — use bullet points and structured recommendations
- Proactive — flag things the team might not have considered
- Reference specific event details (budget, dates, venue) when relevant

When you suggest actionable items (checklist items, budget entries, vendor recommendations), format them clearly so the team can easily add them to the plan.

Current Event Context:
{eventContext}`;

async function buildEventContext(eventId: string): Promise<string> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      budgetItems: true,
      vendors: true,
      staffSlots: true,
      checklist: { where: { isCompleted: false }, take: 20 },
      notes: {
        where: { type: { in: ["DECISION", "USER", "AGENT"] } },
        take: 40,
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!event) return "Event not found.";

  const lines: string[] = [
    `Event: ${event.title}`,
    `Status: ${event.status}`,
    event.startDate ? `Dates: ${event.startDate.toDateString()} to ${event.endDate?.toDateString() ?? "TBD"}` : "",
    event.venueName ? `Venue: ${event.venueName}, ${event.venueCity ?? ""}, ${event.venueState ?? ""}` : "",
    event.totalBudget ? `Budget: $${event.totalBudget}` : "",
    event.expectedAttendance ? `Expected Attendance: ${event.expectedAttendance}` : "",
    event.targetAudience ? `Target Audience: ${event.targetAudience}` : "",
  ].filter(Boolean);

  if (event.objectives) {
    try {
      const objs = JSON.parse(event.objectives) as string[];
      lines.push(`Objectives:\n${objs.map((o) => `- ${o}`).join("\n")}`);
    } catch { /* ignore */ }
  }

  if (event.budgetItems.length > 0) {
    lines.push(
      `\nBudget Items:\n${event.budgetItems
        .map((i) => `- ${i.category}: ${i.description} — $${i.estimated}`)
        .join("\n")}`
    );
  }

  if (event.vendors.length > 0) {
    lines.push(
      `\nVendors:\n${event.vendors
        .map((v) => `- ${v.vendorName} (${v.category}) — ${v.status}`)
        .join("\n")}`
    );
  }

  if (event.staffSlots.length > 0) {
    lines.push(
      `\nStaffing:\n${event.staffSlots
        .map((s) => `- ${s.roleName} ×${s.quantity} — ${s.isFilled ? "Filled" : "Open"}`)
        .join("\n")}`
    );
  }

  if (event.checklist.length > 0) {
    lines.push(
      `\nOpen Checklist Items:\n${event.checklist
        .map((c) => `- [ ] ${c.title}`)
        .join("\n")}`
    );
  }

  const decisions = event.notes.filter((n) => n.type === "DECISION" || n.isPinned);
  if (decisions.length > 0) {
    lines.push(
      `\nKey Decisions (pinned by team):\n${decisions.map((n) => `- ${n.content}`).join("\n")}`
    );
  }

  const conversation = event.notes.filter((n) => n.type === "USER" || n.type === "AGENT");
  if (conversation.length > 0) {
    lines.push(
      `\nTeam Planning Conversation (most recent ${conversation.length} messages):\n` +
      conversation
        .map((n) => {
          const speaker = n.type === "AGENT" ? "EpicenTra Agent" : (n.user?.name ?? "Team Member");
          return `[${speaker}]: ${n.content}`;
        })
        .join("\n")
    );
  }

  return lines.join("\n");
}

const TASK_EXTRACTION_PROMPT = `You are analyzing a team planning conversation for an event.
Your job: identify the 3 to 5 most important planning tasks the team still needs help with, based on what they've discussed.

Return ONLY a valid JSON array of task prompt strings — no explanation, no markdown, no extra text.
Each prompt should be a clear, actionable question for an event planning agent.

Example output:
["Draft a full venue sourcing list with pricing for 300 attendees", "Create a staffing plan including setup crew, brand ambassadors, and breakdown team", "Build a day-of run-of-show timeline from load-in to teardown"]

Current event context and team conversation:
{eventContext}`;

export async function extractTasksFromChat(eventId: string): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return [];

  const groq = createGroq({ apiKey });
  const eventContext = await buildEventContext(eventId);
  const prompt = TASK_EXTRACTION_PROMPT.replace("{eventContext}", eventContext);

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      maxOutputTokens: 512,
    });

    // Extract JSON array from response (guard against extra text)
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as unknown[];
    return parsed.filter((t): t is string => typeof t === "string").slice(0, 5);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[agent] task extraction error:", message);
    return [];
  }
}

export async function runPlanningAgent(
  eventId: string,
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return "⚠️ The Planning Agent is not configured. Add a `GROQ_API_KEY` to your `.env.local` to enable AI responses.";
  }

  const groq = createGroq({ apiKey });
  const eventContext = await buildEventContext(eventId);

  const systemPrompt = SYSTEM_PROMPT.replace("{eventContext}", eventContext);

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: userMessage,
      maxOutputTokens: 1024,
    });
    return text;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[agent] Groq error:", message);
    return `⚠️ The Planning Agent encountered an error: ${message}`;
  }
}

const EXECUTION_AGENT_PROMPTS = [
  "Create an execution-ready vendor coordination plan for this activation, including the categories to source first, decision criteria, and the most important outreach priorities.",
  "Create a staffing deployment plan for this activation, including setup, guest experience, technical support, and breakdown coverage.",
  "Build a launch-readiness checklist and timeline that gets this event from planning into execution with minimal day-of surprises.",
  "Review the budget and operational plan, identify the biggest execution risks, and recommend the highest-value mitigation actions.",
];

export async function startExecutionAgentRun(
  eventId: string,
  createdById: string
) {
  const startedAt = new Date();

  await prisma.note.create({
    data: {
      eventId,
      userId: createdById,
      type: "SYSTEM",
      content: "Execution Agent started. Drafting staffing, vendor, launch, and risk plans while design work continues.",
      metadata: { source: "execution-agent", startedAt: startedAt.toISOString() },
    },
  });

  const completedTasks = [];

  for (let i = 0; i < EXECUTION_AGENT_PROMPTS.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1200));
    const prompt = EXECUTION_AGENT_PROMPTS[i];
    const task = await prisma.agentTask.create({
      data: {
        prompt,
        status: "IN_PROGRESS",
        eventId,
        createdById,
        resultMeta: {
          source: "execution-agent",
          phase: "design-handoff",
          startedAt: new Date().toISOString(),
        },
      },
    });

    let result: string;
    let status: "COMPLETED" | "FAILED";
    try {
      result = await runPlanningAgent(eventId, prompt);
      status = "COMPLETED";
    } catch {
      result = "The execution agent encountered an error while drafting this task.";
      status = "FAILED";
    }

    const updated = await prisma.agentTask.update({
      where: { id: task.id },
      data: {
        result,
        status,
        completedAt: new Date(),
        resultMeta: {
          source: "execution-agent",
          phase: "design-handoff",
          startedAt: startedAt.toISOString(),
          completedAt: new Date().toISOString(),
        },
      },
      include: { createdBy: { select: { id: true, name: true, avatarUrl: true } } },
    });

    completedTasks.push(updated);
  }

  await prisma.note.create({
    data: {
      eventId,
      userId: createdById,
      type: "SYSTEM",
      content: `Execution Agent finished ${completedTasks.length} operational drafts. Review the recommendations while refining the design workspace.`,
      metadata: {
        source: "execution-agent",
        completedAt: new Date().toISOString(),
        taskCount: completedTasks.length,
      },
    },
  });

  return completedTasks;
}

const ACTIVATION_PLAN_PROMPT = `You are EpicenTra's flagship activation strategist.

Your job is to turn a product brief and target audience into a strong experiential activation concept and a practical event-readiness workflow.

Return ONLY valid JSON with this exact shape:
{
  "title": "string",
  "concept": "string",
  "summary": "string",
  "audienceFit": "string",
  "experienceHighlights": ["string"],
  "objectives": ["string"],
  "workflow": [{"stage":"string","summary":"string"}],
  "checklist": [{"title":"string","category":"string"}],
  "staffing": [{"roleName":"string","quantity":1,"notes":"string"}],
  "vendors": [{"vendorName":"string","category":"string","notes":"string"}],
  "budgetItems": [{"category":"string","description":"string","estimated":0}],
  "agentMessage": "string"
}

Rules:
- Create an activation idea that clearly blends the product with the audience.
- Keep workflow stages high-signal and sequential.
- Checklist items should be action-ready.
- Staffing, vendors, and budget should feel realistic for the brief.
- Budget estimates should be whole dollar numbers.
- Do not include markdown fences.

Brief:
{brief}`;

function buildActivationBriefText(input: ActivationBriefInput) {
  return [
    `Product Name: ${input.productName}`,
    `Product Description: ${input.productDescription}`,
    `Target Audience: ${input.targetAudience}`,
    input.primaryGoal ? `Primary Goal: ${input.primaryGoal}` : "",
    input.budget != null ? `Budget: $${input.budget}` : "",
    input.city ? `Preferred City: ${input.city}` : "",
    input.timing ? `Timing: ${input.timing}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function fallbackActivationPlan(input: ActivationBriefInput): ActivationPlan {
  const product = input.productName || "New Product";
  const audience = input.targetAudience || "target customers";
  const city = input.city || "a flagship city";
  const budget = input.budget ?? 75000;

  return {
    title: `${product} Audience Launch Lab`,
    concept: `An immersive pop-up activation in ${city} that lets ${audience} experience ${product} through guided demos, creator-led moments, and social capture zones.`,
    summary: `This concept turns the product story into an in-person discovery experience designed to make the audience feel like early insiders rather than passive attendees.`,
    audienceFit: `The activation is built to resonate with ${audience} by making the product tangible, shareable, and emotionally legible in a live setting.`,
    experienceHighlights: [
      "Hero product discovery zone with guided demos",
      "Audience-specific content capture moment designed for sharing",
      "Live host or creator segment that frames the product story",
      "Conversion moment tied to sign-ups, sampling, or purchase intent",
    ],
    objectives: [
      "Turn the product positioning into a live audience experience",
      "Drive measurable engagement and qualified audience interest",
      "Generate content opportunities tied to the activation moment",
    ],
    workflow: [
      { stage: "Concept & Brief", summary: "Clarify the activation narrative, success metrics, and guest journey." },
      { stage: "Venue & Operations", summary: "Secure a venue footprint and lock logistics that support the experience." },
      { stage: "Production & Partners", summary: "Line up fabrication, AV, staffing, and vendor support for execution." },
      { stage: "Launch Readiness", summary: "Finalize the run-of-show, staffing coverage, and day-of task list." },
    ],
    checklist: [
      { title: "Finalize activation concept and guest journey", category: "marketing" },
      { title: "Source venue options that fit the event footprint", category: "venue" },
      { title: "Draft line-item production budget", category: "logistics" },
      { title: "Confirm staffing plan for setup, guest flow, and teardown", category: "staffing" },
      { title: "Lock vendor shortlist for fabrication, AV, and content capture", category: "logistics" },
    ],
    staffing: [
      { roleName: "Event Producer", quantity: 1, notes: "Own show flow, vendor coordination, and escalation handling." },
      { roleName: "Brand Ambassadors", quantity: 4, notes: "Guide guests through demos and capture audience feedback." },
      { roleName: "Content Capture Lead", quantity: 1, notes: "Direct photo/video moments and social-friendly outputs." },
    ],
    vendors: [
      { vendorName: "Venue Partner", category: "venue", notes: "Find a flexible footprint with strong guest flow and load-in support." },
      { vendorName: "AV Production Team", category: "av", notes: "Support hero moments, sound, and lighting." },
      { vendorName: "Fabrication Studio", category: "fabrication", notes: "Build branded environments and touchpoints." },
    ],
    budgetItems: [
      { category: "venue", description: "Venue rental and site fees", estimated: Math.round(budget * 0.24) },
      { category: "staffing", description: "Producer, ambassadors, and on-site labor", estimated: Math.round(budget * 0.2) },
      { category: "materials", description: "Fabrication, branding, and printed collateral", estimated: Math.round(budget * 0.22) },
      { category: "av", description: "Lighting, sound, and technical support", estimated: Math.round(budget * 0.16) },
      { category: "marketing", description: "Content capture and creator support", estimated: Math.round(budget * 0.12) },
    ],
    agentMessage: `I turned ${product} and ${audience} into a concept built around live discovery, content capture, and measurable engagement. The draft plan below gives you a strong starting workflow, budget structure, and staffing outline to get the event ready.`,
  };
}

export async function generateActivationPlan(
  input: ActivationBriefInput
): Promise<ActivationPlan> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fallbackActivationPlan(input);

  const groq = createGroq({ apiKey });
  const prompt = ACTIVATION_PLAN_PROMPT.replace(
    "{brief}",
    buildActivationBriefText(input)
  );

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      maxOutputTokens: 1800,
    });

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallbackActivationPlan(input);
    const parsed = JSON.parse(match[0]) as ActivationPlan;
    return parsed;
  } catch (err) {
    console.error("[agent] activation plan error:", err);
    return fallbackActivationPlan(input);
  }
}
