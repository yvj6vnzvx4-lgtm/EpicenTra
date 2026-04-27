import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding database...");

  const org = await prisma.organization.upsert({
    where: { slug: "acme-brand-co" },
    update: {},
    create: { name: "Acme Brand Co", slug: "acme-brand-co" },
  });

  const passwordHash = await bcrypt.hash("password123", 12);

  const melissa = await prisma.user.upsert({
    where: { email: "melissa@acme.com" },
    update: {},
    create: { email: "melissa@acme.com", name: "Melissa Chen", passwordHash, role: "DIRECTOR", organizationId: org.id },
  });
  const james = await prisma.user.upsert({
    where: { email: "james@acme.com" },
    update: {},
    create: { email: "james@acme.com", name: "James Rivera", passwordHash, role: "MANAGER", organizationId: org.id },
  });
  const alex = await prisma.user.upsert({
    where: { email: "alex@acme.com" },
    update: {},
    create: { email: "alex@acme.com", name: "Alex Thompson", passwordHash, role: "COORDINATOR", organizationId: org.id },
  });

  // ─── Event 1: Nike Air Max Day Pop-Up — IN_EXECUTION ─────────────────────
  const nike = await prisma.event.upsert({
    where: { id: "event-nike-airmax" },
    update: { status: "IN_EXECUTION", planLockedAt: new Date("2026-03-01T00:00:00Z") },
    create: {
      id: "event-nike-airmax",
      title: "Nike Air Max Day Pop-Up",
      status: "IN_EXECUTION",
      description: "A high-energy pop-up activation celebrating Air Max Day with interactive installations, limited drops, and brand ambassador engagement.",
      startDate: new Date("2026-03-26T10:00:00Z"),
      endDate: new Date("2026-03-26T20:00:00Z"),
      timezone: "America/New_York",
      venueName: "Spring Studios",
      venueAddress: "50 Varick St",
      venueCity: "New York",
      venueState: "NY",
      venueZip: "10013",
      objectives: JSON.stringify([
        "Drive product trial with 500+ attendees",
        "Generate 1M+ social impressions",
        "Capture 300+ email leads",
      ]),
      targetAudience: "Sneakerheads and urban fashion enthusiasts, ages 18-35",
      expectedAttendance: 500,
      totalBudget: 85000,
      planLockedAt: new Date("2026-03-01T00:00:00Z"),
      ownerId: james.id,
      organizationId: org.id,
    },
  });

  for (const [userId, role] of [[melissa.id, "director"], [alex.id, "coordinator"]] as const) {
    await prisma.eventMember.upsert({
      where: { eventId_userId: { eventId: nike.id, userId } },
      update: {},
      create: { eventId: nike.id, userId, role },
    });
  }

  // Clear existing child records before recreating
  await prisma.budgetItem.deleteMany({ where: { eventId: nike.id } });
  await prisma.eventVendor.deleteMany({ where: { eventId: nike.id } });
  await prisma.staffSlot.deleteMany({ where: { eventId: nike.id } });
  await prisma.checklistItem.deleteMany({ where: { eventId: nike.id } });
  await prisma.note.deleteMany({ where: { eventId: nike.id } });
  await prisma.agentTask.deleteMany({ where: { eventId: nike.id } });

  // Budget
  const nikeBudget = [
    { category: "Venue", description: "Spring Studios rental", estimated: 22000, actual: 22000, status: "paid" },
    { category: "Staffing", description: "Brand ambassadors (10 × 10hrs)", estimated: 8000, actual: 7500, status: "paid" },
    { category: "Fabrication", description: "Custom installations & displays", estimated: 28000, actual: 30200, status: "paid" },
    { category: "Catering", description: "F&B for guests", estimated: 12000, actual: null, status: "approved" },
    { category: "Permits", description: "NYC event permit", estimated: 1500, actual: 1500, status: "paid" },
    { category: "Content", description: "Photography & videography", estimated: 8000, actual: null, status: "pending" },
    { category: "Marketing", description: "Influencer seeding & paid social", estimated: 5500, actual: 4800, status: "paid" },
  ];
  for (const item of nikeBudget) {
    await prisma.budgetItem.create({ data: { ...item, eventId: nike.id } });
  }

  // Vendors
  const nikeVendors = [
    { vendorName: "Metro Event Staffing", category: "Staffing", status: "CONTRACTED", contactName: "Dana Patel", contactEmail: "dana@metrostaffing.com" },
    { vendorName: "FabLab NYC", category: "Fabrication", status: "CONTRACTED", contactName: "Chris Wong", contactEmail: "chris@fablabnyc.com" },
    { vendorName: "Hudson Catering Co.", category: "Catering", status: "CONFIRMED", contactName: "Maria Lopez", contactEmail: "maria@hudsoncatering.com" },
    { vendorName: "LensUp Studio", category: "Photography", status: "CONTRACTED", contactName: "Jay Kim", contactEmail: "jay@lensup.io" },
  ];
  for (const v of nikeVendors) {
    await prisma.eventVendor.create({ data: { ...v, eventId: nike.id } });
  }

  // Staff slots
  const nikeStaff = [
    { roleName: "Event Manager", quantity: 1, isFilled: true },
    { roleName: "Brand Ambassador", quantity: 10, isFilled: true },
    { roleName: "Setup Crew", quantity: 4, isFilled: true },
    { roleName: "Security", quantity: 2, isFilled: false },
  ];
  for (const s of nikeStaff) {
    await prisma.staffSlot.create({ data: { ...s, eventId: nike.id } });
  }

  // Checklist
  const nikeChecklist = [
    { title: "Confirm Spring Studios contract", category: "Venue", isCompleted: true, sortOrder: 0 },
    { title: "Submit NYC permit application", category: "Permits", isCompleted: true, sortOrder: 1 },
    { title: "Finalize installation design with FabLab", category: "Fabrication", isCompleted: true, sortOrder: 2 },
    { title: "Brief brand ambassadors on talking points", category: "Staffing", isCompleted: true, sortOrder: 3 },
    { title: "Confirm catering headcount with Hudson", category: "Catering", isCompleted: false, sortOrder: 4, dueDate: new Date("2026-03-20") },
    { title: "Coordinate load-in schedule with venue", category: "Logistics", isCompleted: false, sortOrder: 5, dueDate: new Date("2026-03-22") },
    { title: "Set up social media scheduling", category: "Marketing", isCompleted: false, sortOrder: 6 },
    { title: "Prepare day-of run-of-show document", category: "Logistics", isCompleted: false, sortOrder: 7, dueDate: new Date("2026-03-24") },
  ];
  for (const item of nikeChecklist) {
    await prisma.checklistItem.create({ data: { ...item, eventId: nike.id } });
  }

  // Notes / chat
  const nikeNotes = [
    { content: "Venue confirmed! Spring Studios locked in for March 26th. Load-in starts at 6am.", type: "USER" as const, userId: james.id },
    { content: "FabLab sent the first renders — the Air Max tunnel installation looks incredible. Approved the design.", type: "USER" as const, userId: melissa.id },
    { content: "We need to finalize the run-of-show. Who's drafting it?", type: "USER" as const, userId: alex.id },
    { content: "I'll take the run-of-show. Can you help me with the staffing timeline?", type: "USER" as const, userId: james.id },
    {
      content: `Here's a suggested day-of run-of-show timeline for the Nike Air Max Day Pop-Up:\n\n**6:00 AM** — Load-in begins, setup crew on site\n**9:00 AM** — Brand ambassador briefing\n**10:00 AM** — Doors open to public\n**12:00 PM** — Limited drop reveal (peak traffic window)\n**3:00 PM** — Social media activation push\n**6:00 PM** — VIP hour with exclusive access\n**8:00 PM** — Event closes\n**8:30 PM** — Breakdown begins\n\nI'd recommend stationing 2 brand ambassadors at the tunnel installation at all times during peak hours (12-4pm).`,
      type: "AGENT" as const,
      userId: null,
    },
    { content: "Perfect, I'll use this as the base. Adding the security check-in at 9:30am.", type: "USER" as const, userId: james.id, isPinned: false },
    { content: "Catering confirmed for 500 guests — passed the final headcount to Hudson.", type: "USER" as const, userId: alex.id, isPinned: true },
  ];
  for (const note of nikeNotes) {
    await prisma.note.create({ data: { ...note, eventId: nike.id } });
  }

  // Agent task
  await prisma.agentTask.create({
    data: {
      prompt: "Draft a staffing plan and day-of timeline for 500 attendees",
      status: "COMPLETED",
      result: `## Staffing Plan — Nike Air Max Day Pop-Up\n\n**Total Staff: 17**\n\n### On-Site Roles\n- **1× Event Manager** — overall coordination, vendor liaison\n- **10× Brand Ambassadors** — product demos, guest engagement, social media\n- **4× Setup/Breakdown Crew** — load-in at 6am, teardown from 8pm\n- **2× Security** — entrance management, crowd flow\n\n### Deployment Schedule\n| Time | Role | Count |\n|------|------|-------|\n| 6:00 AM | Setup Crew | 4 |\n| 9:00 AM | Brand Ambassadors | 10 |\n| 9:30 AM | Security | 2 |\n| 10:00 AM | Event Manager | 1 |\n\n### Budget Estimate\n- Brand Ambassadors: $80/hr × 10hrs × 10 = **$8,000**\n- Setup Crew: $35/hr × 4hrs × 4 = **$560**\n- Security: $50/hr × 12hrs × 2 = **$1,200**`,
      completedAt: new Date("2026-02-28T14:00:00Z"),
      eventId: nike.id,
      createdById: james.id,
    },
  });

  // ─── Event 2: Glossier Summer Beauty Bar — PLANNING ───────────────────────
  const glossier = await prisma.event.upsert({
    where: { id: "event-glossier" },
    update: {},
    create: {
      id: "event-glossier",
      title: "Glossier Summer Beauty Bar",
      status: "PLANNING",
      description: "A sun-drenched outdoor beauty experience featuring live demonstrations, product sampling, and Instagrammable moments.",
      startDate: new Date("2026-07-12T11:00:00Z"),
      endDate: new Date("2026-07-14T19:00:00Z"),
      timezone: "America/Los_Angeles",
      venueName: "Platform LA",
      venueCity: "Culver City",
      venueState: "CA",
      objectives: JSON.stringify([
        "Introduce 3 new summer SKUs to target audience",
        "Collect 500+ UGC posts with brand hashtag",
        "Drive 1,000 loyalty app sign-ups",
      ]),
      targetAudience: "Beauty enthusiasts, women ages 22-38",
      expectedAttendance: 1200,
      totalBudget: 120000,
      ownerId: melissa.id,
      organizationId: org.id,
    },
  });

  for (const [userId, role] of [[james.id, "manager"], [alex.id, "coordinator"]] as const) {
    await prisma.eventMember.upsert({
      where: { eventId_userId: { eventId: glossier.id, userId } },
      update: {},
      create: { eventId: glossier.id, userId, role },
    });
  }

  await prisma.budgetItem.deleteMany({ where: { eventId: glossier.id } });
  await prisma.eventVendor.deleteMany({ where: { eventId: glossier.id } });
  await prisma.checklistItem.deleteMany({ where: { eventId: glossier.id } });
  await prisma.note.deleteMany({ where: { eventId: glossier.id } });

  const glossierBudget = [
    { category: "Venue", description: "Platform LA outdoor space rental (3 days)", estimated: 30000, actual: null, status: "approved" },
    { category: "Fabrication", description: "Custom beauty bar structures & signage", estimated: 35000, actual: null, status: "pending" },
    { category: "Staffing", description: "Beauty artists + brand ambassadors (15 staff)", estimated: 18000, actual: null, status: "pending" },
    { category: "Product", description: "Sampling inventory — 3 new SKUs", estimated: 22000, actual: null, status: "pending" },
    { category: "Marketing", description: "Influencer fees + paid social", estimated: 12000, actual: null, status: "approved" },
    { category: "Permits", description: "Culver City outdoor event permit", estimated: 2000, actual: null, status: "pending" },
    { category: "Catering", description: "Complimentary drinks & light bites", estimated: 8000, actual: null, status: "pending" },
  ];
  for (const item of glossierBudget) {
    await prisma.budgetItem.create({ data: { ...item, eventId: glossier.id } });
  }

  const glossierVendors = [
    { vendorName: "Bloom Fabrication Studio", category: "Fabrication", status: "CONTACTED" },
    { vendorName: "LA Event Staffing Group", category: "Staffing", status: "PENDING" },
    { vendorName: "West Coast Permits", category: "Permits", status: "CONTACTED" },
  ];
  for (const v of glossierVendors) {
    await prisma.eventVendor.create({ data: { ...v, eventId: glossier.id } });
  }

  const glossierChecklist = [
    { title: "Confirm venue contract with Platform LA", category: "Venue", isCompleted: true, sortOrder: 0, dueDate: new Date("2026-05-01") },
    { title: "Book photographer and videographer", category: "Content", isCompleted: true, sortOrder: 1, dueDate: new Date("2026-05-15") },
    { title: "Submit Culver City permit application", category: "Permits", isCompleted: false, sortOrder: 2, dueDate: new Date("2026-05-20") },
    { title: "Finalize staffing plan and roles", category: "Staffing", isCompleted: false, sortOrder: 3, dueDate: new Date("2026-06-01") },
    { title: "Confirm product sampling inventory", category: "Product", isCompleted: false, sortOrder: 4, dueDate: new Date("2026-06-15") },
    { title: "Brief influencer partners on content guidelines", category: "Marketing", isCompleted: false, sortOrder: 5, dueDate: new Date("2026-06-30") },
    { title: "Design and order custom beauty bar signage", category: "Fabrication", isCompleted: false, sortOrder: 6 },
    { title: "Set up UGC hashtag tracking dashboard", category: "Marketing", isCompleted: false, sortOrder: 7 },
  ];
  for (const item of glossierChecklist) {
    await prisma.checklistItem.create({ data: { ...item, eventId: glossier.id } });
  }

  const glossierNotes = [
    { content: "Platform LA confirmed availability for July 12-14. Site visit scheduled for next week.", type: "USER" as const, userId: melissa.id },
    { content: "Three new SKUs confirmed: Cloud Paint Blush, Ultralip in 3 shades, and the new SPF Serum.", type: "USER" as const, userId: james.id },
    { content: "What influencer tier are we targeting? We have budget for up to 5 mid-tier or 20 micro.", type: "USER" as const, userId: alex.id },
    {
      content: `Based on your $12K influencer budget and goal of 500+ UGC posts, here's my recommendation:\n\n**Influencer Mix:**\n- **2× Mid-tier** (100K-500K followers): $4,000 each = $8,000\n- **10× Micro** (10K-50K followers): $400 each = $4,000\n\n**Why this works:**\n- Mid-tier drives awareness and reach\n- Micro influencers have 3-5× higher engagement rates and generate more authentic UGC\n- 12 total creators × avg 3 posts each = **36 pieces of content minimum**\n\n**Checklist items to add:**\n- Draft influencer brief by June 1\n- Send product gifting by June 15\n- Set up affiliate tracking codes`,
      type: "AGENT" as const,
      userId: null,
    },
    { content: "Love the micro-heavy approach. Let's go with 3 mid-tier + 15 micro.", type: "USER" as const, userId: melissa.id, isPinned: true },
  ];
  for (const note of glossierNotes) {
    await prisma.note.create({ data: { ...note, eventId: glossier.id } });
  }

  // ─── Event 3: Levi's Block Party — COMPLETED ─────────────────────────────
  const levis = await prisma.event.upsert({
    where: { id: "event-levis" },
    update: {},
    create: {
      id: "event-levis",
      title: "Levi's Block Party",
      status: "COMPLETED",
      description: "An outdoor brand activation celebrating the launch of the Levi's 501 Day limited collection, featuring live music, custom embroidery stations, and photo experiences.",
      startDate: new Date("2026-02-14T12:00:00Z"),
      endDate: new Date("2026-02-14T21:00:00Z"),
      timezone: "America/Los_Angeles",
      venueName: "Levi's Plaza",
      venueCity: "San Francisco",
      venueState: "CA",
      objectives: JSON.stringify([
        "Drive 800+ in-person attendees",
        "Sell 200+ limited-edition 501 Day units on-site",
        "Generate 500K+ social impressions",
      ]),
      targetAudience: "Denim enthusiasts and streetwear fans ages 20-40",
      expectedAttendance: 800,
      totalBudget: 95000,
      planLockedAt: new Date("2026-01-10T00:00:00Z"),
      completedAt: new Date("2026-02-14T21:00:00Z"),
      ownerId: melissa.id,
      organizationId: org.id,
    },
  });

  for (const [userId, role] of [[james.id, "manager"], [alex.id, "coordinator"]] as const) {
    await prisma.eventMember.upsert({
      where: { eventId_userId: { eventId: levis.id, userId } },
      update: {},
      create: { eventId: levis.id, userId, role },
    });
  }

  await prisma.budgetItem.deleteMany({ where: { eventId: levis.id } });
  await prisma.checklistItem.deleteMany({ where: { eventId: levis.id } });
  await prisma.note.deleteMany({ where: { eventId: levis.id } });
  await prisma.agentTask.deleteMany({ where: { eventId: levis.id } });

  const levisBudget = [
    { category: "Venue", description: "Levi's Plaza outdoor permit & setup", estimated: 18000, actual: 17500, status: "paid" },
    { category: "Fabrication", description: "Custom embroidery stations (×4) + stage", estimated: 24000, actual: 25800, status: "paid" },
    { category: "Staffing", description: "Embroidery artists, brand ambassadors, security", estimated: 16000, actual: 15200, status: "paid" },
    { category: "Product", description: "501 Day limited inventory (on-site sales)", estimated: 20000, actual: 20000, status: "paid" },
    { category: "Entertainment", description: "Live DJ + band (2 sets)", estimated: 8000, actual: 8000, status: "paid" },
    { category: "Marketing", description: "Pre-event paid social + influencer gifting", estimated: 6000, actual: 5400, status: "paid" },
    { category: "Catering", description: "Complimentary refreshments", estimated: 3000, actual: 2900, status: "paid" },
  ];
  for (const item of levisBudget) {
    await prisma.budgetItem.create({ data: { ...item, eventId: levis.id } });
  }

  const levisChecklist = [
    { title: "Book Levi's Plaza and obtain city permit", category: "Venue", isCompleted: true, sortOrder: 0 },
    { title: "Confirm embroidery station fabrication", category: "Fabrication", isCompleted: true, sortOrder: 1 },
    { title: "Hire and brief brand ambassadors", category: "Staffing", isCompleted: true, sortOrder: 2 },
    { title: "Confirm 501 Day inventory allocation", category: "Product", isCompleted: true, sortOrder: 3 },
    { title: "Book DJ and live band", category: "Entertainment", isCompleted: true, sortOrder: 4 },
    { title: "Launch pre-event social campaign", category: "Marketing", isCompleted: true, sortOrder: 5 },
    { title: "Prepare post-event recap report", category: "Reporting", isCompleted: true, sortOrder: 6 },
  ];
  for (const item of levisChecklist) {
    await prisma.checklistItem.create({ data: { ...item, eventId: levis.id } });
  }

  const levisNotes = [
    { content: "Incredible turnout — 847 attendees checked in, exceeding our 800 target.", type: "USER" as const, userId: melissa.id, isPinned: true },
    { content: "Sold out all 200 limited 501 Day units by 3pm. Should have ordered more inventory.", type: "USER" as const, userId: james.id },
    { content: "Social impressions came in at 612K — above target. Embroidery station was the most photographed moment.", type: "USER" as const, userId: alex.id },
    {
      content: `## Post-Event Summary — Levi's Block Party\n\n**Attendance:** 847 (↑6% vs target)\n**Units Sold:** 200/200 (sold out by 3pm)\n**Social Impressions:** 612,000 (↑22% vs target)\n\n**Budget:** $94,800 spent vs $95,000 budgeted — **99.8% on budget**\n\n**Top Moments:**\n- Embroidery stations drove the highest engagement — avg 8 min dwell time\n- DJ set at 5pm peaked attendee density (est. 600 on-site simultaneously)\n- 3 micro-influencers organically posted Reels totalling 280K views\n\n**Recommendations for Next Activation:**\n1. Double embroidery station capacity — queue wait times exceeded 20 min\n2. Pre-sell limited inventory to reduce sell-out risk\n3. Schedule influencer content window during peak hour (4-6pm)`,
      type: "AGENT" as const,
      userId: null,
      isPinned: true,
    },
  ];
  for (const note of levisNotes) {
    await prisma.note.create({ data: { ...note, eventId: levis.id } });
  }

  await prisma.agentTask.create({
    data: {
      prompt: "Generate a post-event performance report with key metrics and recommendations",
      status: "COMPLETED",
      result: `## Post-Event Performance Report\n\n**Event:** Levi's Block Party — 501 Day Activation\n**Date:** February 14, 2026\n\n### KPI Summary\n| Metric | Target | Actual | Variance |\n|--------|--------|--------|----------|\n| Attendance | 800 | 847 | +5.9% ✅ |\n| Units Sold | 200 | 200 | Sold Out ✅ |\n| Social Impressions | 500K | 612K | +22.4% ✅ |\n| Budget Utilization | $95,000 | $94,800 | -0.2% ✅ |\n\n### What Worked\n- **Embroidery personalization** drove longest dwell times and highest UGC rate\n- **Limited scarcity framing** (501 Day exclusive) created urgency and sell-out velocity\n- **Live entertainment** timing aligned with peak foot traffic windows\n\n### Areas to Improve\n- Station capacity constrained throughput — expand from 4 to 6 stations next time\n- Inventory allocation should include 20% buffer for sell-out scenarios\n- Dedicated influencer access window would improve content quality`,
      completedAt: new Date("2026-02-15T10:00:00Z"),
      eventId: levis.id,
      createdById: melissa.id,
    },
  });

  // ─── Event 5: Red Bull Urban Pulse Festival — DRAFT ───────────────────────
  await prisma.event.upsert({
    where: { id: "event-redbull" },
    update: {},
    create: {
      id: "event-redbull",
      title: "Red Bull Urban Pulse Festival",
      status: "DRAFT",
      description: "Multi-day urban music and culture festival in partnership with local artists and DJs.",
      startDate: new Date("2026-09-05T14:00:00Z"),
      endDate: new Date("2026-09-07T23:00:00Z"),
      timezone: "America/Chicago",
      targetAudience: "Urban culture enthusiasts ages 18-30",
      expectedAttendance: 3000,
      totalBudget: 250000,
      ownerId: james.id,
      organizationId: org.id,
    },
  });

  // ─── Event: Whitman Spring Capstone Day 2026 ─────────────────────────────
  const capstone = await prisma.event.upsert({
    where: { id: "event-whitman-capstone-2026" },
    update: {},
    create: {
      id: "event-whitman-capstone-2026",
      title: "Whitman Spring Capstone Day 2026",
      status: "PLAN_LOCKED",
      description: "Annual Whitman School of Management capstone pitch competition. Student teams present business plans to industry judges across multiple presentation rooms. Includes judge orientation, two rounds of presentations, alumni watch party, and awards reception.",
      startDate: new Date("2026-04-24T11:30:00Z"),
      endDate: new Date("2026-04-24T20:00:00Z"),
      timezone: "America/New_York",
      venueName: "Whitman School of Management",
      venueAddress: "721 University Ave",
      venueCity: "Syracuse",
      venueState: "NY",
      venueZip: "13244",
      objectives: JSON.stringify([
        "Run two full rounds of presentations across 6 rooms",
        "Provide judges with seamless orientation and scoring experience",
        "Celebrate student teams with a reception and awards ceremony",
      ]),
      targetAudience: "Business school students, industry judges, faculty, and alumni",
      expectedAttendance: 220,
      totalBudget: 6400,
      planLockedAt: new Date("2026-04-15T00:00:00Z"),
      ownerId: melissa.id,
      organizationId: org.id,
    },
  });

  for (const [userId, role] of [[james.id, "manager"], [alex.id, "coordinator"]] as const) {
    await prisma.eventMember.upsert({
      where: { eventId_userId: { eventId: capstone.id, userId } },
      update: {},
      create: { eventId: capstone.id, userId, role },
    });
  }

  await prisma.budgetItem.deleteMany({ where: { eventId: capstone.id } });
  await prisma.eventVendor.deleteMany({ where: { eventId: capstone.id } });
  await prisma.checklistItem.deleteMany({ where: { eventId: capstone.id } });
  await prisma.note.deleteMany({ where: { eventId: capstone.id } });
  await prisma.agentTask.deleteMany({ where: { eventId: capstone.id } });

  // Budget
  const capstoneBudget = [
    { category: "Catering", description: "SU Dining — judge lunch + reception food & drinks", estimated: 3200, actual: 3200, status: "paid" },
    { category: "AV", description: "Whitman AV — projectors, mics, and display screens", estimated: 800, actual: 800, status: "paid" },
    { category: "Printing", description: "Campus Print — signage, judge packets, certificates, run of show", estimated: 420, actual: null, status: "approved" },
    { category: "Photography", description: "Event photographer — ceremony and reception", estimated: 1200, actual: null, status: "approved" },
    { category: "Judges", description: "Judge gifts and supplies", estimated: 480, actual: null, status: "approved" },
    { category: "Staffing", description: "Student worker shirts and timekeeper supplies", estimated: 300, actual: null, status: "approved" },
  ];
  for (const item of capstoneBudget) {
    await prisma.budgetItem.create({ data: { ...item, eventId: capstone.id } });
  }

  // Vendors
  const capstoneVendors = [
    { vendorName: "SU Dining", category: "Catering", status: "CONTRACTED", contactName: "Dawn Kowalski", contactEmail: "dkowalski@syr.edu" },
    { vendorName: "Whitman AV", category: "AV", status: "CONTRACTED", contactName: "Mike Torres", contactEmail: "mtorres@whitman.syr.edu" },
    { vendorName: "Campus Print", category: "Printing", status: "CONFIRMED", contactName: "Campus Print Services", contactEmail: "print@syr.edu" },
  ];
  for (const v of capstoneVendors) {
    await prisma.eventVendor.create({ data: { ...v, eventId: capstone.id } });
  }

  // Checklist — all 54 items from the planning reality list
  const capstoneChecklist = [
    // Planning & Admin
    { title: "Set the dates", category: "Planning", isCompleted: true, sortOrder: 0 },
    { title: "Book rooms", category: "Planning", isCompleted: true, sortOrder: 1, dueDate: new Date("2026-03-01") },
    { title: "Calendar blocks for orientation and day-of", category: "Planning", isCompleted: true, sortOrder: 2 },
    { title: "Schedule run of show meeting", category: "Planning", isCompleted: true, sortOrder: 3 },
    { title: "Secure faculty to review business plans", category: "Planning", isCompleted: true, sortOrder: 4 },
    { title: "Set up parking for judges", category: "Planning", isCompleted: false, sortOrder: 5, dueDate: new Date("2026-04-23") },
    { title: "Zoom webinar link setup", category: "Planning", isCompleted: true, sortOrder: 6 },
    { title: "Run of show meeting with team", category: "Planning", isCompleted: false, sortOrder: 7, dueDate: new Date("2026-04-23") },
    { title: "Run of show document", category: "Planning", isCompleted: false, sortOrder: 8, dueDate: new Date("2026-04-23") },
    { title: "Print 4 copies of run of show", category: "Planning", isCompleted: false, sortOrder: 9, dueDate: new Date("2026-04-24") },
    { title: "Podium script", category: "Planning", isCompleted: false, sortOrder: 10, dueDate: new Date("2026-04-23") },
    { title: "CART and CC", category: "Planning", isCompleted: false, sortOrder: 11, dueDate: new Date("2026-04-22") },
    // Judges
    { title: "Qualtrics judges registration form", category: "Judges", isCompleted: true, sortOrder: 12 },
    { title: "Judges invitation", category: "Judges", isCompleted: true, sortOrder: 13 },
    { title: "Assign judges and teams to rooms", category: "Judges", isCompleted: true, sortOrder: 14, dueDate: new Date("2026-04-18") },
    { title: "Judges ranking form — online", category: "Judges", isCompleted: true, sortOrder: 15 },
    { title: "Judges email with exec summary/day of details", category: "Judges", isCompleted: false, sortOrder: 16, dueDate: new Date("2026-04-23") },
    { title: "Notes for judges orientation", category: "Judges", isCompleted: false, sortOrder: 17, dueDate: new Date("2026-04-23") },
    { title: "Judges meeting slides", category: "Judges", isCompleted: false, sortOrder: 18, dueDate: new Date("2026-04-23") },
    { title: "Nametags for judges", category: "Judges", isCompleted: false, sortOrder: 19, dueDate: new Date("2026-04-24") },
    { title: "Print judges sign in sheet", category: "Judges", isCompleted: false, sortOrder: 20, dueDate: new Date("2026-04-24") },
    { title: "Judges room packets", category: "Judges", isCompleted: false, sortOrder: 21, dueDate: new Date("2026-04-24") },
    { title: "Bottled water for judges", category: "Judges", isCompleted: false, sortOrder: 22, dueDate: new Date("2026-04-24") },
    { title: "Print copies of QR code for judges voting", category: "Judges", isCompleted: false, sortOrder: 23, dueDate: new Date("2026-04-24") },
    { title: "Order judges gifts", category: "Judges", isCompleted: true, sortOrder: 24 },
    // Staffing & Students
    { title: "Order student worker shirts", category: "Staffing", isCompleted: true, sortOrder: 25 },
    { title: "Request DPS for NVRC", category: "Staffing", isCompleted: true, sortOrder: 26 },
    { title: "Student timekeepers — use paid workers", category: "Staffing", isCompleted: true, sortOrder: 27 },
    { title: "Student timekeeper shirts", category: "Staffing", isCompleted: true, sortOrder: 28 },
    { title: "Assemble room boxes for timekeepers", category: "Staffing", isCompleted: false, sortOrder: 29, dueDate: new Date("2026-04-23") },
    { title: "Notes for student volunteer meeting", category: "Staffing", isCompleted: false, sortOrder: 30, dueDate: new Date("2026-04-22") },
    { title: "Email student workers with details", category: "Staffing", isCompleted: false, sortOrder: 31, dueDate: new Date("2026-04-23") },
    { title: "Student nametags for timekeepers", category: "Staffing", isCompleted: false, sortOrder: 32, dueDate: new Date("2026-04-24") },
    { title: "Capstone students email for faculty to send", category: "Staffing", isCompleted: true, sortOrder: 33 },
    // Catering
    { title: "Order food for reception", category: "Catering", isCompleted: true, sortOrder: 34 },
    { title: "Order food for judges lunch", category: "Catering", isCompleted: true, sortOrder: 35 },
    // Communications & Marketing
    { title: "Request photographer", category: "Communications", isCompleted: true, sortOrder: 36 },
    { title: "Alumni watch party invitation", category: "Communications", isCompleted: true, sortOrder: 37 },
    { title: "Send invitation to faculty and staff", category: "Communications", isCompleted: true, sortOrder: 38 },
    { title: "Request writer", category: "Communications", isCompleted: true, sortOrder: 39 },
    { title: "Business plan reviewer email with details", category: "Communications", isCompleted: false, sortOrder: 40, dueDate: new Date("2026-04-22") },
    // Slides & Digital
    { title: "Slides for Flaum/Lender", category: "Slides", isCompleted: false, sortOrder: 41, dueDate: new Date("2026-04-23") },
    { title: "Slides for Flaum", category: "Slides", isCompleted: false, sortOrder: 42, dueDate: new Date("2026-04-23") },
    { title: "Slides for digital signage", category: "Slides", isCompleted: false, sortOrder: 43, dueDate: new Date("2026-04-23") },
    { title: "Digital signage sent to Dawn", category: "Slides", isCompleted: false, sortOrder: 44, dueDate: new Date("2026-04-23") },
    { title: "Make new Mentimeter form/add to slides", category: "Slides", isCompleted: false, sortOrder: 45, dueDate: new Date("2026-04-23") },
    { title: "Download team slides / create folder / send to Mike", category: "Slides", isCompleted: false, sortOrder: 46, dueDate: new Date("2026-04-24") },
    // Logistics & Supplies
    { title: "Order supplies for room boxes", category: "Logistics", isCompleted: true, sortOrder: 47 },
    { title: "Update rubrics", category: "Logistics", isCompleted: true, sortOrder: 48 },
    { title: "Create Excel formulas for determining winners", category: "Logistics", isCompleted: false, sortOrder: 49, dueDate: new Date("2026-04-23") },
    { title: "G drive update (1st)", category: "Logistics", isCompleted: true, sortOrder: 50 },
    { title: "G drive update (2nd)", category: "Logistics", isCompleted: false, sortOrder: 51, dueDate: new Date("2026-04-23") },
    { title: "G drive update (3rd)", category: "Logistics", isCompleted: false, sortOrder: 52, dueDate: new Date("2026-04-24") },
    { title: "Winners certificates", category: "Logistics", isCompleted: false, sortOrder: 53, dueDate: new Date("2026-04-24") },
  ];
  for (const item of capstoneChecklist) {
    await prisma.checklistItem.create({ data: { ...item, eventId: capstone.id } });
  }

  // Notes & AI agent activity
  const capstoneNotes = [
    { content: "Room bookings confirmed: 011, 013, 101, 103 for Round 1 · 201, 203 for Round 2. Load-in access from 10am.", type: "USER" as const, userId: melissa.id, isPinned: true },
    { content: "SU Dining confirmed delivery at 11:45 AM. W-9 and COI on file.", type: "USER" as const, userId: james.id, isPinned: true },
    { content: "We have 18 registered judges. Assigned 3 per room for Round 1, rotating for Round 2.", type: "USER" as const, userId: alex.id },
    {
      content: "Conflict resolved — Room 011 had a double-booking with a faculty seminar. Contacted registrar and moved seminar to Eggers 114. Team C reassigned from 011 to 013. Both teams notified automatically.",
      type: "AGENT" as const,
      userId: null,
      isPinned: true,
    },
    {
      content: "Vendor auto-confirmed — SU Dining delivery at 11:45 AM. W-9 and COI on file. No action needed.",
      type: "AGENT" as const,
      userId: null,
    },
    { content: "Still need to get slides finalized for Flaum presentation and digital signage. Following up today.", type: "USER" as const, userId: melissa.id },
  ];
  for (const note of capstoneNotes) {
    await prisma.note.create({ data: { ...note, eventId: capstone.id } });
  }

  // Agent tasks
  const capstoneAgentTasks = [
    {
      prompt: "Detect and resolve any room double-bookings for Capstone Day",
      status: "COMPLETED" as const,
      result: "Detected a scheduling conflict in Room 011 with a faculty seminar (2–3:30 PM). Contacted the registrar and successfully moved the seminar to Eggers 114. Reassigned Team C from Room 011 to Room 013. Sent automated notifications to Team C and their assigned judges with updated room details.",
      completedAt: new Date("2026-04-21T09:15:00Z"),
      createdById: melissa.id,
    },
    {
      prompt: "Confirm all vendor contracts and day-of logistics are in order",
      status: "COMPLETED" as const,
      result: "All 3 vendors confirmed:\n\n**SU Dining** — Delivery at 11:45 AM. W-9 and COI on file. Menu finalized for 220 guests.\n**Whitman AV** — Setup crew arrives 9:00 AM. Projectors confirmed in all 6 rooms. Mic check at 11:00 AM.\n**Campus Print** — Order #4421 ready for pickup April 23. Includes: 18 judge packets, 4 run-of-show copies, room signage, and QR code sheets.",
      completedAt: new Date("2026-04-21T10:30:00Z"),
      createdById: james.id,
    },
  ];
  for (const task of capstoneAgentTasks) {
    await prisma.agentTask.create({ data: { ...task, eventId: capstone.id } });
  }

  console.log("✅ Seed complete.");
  console.log("\nLogin credentials:");
  console.log("  melissa@acme.com / password123  (DIRECTOR)");
  console.log("  james@acme.com / password123  (MANAGER)");
  console.log("  alex@acme.com  / password123  (COORDINATOR)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
