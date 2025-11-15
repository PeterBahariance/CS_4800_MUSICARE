# Master Prompt: Build a World-Class Documentation System

**Purpose**: This prompt guides an LLM to analyze any codebase and create a comprehensive, organized documentation system similar to Hangg's architecture.

**Usage**: Copy this entire prompt and paste it into your LLM chat for any project.

---

## THE MASTER PROMPT

```
I need you to analyze my codebase and create a comprehensive documentation system that will revolutionize how I (and future developers) work on this project.

## ⚠️ CRITICAL RULES

1. **NO CODE CHANGES** - We are ONLY creating documentation right now. Do NOT modify any code files.
2. **DOCUMENT WHAT EXISTS** - Analyze and document the current codebase as-is.
3. **NOTE IMPROVEMENTS** - If you see bad code/patterns, document them using the **IMPROVEMENT NEEDED** template (see below).
4. **ONE TASK AT A TIME** - We will go through this step-by-step. Complete each task fully before moving to the next.
5. **WAIT FOR CONFIRMATION** - After completing each task, wait for me to review and approve before proceeding.

## IMPROVEMENT NEEDED TEMPLATE

When you encounter code that should be improved, add this section to the relevant documentation:

```markdown
## 🔧 IMPROVEMENT NEEDED

**Location**: `path/to/file.js:123`

**Current Implementation**:
```[language]
// Current code (bad pattern)
[actual code]
```

**Issue**: [What's wrong - be specific]

**Recommended Fix**:
```[language]
// Improved code
[better pattern]
```

**Priority**: [LOW | MEDIUM | HIGH | CRITICAL]

**Reason**: [Why this should be changed]
```

Use this template liberally - we'll create a master list of improvements to tackle later.

---

## CONTEXT

This codebase currently lacks organized documentation. I want you to create a documentation structure that:

1. **Serves as the single source of truth** for how this project works
2. **Enables rapid onboarding** for new developers (human or AI)
3. **Enforces consistency** across all features
4. **Captures architectural patterns** that should be reused
5. **Documents workflows end-to-end** (not just isolated features)
6. **Includes real code examples** from the actual codebase
7. **Prevents common mistakes** by documenting lessons learned
8. **Identifies improvements** needed without changing code yet

## YOUR TASK - BROKEN INTO PHASES

We will complete this in **7 distinct phases**. Each phase is a separate task. Complete one phase fully before moving to the next.

### Final Documentation Structure

```
documentation/
├── architecture/
│   ├── MASTER_SCRIPT.md          # 🌟 THE MOST IMPORTANT FILE - Development methodology
│   ├── TECH_STACK.md             # Complete tech stack with versions
│   ├── FILE_TREE.md              # Complete file structure with explanations
│   ├── PROJECT_STRUCTURE.md      # How the codebase is organized
│   ├── CORE_PATTERNS.md          # Reusable patterns with real examples
│   ├── COMPLIANCE_RULES.md       # Non-negotiable standards
│   └── IMPROVEMENTS_NEEDED.md    # Master list of code improvements (created during analysis)
├── workflows/
│   ├── [FEATURE_1]_FLOW.md       # End-to-end workflow for major feature 1
│   ├── [FEATURE_2]_FLOW.md       # End-to-end workflow for major feature 2
│   └── ...                       # One file per major feature/workflow
├── setup/
│   ├── GETTING_STARTED.md        # First-time setup instructions
│   ├── DEVELOPMENT_WORKFLOW.md   # Daily development process
│   └── TROUBLESHOOTING.md        # Common issues and solutions
└── testing/
    ├── TESTING_GUIDE.md          # How to write and run tests
    └── TEST_PATTERNS.md          # Common test patterns with examples
```

---

## 📋 PHASE 1: INITIAL CODEBASE ANALYSIS

**Goal**: Understand what we're working with

**Tasks**:

1. **Scan the entire codebase** and create a comprehensive inventory
2. **Identify the tech stack** (languages, frameworks, libraries with versions)
3. **Map the project structure** (what folders exist, what they contain)
4. **Identify project type** (web app, mobile app, API, full-stack, monorepo, etc.)
5. **List all major features** (what can users do with this application?)
6. **Identify dependencies** (what external services, APIs, databases are used?)

**Deliverable**: Create `documentation/architecture/INITIAL_ANALYSIS.md` with:

```markdown
# Initial Codebase Analysis

## Project Type
[Web app | Mobile app | API | Full-stack | Desktop app | CLI tool | etc.]

## Tech Stack Summary

### Languages
- [Language 1]: [Version] - [% of codebase]
- [Language 2]: [Version] - [% of codebase]

### Frameworks
- **Frontend**: [Framework + Version]
- **Backend**: [Framework + Version]
- **Database**: [Type + Version]

### Key Libraries (Top 10 most important)
1. [Library]: [Version] - [Purpose]
2. [Library]: [Version] - [Purpose]
...

## Project Structure Overview

```
project-root/
├── [folder1]/     # [What this contains]
├── [folder2]/     # [What this contains]
└── ...
```

## Major Features Identified

1. **[Feature 1]**: [Brief description]
2. **[Feature 2]**: [Brief description]
...

## External Dependencies

- **Database**: [Type, where hosted]
- **APIs**: [List external APIs used]
- **Services**: [Auth providers, cloud services, etc.]

## Initial Observations

### What's Working Well
- [Observation 1]
- [Observation 2]

### What's Confusing
- [Observation 1]
- [Observation 2]

### Potential Issues Spotted
- [Issue 1]
- [Issue 2]

## Questions for Developer

1. [Question about unclear aspect]
2. [Question about project goals]
...
```

**When complete**: Share this file and wait for my review before proceeding to Phase 2.

---

## 📋 PHASE 2: COMPLETE FILE TREE DOCUMENTATION

**Goal**: Create a comprehensive map of every file and folder

**Tasks**:

1. **Generate complete file tree** (all folders and files)
2. **Categorize files** by purpose (components, utilities, config, tests, etc.)
3. **Explain each major folder** (what goes there, why it exists)
4. **Document naming conventions** (how files are named, any patterns)
5. **Identify orphaned/unclear files** (files that don't fit the pattern)

**Deliverable**: Create `documentation/architecture/FILE_TREE.md` with:

```markdown
# Complete File Tree

## Root Directory Structure

```
project-root/
├── [folder1]/
│   ├── [subfolder1]/
│   │   ├── file1.ext
│   │   └── file2.ext
│   └── [subfolder2]/
├── [folder2]/
└── ...
```

## Directory Explanations

### `/[folder1]` - [Purpose]

**Contains**: [What types of files]

**Organization**: [How files are organized within]

**Naming Convention**: [How files are named]

**Key Files**:
- `file1.ext` - [Purpose]
- `file2.ext` - [Purpose]

**Subdirectories**:
- `/subfolder1` - [Purpose]
- `/subfolder2` - [Purpose]

[Repeat for each major directory]

## File Categorization

### Configuration Files
- `file1.config.js` - [Purpose]
- `file2.json` - [Purpose]

### Entry Points
- `index.js` - [Purpose]
- `main.js` - [Purpose]

### Core Application Files
[List by category]

### Test Files
[List test files and their organization]

### Build/Deploy Files
[List build-related files]

## Naming Conventions Observed

### Components
- Pattern: [e.g., PascalCase, kebab-case]
- Example: `UserProfile.jsx`, `user-profile.component.js`

### Utilities
- Pattern: [e.g., camelCase]
- Example: `formatDate.js`, `apiHelpers.js`

### Tests
- Pattern: [e.g., *.test.js, *.spec.js]
- Example: `UserProfile.test.js`

[Document all patterns observed]

## 🔧 IMPROVEMENT NEEDED

[Use this section to note any file organization issues]

**Issue**: Files are inconsistently named (some camelCase, some PascalCase)
**Location**: `/src/components/`
**Recommendation**: Standardize to PascalCase for all React components
**Priority**: MEDIUM
```

**When complete**: Share this file and wait for my review before proceeding to Phase 3.

---

## 📋 PHASE 3: TECH STACK DEEP DIVE

**Goal**: Document every technology, why it's used, and how it's configured

**Tasks**:

1. **List every dependency** from package.json/requirements.txt/etc.
2. **Categorize dependencies** (frontend, backend, dev tools, testing, etc.)
3. **Document versions** (what version is used, is it outdated?)
4. **Explain purpose** (why is each dependency needed?)
5. **Identify redundancies** (multiple libraries doing the same thing?)
6. **Check for security issues** (deprecated packages, known vulnerabilities)

**Deliverable**: Create `documentation/architecture/TECH_STACK.md` with:

```markdown
# Complete Tech Stack

## Overview

**Project Type**: [Type]
**Primary Language**: [Language + Version]
**Framework**: [Framework + Version]

## Frontend Stack

### Core Framework
- **[Framework]**: [Version]
  - **Purpose**: [Why chosen]
  - **Documentation**: [Link]
  - **Status**: ✅ Up-to-date | ⚠️ Outdated | 🔴 Deprecated

### UI Libraries
- **[Library 1]**: [Version] - [Purpose]
- **[Library 2]**: [Version] - [Purpose]

### State Management
- **[Library]**: [Version]
  - **Purpose**: [How state is managed]
  - **Pattern**: [Redux, Context, Zustand, etc.]

### Routing
- **[Library]**: [Version]
  - **Pattern**: [File-based, declarative, etc.]

### Styling
- **[Library/Approach]**: [Version]
  - **Pattern**: [CSS Modules, Tailwind, Styled Components, etc.]

### Data Fetching
- **[Library]**: [Version]
  - **Pattern**: [REST, GraphQL, tRPC, etc.]

## Backend Stack

### Core Framework
- **[Framework]**: [Version]
  - **Purpose**: [API server, full-stack, etc.]
  - **Architecture**: [REST, GraphQL, Microservices, etc.]

### Database
- **Type**: [SQL | NoSQL]
- **Technology**: [PostgreSQL, MongoDB, etc.] - [Version]
- **ORM/ODM**: [Prisma, Mongoose, etc.] - [Version]
- **Hosting**: [Where database is hosted]

### Authentication
- **[Library/Service]**: [Version]
  - **Pattern**: [JWT, Sessions, OAuth, etc.]
  - **Providers**: [Google, GitHub, Email/Password, etc.]

### API Layer
- **[Library]**: [Version]
  - **Pattern**: [Express, Fastify, tRPC, etc.]

## Development Tools

### Build Tools
- **[Tool]**: [Version] - [Purpose]

### Package Manager
- **[npm | yarn | pnpm]**: [Version]

### Linting/Formatting
- **[ESLint, Prettier, etc.]**: [Version]
- **Config**: [Standard, Airbnb, custom]

### Testing
- **Unit Tests**: [Jest, Vitest, etc.] - [Version]
- **Integration Tests**: [Library] - [Version]
- **E2E Tests**: [Playwright, Cypress, etc.] - [Version]

## Infrastructure

### Hosting
- **Frontend**: [Vercel, Netlify, etc.]
- **Backend**: [Railway, Render, AWS, etc.]
- **Database**: [Supabase, PlanetScale, etc.]

### CI/CD
- **[GitHub Actions, CircleCI, etc.]**: [Configuration]

### Monitoring
- **[Sentry, LogRocket, etc.]**: [If any]

## Complete Dependency List

### Production Dependencies

```json
{
  "dependency-1": "version",  // [Purpose]
  "dependency-2": "version",  // [Purpose]
  ...
}
```

### Development Dependencies

```json
{
  "dev-dependency-1": "version",  // [Purpose]
  "dev-dependency-2": "version",  // [Purpose]
  ...
}
```

## 🔧 IMPROVEMENT NEEDED

### Outdated Dependencies
- **[Package]**: Current [version], Latest [version]
  - **Risk**: [Security, compatibility, etc.]
  - **Priority**: [LOW | MEDIUM | HIGH]

### Redundant Dependencies
- **Issue**: Both [library1] and [library2] do the same thing
  - **Recommendation**: Standardize on [library1]
  - **Priority**: MEDIUM

### Missing Dependencies
- **[Functionality]** needs a library
  - **Recommendation**: Add [library]
  - **Priority**: [LOW | MEDIUM | HIGH]
```

**When complete**: Share this file and wait for my review before proceeding to Phase 4.

---

## 📋 PHASE 4: CORE PATTERNS IDENTIFICATION

**Goal**: Identify and document reusable patterns in the codebase

**Tasks**:

1. **Identify common patterns** (how are similar things done?)
2. **Extract code examples** (real code from the codebase)
3. **Document best practices** (what's the "right way" to do things here?)
4. **Identify anti-patterns** (what should NOT be done?)
5. **Note inconsistencies** (where patterns are broken)

**Deliverable**: Create `documentation/architecture/CORE_PATTERNS.md` with:

```markdown
# Core Patterns

## Pattern Categories

1. [Component Patterns] (if frontend)
2. [API Patterns] (if backend)
3. [Data Fetching Patterns]
4. [State Management Patterns]
5. [Error Handling Patterns]
6. [Authentication Patterns]
7. [Database Query Patterns]
8. [Testing Patterns]

---

## [Category 1]: Component Patterns (Example)

### Pattern 1.1: [Name] (e.g., "Page Component Structure")

**When to use**: [Scenario - e.g., "When creating a new page"]

**Current Implementation** (Real code from codebase):

```[language]
// File: path/to/example.js
[ACTUAL CODE FROM CODEBASE - NOT PLACEHOLDER]
```

**Explanation**:
- [What this code does]
- [Why it's structured this way]
- [Key parts to notice]

**Variations Found**:
- ✅ **Good example**: `path/to/good-example.js` - [Why it's good]
- ⚠️ **Inconsistent example**: `path/to/inconsistent.js` - [What's different]
- ❌ **Bad example**: `path/to/bad-example.js` - [What's wrong]

**Best Practice**:
```[language]
// Recommended pattern
[IDEAL CODE]
```

**Common Mistakes**:
- ❌ [Anti-pattern 1]
- ❌ [Anti-pattern 2]

**Related Patterns**: [Link to other patterns]

---

### Pattern 1.2: [Next Pattern]

[Repeat structure]

---

## [Category 2]: API Patterns (Example)

### Pattern 2.1: API Endpoint Structure

**When to use**: When creating a new API endpoint

**Current Implementation**:

```[language]
// File: path/to/api/endpoint.js
[ACTUAL CODE]
```

**Request/Response Format**:

```json
// Request
{
  "field1": "value",
  "field2": "value"
}

// Response (Success)
{
  "success": true,
  "data": { ... }
}

// Response (Error)
{
  "success": false,
  "error": "Error message"
}
```

**Authentication**: [How auth is handled]

**Validation**: [How input is validated]

**Error Handling**: [How errors are handled]

---

## Pattern Consistency Analysis

### Consistent Patterns (Good!)
- ✅ [Pattern 1]: Used consistently across [X] files
- ✅ [Pattern 2]: Well-established pattern

### Inconsistent Patterns (Needs Standardization)
- ⚠️ [Pattern 3]:
  - Used in: [file1, file2]
  - Different approach in: [file3, file4]
  - **Recommendation**: Standardize to [approach]

### Missing Patterns (Gaps)
- ❌ No established pattern for [functionality]
  - **Recommendation**: Create pattern based on [example]

## 🔧 IMPROVEMENT NEEDED

### Pattern Violations

**Location**: `path/to/file.js:45`

**Issue**: Component doesn't follow established pattern

**Current Code**:
```[language]
[bad code]
```

**Should be**:
```[language]
[good code following pattern]
```

**Priority**: MEDIUM

**Affected Files**: [List all files with this issue]

---

[Repeat for each pattern violation found]
```

**When complete**: Share this file and wait for my review before proceeding to Phase 5.

---

## 📋 PHASE 5: THE MASTER SCRIPT (MOST IMPORTANT!)

**Goal**: Create the single source of truth for how development works in this project

This is **THE MOST IMPORTANT FILE** - it's the "brain" of your documentation.

**Tasks**:

1. **Define development philosophy** (what principles guide this project?)
2. **Document the development process** (step-by-step: how to add a feature)
3. **Establish quality standards** (what makes code "good" here?)
4. **Create decision trees** (when to use pattern A vs pattern B)
5. **Document workflows** (from idea to production)

**Deliverable**: Create `documentation/architecture/MASTER_SCRIPT.md` with:

```markdown
# MASTER SCRIPT - [Project Name]

**Last Updated**: [Date]
**Status**: Living Document - Update as project evolves

---

## 🎯 Project Mission

**What**: [What does this project do?]

**Who**: [Who is it for?]

**Why**: [What problem does it solve?]

**How**: [High-level approach]

---

## 🏗️ Development Philosophy

### Core Principles

1. **[Principle 1]** (e.g., "User experience first")
   - What it means: [Explanation]
   - In practice: [How this affects decisions]

2. **[Principle 2]** (e.g., "Code should be self-documenting")
   - What it means: [Explanation]
   - In practice: [How this affects decisions]

3. **[Principle 3]**
   - What it means: [Explanation]
   - In practice: [How this affects decisions]

### Non-Negotiables

These rules MUST be followed:

1. ✅ **[Rule 1]** (e.g., "All API endpoints must have authentication")
2. ✅ **[Rule 2]** (e.g., "All user inputs must be validated")
3. ✅ **[Rule 3]** (e.g., "All features must have tests")

### Nice-to-Haves

These are encouraged but not required:

1. 💡 [Guideline 1]
2. 💡 [Guideline 2]

---

## 📋 How to Add a New Feature (Step-by-Step)

This is the **exact process** to follow when building anything new.

### Step 1: Planning

**Before writing any code**:

1. [ ] Define the feature clearly
   - What does it do?
   - Who is it for?
   - What problem does it solve?

2. [ ] Design the data model
   - What data is needed?
   - Where is it stored?
   - How does it relate to existing data?

3. [ ] Sketch the user flow
   - What does the user see?
   - What actions can they take?
   - What happens at each step?

4. [ ] Identify dependencies
   - What existing code will this use?
   - What new libraries are needed?
   - What external services are involved?

### Step 2: Implementation (Frontend)

**If this feature has a UI**:

1. [ ] Create component files following [pattern from CORE_PATTERNS.md]
   - Location: `[where components go]`
   - Naming: `[naming convention]`

2. [ ] Implement UI following [design system/pattern]
   - Use existing components from `[component library location]`
   - Follow styling pattern: [CSS Modules | Tailwind | etc.]

3. [ ] Add state management
   - Pattern: [Context | Redux | Zustand | etc.]
   - Location: `[where state goes]`

4. [ ] Implement data fetching
   - Pattern: [React Query | SWR | fetch | etc.]
   - API calls go in: `[location]`

5. [ ] Add error handling
   - Pattern: [Error boundaries | try-catch | etc.]
   - User-facing errors: [How to display]

6. [ ] Add loading states
   - Pattern: [Skeletons | Spinners | etc.]

### Step 3: Implementation (Backend)

**If this feature needs API endpoints**:

1. [ ] Create API endpoint following [pattern from CORE_PATTERNS.md]
   - Location: `[where endpoints go]`
   - Naming: `[naming convention]`

2. [ ] Add authentication
   - Pattern: [JWT | Sessions | etc.]
   - Middleware: `[location]`

3. [ ] Add input validation
   - Pattern: [Zod | Joi | express-validator | etc.]
   - Location: `[where validation goes]`

4. [ ] Implement business logic
   - Location: `[services | controllers | etc.]`
   - Pattern: [MVC | Clean Architecture | etc.]

5. [ ] Add database queries
   - ORM: [Prisma | Mongoose | etc.]
   - Location: `[where queries go]`
   - Pattern: [Repository pattern | Direct queries | etc.]

6. [ ] Add error handling
   - Pattern: [Error middleware | try-catch | etc.]
   - Error codes: [Namespaced | HTTP status | etc.]

### Step 4: Testing

**Required tests**:

1. [ ] Unit tests
   - Test: [What to test]
   - Location: `[where tests go]`
   - Pattern: [Describe/it | test() | etc.]

2. [ ] Integration tests (if applicable)
   - Test: [What to test]
   - Location: `[where tests go]`

3. [ ] E2E tests (for critical flows)
   - Test: [What to test]
   - Tool: [Playwright | Cypress | etc.]

**Test coverage goal**: [X]%

### Step 5: Documentation

**Update these files**:

1. [ ] Add to `CORE_PATTERNS.md` if new pattern introduced
2. [ ] Create `workflows/[FEATURE]_FLOW.md` for major features
3. [ ] Update `MASTER_SCRIPT.md` if process changed
4. [ ] Update API documentation (if applicable)

### Step 6: Code Review Checklist

**Before submitting PR**:

- [ ] Code follows patterns in `CORE_PATTERNS.md`
- [ ] All non-negotiables are satisfied
- [ ] Tests pass and coverage meets goal
- [ ] No console errors/warnings
- [ ] Documentation updated
- [ ] Tested in [browsers/devices]
- [ ] Accessibility checked (if UI)
- [ ] Performance acceptable (if applicable)

---

## 🎨 Code Quality Standards

### What Makes Code "Good" in This Project?

1. **Readable**
   - Clear variable names
   - Logical structure
   - Comments for complex logic only

2. **Consistent**
   - Follows patterns in `CORE_PATTERNS.md`
   - Matches existing code style
   - Uses established conventions

3. **Tested**
   - Has unit tests
   - Has integration tests (if applicable)
   - Edge cases covered

4. **Maintainable**
   - DRY (Don't Repeat Yourself)
   - Single Responsibility Principle
   - Easy to modify without breaking things

### Code Review Standards

**Automatic Rejection** (must fix before merge):
- ❌ [Violation 1] (e.g., "No authentication on protected endpoint")
- ❌ [Violation 2] (e.g., "No input validation")
- ❌ [Violation 3] (e.g., "No tests")

**Needs Discussion** (may be acceptable with justification):
- ⚠️ [Issue 1] (e.g., "Deviates from established pattern")
- ⚠️ [Issue 2] (e.g., "Adds new dependency")

---

## 🔀 Decision Trees

### When to Create a New Component vs. Modify Existing?

```
Is the functionality similar to existing component?
├─ YES → Can you extend existing component with props?
│  ├─ YES → Extend existing component
│  └─ NO → Create new component
└─ NO → Create new component
```

### When to Add a New Dependency?

```
Do we need this functionality?
├─ YES → Does existing dependency provide it?
│  ├─ YES → Use existing dependency
│  └─ NO → Can we build it ourselves reasonably?
│     ├─ YES → Build it (avoid dependency bloat)
│     └─ NO → Add new dependency
└─ NO → Don't add dependency
```

### When to Refactor vs. Build New?

```
Is existing code working?
├─ YES → Is it causing problems?
│  ├─ YES → Refactor
│  └─ NO → Leave it (don't fix what isn't broken)
└─ NO → Is it salvageable?
   ├─ YES → Refactor
   └─ NO → Rebuild
```

---

## 🚀 Deployment Process

### Development → Staging → Production

1. **Development**
   - Branch: `develop` or feature branches
   - Deploy: [How/where]
   - Testing: Manual testing

2. **Staging**
   - Branch: `staging`
   - Deploy: [How/where]
   - Testing: [QA process]

3. **Production**
   - Branch: `main`
   - Deploy: [How/where]
   - Monitoring: [How errors are tracked]

### Pre-Deployment Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] [Other checks specific to project]

---

## 📊 Success Metrics

**How we measure if we're doing well**:

1. **Code Quality**
   - Test coverage: [X]%
   - Build time: < [X] minutes
   - Bundle size: < [X] MB

2. **Development Speed**
   - Time to add simple feature: [X] hours
   - Time to add complex feature: [X] days

3. **Stability**
   - Bugs per release: < [X]
   - Uptime: > [X]%

---

## 🔧 IMPROVEMENT NEEDED

[Use this section to note process improvements]

**Current Issue**: [What's not working well]

**Impact**: [How it affects development]

**Proposed Solution**: [How to fix it]

**Priority**: [LOW | MEDIUM | HIGH]

---

## 📚 Related Documentation

- [TECH_STACK.md](./TECH_STACK.md) - What technologies we use
- [FILE_TREE.md](./FILE_TREE.md) - Where everything is located
- [CORE_PATTERNS.md](./CORE_PATTERNS.md) - How to implement features
- [GETTING_STARTED.md](../setup/GETTING_STARTED.md) - How to set up locally
- [DEVELOPMENT_WORKFLOW.md](../setup/DEVELOPMENT_WORKFLOW.md) - Daily workflow

---

**Remember**: This is a living document. Update it as the project evolves!
```

**When complete**: Share this file and wait for my review before proceeding to Phase 6.

---

## 📋 PHASE 6: WORKFLOW DOCUMENTATION

**Goal**: Document end-to-end workflows for major features

**Tasks**:

1. **Select top 3-5 features** to document first
2. **Map complete user flow** (what user sees and does)
3. **Map technical flow** (what happens in code)
4. **Extract real code examples** for each step
5. **Document edge cases** and error handling

**Deliverable**: Create one `documentation/workflows/[FEATURE_NAME]_FLOW.md` for each major feature:

```markdown
# [Feature Name] - Complete Workflow

**Last Updated**: [Date]

---

## Overview

**What**: [What this feature does]

**Who**: [Who uses it]

**Why**: [Why it exists]

---

## User Flow

### Happy Path

1. **User Action**: [What user does]
   - **UI**: [What they see]
   - **Input**: [What they enter/click]

2. **System Response**: [What happens]
   - **Processing**: [What system does]
   - **Feedback**: [What user sees]

3. **Result**: [Final state]
   - **UI Update**: [How UI changes]
   - **Data Change**: [What data changed]

### Alternative Paths

**Path 1**: [Scenario]
- [Steps]

**Path 2**: [Scenario]
- [Steps]

### Error Cases

**Error 1**: [What can go wrong]
- **Cause**: [Why it happens]
- **User sees**: [Error message/UI]
- **Recovery**: [How to fix]

---

## Technical Implementation

### Frontend Flow

**Files Involved**:
- `path/to/component1.jsx` - [Purpose]
- `path/to/component2.jsx` - [Purpose]
- `path/to/api-call.js` - [Purpose]

**Step-by-Step Code Flow**:

#### Step 1: [Action] (e.g., "User clicks submit button")

**File**: `path/to/component.jsx`

```[language]
// ACTUAL CODE FROM CODEBASE
[real code showing this step]
```

**What happens**:
- [Explanation line by line]

**State changes**:
- `[stateVar]`: [old value] → [new value]

---

#### Step 2: [Action] (e.g., "API call is made")

**File**: `path/to/api.js`

```[language]
// ACTUAL CODE FROM CODEBASE
[real code showing API call]
```

**Request**:
```json
{
  "field": "value"
}
```

**What happens**:
- [Explanation]

---

#### Step 3: [Action] (e.g., "Response is processed")

**File**: `path/to/component.jsx`

```[language]
// ACTUAL CODE FROM CODEBASE
[real code showing response handling]
```

**Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**What happens**:
- [Explanation]

---

### Backend Flow (if applicable)

**Files Involved**:
- `path/to/route.js` - [Purpose]
- `path/to/controller.js` - [Purpose]
- `path/to/service.js` - [Purpose]
- `path/to/model.js` - [Purpose]

**Step-by-Step Code Flow**:

#### Step 1: Request Received

**File**: `path/to/route.js`

```[language]
// ACTUAL CODE
[real route definition]
```

**What happens**:
- [Explanation]

---

#### Step 2: Authentication/Validation

**File**: `path/to/middleware.js`

```[language]
// ACTUAL CODE
[real auth/validation code]
```

**What happens**:
- [Explanation]

---

#### Step 3: Business Logic

**File**: `path/to/service.js`

```[language]
// ACTUAL CODE
[real business logic]
```

**What happens**:
- [Explanation]

---

#### Step 4: Database Query

**File**: `path/to/model.js` or service

```[language]
// ACTUAL CODE
[real database query]
```

**Query**:
```sql
-- Actual SQL or ORM query
[real query]
```

**What happens**:
- [Explanation]

---

#### Step 5: Response Sent

**File**: `path/to/controller.js`

```[language]
// ACTUAL CODE
[real response code]
```

**Response Format**:
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Database Schema

**Tables/Collections Used**:

```sql
-- Table 1
CREATE TABLE [table_name] (
  [actual schema from database]
);

-- Table 2
CREATE TABLE [table_name] (
  [actual schema from database]
);
```

**Relationships**:
- [Table 1] → [Table 2]: [Relationship type]

---

## State Management

**State Variables**:

| Variable | Type | Initial Value | Purpose |
|----------|------|---------------|---------|
| `[var1]` | `[type]` | `[value]` | [Purpose] |
| `[var2]` | `[type]` | `[value]` | [Purpose] |

**State Flow**:

```
Initial State
    ↓
[Action 1] → State Update 1
    ↓
[Action 2] → State Update 2
    ↓
Final State
```

---

## Error Handling

### Frontend Errors

**Error 1**: [Error name]

**When**: [When it occurs]

**Code**:
```[language]
// ACTUAL ERROR HANDLING CODE
[real code]
```

**User sees**: [Error message/UI]

**Recovery**: [How user can fix]

---

### Backend Errors

**Error 1**: [Error name]

**When**: [When it occurs]

**Code**:
```[language]
// ACTUAL ERROR HANDLING CODE
[real code]
```

**Response**:
```json
{
  "success": false,
  "error": "Error message"
}
```

**HTTP Status**: [Status code]

---

## Testing

### Unit Tests

**File**: `path/to/test.test.js`

```[language]
// ACTUAL TEST CODE
[real test]
```

**What it tests**: [Explanation]

---

### Integration Tests

**File**: `path/to/integration.test.js`

```[language]
// ACTUAL TEST CODE
[real test]
```

**What it tests**: [Explanation]

---

### E2E Tests

**File**: `path/to/e2e.test.js`

```[language]
// ACTUAL TEST CODE
[real test]
```

**What it tests**: [Complete user flow]

---

## Performance Considerations

**Bottlenecks**:
- [Potential bottleneck 1]
- [Potential bottleneck 2]

**Optimizations**:
- [Optimization 1]
- [Optimization 2]

---

## Security Considerations

**Vulnerabilities**:
- [Potential vulnerability 1]
- [Potential vulnerability 2]

**Mitigations**:
- [How it's protected]

---

## 🔧 IMPROVEMENT NEEDED

**Issue 1**: [What could be better]

**Location**: `path/to/file.js:123`

**Current Code**:
```[language]
[current implementation]
```

**Recommended**:
```[language]
[better implementation]
```

**Priority**: [LOW | MEDIUM | HIGH]

**Reason**: [Why this should change]

---

## Related Features

- [Feature 1]: [How it relates]
- [Feature 2]: [How it relates]

---

## Common Issues

### Issue 1: [Problem]

**Symptoms**: [What user sees]

**Cause**: [Why it happens]

**Solution**: [How to fix]

**Prevention**: [How to avoid]

---

### Issue 2: [Problem]

[Same structure]

---

## Future Enhancements

**Potential Improvements**:
1. [Enhancement 1]
2. [Enhancement 2]

**Technical Debt**:
1. [Debt item 1]
2. [Debt item 2]
```

**Repeat for each major feature** (3-5 features minimum)

**When complete**: Share all workflow files and wait for my review before proceeding to Phase 7.

---

## 📋 PHASE 7: SETUP & TROUBLESHOOTING DOCUMENTATION

**Goal**: Make it easy for anyone to get started and fix common issues

**Tasks**:

1. **Document first-time setup** (every single step)
2. **Document daily workflow** (how to start working)
3. **Collect common issues** (from your experience)
4. **Document solutions** (how you fixed them)
5. **Create verification checklist** (how to know it's working)

**Deliverable 1**: Create `documentation/setup/GETTING_STARTED.md`:

```markdown
# Getting Started

**Last Updated**: [Date]

---

## Prerequisites

**Required**:
- [Tool 1]: Version [X.X] or higher
  - Check: `[command to check version]`
  - Install: `[how to install]`

- [Tool 2]: Version [Y.Y] or higher
  - Check: `[command to check version]`
  - Install: `[how to install]`

**Optional**:
- [Tool 3]: [Purpose]

---

## Installation

### Step 1: Clone Repository

```bash
git clone [actual repo URL]
cd [actual project directory]
```

### Step 2: Install Dependencies

```bash
# ACTUAL COMMAND FOR THIS PROJECT
[npm install | yarn | pnpm install | pip install -r requirements.txt | etc.]
```

**What this does**: [Explanation]

**Expected output**: [What you should see]

**If it fails**: [Common issues and fixes]

---

### Step 3: Environment Configuration

```bash
# Copy example environment file
cp .env.example .env
# or
cp config.example.js config.js
```

**Required environment variables**:

| Variable | Purpose | Example Value | Where to Get |
|----------|---------|---------------|--------------|
| `[VAR_1]` | [Purpose] | `[example]` | [Where to get it] |
| `[VAR_2]` | [Purpose] | `[example]` | [Where to get it] |

**Example `.env` file**:
```bash
# ACTUAL VARIABLES FROM THIS PROJECT
[VAR_1]=[value]
[VAR_2]=[value]
```

---

### Step 4: Database Setup

**If using database**:

```bash
# ACTUAL COMMANDS FOR THIS PROJECT
[database setup commands]
```

**What this does**: [Explanation]

**Verify it worked**:
```bash
[command to verify database is set up]
```

---

### Step 5: Run Development Server

```bash
# ACTUAL COMMAND FOR THIS PROJECT
[npm run dev | yarn dev | python manage.py runserver | etc.]
```

**Expected output**:
```
[actual console output when server starts]
```

**Server should be running at**: `[actual URL]`

---

## Verification

**Check that everything works**:

- [ ] Server starts without errors
- [ ] Can access `[URL]` in browser
- [ ] Can see `[what you should see]`
- [ ] Can perform basic action: `[action]`
- [ ] Database connection works (if applicable)
- [ ] Authentication works (if applicable)

---

## Next Steps

1. Read [MASTER_SCRIPT.md](../architecture/MASTER_SCRIPT.md) to understand development process
2. Review [FILE_TREE.md](../architecture/FILE_TREE.md) to understand project structure
3. Check [CORE_PATTERNS.md](../architecture/CORE_PATTERNS.md) for coding patterns
4. Try making a small change to verify your setup

---

## Common Setup Issues

### Issue 1: [Common problem]

**Symptoms**:
```
[error message]
```

**Cause**: [Why it happens]

**Solution**:
```bash
[commands to fix]
```

---

### Issue 2: [Common problem]

[Same structure]

---

## Getting Help

If you're stuck:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Search closed issues on GitHub
3. Ask in [team chat/forum]
4. Create new issue with:
   - What you tried to do
   - What happened instead
   - Full error message
   - Your environment (OS, versions, etc.)
```

**Deliverable 2**: Create `documentation/setup/DEVELOPMENT_WORKFLOW.md`:

```markdown
# Daily Development Workflow

**Last Updated**: [Date]

---

## Starting Your Day

### 1. Pull Latest Changes

```bash
git checkout main
git pull origin main
```

### 2. Install New Dependencies (if any)

```bash
[package manager install command]
```

**When to do this**: After pulling if `package.json` (or equivalent) changed

### 3. Run Database Migrations (if applicable)

```bash
[migration command]
```

**When to do this**: After pulling if new migrations exist

### 4. Start Development Server

```bash
[actual start command]
```

**Verify**: [What to check to know it's working]

---

## Working on a Feature

### 1. Create Feature Branch

```bash
git checkout -b feature/[feature-name]
# or
git checkout -b fix/[bug-name]
```

**Branch naming convention**: [Explain convention]

### 2. Make Changes

**Follow the process in [MASTER_SCRIPT.md](../architecture/MASTER_SCRIPT.md)**:

1. [ ] Plan the feature
2. [ ] Implement following patterns in [CORE_PATTERNS.md](../architecture/CORE_PATTERNS.md)
3. [ ] Write tests
4. [ ] Test manually
5. [ ] Update documentation (if needed)

### 3. Commit Changes

```bash
git add .
git commit -m "[type]: [description]"
```

**Commit message format**: [Explain format]

**Examples**:
- `feat: add user profile page`
- `fix: resolve login redirect issue`
- `docs: update API documentation`

### 4. Push Changes

```bash
git push origin feature/[feature-name]
```

### 5. Create Pull Request

**PR checklist**:
- [ ] All tests pass
- [ ] Code follows project patterns
- [ ] Documentation updated (if needed)
- [ ] No console errors/warnings
- [ ] Tested in [browsers/devices]
- [ ] [Other project-specific checks]

---

## Running Tests

### All Tests

```bash
[command to run all tests]
```

### Specific Test File

```bash
[command to run specific test]
```

### Watch Mode

```bash
[command to run tests in watch mode]
```

### Coverage

```bash
[command to run tests with coverage]
```

**Coverage goal**: [X]%

---

## Debugging

### Frontend Debugging

**Tools**:
- Browser DevTools
- [React DevTools | Vue DevTools | etc.]
- [Other tools]

**Common debugging steps**:
1. [Step 1]
2. [Step 2]

### Backend Debugging

**Tools**:
- [Debugger tool]
- Logging: [How logging works]

**Common debugging steps**:
1. [Step 1]
2. [Step 2]

---

## Before Submitting PR

**Run this checklist**:

```bash
# 1. Run linter
[lint command]

# 2. Run formatter
[format command]

# 3. Run tests
[test command]

# 4. Build (if applicable)
[build command]
```

**Manual checks**:
- [ ] Feature works as expected
- [ ] No console errors
- [ ] No broken links/images
- [ ] Responsive (if UI)
- [ ] Accessible (if UI)
- [ ] [Other checks]

---

## Ending Your Day

### 1. Commit Work in Progress

```bash
git add .
git commit -m "WIP: [what you're working on]"
git push origin feature/[feature-name]
```

### 2. Update Task Tracker (if applicable)

- [ ] Update ticket status
- [ ] Add notes on progress
- [ ] Flag blockers

---

## Common Commands Reference

| Task | Command |
|------|---------|
| Start dev server | `[command]` |
| Run tests | `[command]` |
| Run linter | `[command]` |
| Format code | `[command]` |
| Build | `[command]` |
| [Other task] | `[command]` |
```

**Deliverable 3**: Create `documentation/setup/TROUBLESHOOTING.md`:

```markdown
# Troubleshooting Guide

**Last Updated**: [Date]

---

## Common Issues

### Issue 1: [Most common problem]

**Symptoms**:
- [What you see]
- [Error message]

**Cause**: [Why it happens]

**Solution**:

```bash
# Step 1
[command]

# Step 2
[command]
```

**Verify it's fixed**: [How to check]

**Prevention**: [How to avoid this in the future]

---

### Issue 2: [Second most common problem]

[Same structure]

---

[Continue for all common issues you've encountered]

---

## Error Messages Explained

### Error: "[Actual error message]"

**What it means**: [Plain English explanation]

**Common causes**:
1. [Cause 1]
2. [Cause 2]

**How to fix**:
- If [cause 1]: [Solution]
- If [cause 2]: [Solution]

---

### Error: "[Another actual error message]"

[Same structure]

---

## Platform-Specific Issues

### macOS

**Issue**: [macOS-specific problem]
**Solution**: [How to fix]

### Windows

**Issue**: [Windows-specific problem]
**Solution**: [How to fix]

### Linux

**Issue**: [Linux-specific problem]
**Solution**: [How to fix]

---

## Performance Issues

### Issue: Slow Development Server

**Symptoms**: [What you experience]

**Possible causes**:
1. [Cause 1]
2. [Cause 2]

**Solutions**:
- [Solution 1]
- [Solution 2]

---

### Issue: Slow Build Times

**Symptoms**: [What you experience]

**Solutions**:
- [Solution 1]
- [Solution 2]

---

## Database Issues

### Issue: Database Connection Failed

**Error message**:
```
[actual error]
```

**Solutions**:
1. [Solution 1]
2. [Solution 2]

---

### Issue: Migration Failed

**Error message**:
```
[actual error]
```

**Solutions**:
1. [Solution 1]
2. [Solution 2]

---

## Dependency Issues

### Issue: Package Installation Failed

**Error message**:
```
[actual error]
```

**Solutions**:
1. Clear cache: `[command]`
2. Delete node_modules: `[command]`
3. Reinstall: `[command]`

---

### Issue: Version Conflicts

**Error message**:
```
[actual error]
```

**Solutions**:
1. [Solution 1]
2. [Solution 2]

---

## Getting Help

**If none of these solutions work**:

1. **Search existing issues**:
   - GitHub Issues: [link]
   - Stack Overflow: [search query]

2. **Ask for help**:
   - Team chat: [link]
   - Forum: [link]

3. **Create new issue**:
   - Include:
     - What you tried to do
     - What happened instead
     - Full error message (copy-paste, not screenshot)
     - Your environment:
       ```
       OS: [macOS | Windows | Linux]
       Node version: [version]
       [Other relevant versions]
       ```
     - Steps to reproduce
     - What you've already tried

---

## Emergency Fixes

### Nuclear Option: Complete Reset

**⚠️ WARNING**: This will delete all local changes!

```bash
# 1. Stash or commit your work first!
git stash

# 2. Reset to clean state
git reset --hard origin/main

# 3. Clean everything
[commands to clean build artifacts, dependencies, etc.]

# 4. Reinstall
[commands to reinstall everything]

# 5. Restore your work
git stash pop
```

**When to use**: Only when nothing else works and you're desperate!
```

**When complete**: Share all three files and wait for my review.

---

## 🎯 FINAL DELIVERABLE: IMPROVEMENTS MASTER LIST

After completing all 7 phases, create one final file that consolidates all the improvements you noted:

**File**: `documentation/architecture/IMPROVEMENTS_NEEDED.md`

```markdown
# Master List of Improvements Needed

**Last Updated**: [Date]

**Purpose**: This document tracks all code improvements, refactoring needs, and technical debt identified during documentation process.

---

## 📊 Code Quality Rating

### BEFORE Documentation (Current State)

**Overall Score**: [X]/100

| Category | Score | Notes |
|----------|-------|-------|
| **Code Organization** | [X]/10 | [Brief assessment] |
| **Consistency** | [X]/10 | [Brief assessment] |
| **Documentation** | [X]/10 | [Brief assessment] |
| **Testing** | [X]/10 | [Brief assessment] |
| **Security** | [X]/10 | [Brief assessment] |
| **Performance** | [X]/10 | [Brief assessment] |
| **Maintainability** | [X]/10 | [Brief assessment] |
| **Error Handling** | [X]/10 | [Brief assessment] |
| **Dependencies** | [X]/10 | [Brief assessment] |
| **Best Practices** | [X]/10 | [Brief assessment] |

**Strengths**:
- ✅ [What's working well]
- ✅ [What's working well]

**Weaknesses**:
- ❌ [What needs improvement]
- ❌ [What needs improvement]

**Technical Debt Level**: [LOW | MEDIUM | HIGH | CRITICAL]

---

### AFTER Improvements (Target State)

**Target Score**: [X]/100

| Category | Current | Target | Improvement |
|----------|---------|--------|-------------|
| **Code Organization** | [X]/10 | [Y]/10 | +[Z] |
| **Consistency** | [X]/10 | [Y]/10 | +[Z] |
| **Documentation** | [X]/10 | [Y]/10 | +[Z] |
| **Testing** | [X]/10 | [Y]/10 | +[Z] |
| **Security** | [X]/10 | [Y]/10 | +[Z] |
| **Performance** | [X]/10 | [Y]/10 | +[Z] |
| **Maintainability** | [X]/10 | [Y]/10 | +[Z] |
| **Error Handling** | [X]/10 | [Y]/10 | +[Z] |
| **Dependencies** | [X]/10 | [Y]/10 | +[Z] |
| **Best Practices** | [X]/10 | [Y]/10 | +[Z] |

**Expected Improvement**: +[Z] points ([X]%)

**Timeline to Achieve**: [Estimate based on improvement priorities]

---

## Summary

**Total Issues**: [Number]

**By Priority**:
- 🔴 CRITICAL: [Number]
- 🟠 HIGH: [Number]
- 🟡 MEDIUM: [Number]
- 🟢 LOW: [Number]

**By Category**:
- Code Quality: [Number]
- Performance: [Number]
- Security: [Number]
- Consistency: [Number]
- Documentation: [Number]

---

## 🔴 CRITICAL Priority

### CRITICAL-001: [Issue Title]

**Location**: `path/to/file.js:123`

**Category**: [Code Quality | Performance | Security | Consistency]

**Issue**: [Detailed description]

**Current Code**:
```[language]
[actual bad code]
```

**Recommended Fix**:
```[language]
[better code]
```

**Impact**: [What happens if not fixed]

**Effort**: [Small | Medium | Large]

**Related Issues**: [Links to other issues]

---

[Repeat for each CRITICAL issue]

---

## 🟠 HIGH Priority

[Same structure]

---

## 🟡 MEDIUM Priority

[Same structure]

---

## 🟢 LOW Priority

[Same structure]

---

## Implementation Plan

### Phase 1: Critical Issues (Do First)
**Estimated Impact**: +[X] points
**Estimated Time**: [X] hours/days

- [ ] CRITICAL-001
- [ ] CRITICAL-002

**After Phase 1**: Expected score: [X]/100

---

### Phase 2: High Priority
**Estimated Impact**: +[X] points
**Estimated Time**: [X] hours/days

- [ ] HIGH-001
- [ ] HIGH-002

**After Phase 2**: Expected score: [X]/100

---

### Phase 3: Medium Priority
**Estimated Impact**: +[X] points
**Estimated Time**: [X] hours/days

- [ ] MEDIUM-001
- [ ] MEDIUM-002

**After Phase 3**: Expected score: [X]/100

---

### Phase 4: Low Priority (Nice to Have)
**Estimated Impact**: +[X] points
**Estimated Time**: [X] hours/days

- [ ] LOW-001
- [ ] LOW-002

**After Phase 4**: Expected score: [X]/100 (Target achieved!)

---

## Progress Tracking

**Current Score**: [X]/100 (Updated as improvements are implemented)

**Last Updated**: [Date]

**Improvements Completed**: [X]/[Total]

**Score History**:
- [Date]: [Score]/100 - Initial assessment
- [Date]: [Score]/100 - After Phase 1
- [Date]: [Score]/100 - After Phase 2
- [Date]: [Score]/100 - After Phase 3
- [Date]: [Score]/100 - Final score

---

## Notes

[Any additional context or considerations]
```

---

## 📊 PROGRESS TRACKING

Use this checklist to track your progress:

### Phase 1: Initial Analysis
- [ ] Scanned entire codebase
- [ ] Identified tech stack
- [ ] Mapped project structure
- [ ] Listed major features
- [ ] Created INITIAL_ANALYSIS.md
- [ ] ✅ **REVIEWED AND APPROVED**

### Phase 2: File Tree
- [ ] Generated complete file tree
- [ ] Explained all directories
- [ ] Documented naming conventions
- [ ] Identified file organization issues
- [ ] Created FILE_TREE.md
- [ ] ✅ **REVIEWED AND APPROVED**

### Phase 3: Tech Stack
- [ ] Listed all dependencies
- [ ] Categorized dependencies
- [ ] Documented versions
- [ ] Identified outdated/redundant packages
- [ ] Created TECH_STACK.md
- [ ] ✅ **REVIEWED AND APPROVED**

### Phase 4: Core Patterns
- [ ] Identified common patterns
- [ ] Extracted real code examples
- [ ] Documented best practices
- [ ] Noted inconsistencies
- [ ] Created CORE_PATTERNS.md
- [ ] ✅ **REVIEWED AND APPROVED**

### Phase 5: Master Script
- [ ] Defined development philosophy
- [ ] Documented feature development process
- [ ] Established quality standards
- [ ] Created decision trees
- [ ] Created MASTER_SCRIPT.md
- [ ] ✅ **REVIEWED AND APPROVED**

### Phase 6: Workflows
- [ ] Selected top features to document
- [ ] Mapped user flows
- [ ] Mapped technical flows
- [ ] Extracted code examples
- [ ] Created workflow docs (3-5 features)
- [ ] ✅ **REVIEWED AND APPROVED**

### Phase 7: Setup & Troubleshooting
- [ ] Documented first-time setup
- [ ] Documented daily workflow
- [ ] Collected common issues
- [ ] Created GETTING_STARTED.md
- [ ] Created DEVELOPMENT_WORKFLOW.md
- [ ] Created TROUBLESHOOTING.md
- [ ] ✅ **REVIEWED AND APPROVED**

### Final: Improvements List
- [ ] Consolidated all improvement notes
- [ ] Prioritized issues
- [ ] Created implementation plan
- [ ] Created IMPROVEMENTS_NEEDED.md
- [ ] ✅ **REVIEWED AND APPROVED**

---

## 🎉 COMPLETION

**When all phases are complete**:

1. You will have a world-class documentation system
2. Any developer (human or AI) can understand your codebase
3. You have a clear roadmap for improvements
4. Future development will be faster and more consistent

**Next steps**:
1. Start implementing improvements from IMPROVEMENTS_NEEDED.md
2. Keep documentation updated as code changes
3. Use MASTER_SCRIPT.md as your development guide
4. Reference CORE_PATTERNS.md when building new features

---

## 💡 TIPS FOR SUCCESS

1. **Be thorough** - Don't rush through phases
2. **Use real code** - No placeholders or theoretical examples
3. **Ask questions** - If something is unclear, ask the developer
4. **Note everything** - Every improvement, every inconsistency
5. **Wait for approval** - Don't move to next phase until current is reviewed
6. **Stay organized** - Follow the structure exactly
7. **Be honest** - Document what IS, not what SHOULD BE

---

**Remember**: We are NOT changing code yet. This is pure documentation. Code improvements come later!
```

---

## HOW TO USE THIS PROMPT

---

## HOW TO USE THIS PROMPT

### For Your School Project (or Any Project):

**Step 1: Copy the Prompt**

Copy everything between the "THE MASTER PROMPT" markers (from line starting with "I need you to analyze..." to the line ending with "...Code improvements come later!")

**Step 2: Start Fresh Chat**

Open a new chat with your LLM (ChatGPT, Claude, etc.) and paste the entire prompt.

**Step 3: Go Phase by Phase**

The LLM will start with Phase 1. Complete it fully, review the output, approve it, then move to Phase 2.

**DO NOT** try to do all phases at once - this is a marathon, not a sprint!

**Step 4: Review Each Phase**

After each phase, the LLM will wait for your approval. Review the documentation carefully:
- Is it accurate?
- Does it use real code from your project?
- Are there any mistakes?
- Is anything missing?

**Step 5: Iterate**

If something isn't right, ask the LLM to fix it before moving to the next phase.

**Step 6: Keep It Updated**

After all phases are complete, update the documentation as your project evolves.

---

## EXPECTED TIMELINE

### Phase-by-Phase Breakdown:

| Phase | Time | What You'll Get |
|-------|------|-----------------|
| **Phase 1**: Initial Analysis | 15-30 min | Understanding of your codebase |
| **Phase 2**: File Tree | 20-40 min | Complete file structure map |
| **Phase 3**: Tech Stack | 30-60 min | Every dependency documented |
| **Phase 4**: Core Patterns | 1-2 hours | Reusable code patterns |
| **Phase 5**: Master Script | 1-2 hours | Development methodology |
| **Phase 6**: Workflows | 2-4 hours | 3-5 complete feature flows |
| **Phase 7**: Setup & Troubleshooting | 1-2 hours | Getting started guides |
| **Final**: Improvements List | 30 min | Consolidated improvement plan |

**Total Time**: 6-12 hours spread over multiple sessions

**Recommendation**: Do 1-2 phases per day over a week

---

## WHAT YOU'LL HAVE WHEN DONE

```
documentation/
├── architecture/
│   ├── MASTER_SCRIPT.md          ⭐ Your development bible
│   ├── TECH_STACK.md             📚 Every technology explained
│   ├── FILE_TREE.md              🗺️ Complete codebase map
│   ├── PROJECT_STRUCTURE.md      🏗️ How code is organized
│   ├── CORE_PATTERNS.md          🎨 Reusable patterns
│   ├── INITIAL_ANALYSIS.md       🔍 Initial findings
│   └── IMPROVEMENTS_NEEDED.md    🔧 Roadmap for improvements
├── workflows/
│   ├── FEATURE_1_FLOW.md         📖 Complete feature documentation
│   ├── FEATURE_2_FLOW.md         📖 Complete feature documentation
│   └── FEATURE_3_FLOW.md         📖 Complete feature documentation
├── setup/
│   ├── GETTING_STARTED.md        🚀 First-time setup
│   ├── DEVELOPMENT_WORKFLOW.md   💼 Daily workflow
│   └── TROUBLESHOOTING.md        🔧 Common issues & fixes
└── testing/
    ├── TESTING_GUIDE.md          ✅ How to test
    └── TEST_PATTERNS.md          🧪 Test examples
```

---

## BENEFITS YOU'LL SEE IMMEDIATELY

### 1. **No More "Shooting in the Dark"**

**Before**:
- "Wait, what tech stack am I using again?"
- "Where does this file go?"
- "How did I implement that other feature?"

**After**:
- Check TECH_STACK.md
- Check FILE_TREE.md
- Check workflows/FEATURE_FLOW.md

### 2. **AI Assistance Actually Works**

**Before**:
```
You: "Add a new user profile feature"
AI: *Guesses patterns, creates inconsistent code*
```

**After**:
```
You: "Add a new user profile feature following the patterns in CORE_PATTERNS.md"
AI: *Follows established patterns, creates consistent code*
```

### 3. **Onboarding Takes Minutes, Not Days**

**Before**: "Let me figure out how this codebase works..." (3 days later still confused)

**After**: "Let me read MASTER_SCRIPT.md and GETTING_STARTED.md" (productive in 1 hour)

### 4. **Clear Improvement Roadmap**

**Before**: Vague feeling that code could be better

**After**: IMPROVEMENTS_NEEDED.md with prioritized list of exactly what to fix

---

## EXAMPLE CONVERSATION FLOW

**You**: [Paste the master prompt]

**LLM**:
```
I'll help you create comprehensive documentation for your project!

⚠️ IMPORTANT REMINDERS:
- We will NOT change any code
- We will document what exists
- We will note improvements for later
- We will go phase by phase

Let's start with Phase 1: Initial Codebase Analysis

Please answer these questions:
1. What type of project is this? (web app, mobile app, API, etc.)
2. What is the main purpose of this project?
3. What programming language(s) are used?
4. Are there any specific areas that confuse you?
```

**You**:
```
1. It's a web app
2. It's a task management app for students
3. React frontend, Node.js/Express backend, MongoDB database
4. I don't remember how authentication works or where files should go
```

**LLM**:
```
Perfect! I'll analyze your codebase and create INITIAL_ANALYSIS.md.

[Scans codebase]

I've created the initial analysis. Here's what I found:

[Shows INITIAL_ANALYSIS.md content]

Key findings:
- React 18.2 frontend with React Router
- Express 4.18 backend with JWT authentication
- MongoDB with Mongoose ORM
- 5 major features identified: Auth, Tasks, Projects, Teams, Notifications

Questions before I finalize:
1. Is the authentication using JWT tokens? (I see jwt-simple in dependencies)
2. Are you using any state management library? (I don't see Redux/Zustand)

Please review and let me know if this looks accurate. Once approved, we'll move to Phase 2: File Tree Documentation.
```

**You**:
```
Yes, JWT tokens for auth. No state management library, just React Context.
Looks good, let's move to Phase 2!
```

**LLM**:
```
Great! Moving to Phase 2: Complete File Tree Documentation

[Generates FILE_TREE.md]

I've created a complete file tree with explanations for each directory...

[Shows FILE_TREE.md content]

I also noted some inconsistencies:
- Some components use PascalCase, others use kebab-case
- Test files are scattered (some in __tests__, some next to components)

These are documented in the "IMPROVEMENT NEEDED" section.

Please review. Once approved, we'll move to Phase 3: Tech Stack Deep Dive.
```

[Continue through all 7 phases...]

---

## TIPS FOR SUCCESS

### 1. **Don't Rush**

This is a comprehensive process. Take your time with each phase.

### 2. **Be Honest with the LLM**

If you don't know something, say so. The LLM will document what it finds and ask questions.

### 3. **Review Carefully**

The LLM might make mistakes. Review each phase before approving.

### 4. **Use Real Code**

Make sure the LLM is using actual code from your project, not placeholders.

### 5. **Ask Questions**

If something in the documentation is unclear, ask the LLM to clarify.

### 6. **Keep It Updated**

After completing all phases, update docs as your code changes.

### 7. **Share with Your Team**

If it's a group project, share the documentation with your teammates.

---

## CUSTOMIZATION FOR DIFFERENT PROJECTS

### Web App (React/Vue/Angular)
- Focus on component patterns
- Document state management
- Map API integration
- Document routing

### Mobile App (React Native/Flutter)
- Focus on navigation
- Document native modules
- Map platform-specific code
- Document build process

### Backend API (Node/Python/Go)
- Focus on endpoint patterns
- Document authentication
- Map database queries
- Document middleware

### Data Science (Python/R)
- Focus on data pipelines
- Document model training
- Map experiment tracking
- Document data sources

### Desktop App (Electron/Tauri)
- Focus on IPC patterns
- Document native integrations
- Map build process
- Document auto-updates

---

## AFTER COMPLETION

### Immediate Next Steps:

1. **Read MASTER_SCRIPT.md** - This is your new development guide
2. **Bookmark key files** - CORE_PATTERNS.md, FILE_TREE.md, TECH_STACK.md
3. **Share with team** - If group project, get everyone on same page
4. **Start using it** - Reference docs when building new features

### Long-Term Maintenance:

1. **Update after major changes** - New feature? Update workflows/
2. **Fix improvements** - Work through IMPROVEMENTS_NEEDED.md
3. **Keep it current** - Documentation should match reality
4. **Expand as needed** - Add new patterns, workflows, troubleshooting

---

## TROUBLESHOOTING THE DOCUMENTATION PROCESS

### Issue: LLM is using placeholder code instead of real code

**Solution**: Remind it to use actual code from the codebase. Say "Please use real code from [specific file], not placeholder code."

### Issue: LLM is trying to change code

**Solution**: Remind it "We are ONLY documenting, not changing code. Note improvements in IMPROVEMENT NEEDED sections."

### Issue: Documentation is too generic

**Solution**: Ask for more specifics. "Can you provide the actual file paths and real code examples from my project?"

### Issue: LLM is going too fast

**Solution**: "Let's slow down. Complete Phase [X] fully before moving to Phase [Y]."

### Issue: Documentation doesn't match reality

**Solution**: "This doesn't match my codebase. Let me clarify: [explain what's actually there]"

---

## SUCCESS METRICS

**You'll know the documentation is working when**:

1. ✅ You can onboard a new developer in < 1 hour
2. ✅ You can find any file/pattern in < 30 seconds
3. ✅ AI assistance produces consistent code
4. ✅ You remember how your own code works
5. ✅ New features follow established patterns
6. ✅ You have a clear improvement roadmap

---

## FINAL THOUGHTS

This documentation system is based on **real-world experience** from the Hangg mobile project, which went from "shooting in the dark" to having a crystal-clear development process.

**The key insight**: Good documentation isn't just reference material - it's a **development system** that makes every future task easier.

**Time investment**: 6-12 hours upfront

**Time saved**: Hundreds of hours over the project lifetime

**ROI**: Massive

---

**Ready to get started? Copy the prompt and let's build your documentation system!** 🚀

