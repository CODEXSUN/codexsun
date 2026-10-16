# Master List

`@codexsun/ui/blocks/master-list` exports `MasterList`, `MasterForm`, and their types.

Define one `MasterField[]` for both the list and the form. Each record has a string `id`; other field values can be strings, numbers, booleans, or empty values. Set `showInList: false` for form-only fields. Use `format` when a list value needs custom display. Select fields provide their own `options`.

`MasterList` supports `table` and `cards` variants. Both show configured fields and optional view, edit, suspend, and delete actions. The table uses the shared Data Table block for search, sorting, and pagination. `MasterForm` supports `page` and `panel` layouts, controlled string values, and required-field checks.

`MasterListDesk` supports dense operational lists. It provides a compact toolbar, quick field filters, selectable rows, row menus for edit, suspend, and delete actions, page-size controls, and a load-more action.

The owning application supplies records, draft values, persistence, permissions, domain validation, and delete confirmation. Neither block stores records or calls an API. The UIUX gallery provides four separate in-memory pages at `/?template=master-list&variant=v1`, `v2`, `v3`, and `v4`.
