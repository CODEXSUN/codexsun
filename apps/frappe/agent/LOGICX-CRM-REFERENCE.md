# LogicX Frappe CRM source reference

## Required reference

For Frappe schema and function work, refer to [CODEXSUN/logicx-biz](https://github.com/CODEXSUN/logicx-biz.git).
The custom app is the reference for LogicX contracts. Generic Frappe CRM documentation does not define these custom DocTypes.

Reviewed on 17-10-2026. Local source: `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype`.
Commit: `02826403ed87903f3eb7f4c57855eb2c829a8803`. The local working tree was clean during collection.
Scope: all 25 DocType JSON definitions in the supplied folder, with adjacent Python controllers and JavaScript forms.
This is a source inventory, not live SQL introspection or a deployed-site certification.
Custom Fields, Property Setters, Server Script records, fixtures, hooks, reports, and other modules may extend these contracts.

## Table interpretation

Normal DocTypes correspond to `tab<DocType name>` tables. Single DocTypes store values in Frappe Singles storage.
Child DocTypes use parent, parenttype, parentfield, and idx. Layout controls do not create business columns.
Frappe supplies standard identity and audit fields, including name, owner, creation, modified, modified_by, docstatus, and idx.
The tables below preserve declared field metadata, not inferred SQL column widths or database indexes.
Link targets require remote identity mapping. Dynamic Link options name the field that selects the target DocType.
Permission entries below are source role declarations. They do not prove effective record access on a running site.

## Inventory

- [API One](#api-one): `api_one`.
- [API One Log](#api-one-log): `api_one_log`.
- [Enquiry](#enquiry): `enquiry`.
- [Enquiry Closure Request](#enquiry-closure-request): `enquiry_closure_request`.
- [Enquiry Group](#enquiry-group): `enquiry_group`.
- [Enquiry Message](#enquiry-message): `enquiry_message`.
- [Enquiry Status](#enquiry-status): `enquiry_status`.
- [Job Activity](#job-activity): `job_activity`.
- [Job Activity Type](#job-activity-type): `job_activity_type`.
- [Job Attachment](#job-attachment): `job_attachment`.
- [Job Comments](#job-comments): `job_comments`.
- [Job Estimate](#job-estimate): `job_estimate`.
- [Job Execution](#job-execution): `job_execution`.
- [Job Location](#job-location): `job_location`.
- [Job Type](#job-type): `job_type`.
- [Mobile Contact](#mobile-contact): `mobile_contact`.
- [Mobile Contact Customer](#mobile-contact-customer): `mobile_contact_customer`.
- [Notice](#notice): `notice`.
- [Renewal Entry](#renewal-entry): `renewal_entry`.
- [Renewal Remainder](#renewal-remainder): `renewal_remainder`.
- [Scheme](#scheme): `scheme`.
- [SOP Assigned](#sop-assigned): `sop_assigned`.
- [SOP Item](#sop-item): `sop_item`.
- [SOP Reporting](#sop-reporting): `sop_reporting`.
- [Staff Request](#staff-request): `staff_request`.

## API One

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/api_one/api_one.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/api_one/api_one.json`.

Declared table: `tabAPI One`.

Metadata: {"module": "LogicX HR", "autoname": "API.#", "is_submittable": 0, "allow_rename": 0, "allow_import": 0, "track_changes": 1, "title_field": "api_path", "sort_field": "creation", "sort_order": "DESC"}.

| Field                    | Label          | Type          | Options / link target                 | Rules                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | -------------- | ------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| section_endpoint         | Endpoint       | Section Break |                                       | —                                                                                                                                                                                                                                                                                                                                                                       |
| api_path                 | API Path       | Data          |                                       | {"reqd": 1, "unique": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1, "description": "Becomes <code>/api/method/&lt;path&gt;</code> (also <code>/api/v2/method/&lt;path&gt;</code>). Letters, digits, underscore, dot and hyphen only; no slashes. Must not clash with an existing method or Server Script."}                                            |
| request_method           | Request Method | Select        | GET<br>POST<br>PUT<br>PATCH<br>DELETE | {"default": "GET", "reqd": 1, "in_list_view": 1, "in_standard_filter": 1}                                                                                                                                                                                                                                                                                               |
| section_endpoint_column2 |                | Column Break  |                                       | —                                                                                                                                                                                                                                                                                                                                                                       |
| enabled                  | Enabled        | Check         |                                       | {"default": "1", "in_list_view": 1, "in_standard_filter": 1}                                                                                                                                                                                                                                                                                                            |
| section_script           | Script         | Section Break |                                       | —                                                                                                                                                                                                                                                                                                                                                                       |
| script                   | Script         | Code          | Python                                | {"reqd": 1, "description": "Runs in Frappe's Server Script sandbox as the authenticated caller. Put the result in <code>frappe.response[\"message\"]</code>. Available: <code>frappe.request</code>, <code>frappe.form_dict</code>, <code>frappe.session.user</code>, <code>frappe.get_list</code>, <code>frappe.get_doc</code>, <code>frappe.db.get_value</code> ..."} |
| server_script            | Server Script  | Link          | Server Script                         | {"read_only": 1, "no_copy": 1, "description": "Managed by API One: overwritten on every save, deleted with this row. Do not edit directly."}                                                                                                                                                                                                                            |

### Declared permissions

| Role           | Level | Owner only | Enabled actions                                            |
| -------------- | ----- | ---------- | ---------------------------------------------------------- |
| System Manager | 0     | 0          | read, create, write, delete, select, report, export, share |
| Script Manager | 0     | 0          | read, create, write, delete, select, report, export, share |
| TM Admin       | 0     | 0          | read, select, report                                       |

### Functions and form behavior

[api_one.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/api_one/api_one.py):

- `resolves_to_python_method(dotted_path)` at line 129: True if `frappe.get_attr` can import the path, i.e. a real method exists there.
- `clear_paths_cache()` at line 140: See implementation for validation, persistence, or lifecycle behavior.
- `validate(self)` at line 26: See implementation for validation, persistence, or lifecycle behavior.
- `on_update(self)` at line 32: See implementation for validation, persistence, or lifecycle behavior.
- `on_trash(self)` at line 36: See implementation for validation, persistence, or lifecycle behavior.
- `validate_api_path(self)` at line 46: See implementation for validation, persistence, or lifecycle behavior.
- `validate_server_scripts_enabled(self)` at line 56: See implementation for validation, persistence, or lifecycle behavior.
- `validate_path_is_free(self)` at line 68: Error if the path already exists anywhere it could be resolved from.
- `sync_server_script(self)` at line 107: Create or update the Server Script that actually serves this endpoint.

[api_one.js](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/api_one/api_one.js):

Form callbacks and helper implementations:

```javascript
frappe.ui.form.on("API One", {
  refresh(frm) {
    if (!frm.is_new()) {
      frm.add_custom_button(__("View Logs"), () => {
        frappe.set_route("List", "API One Log", { api_path: frm.doc.api_path });
      });
    }
  },

  api_path(frm) {
    if (frm.doc.api_path) {
      frm.set_value("api_path", frm.doc.api_path.trim());
    }
  }
});
```

## API One Log

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/api_one_log/api_one_log.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/api_one_log/api_one_log.json`.

Declared table: `tabAPI One Log`.

Metadata: {"module": "LogicX HR", "autoname": "APILOG.#", "is_submittable": 0, "allow_rename": 0, "allow_import": 0, "track_changes": 0, "title_field": "api_path", "sort_field": "creation", "sort_order": "DESC"}.

| Field                   | Label                | Type          | Options / link target | Rules                                                                        |
| ----------------------- | -------------------- | ------------- | --------------------- | ---------------------------------------------------------------------------- |
| section_request         | Request              | Section Break |                       | —                                                                            |
| api_path                | API Path             | Data          |                       | {"read_only": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1} |
| request_method          | Request Method       | Data          |                       | {"read_only": 1, "in_list_view": 1, "in_standard_filter": 1}                 |
| request_query           | Request Query        | Small Text    |                       | {"read_only": 1}                                                             |
| section_request_column2 |                      | Column Break  |                       | —                                                                            |
| user                    | User                 | Link          | User                  | {"read_only": 1, "in_list_view": 1, "in_standard_filter": 1}                 |
| ip_address              | IP Address           | Data          |                       | {"read_only": 1}                                                             |
| duration_ms             | Duration (ms)        | Int           |                       | {"read_only": 1, "in_list_view": 1}                                          |
| section_request_payload | Request Payload      | Section Break |                       | —                                                                            |
| request_header          | Request Header       | Code          | JSON                  | {"read_only": 1}                                                             |
| request_content         | Request Content      | Code          |                       | {"read_only": 1}                                                             |
| section_response        | Response             | Section Break |                       | —                                                                            |
| response_status_code    | Response Status Code | Int           |                       | {"read_only": 1, "in_list_view": 1, "in_standard_filter": 1}                 |
| response_header         | Response Header      | Code          | JSON                  | {"read_only": 1}                                                             |
| response_content        | Response Content     | Code          |                       | {"read_only": 1}                                                             |

### Declared permissions

| Role           | Level | Owner only | Enabled actions                      |
| -------------- | ----- | ---------- | ------------------------------------ |
| System Manager | 0     | 0          | read, delete, select, report, export |
| TM Admin       | 0     | 0          | read, select, report                 |

### Functions and form behavior

[api_one_log.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/api_one_log/api_one_log.py):

- No custom Python functions. The controller delegates to the base Document behavior.

## Enquiry

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/enquiry/enquiry.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/enquiry/enquiry.json`.

Declared table: `tabEnquiry`.

Metadata: {"module": "LogicX HR", "autoname": "ENQ.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "title", "sort_field": "creation", "sort_order": "DESC"}.

| Field                | Label           | Type          | Options / link target           | Rules                                                                                                                             |
| -------------------- | --------------- | ------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| section1             |                 | Section Break |                                 | —                                                                                                                                 |
| mobile               | Mobile          | Link          | Mobile Contact                  | {"reqd": 1, "in_list_view": 0, "in_standard_filter": 1, "in_filter": 1}                                                           |
| btn_whatsapp         | WhatsApp        | Button        |                                 | {"depends_on": "eval:doc.__islocal != 1", "in_list_view": 0}                                                                      |
| mobile_customer      | Mobile Customer | Link          | Mobile Contact Customer         | {"reqd": 0}                                                                                                                       |
| company_name         | Company Name    | Data          |                                 | {"reqd": 0}                                                                                                                       |
| address              | Address         | Small Text    |                                 | {"reqd": 0}                                                                                                                       |
| customer             | Customer        | Link          | Customer                        | {"fetch_from": "mobile_customer.customer", "read_only": 1, "reqd": 0, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1} |
| title                | Title           | Data          |                                 | {"reqd": 0}                                                                                                                       |
| enquiry_details      | Enquiry Details | Text Editor   |                                 | {"reqd": 1}                                                                                                                       |
| group                | List in         | Link          | Enquiry Group                   | {"default": "", "reqd": 0, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                                            |
| due_date             | Due Date        | Date          |                                 | {"reqd": 0}                                                                                                                       |
| priority             | Priority        | Select        | Low<br>Normal<br>High<br>Urgent | {"default": "Normal", "reqd": 0, "in_list_view": 0, "in_standard_filter": 0, "in_filter": 1}                                      |
| section1_column2     |                 | Column Break  |                                 | —                                                                                                                                 |
| user_employee        | User            | Link          | Employee                        | {"read_only": 1, "reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                                           |
| date                 | Date            | Date          |                                 | {"read_only": 1, "default": "Today", "reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                       |
| assigned_to_employee | Assigned To     | Link          | Employee                        | {"read_only": 0, "reqd": 0, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                                           |
| status               | Status          | Link          | Enquiry Status                  | {"default": "New", "reqd": 0, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                                         |
| status_details       | Status Details  | Text Editor   |                                 | {"reqd": 0}                                                                                                                       |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[enquiry.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/enquiry/enquiry.py):

- `get_current_employee()` at line 62: See implementation for validation, persistence, or lifecycle behavior. Decorators: `frappe.whitelist()`.
- `before_validate(self)` at line 7: See implementation for validation, persistence, or lifecycle behavior.
- `validate(self)` at line 14: See implementation for validation, persistence, or lifecycle behavior.
- `validate_mobile_customer(self)` at line 18: Mobile Customer must be one of this Enquiry's Mobile, and Customer must be its Customer.

[enquiry.js](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/enquiry/enquiry.js):

Form callbacks and helper implementations:

```javascript
frappe.ui.form.on("Enquiry", {
  setup(frm) {
    // only the Customers linked to this Enquiry's Mobile; none until a Mobile is picked
    frm.set_query("mobile_customer", () => ({
      filters: { mobile_contact: frm.doc.mobile || "" }
    }));
  },

  onload(frm) {
    set_current_employee(frm);
  },

  refresh(frm) {
    set_current_employee(frm);
    init_btn_whatsapp(frm.fields_dict.btn_whatsapp);
  },

  mobile(frm) {
    // a Mobile Customer belongs to one Mobile, so a new Mobile needs a new pick
    if (frm.doc.mobile_customer) {
      frm.set_value("mobile_customer", null);
    }
  },

  mobile_customer(frm) {
    // Customer is fetched from Mobile Customer, and must be empty without one
    if (!frm.doc.mobile_customer && frm.doc.customer) {
      frm.set_value("customer", null);
    }
  },

  btn_whatsapp(frm, cdt, cdn) {
    whatsapp_open(frm);
  }
});

async function set_current_employee(frm) {
  if (!frm.is_new() || frm.doc.user_employee) {
    return;
  }
  //
  const current_employee = await frappe.xcall(
    "logicx_biz.logicx_hr.doctype.enquiry.enquiry.get_current_employee"
  );
  if (current_employee?.name) {
    frm.set_value("user_employee", current_employee.name);
    frappe.utils.add_link_title("Employee", current_employee.name, current_employee.employee_name);
    await frm.fields_dict.user_employee.set_link_title(current_employee.name);
  }
}

function init_btn_whatsapp(btn_whatsapp) {
  btn_whatsapp.df.label =
    '<i class="fa fa-whatsapp" style="color:green; margin-right:4px;"></i> WhatsApp';
  btn_whatsapp.refresh();
  //
  let div_btn_whatsapp = $(btn_whatsapp.wrapper);
  div_btn_whatsapp.css({
    "margin-left": "2px"
  });
}

function whatsapp_open(frm) {
  const mobile = frm.doc.mobile || "";
  window.open(`whatsapp://send?phone=91${mobile}&text=`, "_blank");
}
```

## Enquiry Closure Request

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/enquiry_closure_request/enquiry_closure_request.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/enquiry_closure_request/enquiry_closure_request.json`.

Declared table: `tabEnquiry Closure Request`.

Metadata: {"module": "LogicX HR", "autoname": "ENQCLOSE.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "enquiry", "sort_field": "creation", "sort_order": "DESC"}.

| Field        | Label        | Type       | Options / link target           | Rules                                                                                         |
| ------------ | ------------ | ---------- | ------------------------------- | --------------------------------------------------------------------------------------------- |
| enquiry      | Enquiry      | Link       | Enquiry                         | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                       |
| requested_by | Requested By | Link       | Employee                        | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                       |
| requested_at | Requested At | Datetime   |                                 | {"reqd": 1, "in_list_view": 1}                                                                |
| status       | Status       | Select     | Pending<br>Approved<br>Rejected | {"default": "Pending", "reqd": 0, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1} |
| request_note | Request Note | Small Text |                                 | {"reqd": 0}                                                                                   |
| reviewed_by  | Reviewed By  | Link       | Employee                        | {"reqd": 0, "in_standard_filter": 1, "in_filter": 1}                                          |
| reviewed_at  | Reviewed At  | Datetime   |                                 | {"reqd": 0}                                                                                   |
| review_note  | Review Note  | Small Text |                                 | {"reqd": 0}                                                                                   |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[enquiry_closure_request.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/enquiry_closure_request/enquiry_closure_request.py):

- No custom Python functions. The controller delegates to the base Document behavior.

## Enquiry Group

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/enquiry_group/enquiry_group.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/enquiry_group/enquiry_group.json`.

Declared table: `tabEnquiry Group`.

Metadata: {"module": "LogicX HR", "autoname": "field:group_name", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "sort_field": "idx", "sort_order": "DESC"}.

| Field      | Label      | Type | Options / link target | Rules                                       |
| ---------- | ---------- | ---- | --------------------- | ------------------------------------------- |
| group_name | Group Name | Data |                       | {"reqd": 1, "unique": 1, "in_list_view": 1} |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[enquiry_group.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/enquiry_group/enquiry_group.py):

- No custom Python functions. The controller delegates to the base Document behavior.

## Enquiry Message

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/enquiry_message/enquiry_message.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/enquiry_message/enquiry_message.json`.

Declared table: `tabEnquiry Message`.

Metadata: {"module": "LogicX HR", "istable": 1, "track_changes": 1, "track_views": 1}.

| Field          | Label          | Type        | Options / link target | Rules                                                        |
| -------------- | -------------- | ----------- | --------------------- | ------------------------------------------------------------ |
| comment        | Comment        | Text Editor |                       | {"in_list_view": 1, "columns": 10}                           |
| btn_whatsapp   | WhatsApp       | Button      |                       | {"depends_on": "eval:doc.__islocal != 1", "in_list_view": 0} |
| mode           | Mode           | Select      | Comment<br>Reply      | {"default": "Comment"}                                       |
| parent_message | Parent Message | Link        | Enquiry Message       | {"in_list_view": 0, "hidden": 1}                             |

### Declared permissions

| Role | Level | Owner only | Enabled actions                    |
| ---- | ----- | ---------- | ---------------------------------- |
| —    | —     | —          | No explicit role rows in this JSON |

### Functions and form behavior

[enquiry_message.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/enquiry_message/enquiry_message.py):

- No custom Python functions. The controller delegates to the base Document behavior.

## Enquiry Status

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/enquiry_status/enquiry_status.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/enquiry_status/enquiry_status.json`.

Declared table: `tabEnquiry Status`.

Metadata: {"module": "LogicX HR", "autoname": "field:status_name", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "sort_field": "idx", "sort_order": "DESC"}.

| Field        | Label        | Type   | Options / link target            | Rules                                                                   |
| ------------ | ------------ | ------ | -------------------------------- | ----------------------------------------------------------------------- |
| status_name  | Status Name  | Data   |                                  | {"reqd": 1, "unique": 1, "in_list_view": 1}                             |
| status_group | Status Group | Select | New<br>Pending<br>Hold<br>Closed | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1} |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[enquiry_status.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/enquiry_status/enquiry_status.py):

- `get_status_groups()` at line 9: The Status Group options, in the order the Select declares them.
- `get_status_bucket_map()` at line 19: {status name: report bucket}, the bucket being the scrubbed Status Group.

## Job Activity

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_activity/job_activity.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/job_activity/job_activity.json`.

Declared table: `tabJob Activity`.

Metadata: {"module": "LogicX HR", "autoname": "JOBACT.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "job_id", "sort_field": "creation", "sort_order": "DESC"}.

| Field             | Label             | Type         | Options / link target | Rules                                                                                                                                                                                                        |
| ----------------- | ----------------- | ------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| job_type          | Job Type          | Link         | Job Type              | {"link_filters": "[[\"Job Type\",\"name\",\"in\",[\"Enquiry\",\"SOP Item\",\"Task\",\"Customer\",\"Supplier\"]]]", "reqd": 1, "remember_last_selected_value": 1, "in_list_view": 1, "in_standard_filter": 1} |
| job_id            | Job ID            | Dynamic Link | job_type              | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1}                                                                                                                                                      |
| job_activity_type | Job Activity Type | Link         | Job Activity Type     | {"description": "The kind of record that posted this activity.", "read_only": 1, "no_copy": 1, "in_list_view": 1, "in_standard_filter": 1}                                                                   |
| job_activity_id   | Job Activity ID   | Dynamic Link | job_activity_type     | {"description": "The record that posted this activity.", "read_only": 1, "no_copy": 1, "in_standard_filter": 1}                                                                                              |
| activity_details  | Activity Details  | Text Editor  |                       | {"in_list_view": 1, "columns": 10}                                                                                                                                                                           |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[job_activity.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_activity/job_activity.py):

- `add_job_activity(job_type, job_id, activity_details, job_activity_type, job_activity_id)` at line 9: Add an auto-generated Job Activity record for a job (an Enquiry, a Task, ...).

## Job Activity Type

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_activity_type/job_activity_type.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/job_activity_type/job_activity_type.json`.

Declared table: `tabJob Activity Type`.

Metadata: {"module": "LogicX HR", "autoname": "field:document_type", "is_submittable": 0, "allow_rename": 0, "allow_import": 1, "track_changes": 1, "sort_field": "idx", "sort_order": "DESC"}.

| Field         | Label         | Type | Options / link target | Rules                                                                                                                                                        |
| ------------- | ------------- | ---- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| document_type | Document Type | Link | DocType               | {"description": "The DocType a Job Activity ID of this type points at. The Job Activity Type is named after it.", "reqd": 1, "unique": 1, "in_list_view": 1} |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, select, report, export, email, print                                             |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[job_activity_type.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_activity_type/job_activity_type.py):

- No custom Python functions. The controller delegates to the base Document behavior.

## Job Attachment

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_attachment/job_attachment.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/job_attachment/job_attachment.json`.

Declared table: `tabJob Attachment`.

Metadata: {"module": "LogicX HR", "autoname": "JOBATT.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "job_id", "sort_field": "creation", "sort_order": "DESC"}.

| Field              | Label    | Type          | Options / link target | Rules                                                                                                                                                                                                        |
| ------------------ | -------- | ------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| job_type           | Job Type | Link          | Job Type              | {"link_filters": "[[\"Job Type\",\"name\",\"in\",[\"Enquiry\",\"SOP Item\",\"Task\",\"Customer\",\"Supplier\"]]]", "reqd": 1, "remember_last_selected_value": 1, "in_list_view": 1, "in_standard_filter": 1} |
| job_id             | Job ID   | Dynamic Link  | job_type              | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1}                                                                                                                                                      |
| enquiry            | Enquiry  | Link          | Enquiry               | {"read_only": 1, "reqd": 0, "in_filter": 1}                                                                                                                                                                  |
| employee           | Employee | Link          | Employee              | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                                                                                                                                      |
| column_break_1     |          | Column Break  |                       | —                                                                                                                                                                                                            |
| date               | Date     | Date          |                       | {"default": "Today", "reqd": 1, "in_list_view": 1}                                                                                                                                                           |
| time               | Time     | Time          |                       | {"default": "Now", "reqd": 1, "in_list_view": 1}                                                                                                                                                             |
| section_attachment |          | Section Break |                       | —                                                                                                                                                                                                            |
| document           | Document | Attach        |                       | {"reqd": 1}                                                                                                                                                                                                  |
| is_photo           | Is Photo | Check         |                       | {"default": "0", "in_list_view": 1, "in_standard_filter": 1}                                                                                                                                                 |
| column_break_2     |          | Column Break  |                       | —                                                                                                                                                                                                            |
| preview            | Preview  | Image         | document              | {"depends_on": "eval:doc.is_photo && doc.document"}                                                                                                                                                          |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[job_attachment.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_attachment/job_attachment.py):

- `get_file_link(file_url)` at line 33: Full link to an attached file, so it also opens when the Job Activity is read outside the desk.
- `on_update(self)` at line 14: See implementation for validation, persistence, or lifecycle behavior.
- `post_job_activity(self)` at line 18: See implementation for validation, persistence, or lifecycle behavior.

[job_attachment.js](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_attachment/job_attachment.js):

Form callbacks and helper implementations:

```javascript
// Copyright (c) 2026, LogicX and contributors
// For license information, please see license.txt

frappe.ui.form.on("Job Attachment", {
  onload(frm) {
    set_current_employee(frm);
  },

  document(frm) {
    frm.refresh_field("preview");
    // The Attach control saves the form as soon as the upload finishes, so tick "Is Photo" before that save.
    // It can still be unticked afterwards, e.g. for a scanned document.
    return frm.set_value("is_photo", frappe.utils.is_image_file(frm.doc.document) ? 1 : 0);
  }
});

async function set_current_employee(frm) {
  if (!frm.is_new() || frm.doc.employee) {
    return;
  }
  //
  const current_employee = await frappe.xcall(
    "logicx_biz.logicx_hr.doctype.enquiry.enquiry.get_current_employee"
  );
  if (current_employee?.name) {
    frm.set_value("employee", current_employee.name);
    frappe.utils.add_link_title("Employee", current_employee.name, current_employee.employee_name);
    await frm.fields_dict.employee.set_link_title(current_employee.name);
  }
}
```

## Job Comments

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_comments/job_comments.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/job_comments/job_comments.json`.

Declared table: `tabJob Comments`.

Metadata: {"module": "LogicX HR", "autoname": "JOBCOM.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "job_id", "sort_field": "creation", "sort_order": "DESC"}.

| Field          | Label          | Type         | Options / link target | Rules                                                                                                                                                                                                        |
| -------------- | -------------- | ------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| job_type       | Job Type       | Link         | Job Type              | {"link_filters": "[[\"Job Type\",\"name\",\"in\",[\"Enquiry\",\"SOP Item\",\"Task\",\"Customer\",\"Supplier\"]]]", "reqd": 1, "remember_last_selected_value": 1, "in_list_view": 1, "in_standard_filter": 1} |
| job_id         | Job ID         | Dynamic Link | job_type              | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1}                                                                                                                                                      |
| enquiry        | Enquiry        | Link         | Enquiry               | {"read_only": 1, "reqd": 0, "in_filter": 1}                                                                                                                                                                  |
| comment        | Comment        | Text Editor  |                       | {"in_list_view": 1, "columns": 10}                                                                                                                                                                           |
| btn_whatsapp   | WhatsApp       | Button       |                       | {"depends_on": "eval:doc.__islocal != 1", "in_list_view": 0}                                                                                                                                                 |
| mode           | Mode           | Select       | Comment<br>Reply      | {"default": "Comment"}                                                                                                                                                                                       |
| parent_comment | Parent Comment | Link         | Job Comments          | {"in_list_view": 0, "hidden": 1}                                                                                                                                                                             |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[job_comments.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_comments/job_comments.py):

- `on_update(self)` at line 9: See implementation for validation, persistence, or lifecycle behavior.
- `post_job_activity(self)` at line 13: See implementation for validation, persistence, or lifecycle behavior.

[job_comments.js](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_comments/job_comments.js):

Form callbacks and helper implementations:

```javascript
// Copyright (c) 2026, LogicX and contributors
// For license information, please see license.txt

frappe.ui.form.on("Job Comments", {
  refresh(frm) {
    init_btn_whatsapp(frm.fields_dict.btn_whatsapp);
  },

  btn_whatsapp(frm) {
    whatsapp_send(frm);
  }
});

function init_btn_whatsapp(btn_whatsapp) {
  btn_whatsapp.df.label =
    '<i class="fa fa-whatsapp" style="color:green; margin-right:4px;"></i> WhatsApp';
  btn_whatsapp.refresh();
  //
  let div_btn_whatsapp = $(btn_whatsapp.wrapper);
  div_btn_whatsapp.css({
    "margin-left": "2px"
  });
}

async function whatsapp_send(frm) {
  // the mobile number is on the Enquiry, not on the comment; other Job Types open WhatsApp without one
  let mobile = "";
  if (frm.doc.job_type === "Enquiry" && frm.doc.job_id) {
    const { message } = await frappe.db.get_value("Enquiry", frm.doc.job_id, "mobile");
    mobile = message?.mobile || "";
  }
  const comment = frm.doc.comment || "";
  window.open(`whatsapp://send?phone=91${mobile}&text=${encodeURIComponent(comment)}`, "_blank");
}
```

## Job Estimate

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_estimate/job_estimate.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/job_estimate/job_estimate.json`.

Declared table: `tabJob Estimate`.

Metadata: {"module": "LogicX HR", "autoname": "ESTIMATE.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "item_name", "sort_field": "modified", "sort_order": "DESC"}.

| Field     | Label     | Type         | Options / link target | Rules                                                                                                                                                                                                        |
| --------- | --------- | ------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| job_type  | Job Type  | Link         | Job Type              | {"link_filters": "[[\"Job Type\",\"name\",\"in\",[\"Enquiry\",\"SOP Item\",\"Task\",\"Customer\",\"Supplier\"]]]", "reqd": 1, "remember_last_selected_value": 1, "in_list_view": 1, "in_standard_filter": 1} |
| job_id    | Job ID    | Dynamic Link | job_type              | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1}                                                                                                                                                      |
| enquiry   | Enquiry   | Link         | Enquiry               | {"read_only": 1, "reqd": 0, "in_filter": 1}                                                                                                                                                                  |
| date      | Date      | Date         |                       | {"default": "Today", "reqd": 1, "in_list_view": 1}                                                                                                                                                           |
| item_name | Item Name | Data         |                       | {"reqd": 1, "in_list_view": 1}                                                                                                                                                                               |
| supplier  | Vendor    | Link         | Supplier              | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                                                                                                                                      |
| price     | Price     | Currency     |                       | {"reqd": 1, "in_list_view": 1}                                                                                                                                                                               |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[job_estimate.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_estimate/job_estimate.py):

- `on_update(self)` at line 11: See implementation for validation, persistence, or lifecycle behavior.
- `post_job_activity(self)` at line 15: See implementation for validation, persistence, or lifecycle behavior.

## Job Execution

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_execution/job_execution.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/job_execution/job_execution.json`.

Declared table: `tabJob Execution`.

Metadata: {"module": "LogicX HR", "autoname": "JOBEXE.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "job_id", "sort_field": "modified", "sort_order": "DESC"}.

| Field                  | Label                  | Type         | Options / link target             | Rules                                                                                                                                                                                                        |
| ---------------------- | ---------------------- | ------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| job_type               | Job Type               | Link         | Job Type                          | {"link_filters": "[[\"Job Type\",\"name\",\"in\",[\"Enquiry\",\"SOP Item\",\"Task\",\"Customer\",\"Supplier\"]]]", "reqd": 1, "remember_last_selected_value": 1, "in_list_view": 1, "in_standard_filter": 1} |
| job_id                 | Job ID                 | Dynamic Link | job_type                          | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1}                                                                                                                                                      |
| enquiry                | Enquiry                | Link         | Enquiry                           | {"read_only": 1, "reqd": 0, "in_filter": 1}                                                                                                                                                                  |
| date                   | Date                   | Date         |                                   | {"default": "Today", "reqd": 1, "in_list_view": 1}                                                                                                                                                           |
| employee               | Employee               | Link         | Employee                          | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                                                                                                                                      |
| start_time             | Start Time             | Time         |                                   | {"reqd": 1, "in_list_view": 1}                                                                                                                                                                               |
| stop_time              | Stop Time              | Time         |                                   | {"reqd": 0, "in_list_view": 1}                                                                                                                                                                               |
| hours                  | Hours                  | Float        |                                   | {"precision": "2", "read_only": 1, "reqd": 0, "default": "0.0", "in_list_view": 1}                                                                                                                           |
| employee_cost_per_hour | Employee Cost Per Hour | Currency     |                                   | {"fetch_from": "employee.cost_per_hour", "fetch_if_empty": 1, "read_only": 1, "reqd": 0}                                                                                                                     |
| total_cost             | Total Cost             | Float        |                                   | {"precision": "2", "read_only": 1, "reqd": 0}                                                                                                                                                                |
| status                 | Status                 | Select       | Running<br>Completed<br>Cancelled | {"default": "Running", "reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                                                                                                                |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[job_execution.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_execution/job_execution.py):

- `validate(self)` at line 17: See implementation for validation, persistence, or lifecycle behavior.
- `calculate_hours(self)` at line 21: See implementation for validation, persistence, or lifecycle behavior.
- `calculate_total_cost(self)` at line 32: See implementation for validation, persistence, or lifecycle behavior.
- `on_update(self)` at line 35: See implementation for validation, persistence, or lifecycle behavior.
- `post_job_activity(self)` at line 39: See implementation for validation, persistence, or lifecycle behavior.

[job_execution.js](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_execution/job_execution.js):

Form callbacks and helper implementations:

```javascript
// Copyright (c) 2026, LogicX and contributors
// For license information, please see license.txt

frappe.ui.form.on("Job Execution", {
  start_time: function (frm) {
    calc_hours(frm);
  },

  stop_time: function (frm) {
    calc_hours(frm);
  },

  hours: function (frm) {
    calc_total_cost(frm);
  },

  employee_cost_per_hour: function (frm) {
    calc_total_cost(frm);
  }
});

function calc_hours(frm) {
  if (frm.doc.start_time && frm.doc.stop_time) {
    let start = moment(frm.doc.start_time, "HH:mm:ss");
    let stop = moment(frm.doc.stop_time, "HH:mm:ss");
    if (stop.isBefore(start)) {
      stop.add(1, "days");
    }
    let hours = moment.duration(stop.diff(start)).asHours();
    frm.set_value("hours", flt(hours, 2));
  }
}

function calc_total_cost(frm) {
  let hours = frm.doc.hours || 0;
  let cost_per_hour = frm.doc.employee_cost_per_hour || 0;
  frm.set_value("total_cost", flt(hours * cost_per_hour, 2));
}
```

## Job Location

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_location/job_location.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/job_location/job_location.json`.

Declared table: `tabJob Location`.

Metadata: {"module": "LogicX HR", "autoname": "JOBLOC.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "job_id", "sort_field": "creation", "sort_order": "DESC"}.

| Field            | Label                | Type          | Options / link target | Rules                                                                                                                                                                                                        |
| ---------------- | -------------------- | ------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| job_type         | Job Type             | Link          | Job Type              | {"link_filters": "[[\"Job Type\",\"name\",\"in\",[\"Enquiry\",\"SOP Item\",\"Task\",\"Customer\",\"Supplier\"]]]", "reqd": 1, "remember_last_selected_value": 1, "in_list_view": 1, "in_standard_filter": 1} |
| job_id           | Job ID               | Dynamic Link  | job_type              | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1}                                                                                                                                                      |
| enquiry          | Enquiry              | Link          | Enquiry               | {"read_only": 1, "reqd": 0, "in_filter": 1}                                                                                                                                                                  |
| employee         | Employee             | Link          | Employee              | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                                                                                                                                      |
| column_break_1   |                      | Column Break  |                       | —                                                                                                                                                                                                            |
| date             | Date                 | Date          |                       | {"default": "Today", "reqd": 1, "in_list_view": 1}                                                                                                                                                           |
| time             | Time                 | Time          |                       | {"default": "Now", "reqd": 1, "in_list_view": 1}                                                                                                                                                             |
| section_location | Location             | Section Break |                       | —                                                                                                                                                                                                            |
| latitude         | Latitude             | Float         |                       | {"precision": "7", "reqd": 1}                                                                                                                                                                                |
| longitude        | Longitude            | Float         |                       | {"precision": "7", "reqd": 1}                                                                                                                                                                                |
| btn_get_location | Get Current Location | Button        |                       | —                                                                                                                                                                                                            |
| column_break_2   |                      | Column Break  |                       | —                                                                                                                                                                                                            |
| geolocation_url  | Geolocation URL      | Data          | URL                   | {"read_only": 1}                                                                                                                                                                                             |
| section_map      |                      | Section Break |                       | —                                                                                                                                                                                                            |
| geolocation_map  |                      | Geolocation   |                       | {"read_only": 1}                                                                                                                                                                                             |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[job_location.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_location/job_location.py):

- `validate(self)` at line 17: See implementation for validation, persistence, or lifecycle behavior.
- `set_location_fields(self)` at line 21: Check the coordinates and rebuild the Geolocation URL and Map from them. Decorators: `frappe.whitelist()`.
- `validate_coordinates(self)` at line 45: See implementation for validation, persistence, or lifecycle behavior.
- `format_coordinate(self, fieldname)` at line 57: See implementation for validation, persistence, or lifecycle behavior.
- `on_update(self)` at line 61: See implementation for validation, persistence, or lifecycle behavior.
- `post_job_activity(self)` at line 65: See implementation for validation, persistence, or lifecycle behavior.

[job_location.js](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_location/job_location.js):

Form callbacks and helper implementations:

```javascript
// Copyright (c) 2026, LogicX and contributors
// For license information, please see license.txt

frappe.ui.form.on("Job Location", {
  onload(frm) {
    set_current_employee(frm);
  },

  btn_get_location(frm) {
    get_current_location(frm);
  }
});

async function set_current_employee(frm) {
  if (!frm.is_new() || frm.doc.employee) {
    return;
  }
  //
  const current_employee = await frappe.xcall(
    "logicx_biz.logicx_hr.doctype.enquiry.enquiry.get_current_employee"
  );
  if (current_employee?.name) {
    frm.set_value("employee", current_employee.name);
    frappe.utils.add_link_title("Employee", current_employee.name, current_employee.employee_name);
    await frm.fields_dict.employee.set_link_title(current_employee.name);
  }
}

// Fill Latitude / Longitude from the device's GPS, then let the server rebuild the URL and map pin.
// Browsers only share the location on HTTPS (or localhost).
function get_current_location(frm) {
  if (!navigator.geolocation) {
    frappe.msgprint(__("This browser cannot share its location."));
    return;
  }

  frappe.dom.freeze(__("Getting current location..."));
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        await frm.set_value({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        await frm.call("set_location_fields");
      } finally {
        frappe.dom.unfreeze();
      }
    },
    (error) => {
      frappe.dom.unfreeze();
      frappe.msgprint(__("Could not get the current location: {0}", [error.message]));
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );
}
```

## Job Type

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_type/job_type.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/job_type/job_type.json`.

Declared table: `tabJob Type`.

Metadata: {"module": "LogicX HR", "autoname": "field:document_type", "is_submittable": 0, "allow_rename": 0, "allow_import": 1, "track_changes": 1, "sort_field": "idx", "sort_order": "DESC"}.

| Field         | Label         | Type | Options / link target | Rules                                                                                                                                      |
| ------------- | ------------- | ---- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| document_type | Document Type | Link | DocType               | {"description": "The DocType a Job ID of this type points at. The Job Type is named after it.", "reqd": 1, "unique": 1, "in_list_view": 1} |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, select, report, export, email, print                                             |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[job_type.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/job_type/job_type.py):

- No custom Python functions. The controller delegates to the base Document behavior.

## Mobile Contact

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/mobile_contact/mobile_contact.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/mobile_contact/mobile_contact.json`.

Declared table: `tabMobile Contact`.

Metadata: {"module": "LogicX HR", "autoname": "field:mobile_number", "is_submittable": 0, "allow_rename": 0, "allow_import": 1, "track_changes": 1, "sort_field": "modified", "sort_order": "ASC"}.

| Field         | Label         | Type | Options / link target | Rules                                       |
| ------------- | ------------- | ---- | --------------------- | ------------------------------------------- |
| mobile_number | Mobile Number | Data |                       | {"reqd": 1, "unique": 1, "in_list_view": 1} |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[mobile_contact.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/mobile_contact/mobile_contact.py):

- `validate(self)` at line 7: See implementation for validation, persistence, or lifecycle behavior.
- `before_rename(self, old, new, merge=False)` at line 12: See implementation for validation, persistence, or lifecycle behavior.

[mobile_contact.js](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/mobile_contact/mobile_contact.js):

Form callbacks and helper implementations:

```javascript
frappe.ui.form.on("Mobile Contact", {
  refresh(frm) {
    if (!frm.is_new()) {
      frm.add_custom_button(__("Customers"), () => {
        frappe.set_route("List", "Mobile Contact Customer", { mobile_contact: frm.doc.name });
      });
    }
  },

  mobile_number(frm) {
    if (frm.doc.mobile_number) {
      frm.set_value("mobile_number", frm.doc.mobile_number.trim());
    }
  }
});
```

## Mobile Contact Customer

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/mobile_contact_customer/mobile_contact_customer.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/mobile_contact_customer/mobile_contact_customer.json`.

Declared table: `tabMobile Contact Customer`.

Metadata: {"module": "LogicX HR", "autoname": "format:{mobile_contact} - {customer}", "is_submittable": 0, "allow_rename": 0, "allow_import": 1, "track_changes": 1, "title_field": "customer_name", "search_fields": "mobile_contact,customer,customer_name", "sort_field": "modified", "sort_order": "DESC"}.

| Field          | Label          | Type | Options / link target | Rules                                                                       |
| -------------- | -------------- | ---- | --------------------- | --------------------------------------------------------------------------- |
| mobile_contact | Mobile Contact | Link | Mobile Contact        | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1}                     |
| customer       | Customer       | Link | Customer              | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1}                     |
| customer_name  | Customer Name  | Data |                       | {"fetch_from": "customer.customer_name", "read_only": 1, "in_list_view": 1} |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[mobile_contact_customer.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/mobile_contact_customer/mobile_contact_customer.py):

- `update_customer_name(doc, method=None, *args)` at line 29: doc_events hook on Customer: carry its current customer_name onto its Mobile Contact Customer rows.
- `on_doctype_update()` at line 43: See implementation for validation, persistence, or lifecycle behavior.
- `validate(self)` at line 8: See implementation for validation, persistence, or lifecycle behavior.
- `validate_duplicate(self)` at line 11: A Mobile Contact is linked to a Customer only once.

## Notice

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/notice/notice.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/notice/notice.json`.

Declared table: `tabNotice`.

Metadata: {"module": "LogicX HR", "autoname": "NOTICE.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "employee", "sort_field": "modified", "sort_order": "DESC"}.

| Field    | Label    | Type        | Options / link target | Rules                                                                                                                         |
| -------- | -------- | ----------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| date     | Date     | Date        |                       | {"reqd": 1, "in_list_view": 1}                                                                                                |
| employee | Employee | Link        | Employee              | {"description": "Leave empty to notify ALL employees", "reqd": 0, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1} |
| priority | Priority | Select      | High<br>Medium<br>Low | {"reqd": 1, "in_list_view": 1}                                                                                                |
| message  | Message  | Text Editor |                       | {"reqd": 1, "in_list_view": 1}                                                                                                |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[notice.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/notice/notice.py):

- No custom Python functions. The controller delegates to the base Document behavior.

## Renewal Entry

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/renewal_entry/renewal_entry.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/renewal_entry/renewal_entry.json`.

Declared table: `tabRenewal Entry`.

Metadata: {"module": "LogicX HR", "autoname": "RENEWAL.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "service_description", "sort_field": "modified", "sort_order": "DESC"}.

| Field               | Label               | Type          | Options / link target | Rules                                                                               |
| ------------------- | ------------------- | ------------- | --------------------- | ----------------------------------------------------------------------------------- |
| section1            |                     | Section Break |                       | —                                                                                   |
| renewal_remainder   | Service ID          | Link          | Renewal Remainder     | {"reqd": 1, "in_list_view": 1}                                                      |
| date                | Date                | Date          |                       | {"default": "Today", "reqd": 1, "in_list_view": 1}                                  |
| quantity            | Quantity            | Int           |                       | {"default": "1", "reqd": 1}                                                         |
| rate                | Rate                | Int           |                       | {"reqd": 1}                                                                         |
| renewal_value       | Renewal Value       | Int           |                       | {"read_only": 1, "fetch_if_empty": 1, "default": "0", "reqd": 1, "in_list_view": 1} |
| next_due_date       | Next Due Date       | Date          |                       | {"reqd": 1, "in_list_view": 1}                                                      |
| section1_column2    |                     | Column Break  |                       | —                                                                                   |
| customer            | Customer            | Read Only     |                       | {"fetch_from": "renewal_remainder.customer", "in_list_view": 1}                     |
| service_description | Service Description | Read Only     |                       | {"fetch_from": "renewal_remainder.service_description", "in_list_view": 1}          |
| vendor              | Vendor              | Read Only     |                       | {"fetch_from": "renewal_remainder.vendor", "in_list_view": 1}                       |
| period_type         | Period Type         | Read Only     |                       | {"fetch_from": "renewal_remainder.period_type", "in_list_view": 1}                  |
| period              | Period              | Read Only     |                       | {"fetch_from": "renewal_remainder.period", "in_list_view": 1}                       |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[renewal_entry.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/renewal_entry/renewal_entry.py):

- No custom Python functions. The controller delegates to the base Document behavior.

[renewal_entry.js](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/renewal_entry/renewal_entry.js):

Form callbacks and helper implementations:

```javascript
// Copyright (c) 2026, LogicX and contributors
// For license information, please see license.txt

frappe.ui.form.on("Renewal Entry", {
  quantity: function (frm) {
    calc_renewal_value(frm);
  },

  rate: function (frm) {
    calc_renewal_value(frm);
  }
});

function calc_renewal_value(frm) {
  let qty = frm.doc.quantity || 0;
  let rate = frm.doc.rate || 0;
  frm.set_value("renewal_value", qty * rate);
}
```

## Renewal Remainder

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/renewal_remainder/renewal_remainder.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/renewal_remainder/renewal_remainder.json`.

Declared table: `tabRenewal Remainder`.

Metadata: {"module": "LogicX HR", "autoname": "RENEW-.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "service_description", "sort_field": "modified", "sort_order": "DESC"}.

| Field               | Label               | Type   | Options / link target   | Rules                                                                               |
| ------------------- | ------------------- | ------ | ----------------------- | ----------------------------------------------------------------------------------- |
| customer            | Customer            | Link   | Customer                | {"reqd": 1, "in_list_view": 1}                                                      |
| service_description | Service Description | Data   |                         | {"reqd": 1}                                                                         |
| vendor              | Vendor              | Link   | Supplier                | {"reqd": 1}                                                                         |
| due_date            | Due Date            | Date   |                         | {"reqd": 1}                                                                         |
| period_type         | Period Type         | Select | Years<br>Months<br>Days | {"default": "Years", "reqd": 1}                                                     |
| period              | Period              | Int    |                         | {"reqd": 1}                                                                         |
| quantity            | Quantity            | Int    |                         | {"default": "1", "reqd": 1}                                                         |
| rate                | Rate                | Int    |                         | {"reqd": 1}                                                                         |
| renewal_value       | Renewal Value       | Int    |                         | {"read_only": 1, "fetch_if_empty": 1, "default": "0", "reqd": 1, "in_list_view": 1} |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[renewal_remainder.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/renewal_remainder/renewal_remainder.py):

- No custom Python functions. The controller delegates to the base Document behavior.

[renewal_remainder.js](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/renewal_remainder/renewal_remainder.js):

Form callbacks and helper implementations:

```javascript
// Copyright (c) 2026, LogicX and contributors
// For license information, please see license.txt

frappe.ui.form.on("Renewal Remainder", {
  refresh: function (frm) {
    add_button_new_renewal_entry();

    function add_button_new_renewal_entry() {
      if (!frm.is_new()) {
        frm.add_custom_button("Renewal Entry", () => {
          frappe.new_doc("Renewal Entry", {
            renewal_remainder: frm.doc.name,
            quantity: frm.doc.quantity,
            rate: frm.doc.rate,
            renewal_value: frm.doc.renewal_value
          });
        });
      }
    }
  },

  quantity: function (frm) {
    calc_renewal_value(frm);
  },

  rate: function (frm) {
    calc_renewal_value(frm);
  }
});

function calc_renewal_value(frm) {
  let qty = frm.doc.quantity || 0;
  let rate = frm.doc.rate || 0;
  frm.set_value("renewal_value", qty * rate);
}
```

## Scheme

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/scheme/scheme.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/scheme/scheme.json`.

Declared table: `tabScheme`.

Metadata: {"module": "LogicX HR", "autoname": "SCHEME.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "scheme_description", "sort_field": "modified", "sort_order": "DESC"}.

| Field              | Label              | Type   | Options / link target | Rules                           |
| ------------------ | ------------------ | ------ | --------------------- | ------------------------------- |
| date               | Date               | Date   |                       | {"default": "Today", "reqd": 1} |
| invoice_number     | Invoice Number     | Link   | Sales Invoice         | {"reqd": 1, "in_list_view": 1}  |
| priority           | Priority           | Select | High<br>Medium<br>Low | {"reqd": 1, "in_list_view": 1}  |
| support_value      | Support Value      | Int    |                       | {"reqd": 1}                     |
| brand              | Brand              | Link   | Brand                 | {"reqd": 1}                     |
| scheme_description | Scheme Description | Data   |                       | {"reqd": 1}                     |
| requested_by_user  | Requested by User  | Link   | Employee              | {"reqd": 1}                     |
| approved_by_user   | Approved by User   | Link   | Employee              | {"reqd": 0}                     |
| claim_done         | Claim Done         | Check  |                       | {"default": "0", "reqd": 0}     |
| amount_realized    | Amount Realized    | Int    |                       | {"reqd": 0}                     |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[scheme.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/scheme/scheme.py):

- No custom Python functions. The controller delegates to the base Document behavior.

## SOP Assigned

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/sop_assigned/sop_assigned.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/sop_assigned/sop_assigned.json`.

Declared table: `tabSOP Assigned`.

Metadata: {"module": "LogicX HR", "autoname": "ASSIGN.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "sop_name", "sort_field": "modified", "sort_order": "DESC"}.

| Field            | Label      | Type          | Options / link target | Rules                                                                   |
| ---------------- | ---------- | ------------- | --------------------- | ----------------------------------------------------------------------- |
| section1         |            | Section Break |                       | —                                                                       |
| sop_item         | SOP Item   | Link          | SOP Item              | {"reqd": 1, "in_list_view": 1}                                          |
| user             | User       | Link          | Employee              | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1} |
| index            | Index      | Int           |                       | {"reqd": 1}                                                             |
| section1_column2 |            | Column Break  |                       | —                                                                       |
| sop_name         | SOP Name   | Read Only     |                       | {"fetch_from": "sop_item.sop_name", "in_list_view": 1}                  |
| department       | Department | Read Only     |                       | {"fetch_from": "sop_item.department", "in_list_view": 1}                |
| frequency        | Frequency  | Read Only     |                       | {"fetch_from": "sop_item.frequency", "in_list_view": 1}                 |
| section2         |            | Section Break |                       | —                                                                       |
| steps            | Steps      | Text Editor   |                       | {"read_only": 1, "fetch_from": "sop_item.steps"}                        |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, select, report, export, email, print, share                                      |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[sop_assigned.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/sop_assigned/sop_assigned.py):

- `validate(self)` at line 9: See implementation for validation, persistence, or lifecycle behavior.

[sop_assigned.js](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/sop_assigned/sop_assigned.js):

Form callbacks and helper implementations:

```javascript
// Copyright (c) 2026, LogicX and contributors
// For license information, please see license.txt

frappe.ui.form.on("SOP Assigned", {
  refresh: function (frm) {
    add_button_new_sop_reporting();

    function add_button_new_sop_reporting() {
      if (!frm.is_new()) {
        frm.add_custom_button("SOP Reporting", () => {
          frappe.new_doc("SOP Reporting", {
            sop_item: frm.doc.sop_item,
            user: frm.doc.user
          });
        });
      }
    }
  }
});
```

## SOP Item

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/sop_item/sop_item.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/sop_item/sop_item.json`.

Declared table: `tabSOP Item`.

Metadata: {"module": "LogicX HR", "autoname": "SOP-.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "sop_name", "sort_field": "modified", "sort_order": "DESC"}.

| Field      | Label      | Type        | Options / link target                | Rules                          |
| ---------- | ---------- | ----------- | ------------------------------------ | ------------------------------ |
| sop_name   | SOP Name   | Data        |                                      | {"reqd": 1, "in_list_view": 1} |
| department | Department | Link        | Department                           | {"reqd": 1, "in_list_view": 1} |
| frequency  | Frequency  | Select      | Daily<br>Weekly<br>Monthly<br>Yearly | {"reqd": 1, "in_list_view": 1} |
| steps      | Steps      | Text Editor |                                      | {"reqd": 1}                    |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, select, report, export, email, print, share                                      |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[sop_item.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/sop_item/sop_item.py):

- No custom Python functions. The controller delegates to the base Document behavior.

[sop_item.js](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/sop_item/sop_item.js):

Form callbacks and helper implementations:

```javascript
// Copyright (c) 2026, LogicX and contributors
// For license information, please see license.txt

frappe.ui.form.on("SOP Item", {
  refresh(frm) {
    if (!frm.is_new()) {
      frm.add_custom_button("SOP Reporting", () => {
        let current_user = frappe.session.user;
        frappe.db.get_value("Employee", { user_id: current_user }, "name", (employee_doc) => {
          if (employee_doc && employee_doc.name) {
            let current_employee = employee_doc.name;
            frappe.new_doc("SOP Reporting", {
              sop_item: frm.doc.name,
              user: current_employee
            });
          }
        });
      });
    }
  }
});
```

## SOP Reporting

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/sop_reporting/sop_reporting.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/sop_reporting/sop_reporting.json`.

Declared table: `tabSOP Reporting`.

Metadata: {"module": "LogicX HR", "autoname": "REPORTING.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "sop_name", "sort_field": "modified", "sort_order": "DESC"}.

| Field            | Label      | Type          | Options / link target | Rules                                                                                       |
| ---------------- | ---------- | ------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| section1         |            | Section Break |                       | —                                                                                           |
| sop_item         | SOP Item   | Link          | SOP Item              | {"reqd": 1, "in_list_view": 1}                                                              |
| user             | User       | Link          | Employee              | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                     |
| date             | Date       | Date          |                       | {"default": "Today", "reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1} |
| section1_column2 |            | Column Break  |                       | —                                                                                           |
| sop_name         | SOP Name   | Read Only     |                       | {"fetch_from": "sop_item.sop_name", "in_list_view": 1}                                      |
| department       | Department | Read Only     |                       | {"fetch_from": "sop_item.department", "in_list_view": 1}                                    |
| frequency        | Frequency  | Read Only     |                       | {"fetch_from": "sop_item.frequency", "in_list_view": 1}                                     |
| section2         |            | Section Break |                       | —                                                                                           |
| actions          | Actions    | Text Editor   |                       | {"reqd": 1}                                                                                 |
| steps            | Steps      | Text Editor   |                       | {"read_only": 1, "fetch_from": "sop_item.steps"}                                            |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[sop_reporting.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/sop_reporting/sop_reporting.py):

- No custom Python functions. The controller delegates to the base Document behavior.

## Staff Request

[Schema](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/staff_request/staff_request.json) · local `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype/staff_request/staff_request.json`.

Declared table: `tabStaff Request`.

Metadata: {"module": "LogicX HR", "autoname": "REQUEST.#", "is_submittable": 0, "allow_rename": 1, "allow_import": 1, "track_changes": 1, "track_views": 1, "title_field": "employee", "sort_field": "modified", "sort_order": "DESC"}.

| Field        | Label        | Type       | Options / link target      | Rules                                                                                                                         |
| ------------ | ------------ | ---------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| employee     | Employee     | Link       | Employee                   | {"reqd": 1, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                                                       |
| request_type | Request Type | Select     | Leave<br>Late In<br>Absent | {"reqd": 1, "in_list_view": 1}                                                                                                |
| date         | Date         | Date       |                            | {"reqd": 1, "in_list_view": 1}                                                                                                |
| days         | Days         | Int        |                            | {"reqd": 0, "mandatory_depends_on": "eval:doc.request_type == 'Leave'", "depends_on": "eval:doc.request_type == 'Leave'"}     |
| minutes      | Minutes      | Int        |                            | {"reqd": 0, "mandatory_depends_on": "eval:doc.request_type == 'Late In'", "depends_on": "eval:doc.request_type == 'Late In'"} |
| details      | Details      | Small Text |                            | {"reqd": 1}                                                                                                                   |
| approved     | Approved     | Check      |                            | {"default": "0", "reqd": 0, "in_list_view": 1, "in_standard_filter": 1, "in_filter": 1}                                       |

### Declared permissions

| Role     | Level | Owner only | Enabled actions                                                                        |
| -------- | ----- | ---------- | -------------------------------------------------------------------------------------- |
| TM User  | 0     | 0          | read, create, write, select, report, export, email, print, share                       |
| TM Admin | 0     | 0          | read, create, write, delete, select, report, export, email, print, share, import, mask |
| TM Admin | 1     | 0          | read, write, mask                                                                      |

### Functions and form behavior

[staff_request.py](https://github.com/CODEXSUN/logicx-biz/blob/02826403ed87903f3eb7f4c57855eb2c829a8803/logicx_biz/logicx_hr/doctype/staff_request/staff_request.py):

- No custom Python functions. The controller delegates to the base Document behavior.

## Python behavior evidence

These source excerpts preserve the implemented controller behavior. Imports are included to identify external dependencies.
They are reference code, not instructions to copy permission bypasses into CODEXSUN.

### API One controller

```python
"""API One: define a REST endpoint by saving a record.

Each row is a facade over one Frappe *Server Script* of type "API". Saving the
row creates or re-syncs that Server Script (same path, script, enabled flag,
never guest-callable), so Frappe itself serves the endpoint at
``/api/method/<api_path>`` and ``/api/v2/method/<api_path>`` and runs the
script in its restricted sandbox as the authenticated caller.

HTTP-method enforcement and API One Log writing live in
``logicx_biz.logicx_hr.api_one_hooks`` (before_request / after_request).
"""

import re

import frappe
from frappe import _
from frappe.model.document import Document

from logicx_biz.logicx_hr.api_one_hooks import API_ONE_PATHS_CACHE_KEY

API_PATH_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_.\-]*$")
SERVER_SCRIPT_NAME_PREFIX = "API One "


class APIOne(Document):
	def validate(self):
		self.api_path = (self.api_path or "").strip()
		self.validate_api_path()
		self.validate_server_scripts_enabled()
		self.validate_path_is_free()

	def on_update(self):
		self.sync_server_script()
		clear_paths_cache()

	def on_trash(self):
		if self.server_script and frappe.db.exists("Server Script", self.server_script):
			# force: the Server Script is still linked from this (not yet deleted) row
			frappe.delete_doc(
				"Server Script", self.server_script, ignore_permissions=True, force=True
			)
		clear_paths_cache()

	# ---- validation ---------------------------------------------------------------------------

	def validate_api_path(self):
		if not API_PATH_PATTERN.fullmatch(self.api_path) or ".." in self.api_path:
			frappe.throw(
				_(
					"API Path '{0}' is invalid. Use letters, digits, underscore, dot or hyphen, "
					"start with a letter, and do not use slashes."
				).format(self.api_path),
				title=_("Invalid API Path"),
			)

	def validate_server_scripts_enabled(self):
		from frappe.utils.safe_exec import is_safe_exec_enabled

		if not is_safe_exec_enabled():
			frappe.throw(
				_(
					"Server scripts are disabled on this site, so API One endpoints cannot run. "
					"Enable them with: <code>bench --site {0} set-config server_script_enabled true</code>"
				).format(frappe.local.site),
				title=_("Server Scripts Disabled"),
			)

	def validate_path_is_free(self):
		"""Error if the path already exists anywhere it could be resolved from."""
		other_api_one = frappe.db.get_value(
			"API One", {"api_path": self.api_path, "name": ("!=", self.name)}, "name"
		)
		if other_api_one:
			frappe.throw(
				_("API Path '{0}' already exists: {1}").format(
					self.api_path, frappe.get_desk_link("API One", other_api_one)
				),
				title=_("Duplicate API Path"),
				exc=frappe.DuplicateEntryError,
			)

		other_server_script = frappe.db.get_value(
			"Server Script",
			{"script_type": "API", "api_method": self.api_path, "name": ("!=", self.server_script or "")},
			"name",
		)
		if other_server_script:
			frappe.throw(
				_("API Path '{0}' is already served by Server Script {1}").format(
					self.api_path, frappe.get_desk_link("Server Script", other_server_script)
				),
				title=_("Duplicate API Path"),
				exc=frappe.DuplicateEntryError,
			)

		if resolves_to_python_method(self.api_path):
			frappe.throw(
				_("API Path '{0}' clashes with an existing method and would shadow it").format(
					self.api_path
				),
				title=_("Duplicate API Path"),
				exc=frappe.DuplicateEntryError,
			)

	# ---- server script sync -------------------------------------------------------------------

	def sync_server_script(self):
		"""Create or update the Server Script that actually serves this endpoint."""
		script_name = self.server_script or f"{SERVER_SCRIPT_NAME_PREFIX}{self.name}"
		if frappe.db.exists("Server Script", script_name):
			server_script = frappe.get_doc("Server Script", script_name)
		else:
			# Server Script is named by prompt, so a preset name is honoured on insert
			server_script = frappe.new_doc("Server Script")
			server_script.name = script_name

		server_script.script_type = "API"
		server_script.api_method = self.api_path
		server_script.allow_guest = 0
		server_script.disabled = 0 if self.enabled else 1
		server_script.script = self.script
		# Server Script.validate compiles the script, so syntax errors surface on this save
		server_script.save(ignore_permissions=True)

		if server_script.name != self.server_script:
			self.db_set("server_script", server_script.name, update_modified=False)


def resolves_to_python_method(dotted_path):
	"""True if ``frappe.get_attr`` can import the path, i.e. a real method exists there."""
	if "." not in dotted_path:
		return False
	try:
		frappe.get_attr(dotted_path)
	except (ImportError, AttributeError, ValueError):
		return False
	return True


def clear_paths_cache():
	frappe.cache.delete_value(API_ONE_PATHS_CACHE_KEY)
```

### Enquiry controller

```python
import frappe
from frappe import _
from frappe.model.document import Document


class Enquiry(Document):
	def before_validate(self):
		if self.user_employee:
			return
		#
		employee_doc = get_current_employee()
		self.user_employee = employee_doc.name if employee_doc else None

	def validate(self):
		# Mobile is a Link to Mobile Contact, whose own validate holds it to 10 digits
		self.validate_mobile_customer()

	def validate_mobile_customer(self):
		"""Mobile Customer must be one of this Enquiry's Mobile, and Customer must be its Customer.

		Customer is fetched from Mobile Customer, so the form keeps the two in step. These checks
		hold the same line for imports and the API, which can send the fields in any combination.
		"""
		if not self.mobile_customer:
			# the fetch fills Customer from Mobile Customer, but never clears it
			if self.customer:
				frappe.throw(
					_("Customer must be empty when Mobile Customer is not set: {0}").format(
						frappe.bold(self.customer)
					),
					title=_("Invalid Customer"),
				)
			return
		#
		mobile_customer = frappe.db.get_value(
			"Mobile Contact Customer", self.mobile_customer, ["mobile_contact", "customer"], as_dict=True
		)
		if not mobile_customer:
			frappe.throw(_("Mobile Customer {0} not found.").format(frappe.bold(self.mobile_customer)))
		if mobile_customer.mobile_contact != self.mobile:
			frappe.throw(
				_("Mobile Customer {0} is for Mobile {1}, not {2}.").format(
					frappe.bold(self.mobile_customer),
					frappe.bold(mobile_customer.mobile_contact),
					frappe.bold(self.mobile),
				),
				title=_("Invalid Mobile Customer"),
			)
		if mobile_customer.customer != self.customer:
			frappe.throw(
				_("Customer must be {0}, the Customer of Mobile Customer {1}, not {2}.").format(
					frappe.bold(mobile_customer.customer),
					frappe.bold(self.mobile_customer),
					frappe.bold(self.customer or _("empty")),
				),
				title=_("Invalid Customer"),
			)



@frappe.whitelist()
def get_current_employee():
	employee_doc = None
	if frappe.session.user:
		employee_name = frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name")
		employee_doc = frappe.get_doc("Employee", employee_name) if employee_name else None
	return employee_doc
```

### Enquiry Status controller

```python
import frappe
from frappe.model.document import Document


class EnquiryStatus(Document):
	pass


def get_status_groups():
	"""The Status Group options, in the order the Select declares them.

	Reports use this as their column order, so adding a group to the Select is
	enough to make it show up as a column.
	"""
	options = frappe.get_meta("Enquiry Status").get_field("status_group").options or ""
	return [option for option in options.split("\n") if option]


def get_status_bucket_map():
	"""{status name: report bucket}, the bucket being the scrubbed Status Group.

	Statuses whose group is not one of the current Select options are left out,
	so callers fall back to their own "other" bucket -- as does any value stored
	on an Enquiry that no longer has an Enquiry Status master.
	"""
	valid_groups = set(get_status_groups())
	return {
		status.name: frappe.scrub(status.status_group)
		for status in frappe.get_all("Enquiry Status", fields=["name", "status_group"])
		if status.status_group in valid_groups
	}
```

### Job Activity controller

```python
import frappe
from frappe.model.document import Document


class JobActivity(Document):
	pass


def add_job_activity(job_type, job_id, activity_details, job_activity_type, job_activity_id):
	"""Add an auto-generated Job Activity record for a job (an Enquiry, a Task, ...).

	Used by related doctypes (Job Execution, Job Location, Job Attachment, Job Estimate, Job Comments)
	to log activity against the job they belong to. `job_activity_type` / `job_activity_id` name the
	record that posted it, e.g. "Job Execution" / "JOBEXE7".
	"""
	if not job_type or not job_id or not activity_details:
		return
	frappe.get_doc(
		{
			"doctype": "Job Activity",
			"job_type": job_type,
			"job_id": job_id,
			"job_activity_type": job_activity_type,
			"job_activity_id": job_activity_id,
			"activity_details": activity_details,
		}
	).insert(ignore_permissions=True)
```

### Job Attachment controller

```python
from urllib.parse import quote

import frappe
from frappe.model.document import Document
from frappe.utils import format_time, formatdate, get_url

from logicx_biz.logicx_hr.doctype.job_activity.job_activity import add_job_activity

MESSAGE_TEMPLATE = "{kind} attached by {employee} at {date} {time}: {url}"
TRIGGER_FIELDS = ("job_type", "job_id", "document")


class JobAttachment(Document):
	def on_update(self):
		if any(self.has_value_changed(fieldname) for fieldname in TRIGGER_FIELDS):
			self.post_job_activity()

	def post_job_activity(self):
		if not self.job_id or not self.document:
			return

		employee_name = frappe.get_cached_value("Employee", self.employee, "employee_name") or self.employee
		activity_details = MESSAGE_TEMPLATE.format(
			kind="Photo" if self.is_photo else "Document",
			employee=employee_name,
			date=formatdate(self.date),
			time=format_time(self.time, "hh:mm a"),
			url=get_file_link(self.document),
		)
		add_job_activity(self.job_type, self.job_id, activity_details, self.doctype, self.name)


def get_file_link(file_url):
	"""Full link to an attached file, so it also opens when the Job Activity is read outside the desk."""
	if file_url.startswith(("/files/", "/private/files/")):
		# uploaded file names often have spaces ("WhatsApp Image ... .jpeg"), which would cut the link short
		file_url = quote(file_url)
	# links to other sites come back unchanged
	return get_url(file_url)
```

### Job Comments controller

```python
from frappe.model.document import Document

from logicx_biz.logicx_hr.doctype.job_activity.job_activity import add_job_activity

TRIGGER_FIELDS = ("job_type", "job_id", "comment")


class JobComments(Document):
	def on_update(self):
		if any(self.has_value_changed(fieldname) for fieldname in TRIGGER_FIELDS):
			self.post_job_activity()

	def post_job_activity(self):
		add_job_activity(self.job_type, self.job_id, self.comment, self.doctype, self.name)
```

### Job Estimate controller

```python
import frappe
from frappe.model.document import Document
from frappe.utils import formatdate

from logicx_biz.logicx_hr.doctype.job_activity.job_activity import add_job_activity

TRIGGER_FIELDS = ("item_name", "supplier", "date")


class JobEstimate(Document):
	def on_update(self):
		if any(self.has_value_changed(fieldname) for fieldname in TRIGGER_FIELDS):
			self.post_job_activity()

	def post_job_activity(self):
		if not self.job_id:
			return

		supplier_name = frappe.get_cached_value("Supplier", self.supplier, "supplier_name") or self.supplier
		activity_details = f"Estimate for {self.item_name} is received from {supplier_name} on {formatdate(self.date)}"
		add_job_activity(self.job_type, self.job_id, activity_details, self.doctype, self.name)
```

### Job Execution controller

```python
from datetime import timedelta

import frappe
from frappe.model.document import Document
from frappe.utils import flt, formatdate, format_time, get_timedelta, nowtime

from logicx_biz.logicx_hr.doctype.job_activity.job_activity import add_job_activity

STATUS_MESSAGE_TEMPLATES = {
	"Running": "Job Started by {employee} at {date} {time}",
	"Completed": "Job Stopped by {employee} at {date} {time}",
	"Cancelled": "Job Cancelled by {employee} at {date} {time}",
}


class JobExecution(Document):
	def validate(self):
		self.calculate_hours()
		self.calculate_total_cost()

	def calculate_hours(self):
		if self.start_time and self.stop_time:
			start_time = get_timedelta(self.start_time)
			stop_time = get_timedelta(self.stop_time)
			diff = stop_time - start_time
			if diff < timedelta(0):
				diff += timedelta(days=1)
			self.hours = flt(diff.total_seconds() / 3600, 2)
		else:
			self.hours = 0

	def calculate_total_cost(self):
		self.total_cost = flt(flt(self.hours) * flt(self.employee_cost_per_hour), 2)

	def on_update(self):
		if self.has_value_changed("status"):
			self.post_job_activity()

	def post_job_activity(self):
		template = STATUS_MESSAGE_TEMPLATES.get(self.status)
		if not template or not self.job_id:
			return

		employee_name = frappe.get_cached_value("Employee", self.employee, "employee_name") or self.employee
		event_time = self.start_time if self.status == "Running" else (self.stop_time or nowtime())

		activity_details = template.format(
			employee=employee_name,
			date=formatdate(self.date),
			time=format_time(event_time, "hh:mm a"),
		)
		add_job_activity(self.job_type, self.job_id, activity_details, self.doctype, self.name)
```

### Job Location controller

```python
import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, format_time, formatdate

from logicx_biz.logicx_hr.doctype.job_activity.job_activity import add_job_activity

# Google Maps URLs "search" action: opens the Maps app on Android / iOS, the browser elsewhere
GOOGLE_MAPS_URL = "https://www.google.com/maps/search/?api=1&query={latitude}%2C{longitude}"
MESSAGE_TEMPLATE = "Location captured by {employee} at {date} {time}: {url}"
TRIGGER_FIELDS = ("job_type", "job_id", "latitude", "longitude")


class JobLocation(Document):
	def validate(self):
		self.set_location_fields()

	@frappe.whitelist()
	def set_location_fields(self):
		"""Check the coordinates and rebuild the Geolocation URL and Map from them.

		Also called by the form's "Get Current Location" button, so the pin shows before saving.
		"""
		self.validate_coordinates()
		self.geolocation_url = GOOGLE_MAPS_URL.format(
			latitude=self.format_coordinate("latitude"),
			longitude=self.format_coordinate("longitude"),
		)
		self.geolocation_map = json.dumps(
			{
				"type": "FeatureCollection",
				"features": [
					{
						"type": "Feature",
						"properties": {},
						# GeoJSON puts longitude first
						"geometry": {"type": "Point", "coordinates": [self.longitude, self.latitude]},
					}
				],
			}
		)

	def validate_coordinates(self):
		self.latitude = flt(self.latitude, self.precision("latitude"))
		self.longitude = flt(self.longitude, self.precision("longitude"))

		# Float columns are NOT NULL DEFAULT 0, so a location that was never sent arrives as 0, 0
		if not self.latitude and not self.longitude:
			frappe.throw(_("Latitude and Longitude are required."))
		if not -90 <= self.latitude <= 90:
			frappe.throw(_("Latitude must be between -90 and 90."))
		if not -180 <= self.longitude <= 180:
			frappe.throw(_("Longitude must be between -180 and 180."))

	def format_coordinate(self, fieldname):
		# fixed-point, so a value close to 0 never turns into "1e-05"
		return f"{self.get(fieldname):.{self.precision(fieldname)}f}"

	def on_update(self):
		if any(self.has_value_changed(fieldname) for fieldname in TRIGGER_FIELDS):
			self.post_job_activity()

	def post_job_activity(self):
		if not self.job_id:
			return

		employee_name = frappe.get_cached_value("Employee", self.employee, "employee_name") or self.employee
		activity_details = MESSAGE_TEMPLATE.format(
			employee=employee_name,
			date=formatdate(self.date),
			time=format_time(self.time, "hh:mm a"),
			url=self.geolocation_url,
		)
		add_job_activity(self.job_type, self.job_id, activity_details, self.doctype, self.name)
```

### Mobile Contact controller

```python
from frappe.model.document import Document

from logicx_biz.logicx_erp.mobile_validation import validate_mobile_number


class MobileContact(Document):
	def validate(self):
		# the name is already the trimmed number; keep the field the same for imports and the API
		self.mobile_number = (self.mobile_number or "").strip()
		validate_mobile_number(self.mobile_number, self.meta.get_label("mobile_number"))

	def before_rename(self, old, new, merge=False):
		# rename doesn't run validate, yet Frappe writes the new name into mobile_number,
		# so the new name gets the same check; returning it hands Frappe the trimmed name
		new = (new or "").strip()
		validate_mobile_number(new, self.meta.get_label("mobile_number"))
		return new
```

### Mobile Contact Customer controller

```python
import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_link_to_form


class MobileContactCustomer(Document):
	def validate(self):
		self.validate_duplicate()

	def validate_duplicate(self):
		"""A Mobile Contact is linked to a Customer only once."""
		duplicate = frappe.db.exists(
			"Mobile Contact Customer",
			{"mobile_contact": self.mobile_contact, "customer": self.customer, "name": ["!=", self.name]},
		)
		if duplicate:
			frappe.throw(
				_("{0} is already linked to {1}: {2}").format(
					frappe.bold(self.mobile_contact),
					frappe.bold(self.customer_name or self.customer),
					get_link_to_form("Mobile Contact Customer", duplicate),
				),
				frappe.DuplicateEntryError,
				title=_("Duplicate Mobile Contact Customer"),
			)


def update_customer_name(doc, method=None, *args):
	"""doc_events hook on Customer: carry its current customer_name onto its Mobile Contact Customer rows.

	Runs on on_update, when the name is edited, and on after_rename, where ERPNext sets
	customer_name with db_set (Customers named by Customer Name) and on_update never runs.
	"""
	if method == "on_update" and not doc.has_value_changed("customer_name"):
		return
	customer_name = frappe.db.get_value("Customer", doc.name, "customer_name")
	frappe.db.set_value(
		"Mobile Contact Customer", {"customer": doc.name}, "customer_name", customer_name, update_modified=False
	)


def on_doctype_update():
	# the database's own guard for one row per Mobile Contact and Customer,
	# should two saves race past validate_duplicate
	frappe.db.add_unique("Mobile Contact Customer", ["mobile_contact", "customer"])
```

### SOP Assigned controller

```python
# Copyright (c) 2026, LogicX and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class SOPAssigned(Document):

	def validate(self):
		exists = frappe.db.exists(
			"SOP Assigned",
			{
				"sop_item": self.sop_item,
				"user": self.user,
				"name": ["!=", self.name]
			}
		)
		if exists:
			frappe.throw("This SOP is already assigned to this User.")
```
