export const defaultTaskBoards = [
  {
    id: "default-master-queue",
    title: "Master Queue",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const defaultTaskBoardStages = [
  {
    id: "stage-todo",
    title: "To Do",
    board_id: "default-master-queue",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "stage-in-progress",
    title: "In Progress",
    board_id: "default-master-queue",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "stage-review",
    title: "Needs Review",
    board_id: "default-master-queue",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "stage-done",
    title: "Done",
    board_id: "default-master-queue",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const defaultTaskTemplates = [
  {
    id: "tpl-ecommerce-seo",
    title: "Ecommerce: Comprehensive SEO Verification",
    checklist: [
      "Review Meta Tags",
      "Verify Open Graph tags",
      "Validate product description keywords",
      "Ensure image alt tags are present"
    ],
    priority: "high",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl-billing-invoice",
    title: "Billing: Print & Mail Execution",
    checklist: [
      "Generate high-res PDF print",
      "Attach to physical mailer queue",
      "CC accounting on final summary"
    ],
    priority: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
]
