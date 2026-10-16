import { AppError } from "@codexsun/framework/errors";
import type {
  LiveEnquiryInput,
  LiveEnquiryOptions,
  LiveEnquiryPatch,
  LiveEnquiryJob,
  LiveEnquiryJobInput,
  LiveEnquiryEstimate,
  LiveEnquiryEstimateInput
} from "@codexsun/crm-api";
import { requestFrappe } from "./connection.service.js";
import type { FrappeSettings } from "./connection.types.js";

type Document = {
  name: string;
  user_employee?: string | null;
  assigned_to_employee?: string | null;
  status?: string | null;
  enquiry_messages?: Array<{
    name?: string;
    comment?: string;
    mode?: string;
    parent_message?: string;
  }>;
};
type JobDocument = {
  name: string;
  creation?: string | null;
  employee?: string;
  enquiry?: string;
  start_time?: string;
  stop_time?: string | null;
  status?: string;
  hours?: number | string;
  total_cost?: number | string;
  employee_cost_per_hour?: number | string;
};
type EstimateDocument = {
  name: string;
  enquiry?: string;
  date?: string;
  item_name?: string;
  supplier?: string;
  price?: number | string;
};

export class LiveFrappeActions {
  constructor(
    private readonly settings: FrappeSettings,
    private readonly employeeCode: string | null,
    private readonly canViewAll: boolean
  ) {}

  async options(): Promise<LiveEnquiryOptions> {
    const [groups, statuses, employees, customers, suppliers] = await Promise.all([
      this.references<{ name: string; group_name?: string }>("Enquiry Group", [
        "name",
        "group_name"
      ]),
      this.references<{ name: string; status_name?: string }>("Enquiry Status", [
        "name",
        "status_name"
      ]),
      this.references<{ name: string; employee_name?: string }>("Employee", [
        "name",
        "employee_name"
      ]),
      this.references<{ name: string; customer_name?: string }>("Customer", [
        "name",
        "customer_name"
      ]),
      this.references<{ name: string; supplier_name?: string }>("Supplier", [
        "name",
        "supplier_name"
      ])
    ]);
    return {
      groups: groups.map((item) => item.group_name || item.name),
      statuses: statuses.map((item) => item.status_name || item.name),
      employees: employees.map((item) => ({
        code: item.name,
        name: item.employee_name || item.name
      })),
      customers: customers.map((item) => ({
        code: item.name,
        name: item.customer_name || item.name
      })),
      suppliers: suppliers.map((item) => ({
        code: item.name,
        name: item.supplier_name || item.name
      }))
    };
  }

  async createOption(kind: "list-in" | "status" | "priority", name: string) {
    if (kind === "priority")
      throw AppError.validation("Frappe priority choices are controlled by the Enquiry field configuration.");
    const doctype = kind === "list-in" ? "Enquiry Group" : "Enquiry Status";
    const field = kind === "list-in" ? "group_name" : "status_name";
    const response = await requestFrappe<{ data?: { name?: string } }>(
      `/api/resource/${encodeURIComponent(doctype)}`,
      "POST",
      this.settings,
      { [field]: name }
    );
    const id = response.data?.name;
    if (!id) throw AppError.conflict("Frappe did not return the new option.");
    return { id, name, code: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") };
  }

  async create(input: LiveEnquiryInput) {
    if (!this.employeeCode)
      throw AppError.forbidden("Map this CRM user to a Frappe employee to create enquiries.");
    const response = await requestFrappe<{ data?: Document }>(
      "/api/resource/Enquiry",
      "POST",
      this.settings,
      {
        ...toFrappePayload(input),
        user_employee: this.employeeCode,
        enquiry_messages: [{ comment: input.details, mode: "Comment" }]
      }
    );
    if (!response.data?.name) throw AppError.conflict("Frappe did not return the new enquiry.");
    return response.data.name;
  }

  async update(name: string, input: LiveEnquiryPatch) {
    await this.visibleDocument(name);
    await requestFrappe(this.enquiryPath(name), "PUT", this.settings, toFrappePayload(input));
  }

  async addMessage(name: string, body: string, parentName: string | null) {
    const document = await this.visibleDocument(name);
    const messages = document.enquiry_messages ?? [];
    if (parentName && !messages.some((message) => message.name === parentName))
      throw AppError.validation("Reply target is not part of this enquiry.");
    await requestFrappe(this.enquiryPath(name), "PUT", this.settings, {
      enquiry_messages: [
        ...messages.map((message) => ({
          ...(message.name ? { name: message.name } : {}),
          comment: message.comment || "",
          mode: message.mode || (message.parent_message ? "Reply" : "Comment"),
          ...(message.parent_message ? { parent_message: message.parent_message } : {})
        })),
        {
          comment: body,
          mode: parentName ? "Reply" : "Comment",
          ...(parentName ? { parent_message: parentName } : {})
        }
      ]
    });
  }

  async suspendMessage(name: string, messageName: string) {
    const document = await this.visibleDocument(name);
    const messages = document.enquiry_messages ?? [];
    const latest = messages.at(-1);
    if (!latest || latest.name !== messageName)
      throw AppError.conflict("Only the latest conversation entry can be suspended.");
    const comment = (latest.comment || "").trim();
    if (comment.startsWith("<s>") && comment.endsWith("</s>"))
      throw AppError.conflict("This conversation entry is already suspended.");
    await requestFrappe(this.enquiryPath(name), "PUT", this.settings, {
      enquiry_messages: messages.map((message) => ({
        ...(message.name ? { name: message.name } : {}),
        comment:
          message.name === messageName ? `<s>${message.comment || ""}</s>` : message.comment || "",
        mode: message.mode || (message.parent_message ? "Reply" : "Comment"),
        ...(message.parent_message ? { parent_message: message.parent_message } : {})
      }))
    });
  }

  async delete(name: string) {
    if (!this.canViewAll)
      throw AppError.forbidden("Only CRM administrators can delete live enquiries.");
    await this.visibleDocument(name);
    await requestFrappe(this.enquiryPath(name), "DELETE", this.settings);
    return { deleted: true as const };
  }

  async openNewCall(name: string) {
    const document = await this.visibleDocument(name);
    if (document.status?.trim().toLowerCase() !== "new")
      throw AppError.conflict("Only a new call can be opened.");
    const options = await this.options();
    const open = options.statuses.find((status) => status.toLowerCase() === "open");
    if (!open) throw AppError.conflict("Frappe has no Open enquiry status.");
    await requestFrappe(this.enquiryPath(name), "PUT", this.settings, {
      status: open,
      enquiry_messages: [
        ...(document.enquiry_messages ?? []).map((message) => ({
          ...(message.name ? { name: message.name } : {}),
          comment: message.comment || "",
          mode: message.mode || (message.parent_message ? "Reply" : "Comment"),
          ...(message.parent_message ? { parent_message: message.parent_message } : {})
        })),
        { comment: "New call opened", mode: "Comment" }
      ]
    });
  }

  async jobs(name: string): Promise<LiveEnquiryJob[]> {
    await this.visibleDocument(name);
    const response = await requestFrappe<{ message?: JobDocument[]; data?: JobDocument[] }>(
      "/api/v2/method/frappe.client.get_list",
      "POST",
      this.settings,
      {
        doctype: "Job Execution",
        fields: [
          "name",
          "creation",
          "employee",
          "enquiry",
          "start_time",
          "stop_time",
          "status",
          "hours",
          "total_cost",
          "employee_cost_per_hour"
        ],
        filters: [["enquiry", "=", name]],
        order_by: "creation desc",
        limit_page_length: 500
      }
    );
    return (response.message ?? response.data ?? []).map(mapJob);
  }

  async startJob(name: string): Promise<LiveEnquiryJob> {
    if (!this.employeeCode)
      throw AppError.forbidden("Map this CRM user to a Frappe employee to start a job.");
    const jobs = await this.jobs(name);
    if (jobs.some((job) => job.status === "Running"))
      throw AppError.conflict("A job is already running for this enquiry.");
    const employee = await requestFrappe<{
      data?: { cost_per_hour?: number | string };
    }>(
      `/api/resource/Employee/${encodeURIComponent(this.employeeCode)}?fields=${encodeURIComponent(JSON.stringify(["name", "cost_per_hour"]))}`,
      "GET",
      this.settings
    );
    const ratePerHour = Number(employee.data?.cost_per_hour ?? 0);
    if (!Number.isFinite(ratePerHour) || ratePerHour < 0)
      throw AppError.validation("The employee cost per hour must be a valid non-negative amount.");
    const response = await requestFrappe<{ data?: JobDocument }>(
      "/api/v2/document/Job Execution",
      "POST",
      this.settings,
      {
        employee: this.employeeCode,
        enquiry: name,
        start_time: frappeTime()
      }
    );
    if (!response.data?.name) throw AppError.conflict("Frappe did not return the started job.");
    const job = mapJob(response.data);
    return { ...job, ratePerHour: job.ratePerHour || ratePerHour };
  }

  async stopJob(name: string, jobName: string): Promise<LiveEnquiryJob> {
    const jobs = await this.jobs(name);
    const job = jobs.find((item) => item.name === jobName);
    if (!job) throw AppError.notFound("Job was not found against this enquiry.");
    if (job.status !== "Running") throw AppError.conflict("The selected job is no longer running.");
    const response = await requestFrappe<{ data?: JobDocument }>(
      `/api/v2/document/Job Execution/${encodeURIComponent(jobName)}`,
      "PUT",
      this.settings,
      { status: "Completed", stop_time: frappeTime() }
    );
    if (!response.data?.name) throw AppError.conflict("Frappe did not return the completed job.");
    return mapJob(response.data);
  }

  async saveJob(name: string, input: LiveEnquiryJobInput, jobName?: string) {
    const jobs = await this.jobs(name);
    if (jobName && !jobs.some((job) => job.name === jobName))
      throw AppError.notFound("Job was not found against this enquiry.");
    if (
      input.status === "Running" &&
      jobs.some((job) => job.status === "Running" && job.name !== jobName)
    )
      throw AppError.conflict("A different job is already running for this enquiry.");
    const hours =
      input.status === "Running" || !input.stopTime
        ? 0
        : elapsedHours(input.startTime, input.stopTime);
    const response = await requestFrappe<{ data?: JobDocument }>(
      jobName
        ? `/api/v2/document/Job Execution/${encodeURIComponent(jobName)}`
        : "/api/v2/document/Job Execution",
      jobName ? "PUT" : "POST",
      this.settings,
      {
        enquiry: name,
        employee: input.employee,
        start_time: input.startTime,
        stop_time: input.status === "Running" ? null : input.stopTime,
        employee_cost_per_hour: input.ratePerHour,
        status: input.status,
        hours,
        total_cost: Number((hours * input.ratePerHour).toFixed(2))
      }
    );
    if (!response.data?.name) throw AppError.conflict("Frappe did not return the job.");
    return mapJob(response.data);
  }

  async estimates(name: string): Promise<LiveEnquiryEstimate[]> {
    await this.visibleDocument(name);
    const response = await requestFrappe<{
      message?: EstimateDocument[];
      data?: EstimateDocument[];
    }>("/api/v2/method/frappe.client.get_list", "POST", this.settings, {
      doctype: "Estimate",
      fields: ["name", "enquiry", "date", "item_name", "supplier", "price"],
      filters: [["enquiry", "=", name]],
      order_by: "modified desc",
      limit_page_length: 500
    });
    return (response.message ?? response.data ?? []).map(mapEstimate);
  }

  async saveEstimate(name: string, input: LiveEnquiryEstimateInput, estimateName?: string) {
    await this.visibleDocument(name);
    if (estimateName) {
      const current = (await this.estimates(name)).find((item) => item.name === estimateName);
      if (!current) throw AppError.notFound("Estimate was not found against this enquiry.");
    }
    const response = await requestFrappe<{ data?: EstimateDocument; message?: EstimateDocument }>(
      estimateName
        ? `/api/v2/document/Estimate/${encodeURIComponent(estimateName)}`
        : "/api/v2/document/Estimate",
      estimateName ? "PUT" : "POST",
      this.settings,
      {
        enquiry: name,
        date: input.date,
        item_name: input.itemName,
        supplier: input.supplier,
        price: input.price
      }
    );
    const document = response.data ?? response.message;
    if (!document?.name) throw AppError.conflict("Frappe did not return the estimate.");
    return mapEstimate(document);
  }

  private async visibleDocument(name: string) {
    const response = await requestFrappe<{ data?: Document }>(
      this.enquiryPath(name),
      "GET",
      this.settings
    );
    const document = response.data;
    if (!document || document.name !== name) throw AppError.notFound("Enquiry was not found.");
    if (
      !this.canViewAll &&
      (!this.employeeCode ||
        (document.user_employee !== this.employeeCode &&
          document.assigned_to_employee !== this.employeeCode))
    )
      throw AppError.forbidden("You cannot change this enquiry.");
    return document;
  }

  private enquiryPath(name: string) {
    return `/api/resource/Enquiry/${encodeURIComponent(name)}`;
  }

  private async references<T>(doctype: string, fields: string[]): Promise<T[]> {
    const query = new URLSearchParams({
      fields: JSON.stringify(fields),
      limit_page_length: "500",
      order_by: "creation asc"
    });
    const response = await requestFrappe<{ data?: T[] }>(
      `/api/resource/${encodeURIComponent(doctype)}?${query}`,
      "GET",
      this.settings
    );
    return response.data ?? [];
  }
}

function mapJob(document: JobDocument): LiveEnquiryJob {
  return {
    name: document.name,
    createdAt: document.creation ?? null,
    employee: document.employee || "",
    startTime: document.start_time || "",
    stopTime: document.stop_time || null,
    status: document.status || "Running",
    hours: Number(document.hours || 0),
    totalCost: Number(document.total_cost || 0),
    ratePerHour: Number(document.employee_cost_per_hour || 0)
  };
}

function mapEstimate(document: EstimateDocument): LiveEnquiryEstimate {
  return {
    name: document.name,
    date: document.date || "",
    itemName: document.item_name || "",
    supplier: document.supplier || "",
    price: Number(document.price || 0)
  };
}

function frappeTime() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata"
  }).format(new Date());
}

function elapsedHours(start: string, stop: string) {
  const seconds = clockSeconds(stop) - clockSeconds(start);
  return Number(((seconds < 0 ? seconds + 86400 : seconds) / 3600).toFixed(6));
}

function clockSeconds(value: string) {
  const [hours = 0, minutes = 0, seconds = 0] = value.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function toFrappePayload(input: LiveEnquiryPatch) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.details !== undefined ? { enquiry_details: input.details } : {}),
    ...(input.customer !== undefined ? { customer: input.customer } : {}),
    ...(input.mobile !== undefined ? { mobile: input.mobile } : {}),
    ...(input.date !== undefined ? { date: input.date } : {}),
    ...(input.dueDate !== undefined ? { due_date: input.dueDate } : {}),
    ...(input.group !== undefined ? { group: input.group } : {}),
    ...(input.assigneeCode !== undefined ? { assigned_to_employee: input.assigneeCode } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.statusDetails !== undefined ? { status_details: input.statusDetails } : {})
  };
}
