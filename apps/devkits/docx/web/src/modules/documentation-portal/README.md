# DOCX Documentation Portal Web Module

## Purpose

Composes the DOCX documentation portal from public `@codexsun/ui` exports.
It owns DOCX navigation, document-reader state, Ideas pages, header actions,
and the rich-text authoring flow.

## Ownership

- Uses `DocumentationWorkspace` for the shared MDI documentation frame.
- Uses `RichTextEditor` through its public component export.
- Keeps DOCX document content, source paths, navigation, and editing state in
  this module.
- Does not import another application's source files or copy UI package components.

## Verification

Run the DOCX web type check, lint, test command, and a browser-visible portal
flow covering navigation, header actions, helper navigation, Ideas pages, and
the editor.
