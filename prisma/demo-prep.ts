/**
 * Demo prep script — updates Whitman Capstone event to look great on camera.
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/demo-prep.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🎬 Prepping Whitman Capstone for demo...");

  const event = await prisma.event.findUnique({ where: { id: "event-whitman-capstone-2026" } });
  if (!event) { console.error("❌ Capstone event not found — run db:seed first."); process.exit(1); }

  // 1. Add actual spending to budget items so the report looks realistic
  const budgetItems = await prisma.budgetItem.findMany({ where: { eventId: event.id } });
  const actuals: Record<string, number> = {
    "Catering":    3150,
    "AV":           800,
    "Printing":     398,
    "Photography": 1200,
    "Judges":       462,
    "Staffing":     290,
  };
  for (const item of budgetItems) {
    const actual = actuals[item.category];
    if (actual !== undefined) {
      await prisma.budgetItem.update({
        where: { id: item.id },
        data: { actual, status: "paid" },
      });
    }
  }

  // 2. Mark the final batch of checklist items completed (demo is the day-of)
  const remaining = [
    "Set up parking for judges",
    "Run of show meeting with team",
    "Run of show document",
    "Judges email with exec summary/day of details",
    "Notes for judges orientation",
    "Judges meeting slides",
    "Assemble room boxes for timekeepers",
    "Notes for student volunteer meeting",
    "Email student workers with details",
    "Business plan reviewer email with details",
    "G drive update (2nd)",
    "Download team slides / create folder / send to Mike",
    "Create Excel formulas for determining winners",
  ];
  for (const title of remaining) {
    await prisma.checklistItem.updateMany({
      where: { eventId: event.id, title },
      data: { isCompleted: true },
    });
  }

  // 3. Add richer team notes for the demo
  const existingNotes = await prisma.note.findMany({ where: { eventId: event.id } });
  if (existingNotes.length < 8) {
    const newNotes = [
      {
        content: "All 18 judges confirmed and room assignments finalized. Round 1: rooms 011, 013, 101, 103. Round 2: rooms 201, 203.",
        type: "USER" as const,
        userId: (await prisma.user.findFirst({ where: { email: "james@acme.com" } }))!.id,
        isPinned: false,
      },
      {
        content: "Logistics check: SU Dining confirmed 11:45 AM delivery. Whitman AV crew arriving at 9:00 AM for setup. Campus Print order ready for pickup tomorrow morning.",
        type: "USER" as const,
        userId: (await prisma.user.findFirst({ where: { email: "alex@acme.com" } }))!.id,
        isPinned: false,
      },
      {
        content: `Based on your 18 registered judges and 25 presenting teams, here's the optimized room flow:\n\n**Round 1 (12:30–3:00 PM)**\n- Room 011: Teams A, B, C (3 judges)\n- Room 013: Teams D, E, F (3 judges)\n- Room 101: Teams G, H, I (3 judges)\n- Room 103: Teams J, K, L (3 judges)\n\n**Round 2 (3:45–5:00 PM)**\n- Room 201: Top 6 teams (9 judges rotating)\n- Room 203: Teams 7–12 (9 judges rotating)\n\nRecommendation: station 1 student timekeeper per room with a digital timer. Use the Mentimeter QR code for real-time audience voting during presentations.`,
        type: "AGENT" as const,
        userId: null,
        isPinned: true,
      },
    ];
    for (const note of newNotes) {
      await prisma.note.create({ data: { ...note, eventId: event.id } });
    }
  }

  // 4. Add a completed execution agent task for the demo
  const existingTasks = await prisma.agentTask.findMany({ where: { eventId: event.id } });
  if (existingTasks.length < 3) {
    const james = await prisma.user.findFirst({ where: { email: "james@acme.com" } });
    await prisma.agentTask.create({
      data: {
        prompt: "Generate a day-of run of show and staffing deployment plan",
        status: "COMPLETED",
        result: `## Whitman Capstone Day 2026 — Run of Show\n\n**Event Date:** Friday, April 24, 2026\n**Venue:** Whitman School of Management, Syracuse, NY\n\n### Timeline\n| Time | Activity | Lead |\n|------|----------|------|\n| 9:00 AM | AV setup + room prep | AV Crew |\n| 10:30 AM | Judge orientation materials distributed | Student Workers |\n| 11:30 AM | Judge check-in opens, Whitman lobby | Timekeeper Team |\n| 12:00 PM | Judges lunch (Atrium) | SU Dining |\n| 12:30 PM | **Round 1 begins** — Rooms 011, 013, 101, 103 | All Judges |\n| 3:00 PM | Round 1 closes, scoring window opens | Qualtrics Form |\n| 3:15 PM | Break + refreshments | SU Dining |\n| 3:45 PM | **Round 2 begins** — Rooms 201, 203 | Panel Judges |\n| 5:00 PM | Judging complete, tabulation begins | Event Staff |\n| 5:30 PM | **Awards reception + winner announcements** | Dean's Office |\n| 6:30 PM | Event concludes, breakdown begins | Setup Crew |\n\n### Staffing Deployment\n- **6 student timekeepers** — 1 per presentation room\n- **4 student workers** — judge check-in, signage, supplies\n- **2 staff coordinators** — overall flow management\n- **1 photographer** — ceremony + reception coverage\n\n### Key Contacts\n- AV issues: Whitman AV (Mike Torres)\n- Catering issues: SU Dining (Dawn Kowalski)\n- Scoring issues: Qualtrics admin`,
        completedAt: new Date("2026-04-22T11:00:00Z"),
        eventId: event.id,
        createdById: james!.id,
      },
    });
  }

  // 5. Create a COMPLETED version of the event for the "post-event report" stage
  // We'll update the existing event's status to COMPLETED for demo
  // (The user will manually change it back if needed, or we add a second event)
  // Instead: create a duplicate "post-event" version with COMPLETED status
  const postOrg = await prisma.organization.findFirst({ where: { slug: "acme-brand-co" } });
  const melissa = await prisma.user.findFirst({ where: { email: "melissa@acme.com" } });

  const existing = await prisma.event.findUnique({ where: { id: "event-whitman-capstone-completed" } });
  if (!existing) {
    const completed = await prisma.event.create({
      data: {
        id: "event-whitman-capstone-completed",
        title: "Whitman Spring Capstone Day 2026 ✓",
        status: "COMPLETED",
        description: "Annual Whitman School of Management capstone pitch competition. 25 student teams presented business plans to 18 industry judges across 6 rooms.",
        startDate: new Date("2026-04-24T11:30:00Z"),
        endDate: new Date("2026-04-24T18:30:00Z"),
        timezone: "America/New_York",
        venueName: "Whitman School of Management",
        venueCity: "Syracuse",
        venueState: "NY",
        expectedAttendance: 220,
        totalBudget: 6400,
        planLockedAt: new Date("2026-04-15T00:00:00Z"),
        completedAt: new Date("2026-04-24T18:30:00Z"),
        ownerId: melissa!.id,
        organizationId: postOrg!.id,
      },
    });

    // Budget with actuals for report
    const completedBudget = [
      { category: "Catering", description: "SU Dining — judge lunch + reception", estimated: 3200, actual: 3150, status: "paid" },
      { category: "AV", description: "Whitman AV — projectors, mics, screens", estimated: 800, actual: 800, status: "paid" },
      { category: "Printing", description: "Campus Print — packets, signage, certificates", estimated: 420, actual: 398, status: "paid" },
      { category: "Photography", description: "Event photographer", estimated: 1200, actual: 1200, status: "paid" },
      { category: "Judges", description: "Judge gifts and supplies", estimated: 480, actual: 462, status: "paid" },
      { category: "Staffing", description: "Student worker shirts and supplies", estimated: 300, actual: 290, status: "paid" },
    ];
    for (const item of completedBudget) {
      await prisma.budgetItem.create({ data: { ...item, eventId: completed.id } });
    }

    // Full checklist — all completed
    const allChecklist = [
      "Set the dates", "Book rooms", "Qualtrics judges registration form", "Judges invitation",
      "Calendar blocks for orientation and day-of", "Request photographer", "Order food for reception",
      "Order food for judges lunch", "Order judges gifts", "Order student worker shirts",
      "Request DPS for NVRC", "Schedule run of show meeting", "Secure faculty to review business plans",
      "Set up parking for judges", "Zoom webinar link setup", "Request writer",
      "Slides for digital signage", "Order supplies for room boxes", "Update rubrics",
      "Alumni watch party invitation", "Send invitation to faculty and staff",
      "Create Excel formulas for determining winners", "Assign judges and teams to rooms",
      "Run of show document", "Student timekeepers — use paid workers", "Student timekeeper shirts",
      "Assemble room boxes for timekeepers", "Notes for student volunteer meeting",
      "G drive update (1st)", "Digital signage sent to Dawn", "Judges ranking form — online",
      "Make new Mentimeter form/add to slides", "Judges email with exec summary/day of details",
      "Business plan reviewer email with details", "Run of show meeting with team",
      "Capstone students email for faculty to send", "Email student workers with details",
      "Bottled water for judges", "Print copies of QR code for judges voting", "Podium script",
      "Notes for judges orientation", "Judges meeting slides", "Student nametags for timekeepers",
      "Nametags for judges", "Print judges sign in sheet", "Judges room packets",
      "Winners certificates", "Print 4 copies of run of show", "G drive update (2nd)",
      "G drive update (3rd)", "Download team slides / create folder / send to Mike", "CART and CC",
      "Slides for Flaum/Lender", "Slides for Flaum",
    ];
    for (let i = 0; i < allChecklist.length; i++) {
      await prisma.checklistItem.create({
        data: { title: allChecklist[i], isCompleted: true, sortOrder: i, eventId: completed.id },
      });
    }

    // Pinned notes for report
    const completedNotes = [
      { content: "Event ran flawlessly. All 25 teams presented on time across 6 rooms. Zero AV issues.", type: "USER" as const, userId: melissa!.id, isPinned: true },
      { content: "Winner announced: Team Nexus (MBA '26) with their supply chain SaaS concept. Standing ovation from judges.", type: "USER" as const, userId: melissa!.id, isPinned: true },
      { content: "Final attendance: 214 checked in. SU Dining ran perfectly — judges praised the lunch setup.", type: "USER" as const, userId: (await prisma.user.findFirst({ where: { email: "james@acme.com" } }))!.id, isPinned: true },
    ];
    for (const note of completedNotes) {
      await prisma.note.create({ data: { ...note, eventId: completed.id } });
    }

    // Agent post-event summary
    await prisma.agentTask.create({
      data: {
        prompt: "Generate post-event performance summary with key metrics and recommendations",
        status: "COMPLETED",
        result: `## Post-Event Report — Whitman Spring Capstone Day 2026\n\n**Date:** April 24, 2026 · Whitman School of Management\n\n### At a Glance\n| Metric | Target | Actual |\n|--------|--------|--------|\n| Attendance | 220 | 214 |\n| Teams presented | 25 | 25 |\n| Judges participating | 18 | 18 |\n| Budget | $6,400 | $6,300 |\n| Checklist completion | 100% | 100% ✅ |\n\n### What Worked\n- **Room logistics** were seamless — timekeepers kept every presentation within the 12-minute window\n- **Digital scoring via Qualtrics** eliminated paper ballots; results tabulated in under 8 minutes\n- **SU Dining** received high marks from judges for the lunch quality and timing\n- **Mentimeter voting** during the reception drove strong alumni engagement\n\n### Recommendations for 2027\n1. Add a 5-minute buffer between rounds for room transitions\n2. Offer a virtual watch option for remote alumni (Zoom integration)\n3. Expand to 3 rounds to accommodate growing team count\n4. Pre-assign judge parking spots to reduce lobby congestion at 11:30 AM`,
        completedAt: new Date("2026-04-24T20:00:00Z"),
        eventId: completed.id,
        createdById: melissa!.id,
      },
    });
  }

  console.log("✅ Demo prep complete!");
  console.log("\nEvents ready:");
  console.log("  • event-whitman-capstone-2026          → PLAN_LOCKED (planning stage)");
  console.log("  • event-whitman-capstone-completed      → COMPLETED (post-event report)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
