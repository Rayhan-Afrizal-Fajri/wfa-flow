import type { Project, ProjectTemplate, Task, User } from "@/types"

export const users: User[] = [
  { id: "u1", name: "Maya Chen", role: "developer", avatar: "" },
  { id: "u2", name: "Diego Alvarez", role: "marketer", avatar: "" },
]

export const projects: Project[] = [
  {
    id: "p1",
    name: "Northwind Storefront",
    category: "web_app",
    status: "active",
    client_name: "Northwind Coffee",
    start_date: "2026-07-15",
    deadline: "2026-09-10",
  },
  {
    id: "p2",
    name: "Peak Fitness — Q3 Ads",
    category: "ads_opt",
    status: "active",
    client_name: "Peak Fitness",
    start_date: "2026-07-01",
    deadline: "2026-08-20",
  },
  {
    id: "p3",
    name: "Lumen SaaS Dashboard",
    category: "web_app",
    status: "planning",
    client_name: "Lumen Analytics",
    start_date: "2026-08-10",
    deadline: "2026-10-30",
  },
  {
    id: "p4",
    name: "Verde Skincare Launch",
    category: "ads_opt",
    status: "on_hold",
    client_name: "Verde Skincare",
    start_date: "2026-06-20",
    deadline: "2026-08-15",
  },
]

export const tasks: Task[] = [
  // ---- p1: Northwind Storefront (primary, richly populated) ----
  { id: "t1", project_id: "p1", title: "Design system & component tokens", status: "done", priority: "high", assignee_id: "u1", due_date: "2026-07-22", type: "setup" },
  { id: "t2", project_id: "p1", title: "Set up Next.js + CI pipeline", status: "done", priority: "medium", assignee_id: "u1", due_date: "2026-07-20", type: "setup" },
  { id: "t3", project_id: "p1", title: "Product catalog schema", status: "done", priority: "high", assignee_id: "u1", due_date: "2026-07-25", type: "feature" },
  { id: "t4", project_id: "p1", title: "Competitor keyword research", status: "done", priority: "low", assignee_id: "u2", due_date: "2026-07-24", type: "setup" },

  { id: "t5", project_id: "p1", title: "Cart & checkout flow", status: "in_progress", priority: "urgent", assignee_id: "u1", due_date: "2026-08-08", type: "feature" },
  { id: "t6", project_id: "p1", title: "Stripe payment integration", status: "in_progress", priority: "high", assignee_id: "u1", due_date: "2026-08-12", type: "feature" },
  { id: "t7", project_id: "p1", title: "Landing page ad copy", status: "in_progress", priority: "medium", assignee_id: "u2", due_date: "2026-08-09", type: "feature" },
  { id: "t8", project_id: "p1", title: "Google Merchant feed setup", status: "in_progress", priority: "medium", assignee_id: "u2", due_date: "2026-08-14", type: "setup" },

  { id: "t9", project_id: "p1", title: "Mobile nav review", status: "review", priority: "medium", assignee_id: "u1", due_date: "2026-08-06", type: "revision" },
  { id: "t10", project_id: "p1", title: "SEO meta & OpenGraph pass", status: "review", priority: "low", assignee_id: "u2", due_date: "2026-08-07", type: "revision" },
  { id: "t11", project_id: "p1", title: "Accessibility audit fixes", status: "review", priority: "high", assignee_id: "u1", due_date: "2026-08-10", type: "revision" },

  { id: "t12", project_id: "p1", title: "Wishlist & saved items", status: "todo", priority: "low", assignee_id: "u1", due_date: "2026-08-22", type: "feature" },
  { id: "t13", project_id: "p1", title: "Retargeting pixel + audiences", status: "todo", priority: "high", assignee_id: "u2", due_date: "2026-08-18", type: "setup" },
  { id: "t14", project_id: "p1", title: "Order confirmation emails", status: "todo", priority: "medium", assignee_id: "u1", due_date: "2026-08-25", type: "feature" },
  { id: "t15", project_id: "p1", title: "Launch email campaign", status: "todo", priority: "urgent", assignee_id: "u2", due_date: "2026-08-28", type: "feature" },
  { id: "t16", project_id: "p1", title: "Performance & Lighthouse tuning", status: "todo", priority: "medium", assignee_id: "u1", due_date: "2026-09-01", type: "revision" },

  // ---- p2: Peak Fitness Ads ----
  { id: "t17", project_id: "p2", title: "Audit existing ad accounts", status: "done", priority: "high", assignee_id: "u2", due_date: "2026-07-05", type: "setup" },
  { id: "t18", project_id: "p2", title: "Build conversion tracking", status: "in_progress", priority: "urgent", assignee_id: "u2", due_date: "2026-08-07", type: "setup" },
  { id: "t19", project_id: "p2", title: "A/B test creative variants", status: "in_progress", priority: "medium", assignee_id: "u2", due_date: "2026-08-11", type: "feature" },
  { id: "t20", project_id: "p2", title: "Landing page speed fixes", status: "review", priority: "high", assignee_id: "u1", due_date: "2026-08-09", type: "revision" },
  { id: "t21", project_id: "p2", title: "Weekly performance report", status: "todo", priority: "low", assignee_id: "u2", due_date: "2026-08-16", type: "revision" },

  // ---- p3: Lumen SaaS Dashboard ----
  { id: "t22", project_id: "p3", title: "Kickoff & requirements", status: "todo", priority: "high", assignee_id: "u1", due_date: "2026-08-12", type: "setup" },
  { id: "t23", project_id: "p3", title: "Auth & billing scaffolding", status: "todo", priority: "medium", assignee_id: "u1", due_date: "2026-08-20", type: "setup" },
  { id: "t24", project_id: "p3", title: "Growth landing page", status: "todo", priority: "medium", assignee_id: "u2", due_date: "2026-08-24", type: "feature" },

  // ---- p4: Verde Skincare ----
  { id: "t25", project_id: "p4", title: "Influencer shortlist", status: "review", priority: "low", assignee_id: "u2", due_date: "2026-08-02", type: "setup" },
  { id: "t26", project_id: "p4", title: "Promo microsite", status: "in_progress", priority: "medium", assignee_id: "u1", due_date: "2026-08-13", type: "feature" },
]

export const templates: ProjectTemplate[] = [
  {
    id: "tpl_web",
    label: "Custom Web App",
    category: "web_app",
    description: "Full build lifecycle from discovery to launch for a bespoke web application.",
    taskCount: 12,
    tasks: [
      { title: "Discovery & requirements workshop", type: "setup", priority: "high", role: "developer", dayOffset: 0 },
      { title: "Information architecture & wireframes", type: "setup", priority: "high", role: "developer", dayOffset: 3 },
      { title: "Design system & tokens", type: "setup", priority: "medium", role: "developer", dayOffset: 6 },
      { title: "Project & CI scaffolding", type: "setup", priority: "medium", role: "developer", dayOffset: 8 },
      { title: "Core data model", type: "feature", priority: "high", role: "developer", dayOffset: 12 },
      { title: "Authentication & accounts", type: "feature", priority: "high", role: "developer", dayOffset: 16 },
      { title: "Primary feature build", type: "feature", priority: "urgent", role: "developer", dayOffset: 22 },
      { title: "Marketing landing page", type: "feature", priority: "medium", role: "marketer", dayOffset: 26 },
      { title: "SEO & analytics setup", type: "setup", priority: "medium", role: "marketer", dayOffset: 30 },
      { title: "QA & accessibility pass", type: "revision", priority: "high", role: "developer", dayOffset: 34 },
      { title: "Performance tuning", type: "revision", priority: "medium", role: "developer", dayOffset: 38 },
      { title: "Launch & handoff", type: "feature", priority: "urgent", role: "developer", dayOffset: 42 },
    ],
  },
  {
    id: "tpl_ads",
    label: "Ads Optimization Setup",
    category: "ads_opt",
    description: "Standardized paid-media onboarding, tracking, and optimization cadence.",
    taskCount: 12,
    tasks: [
      { title: "Ad account & access audit", type: "setup", priority: "high", role: "marketer", dayOffset: 0 },
      { title: "Conversion tracking install", type: "setup", priority: "urgent", role: "marketer", dayOffset: 2 },
      { title: "Audience & keyword research", type: "setup", priority: "high", role: "marketer", dayOffset: 4 },
      { title: "Landing page speed review", type: "revision", priority: "high", role: "developer", dayOffset: 6 },
      { title: "Creative concepts brief", type: "feature", priority: "medium", role: "marketer", dayOffset: 8 },
      { title: "Campaign structure build", type: "setup", priority: "high", role: "marketer", dayOffset: 10 },
      { title: "A/B test creatives", type: "feature", priority: "medium", role: "marketer", dayOffset: 14 },
      { title: "Bid strategy optimization", type: "revision", priority: "high", role: "marketer", dayOffset: 18 },
      { title: "Retargeting audiences", type: "setup", priority: "medium", role: "marketer", dayOffset: 21 },
      { title: "Weekly performance report", type: "revision", priority: "low", role: "marketer", dayOffset: 25 },
      { title: "Scale winning campaigns", type: "feature", priority: "urgent", role: "marketer", dayOffset: 30 },
      { title: "Monthly strategy review", type: "revision", priority: "medium", role: "marketer", dayOffset: 35 },
    ],
  },
]

export const TODAY = new Date("2026-08-05T00:00:00")
