# Slash Command Feature - Technical Specification

**Version:** 1.0 MVP  
**Date:** January 27, 2026  
**Purpose:** Technical implementation guide for inline content contribution system

---

## Executive Summary

The slash command system enables users to contribute problems, solutions, and guidance directly from the code editor while solving challenges. This creates a continuous feedback loop where user insights improve the platform's teaching quality.

**Core Innovation:** Transform the code editor into a content authoring tool, capturing insights at the moment of learning.

---

## System Architecture

### High-Level Flow

```
User types in editor → Command detected → Parsed & validated → 
Stored with context → Auto-linked to related items → 
Notification shown → Editor cleared
```

### Components

```
┌─────────────────────────────────────────────────────┐
│                 Code Editor (Monaco)                │
│  - Keystroke detection                              │
│  - Command parsing                                  │
│  - Autocomplete UI                                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│            SlashCommandHandler                      │
│  - Parse command syntax                             │
│  - Validate input                                   │
│  - Execute command                                  │
│  - Trigger notifications                            │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│           ContributionService                       │
│  - Store contributions                              │
│  - Auto-link problems → solutions                   │
│  - Capture context                                  │
│  - AI categorization                                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│              Database Layer                         │
│  - inline_contributions table                       │
│  - contribution_links table                         │
│  - sessions, attempts tables                        │
└─────────────────────────────────────────────────────┘
```

---

## Data Models

### Database Schema

```sql
-- Inline contributions (slash commands)
CREATE TABLE inline_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  user_id UUID NOT NULL,
  problem_id UUID NOT NULL,
  
  -- Command details
  command VARCHAR(20) NOT NULL, -- 'problem', 'solution', 'guidance'
  subcommand VARCHAR(20), -- 'new', 'edit', 'list', etc.
  content TEXT NOT NULL,
  
  -- Timing
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  time_since_start INTEGER, -- milliseconds since session start
  current_attempt INTEGER,
  
  -- Context capture
  context JSONB NOT NULL,
  -- {
  --   code: "current code snapshot",
  --   attemptNumber: 3,
  --   testResult: { passed: 0, total: 5 },
  --   lastError: "Wrong Answer",
  --   timeStuck: 292333,
  --   recentChanges: ["line 6: left += 1"]
  -- }
  
  -- References (for linking)
  references JSONB,
  -- {
  --   problems: ["prob_123", "prob_456"],
  --   solutions: ["sol_789"],
  --   guidance: ["guid_012"]
  -- }
  
  -- AI categorization
  suggested_category VARCHAR(50),
  related_pattern VARCHAR(50),
  related_invariant VARCHAR(50),
  
  -- Community metrics
  helpful_votes INTEGER DEFAULT 0,
  used_in_guidance BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contributions_session ON inline_contributions(session_id);
CREATE INDEX idx_contributions_user ON inline_contributions(user_id);
CREATE INDEX idx_contributions_problem ON inline_contributions(problem_id);
CREATE INDEX idx_contributions_command ON inline_contributions(command);
CREATE INDEX idx_contributions_timestamp ON inline_contributions(timestamp DESC);

-- Contribution links (problems → solutions → guidance)
CREATE TABLE contribution_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_contribution_id UUID NOT NULL REFERENCES inline_contributions(id) ON DELETE CASCADE,
  to_contribution_id UUID NOT NULL REFERENCES inline_contributions(id) ON DELETE CASCADE,
  link_type VARCHAR(20) NOT NULL, -- 'solves', 'references', 'extends'
  
  -- Auto-generated or manual
  auto_generated BOOLEAN DEFAULT FALSE,
  confidence_score FLOAT, -- 0-1 for auto-generated links
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_link UNIQUE(from_contribution_id, to_contribution_id, link_type)
);

CREATE INDEX idx_links_from ON contribution_links(from_contribution_id);
CREATE INDEX idx_links_to ON contribution_links(to_contribution_id);
```

### TypeScript Interfaces

```typescript
// Core contribution type
interface InlineContribution {
  id: string
  sessionId: string
  userId: string
  problemId: string
  
  command: 'problem' | 'solution' | 'guidance'
  subcommand: string
  content: string
  
  timestamp: Date
  timeSinceStart: number
  currentAttempt: number
  
  context: ContributionContext
  references?: ContributionReferences
  
  suggestedCategory?: string
  relatedPattern?: string
  relatedInvariant?: string
  
  helpfulVotes: number
  usedInGuidance: boolean
  
  createdAt: Date
  updatedAt: Date
}

interface ContributionContext {
  code: string
  attemptNumber: number
  testResult: {
    passed: number
    total: number
    error?: string
  }
  lastError?: string
  timeStuck?: number
  recentChanges: string[]
  codeAnalysis?: {
    hasNestedLoops: boolean
    pointerInit?: any
    loopCondition?: string
    // ... other AST analysis
  }
}

interface ContributionReferences {
  problems?: string[]
  solutions?: string[]
  guidance?: string[]
}

interface ContributionLink {
  id: string
  fromContributionId: string
  toContributionId: string
  linkType: 'solves' | 'references' | 'extends'
  autoGenerated: boolean
  confidenceScore?: number
  createdAt: Date
}

// Command parsing
interface ParsedCommand {
  command: 'problem' | 'solution' | 'guidance'
  subcommand?: string
  content: string
  references?: string[]
  valid: boolean
  error?: string
}
```

---

## Command Syntax

### Overview

```
/problem <subcommand> "content"
/solution <subcommand> "content"
/guidance [/select refs...] "content"
```

### Detailed Specifications

#### 1. `/problem` Command

**Purpose:** Capture confusion moments, questions, blockers

**Syntax:**
```
/problem new "What I'm stuck on"
/problem list
/problem edit prob_123 "Updated text"
/problem link sol_456
```

**Examples:**
```javascript
// Capture new problem
/problem new "I don't know which pointer to move"

// List all problems from this session
/problem list

// Edit existing problem
/problem edit prob_42 "I don't understand the move logic"

// Link to a solution
/problem link sol_18
```

**Validation Rules:**
- Content must be 10-500 characters
- Command must be on its own line
- Content must be in quotes
- Subcommand must be valid: new, list, edit, link

**Response:**
```
✓ Problem captured (prob_42)
"I don't know which pointer to move"

Context saved:
• Current code
• Attempt #3
• 4.8 minutes on this attempt

We'll help you link this to your solution when you figure it out!
```

---

#### 2. `/solution` Command

**Purpose:** Capture breakthrough moments, insights, "aha" moments

**Syntax:**
```
/solution new "What I figured out"
/solution list
/solution edit sol_123 "Updated insight"
/solution link prob_456
```

**Examples:**
```javascript
// Capture breakthrough
/solution new "I need to start at widest position, not both at 0!"

// List all solutions
/solution list

// Edit solution
/solution edit sol_18 "Start right pointer at len(positions)-1"

// Link to specific problem
/solution link prob_42
```

**Auto-Linking Logic:**
```typescript
async function autoLinkSolution(solutionId: string, sessionId: string) {
  // Get recent problems from this session (last 5)
  const recentProblems = await db.contributions.findMany({
    where: {
      sessionId,
      command: 'problem',
      timestamp: {
        gte: new Date(Date.now() - 30 * 60 * 1000) // last 30 min
      }
    },
    orderBy: { timestamp: 'desc' },
    take: 5
  })
  
  // Auto-link to all recent problems
  for (const problem of recentProblems) {
    await db.contributionLinks.create({
      data: {
        fromContributionId: solutionId,
        toContributionId: problem.id,
        linkType: 'solves',
        autoGenerated: true,
        confidenceScore: calculateConfidence(problem, solution)
      }
    })
  }
  
  return recentProblems
}
```

**Confidence Calculation:**
```typescript
function calculateConfidence(problem: Contribution, solution: Contribution): number {
  let score = 0.5 // base confidence
  
  // Same session = higher confidence
  if (problem.sessionId === solution.sessionId) {
    score += 0.2
  }
  
  // Close in time = higher confidence
  const timeDiff = solution.timestamp - problem.timestamp
  if (timeDiff < 10 * 60 * 1000) { // < 10 minutes
    score += 0.2
  } else if (timeDiff < 30 * 60 * 1000) { // < 30 minutes
    score += 0.1
  }
  
  // Code similarity (check if problem area was changed in solution)
  // ... more complex analysis
  
  return Math.min(score, 1.0)
}
```

**Response:**
```
✓ Solution captured (sol_18)
"I need to start at widest position, not both at 0!"

Auto-linked to:
• prob_42: "I don't know which pointer to move"

Code change detected:
• Line 3: right = 0 → right = len(positions) - 1

This took 4.8 minutes to figure out!
```

---

#### 3. `/guidance` Command

**Purpose:** Create teaching advice that references problems and solutions

**Syntax:**
```
/guidance /select ref1 ref2 ... "Teaching advice"
/guidance /category key_concepts "Content"
/guidance list
/guidance edit guid_123 "Updated guidance"
```

**Examples:**
```javascript
// Create guidance with references
/guidance /select prob_42 sol_18 "Start two pointers at widest position first"

// Create with explicit category
/guidance /category common_mistakes "Don't start both pointers at 0"

// List all guidance
/guidance list

// Edit existing
/guidance edit guid_7 "Updated teaching advice"
```

**Reference Resolution:**
```typescript
async function parseReferences(
  refStrings: string[], 
  sessionId: string
): Promise<ContributionReferences> {
  const refs: ContributionReferences = {
    problems: [],
    solutions: [],
    guidance: []
  }
  
  for (const refStr of refStrings) {
    // Direct ID reference: prob_42, sol_18, guid_7
    if (refStr.match(/^(prob|sol|guid)_\d+$/)) {
      const contribution = await db.contributions.findUnique({
        where: { id: refStr }
      })
      
      if (contribution) {
        if (contribution.command === 'problem') {
          refs.problems.push(refStr)
        } else if (contribution.command === 'solution') {
          refs.solutions.push(refStr)
        } else if (contribution.command === 'guidance') {
          refs.guidance.push(refStr)
        }
      }
    }
    
    // Keyword search: "both pointers" finds related problems/solutions
    else {
      const matches = await db.contributions.search({
        sessionId,
        query: refStr,
        limit: 3
      })
      
      for (const match of matches) {
        if (match.command === 'problem') {
          refs.problems.push(match.id)
        } else if (match.command === 'solution') {
          refs.solutions.push(match.id)
        }
      }
    }
  }
  
  return refs
}
```

**AI Categorization:**
```typescript
async function categorizGuidance(
  content: string,
  references: ContributionReferences,
  context: ContributionContext
): Promise<AICategorizationResult> {
  // Call AI service to suggest category
  const prompt = `
Given this teaching guidance:
"${content}"

Referenced problems:
${references.problems.map(p => p.content).join('\n')}

Referenced solutions:
${references.solutions.map(s => s.content).join('\n')}

Suggest:
1. Category: key_concepts, common_mistakes, real_world, solution_approach
2. Related pattern: two-pointers, sliding-window, dynamic-programming, etc.
3. Related invariant: pointer-bounds, move-bottleneck, etc.

Respond in JSON format.
`

  const response = await ai.complete(prompt)
  
  return {
    category: response.category,
    pattern: response.pattern,
    invariant: response.invariant
  }
}
```

**Response:**
```
✓ Guidance created (guid_7)
"Start two pointers at widest position first"

References:
• Problem: "I don't know which pointer to move"
• Solution: "I need to start at widest position..."

Suggested category: key_concepts
Related pattern: two-pointers
Related invariant: pointer-initialization

[Confirm] [Edit Category]
```

---

## Frontend Implementation

### 1. Command Detection System

```typescript
// hooks/useSlashCommands.ts
import { useEffect, useState } from 'react'
import { editor } from 'monaco-editor'

export function useSlashCommands(
  editorInstance: editor.IStandaloneCodeEditor,
  sessionId: string,
  problemId: string
) {
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [commandLine, setCommandLine] = useState('')
  const [cursorPosition, setCursorPosition] = useState<{ row: number, col: number }>()
  
  useEffect(() => {
    if (!editorInstance) return
    
    // Listen for keypress events
    const disposable = editorInstance.onDidChangeModelContent((e) => {
      const position = editorInstance.getPosition()
      if (!position) return
      
      const lineContent = editorInstance.getModel()?.getLineContent(position.lineNumber) || ''
      
      // Detect slash at start of line
      if (lineContent.trim().startsWith('/')) {
        setShowAutocomplete(true)
        setCommandLine(lineContent.trim())
        setCursorPosition({ row: position.lineNumber, col: position.column })
      } else if (showAutocomplete) {
        setShowAutocomplete(false)
      }
    })
    
    // Listen for Enter key to execute command
    const keyDisposable = editorInstance.onKeyDown((e) => {
      if (e.keyCode === KeyCode.Enter && showAutocomplete && commandLine) {
        e.preventDefault()
        executeCommand(commandLine)
      }
    })
    
    return () => {
      disposable.dispose()
      keyDisposable.dispose()
    }
  }, [editorInstance, showAutocomplete, commandLine])
  
  async function executeCommand(cmdLine: string) {
    const parsed = parseCommand(cmdLine)
    
    if (!parsed.valid) {
      showError(parsed.error)
      return
    }
    
    try {
      const result = await handleCommand(parsed, {
        sessionId,
        problemId,
        editorInstance,
        getCurrentContext: () => captureContext(editorInstance, sessionId)
      })
      
      // Clear the command line
      if (cursorPosition) {
        const model = editorInstance.getModel()
        model?.applyEdits([{
          range: {
            startLineNumber: cursorPosition.row,
            startColumn: 1,
            endLineNumber: cursorPosition.row,
            endColumn: model.getLineMaxColumn(cursorPosition.row)
          },
          text: ''
        }])
      }
      
      // Show success notification
      showNotification(result)
      
      setShowAutocomplete(false)
      setCommandLine('')
      
    } catch (error) {
      showError(error.message)
    }
  }
  
  return {
    showAutocomplete,
    commandLine,
    executeCommand
  }
}
```

---

### 2. Command Parser

```typescript
// utils/commandParser.ts

export function parseCommand(line: string): ParsedCommand {
  // Remove leading/trailing whitespace
  line = line.trim()
  
  // Must start with /
  if (!line.startsWith('/')) {
    return {
      valid: false,
      error: 'Command must start with /'
    }
  }
  
  // Parse /problem
  if (line.startsWith('/problem')) {
    return parseProblemCommand(line)
  }
  
  // Parse /solution
  if (line.startsWith('/solution')) {
    return parseSolutionCommand(line)
  }
  
  // Parse /guidance
  if (line.startsWith('/guidance')) {
    return parseGuidanceCommand(line)
  }
  
  return {
    valid: false,
    error: 'Unknown command. Use: /problem, /solution, or /guidance'
  }
}

function parseProblemCommand(line: string): ParsedCommand {
  // /problem new "content"
  const newMatch = line.match(/^\/problem\s+new\s+"([^"]+)"$/)
  if (newMatch) {
    return {
      command: 'problem',
      subcommand: 'new',
      content: newMatch[1],
      valid: true
    }
  }
  
  // /problem list
  if (line === '/problem list') {
    return {
      command: 'problem',
      subcommand: 'list',
      content: '',
      valid: true
    }
  }
  
  // /problem edit prob_123 "new content"
  const editMatch = line.match(/^\/problem\s+edit\s+(prob_\d+)\s+"([^"]+)"$/)
  if (editMatch) {
    return {
      command: 'problem',
      subcommand: 'edit',
      content: editMatch[2],
      references: [editMatch[1]],
      valid: true
    }
  }
  
  // /problem link sol_456
  const linkMatch = line.match(/^\/problem\s+link\s+(sol_\d+)$/)
  if (linkMatch) {
    return {
      command: 'problem',
      subcommand: 'link',
      content: '',
      references: [linkMatch[1]],
      valid: true
    }
  }
  
  return {
    valid: false,
    error: 'Invalid /problem syntax. Use: new "content", list, edit, or link'
  }
}

function parseSolutionCommand(line: string): ParsedCommand {
  // Similar to parseProblemCommand
  // /solution new "content"
  const newMatch = line.match(/^\/solution\s+new\s+"([^"]+)"$/)
  if (newMatch) {
    return {
      command: 'solution',
      subcommand: 'new',
      content: newMatch[1],
      valid: true
    }
  }
  
  // ... other subcommands
  
  return {
    valid: false,
    error: 'Invalid /solution syntax'
  }
}

function parseGuidanceCommand(line: string): ParsedCommand {
  // /guidance /select ref1 ref2 "content"
  const selectMatch = line.match(/^\/guidance\s+\/select\s+(.+?)\s+"([^"]+)"$/)
  if (selectMatch) {
    const refs = selectMatch[1].split(/\s+/)
    return {
      command: 'guidance',
      subcommand: 'select',
      content: selectMatch[2],
      references: refs,
      valid: true
    }
  }
  
  // /guidance /category key_concepts "content"
  const categoryMatch = line.match(/^\/guidance\s+\/category\s+(\w+)\s+"([^"]+)"$/)
  if (categoryMatch) {
    return {
      command: 'guidance',
      subcommand: 'category',
      content: categoryMatch[2],
      references: [categoryMatch[1]], // category as reference
      valid: true
    }
  }
  
  // ... other subcommands
  
  return {
    valid: false,
    error: 'Invalid /guidance syntax'
  }
}
```

---

### 3. Command Handler

```typescript
// services/commandHandler.ts

interface CommandContext {
  sessionId: string
  problemId: string
  editorInstance: editor.IStandaloneCodeEditor
  getCurrentContext: () => ContributionContext
}

export async function handleCommand(
  parsed: ParsedCommand,
  context: CommandContext
): Promise<CommandResult> {
  
  if (parsed.command === 'problem') {
    return handleProblemCommand(parsed, context)
  }
  
  if (parsed.command === 'solution') {
    return handleSolutionCommand(parsed, context)
  }
  
  if (parsed.command === 'guidance') {
    return handleGuidanceCommand(parsed, context)
  }
  
  throw new Error('Invalid command')
}

async function handleProblemCommand(
  parsed: ParsedCommand,
  context: CommandContext
): Promise<CommandResult> {
  
  if (parsed.subcommand === 'new') {
    // Create new problem
    const contribution = await api.contributions.create({
      sessionId: context.sessionId,
      problemId: context.problemId,
      command: 'problem',
      subcommand: 'new',
      content: parsed.content,
      timestamp: new Date(),
      timeSinceStart: getTimeSinceStart(context.sessionId),
      currentAttempt: getCurrentAttemptNumber(context.sessionId),
      context: context.getCurrentContext()
    })
    
    return {
      type: 'success',
      message: `✓ Problem captured (${contribution.id})`,
      details: [
        `"${parsed.content}"`,
        '',
        'Context saved:',
        '• Current code',
        `• Attempt #${contribution.currentAttempt}`,
        `• ${formatTime(contribution.context.timeStuck)} on this attempt`
      ],
      contributionId: contribution.id
    }
  }
  
  if (parsed.subcommand === 'list') {
    // List all problems from this session
    const problems = await api.contributions.findMany({
      where: {
        sessionId: context.sessionId,
        command: 'problem'
      },
      orderBy: { timestamp: 'desc' }
    })
    
    return {
      type: 'list',
      message: `📝 Your problems (${problems.length})`,
      items: problems.map(p => ({
        id: p.id,
        content: p.content,
        timestamp: p.timestamp
      }))
    }
  }
  
  // ... other subcommands
  
  throw new Error('Invalid problem subcommand')
}

async function handleSolutionCommand(
  parsed: ParsedCommand,
  context: CommandContext
): Promise<CommandResult> {
  
  if (parsed.subcommand === 'new') {
    // Create new solution
    const contribution = await api.contributions.create({
      sessionId: context.sessionId,
      problemId: context.problemId,
      command: 'solution',
      subcommand: 'new',
      content: parsed.content,
      timestamp: new Date(),
      timeSinceStart: getTimeSinceStart(context.sessionId),
      currentAttempt: getCurrentAttemptNumber(context.sessionId),
      context: context.getCurrentContext()
    })
    
    // Auto-link to recent problems
    const linkedProblems = await autoLinkSolution(
      contribution.id,
      context.sessionId
    )
    
    // Detect code changes
    const changes = detectCodeChanges(
      getPreviousCode(context.sessionId),
      context.editorInstance.getValue()
    )
    
    return {
      type: 'success',
      message: `✓ Solution captured (${contribution.id})`,
      details: [
        `"${parsed.content}"`,
        '',
        'Auto-linked to:',
        ...linkedProblems.map(p => `• ${p.id}: "${truncate(p.content, 40)}"`),
        '',
        'Code changes detected:',
        ...changes.map(c => `• ${c}`)
      ],
      contributionId: contribution.id
    }
  }
  
  // ... other subcommands
  
  throw new Error('Invalid solution subcommand')
}

async function handleGuidanceCommand(
  parsed: ParsedCommand,
  context: CommandContext
): Promise<CommandResult> {
  
  if (parsed.subcommand === 'select') {
    // Parse and resolve references
    const refs = await parseReferences(
      parsed.references || [],
      context.sessionId
    )
    
    // AI categorization
    const categorization = await categorizeGuidance(
      parsed.content,
      refs,
      context.getCurrentContext()
    )
    
    // Create guidance
    const contribution = await api.contributions.create({
      sessionId: context.sessionId,
      problemId: context.problemId,
      command: 'guidance',
      subcommand: 'select',
      content: parsed.content,
      timestamp: new Date(),
      timeSinceStart: getTimeSinceStart(context.sessionId),
      currentAttempt: getCurrentAttemptNumber(context.sessionId),
      context: context.getCurrentContext(),
      references: refs,
      suggestedCategory: categorization.category,
      relatedPattern: categorization.pattern,
      relatedInvariant: categorization.invariant
    })
    
    return {
      type: 'success',
      message: `✓ Guidance created (${contribution.id})`,
      details: [
        `"${parsed.content}"`,
        '',
        'References:',
        ...formatReferences(refs),
        '',
        `Suggested category: ${categorization.category}`,
        `Related pattern: ${categorization.pattern}`,
        `Related invariant: ${categorization.invariant}`
      ],
      contributionId: contribution.id,
      suggestedCategory: categorization.category
    }
  }
  
  // ... other subcommands
  
  throw new Error('Invalid guidance subcommand')
}
```

---

### 4. Autocomplete UI Component

```typescript
// components/SlashAutocomplete.tsx
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  visible: boolean
  commandLine: string
  onSelect: (suggestion: string) => void
}

export function SlashAutocomplete({ visible, commandLine, onSelect }: Props) {
  const suggestions = getSuggestions(commandLine)
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg"
          style={{
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '400px'
          }}
        >
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 mb-2">
              Slash Commands
            </div>
            
            {suggestions.map((suggestion, idx) => (
              <SuggestionItem
                key={idx}
                icon={suggestion.icon}
                command={suggestion.command}
                description={suggestion.description}
                example={suggestion.example}
                onClick={() => onSelect(suggestion.command)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SuggestionItem({ icon, command, description, example, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <div className="font-mono text-sm font-semibold text-gray-900">
            {command}
          </div>
          <div className="text-xs text-gray-600">
            {description}
          </div>
          {example && (
            <div className="text-xs text-gray-400 mt-1 font-mono">
              e.g. {example}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

function getSuggestions(commandLine: string): Suggestion[] {
  // Base suggestions
  const base = [
    {
      icon: '📝',
      command: '/problem new "..."',
      description: 'Capture what you\'re stuck on',
      example: '/problem new "I don\'t know which pointer to move"'
    },
    {
      icon: '💡',
      command: '/solution new "..."',
      description: 'Note your breakthrough',
      example: '/solution new "Start at widest position!"'
    },
    {
      icon: '🎓',
      command: '/guidance /select refs "..."',
      description: 'Create teaching advice',
      example: '/guidance /select prob_1 sol_1 "Start wide, narrow down"'
    }
  ]
  
  // Filter based on what's typed
  if (commandLine.startsWith('/problem')) {
    return [
      { icon: '📝', command: '/problem new "..."', description: 'Create new problem' },
      { icon: '📋', command: '/problem list', description: 'List all problems' },
      { icon: '✏️', command: '/problem edit prob_X "..."', description: 'Edit existing' },
      { icon: '🔗', command: '/problem link sol_X', description: 'Link to solution' }
    ]
  }
  
  if (commandLine.startsWith('/solution')) {
    return [
      { icon: '💡', command: '/solution new "..."', description: 'Create new solution' },
      { icon: '📋', command: '/solution list', description: 'List all solutions' },
      { icon: '✏️', command: '/solution edit sol_X "..."', description: 'Edit existing' },
      { icon: '🔗', command: '/solution link prob_X', description: 'Link to problem' }
    ]
  }
  
  if (commandLine.startsWith('/guidance')) {
    return [
      { icon: '🎓', command: '/guidance /select refs "..."', description: 'Create with references' },
      { icon: '🏷️', command: '/guidance /category X "..."', description: 'Create with category' },
      { icon: '📋', command: '/guidance list', description: 'List all guidance' }
    ]
  }
  
  return base
}
```

---

### 5. Notification System

```typescript
// components/CommandNotification.tsx
import { motion } from 'framer-motion'
import { Check, X, List } from 'lucide-react'

interface Props {
  result: CommandResult
  onDismiss: () => void
}

export function CommandNotification({ result, onDismiss }: Props) {
  if (result.type === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-4 right-4 bg-white border-l-4 border-green-500 rounded-lg shadow-xl p-4 max-w-md"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="font-semibold text-gray-900 mb-1">
              {result.message}
            </div>
            
            {result.details && (
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {result.details.join('\n')}
              </div>
            )}
            
            {result.suggestedCategory && (
              <div className="mt-2 flex gap-2">
                <button className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                  Confirm Category
                </button>
                <button className="text-sm px-3 py-1 text-gray-600 hover:text-gray-900">
                  Edit
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    )
  }
  
  if (result.type === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-xl p-4 max-w-md"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <List className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="font-semibold text-gray-900 mb-2">
              {result.message}
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {result.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="text-sm p-2 bg-gray-50 rounded"
                >
                  <div className="font-mono text-xs text-gray-500 mb-1">
                    {item.id}
                  </div>
                  <div className="text-gray-900">
                    {item.content}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatRelativeTime(item.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    )
  }
  
  return null
}
```

---

## Context Capture System

```typescript
// utils/contextCapture.ts

export function captureContext(
  editorInstance: editor.IStandaloneCodeEditor,
  sessionId: string
): ContributionContext {
  const code = editorInstance.getValue()
  const currentAttempt = getCurrentAttemptNumber(sessionId)
  const lastAttempt = getLastAttempt(sessionId)
  
  // Calculate time stuck on current attempt
  const timeStuck = lastAttempt 
    ? Date.now() - lastAttempt.timestamp.getTime()
    : 0
  
  // Detect recent code changes
  const previousCode = getPreviousCode(sessionId)
  const changes = detectCodeChanges(previousCode, code)
  
  // AST analysis
  const analysis = analyzeCode(code)
  
  return {
    code,
    attemptNumber: currentAttempt,
    testResult: lastAttempt?.result || { passed: 0, total: 0 },
    lastError: lastAttempt?.result?.error,
    timeStuck,
    recentChanges: changes,
    codeAnalysis: analysis
  }
}

export function detectCodeChanges(
  previousCode: string,
  currentCode: string
): string[] {
  const changes: string[] = []
  
  const prevLines = previousCode.split('\n')
  const currLines = currentCode.split('\n')
  
  for (let i = 0; i < Math.max(prevLines.length, currLines.length); i++) {
    const prevLine = prevLines[i] || ''
    const currLine = currLines[i] || ''
    
    if (prevLine !== currLine) {
      if (!prevLine) {
        changes.push(`line ${i+1}: added "${currLine.trim()}"`)
      } else if (!currLine) {
        changes.push(`line ${i+1}: deleted "${prevLine.trim()}"`)
      } else {
        changes.push(`line ${i+1}: "${prevLine.trim()}" → "${currLine.trim()}"`)
      }
    }
  }
  
  return changes
}

export function analyzeCode(code: string): CodeAnalysis {
  // Simple AST analysis
  // In production, use proper parser like @babel/parser
  
  return {
    hasNestedLoops: /for.*for|while.*while/i.test(code),
    pointerInit: detectPointerInit(code),
    loopCondition: extractLoopCondition(code),
    // ... more analysis
  }
}
```

---

## API Endpoints

```typescript
// Backend API routes

// POST /api/contributions
interface CreateContributionRequest {
  sessionId: string
  problemId: string
  command: 'problem' | 'solution' | 'guidance'
  subcommand: string
  content: string
  context: ContributionContext
  references?: ContributionReferences
}

// GET /api/contributions?sessionId=X&command=problem
interface ListContributionsQuery {
  sessionId: string
  command?: string
  limit?: number
}

// PUT /api/contributions/:id
interface UpdateContributionRequest {
  content?: string
  references?: ContributionReferences
  suggestedCategory?: string
}

// POST /api/contribution-links
interface CreateLinkRequest {
  fromContributionId: string
  toContributionId: string
  linkType: 'solves' | 'references' | 'extends'
  autoGenerated: boolean
  confidenceScore?: number
}

// GET /api/contributions/:id/links
interface GetLinksQuery {
  direction?: 'from' | 'to' | 'both'
  linkType?: string
}
```

---

## Testing Plan

### Unit Tests

```typescript
// __tests__/commandParser.test.ts
describe('Command Parser', () => {
  test('parses /problem new command', () => {
    const result = parseCommand('/problem new "test content"')
    expect(result.valid).toBe(true)
    expect(result.command).toBe('problem')
    expect(result.subcommand).toBe('new')
    expect(result.content).toBe('test content')
  })
  
  test('rejects invalid syntax', () => {
    const result = parseCommand('/problem invalid')
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })
  
  // ... more tests
})

// __tests__/autoLinking.test.ts
describe('Auto-linking', () => {
  test('links solution to recent problems', async () => {
    // Setup: create problem
    const problem = await createContribution({
      command: 'problem',
      content: 'I am stuck',
      sessionId: 'test-session'
    })
    
    // Create solution
    const solution = await createContribution({
      command: 'solution',
      content: 'I figured it out!',
      sessionId: 'test-session'
    })
    
    // Auto-link should have created link
    const links = await getLinks(solution.id)
    expect(links).toHaveLength(1)
    expect(links[0].toContributionId).toBe(problem.id)
    expect(links[0].linkType).toBe('solves')
  })
})
```

### Integration Tests

```typescript
// __tests__/integration/slashCommands.test.ts
describe('Slash Commands End-to-End', () => {
  test('complete flow: problem → solution → guidance', async () => {
    // Setup: mock editor and session
    const { editorInstance, sessionId } = setupTestEnvironment()
    
    // Step 1: User types /problem
    editorInstance.setValue('/problem new "I am confused"')
    await executeCommand(editorInstance)
    
    const problems = await api.contributions.findMany({
      where: { sessionId, command: 'problem' }
    })
    expect(problems).toHaveLength(1)
    
    // Step 2: User types /solution
    editorInstance.setValue('/solution new "Now I get it!"')
    await executeCommand(editorInstance)
    
    const solutions = await api.contributions.findMany({
      where: { sessionId, command: 'solution' }
    })
    expect(solutions).toHaveLength(1)
    
    // Check auto-linking
    const links = await api.contributionLinks.findMany({
      where: { fromContributionId: solutions[0].id }
    })
    expect(links).toHaveLength(1)
    expect(links[0].toContributionId).toBe(problems[0].id)
    
    // Step 3: User types /guidance
    editorInstance.setValue(
      `/guidance /select ${problems[0].id} ${solutions[0].id} "Remember to check bounds"`
    )
    await executeCommand(editorInstance)
    
    const guidance = await api.contributions.findMany({
      where: { sessionId, command: 'guidance' }
    })
    expect(guidance).toHaveLength(1)
    expect(guidance[0].references.problems).toContain(problems[0].id)
    expect(guidance[0].references.solutions).toContain(solutions[0].id)
  })
})
```

---

## Performance Considerations

### 1. Debouncing

```typescript
// Debounce command detection to avoid excessive parsing
const debouncedParse = debounce((line: string) => {
  const parsed = parseCommand(line)
  if (parsed.valid) {
    // Show preview or validation
  }
}, 300) // 300ms delay
```

### 2. Caching

```typescript
// Cache recent contributions for faster reference lookup
const contributionCache = new Map<string, InlineContribution>()

async function getCachedContribution(id: string): Promise<InlineContribution> {
  if (contributionCache.has(id)) {
    return contributionCache.get(id)!
  }
  
  const contribution = await api.contributions.findUnique({ where: { id } })
  contributionCache.set(id, contribution)
  
  return contribution
}
```

### 3. Lazy Loading

```typescript
// Don't load all contributions upfront
// Load on-demand when /list command is used
```

---

## Error Handling

```typescript
// Graceful degradation
try {
  await executeCommand(parsed)
} catch (error) {
  if (error instanceof NetworkError) {
    // Queue command for retry
    await queueOfflineCommand(parsed)
    showNotification({
      type: 'warning',
      message: 'Command will be synced when connection is restored'
    })
  } else {
    showNotification({
      type: 'error',
      message: 'Failed to execute command',
      details: error.message
    })
  }
}
```

---

## Privacy & Security

### Input Validation

```typescript
// Sanitize user input
function sanitizeContent(content: string): string {
  // Remove potentially dangerous characters
  // Enforce length limits
  // Escape HTML/SQL
  return DOMPurify.sanitize(content.slice(0, 500))
}
```

### Rate Limiting

```typescript
// Prevent spam
const rateLimiter = new RateLimiter({
  maxCommands: 20,
  windowMs: 60000 // 20 commands per minute
})

async function executeCommand(parsed: ParsedCommand) {
  if (!rateLimiter.checkLimit(userId)) {
    throw new Error('Rate limit exceeded. Please wait.')
  }
  
  // ... execute command
}
```

---

## Success Metrics

**Week 1 (MVP Launch):**
- [ ] Command parser working for all 3 commands
- [ ] Can create problem, solution, guidance
- [ ] Auto-linking works (solution → problems)
- [ ] Basic notifications shown
- [ ] No major bugs

**Week 2-3:**
- [ ] 20+ users have created contributions
- [ ] Average 3-5 contributions per solved problem
- [ ] Auto-linking accuracy > 80%
- [ ] AI categorization accuracy > 70%

**Month 1:**
- [ ] 100+ contributions collected
- [ ] Users report feature is helpful
- [ ] 0 data loss incidents
- [ ] Performance < 100ms for command execution

---

## MVP Scope

### ✅ Included in MVP

- `/problem new`, `/solution new`, `/guidance /select`
- Basic auto-linking (solution → recent problems)
- Context capture (code, timing, attempt)
- Inline notifications
- Database storage

### ❌ Not in MVP (Future)

- `/problem list`, `/solution list` (admin dashboard instead)
- `/problem edit`, `/solution edit` (read-only for now)
- Complex reference search (exact IDs only)
- AI categorization (manual review initially)
- Community voting (just store, don't display)
- Offline queue (fail gracefully instead)

---

## Implementation Checklist

### Week 1: Core System

**Backend:**
- [ ] Database schema (contributions, links tables)
- [ ] API endpoints (create, list)
- [ ] Auto-linking logic
- [ ] Context capture utilities

**Frontend:**
- [ ] Command detection in editor
- [ ] Command parser (3 commands)
- [ ] Command handler (create contributions)
- [ ] Basic notification component
- [ ] Autocomplete UI

**Testing:**
- [ ] Unit tests for parser
- [ ] Integration test for full flow
- [ ] Manual QA with 5 test problems

### Week 2: Polish & Deploy

- [ ] Error handling
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] Performance optimization
- [ ] Deploy to staging
- [ ] Beta test with 10 users
- [ ] Fix bugs
- [ ] Deploy to production

---

## Support & Maintenance

### Monitoring

```typescript
// Track command usage
trackEvent('slash_command_used', {
  command: parsed.command,
  subcommand: parsed.subcommand,
  success: true,
  executionTime: Date.now() - startTime
})

// Track errors
trackError('slash_command_error', {
  command: parsed.command,
  error: error.message,
  userId,
  sessionId
})
```

### Debugging

```typescript
// Add debug logging
if (process.env.DEBUG_COMMANDS) {
  console.log('Executing command:', {
    parsed,
    context,
    timestamp: Date.now()
  })
}
```

---

## Conclusion

This slash command system transforms passive problem-solving into active content creation. Users naturally document their learning journey while solving problems, creating a rich dataset that improves the platform for everyone.

**Key Innovation:** Capture insights at the moment of learning, not after.

**Next Steps:** 
1. Implement Week 1 checklist
2. Test with 5-10 beta users
3. Iterate based on feedback
4. Scale to all users

---

*For questions or clarifications, see PRD-slashcommand-feature.md*
