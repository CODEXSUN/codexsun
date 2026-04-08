You are a senior Node.js + TypeScript architect.

Task:
Refactor the provided file into a clean, scalable, modular architecture.

Architecture Rules:
- Read ASSIST/AI_RULES.md and all files in ASSIST
- Use feature-based modular structure
- Follow clean architecture:
  controller → service → repository
- Separate concerns strictly

Constraints:
- The current file is too large (over 500–700+ lines).
- Split it into multiple smaller files based on responsibility.
- Follow best practices (SOLID, clean architecture).

Instructions:
1. Analyze the entire file and identify logical responsibilities:
    - controllers (HTTP handling)
    - services (business logic)
    - repositories (database access)
    - utils/helpers
    - types/interfaces

2. Split the code into multiple files:
    - Each file should ideally be under 300–400 lines.
    - Group related logic together.
    - Remove duplication.

3. Maintain:
    - Existing functionality (no breaking changes)
    - Proper TypeScript typing
    - Clean imports/exports

4. Improve:
    - Naming conventions
    - Reusability
    - Readability

5. Output format:
    - Show folder structure
    - Then show each file with filename
    - Include updated imports between files

6. Optional improvements:
    - Add basic validation if missing
    - Add error handling
    - Suggest improvements at the end

7. add to rule book
    - add this to AI_RULES.md as rule

Important:
Do NOT rewrite logic unnecessarily.
Focus on splitting and organizing.