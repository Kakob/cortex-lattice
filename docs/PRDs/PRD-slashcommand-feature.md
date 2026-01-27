# PRD: Slash Command Feature - Inline Content Contribution

**Product:** Cortex Lattice  
**Feature:** Slash Commands for User Contributions  
**Version:** 1.0 MVP  
**Date:** January 27, 2026  
**Owner:** Jacob  
**Status:** Ready for Development

---

## Executive Summary

**Problem:** Creating teaching content for 100+ problems is time-intensive and captures only one person's perspective on common mistakes.

**Solution:** Enable users to contribute problems, solutions, and guidance directly from the code editor using slash commands (`/problem`, `/solution`, `/guidance`). This crowdsources learning insights and creates a self-improving platform.

**Impact:**
- 10x faster content improvement (contributions from hundreds of users vs. just Jacob)
- Data-driven teaching (know exactly where users get stuck)
- Network effects (more users = better guidance)
- Defensible moat (aggregated wisdom can't be replicated)

---

## Background

### Current State

**Content Creation Process:**
1. Jacob creates problem.yaml, solution.py, guidance.yaml
2. Jacob guesses common mistakes based on experience
3. Takes 3-4 hours per problem
4. Only captures one perspective

**Problems:**
- No way to know if guidance is actually helpful
- Can't discover unexpected confusion points
- Users can't share their breakthroughs
- No feedback loop for improvement

### Opportunity

**Every user who solves a problem has valuable insights:**
- Where they got stuck → becomes a detected mistake
- How they figured it out → becomes teaching guidance
- What helped them → validates hint effectiveness

**Example:**
```
89 users make the same mistake: "both pointers at 0"
45 users say the same hint helped: "Start at widest position"
→ Automatically update guidance.yaml to emphasize this hint
```

---

## Goals & Success Metrics

### Primary Goals

1. **Enable User Contributions**
   - Users can document their confusion moments
   - Users can capture breakthrough insights
   - Users can create teaching guidance

2. **Build Data Flywheel**
   - Collect data → Improve guidance → Better outcomes → More users → More data

3. **Reduce Content Creation Burden**
   - From: Jacob manually creates all guidance
   - To: System aggregates user insights

### Success Metrics

**Week 1 (MVP Launch):**
- ✅ Feature works without major bugs
- ✅ 20+ contributions created
- ✅ Auto-linking works (80%+ accuracy)

**Month 1:**
- ✅ 100+ contributions from 30+ users
- ✅ Average 3-5 contributions per solved problem
- ✅ Users report feature is helpful (survey)

**Month 3:**
- ✅ 1,000+ contributions
- ✅ Updated guidance files show measurable improvement
- ✅ Success rate increases 10-15% on updated problems

### Non-Goals (Out of Scope for MVP)

- ❌ Public display of contributions (just collect data)
- ❌ Community voting/ranking (future)
- ❌ Editing contributions after creation (read-only for now)
- ❌ Advanced search/filtering (basic IDs only)
- ❌ Rewards/gamification (future)

---

## User Stories

### Story 1: Capturing Confusion

**As a** student solving a problem  
**I want to** quickly document what I'm stuck on  
**So that** I can help improve the teaching for future learners

**Acceptance Criteria:**
- User types `/problem new "I don't know which pointer to move"` in code editor
- System captures the problem with context (code state, timing)
- User sees confirmation notification
- Command line is cleared, ready to continue coding

---

### Story 2: Noting Breakthroughs

**As a** student who just figured something out  
**I want to** capture my "aha moment" immediately  
**So that** others can learn from my insight

**Acceptance Criteria:**
- User types `/solution new "I need to start at widest position!"` in code editor
- System automatically links solution to recent problems
- System detects what code changed
- User sees confirmation with linked problems
- Command line is cleared

---

### Story 3: Creating Guidance

**As a** student who solved a problem  
**I want to** create teaching advice for others  
**So that** I can contribute to the platform

**Acceptance Criteria:**
- User types `/guidance /select prob_42 sol_18 "Start wide, narrow toward target"`
- System resolves references (finds the linked contributions)
- AI suggests category (key_concepts, common_mistakes, etc.)
- User sees confirmation with categorization
- Can confirm or edit the suggested category

---

### Story 4: Discovering Patterns (Platform)

**As a** platform operator  
**I want to** see aggregated user data  
**So that** I can improve guidance files

**Acceptance Criteria:**
- Dashboard shows most common problems
- Dashboard shows most helpful solutions
- Dashboard shows mistake frequency
- Can export data to update guidance.yaml files

---

## User Experience

### Entry Point

**Location:** Code editor (Monaco) at the problem-solving interface

**Trigger:** User types `/` at the start of a line

**Visual:** Autocomplete dropdown appears showing available commands

### Interaction Flow

```
1. User types "/" 
   → Autocomplete appears

2. User types "/problem new "
   → Autocomplete narrows to /problem commands
   → Shows examples

3. User completes: /problem new "I'm stuck on X"
   → Presses Enter

4. System processes command
   → Saves to database
   → Captures context
   → Shows notification

5. Command line clears
   → User continues coding

6. Later, user solves it
   → Types: /solution new "I figured out Y!"
   → System auto-links to problem

7. User wants to help others
   → Types: /guidance /select prob_X sol_Y "Remember Z"
   → AI categorizes
   → User confirms
```

### Visual Design

**Autocomplete UI:**
```
┌─────────────────────────────────────────┐
│  Slash Commands                         │
├─────────────────────────────────────────┤
│  📝 /problem new "..."                  │
│     Capture what you're stuck on        │
│     e.g. /problem new "Don't know..."   │
│                                         │
│  💡 /solution new "..."                 │
│     Note your breakthrough              │
│     e.g. /solution new "Start wide!"    │
│                                         │
│  🎓 /guidance /select refs "..."        │
│     Create teaching advice              │
│     e.g. /guidance /select prob_1...    │
└─────────────────────────────────────────┘
```

**Success Notification:**
```
┌─────────────────────────────────────────┐
│  ✓ Problem captured (prob_42)           │
│  "I don't know which pointer to move"   │
│                                         │
│  Context saved:                         │
│  • Current code                         │
│  • Attempt #3                           │
│  • 4.8 minutes on this attempt          │
│                                         │
│  We'll help you link this to your      │
│  solution when you figure it out!      │
└─────────────────────────────────────────┘
```

---

## Technical Requirements

### Functional Requirements

**FR1: Command Detection**
- System must detect slash commands at start of line
- System must show autocomplete after typing "/"
- System must validate command syntax before execution

**FR2: Command Execution**
- System must support `/problem new "content"`
- System must support `/solution new "content"`
- System must support `/guidance /select ref1 ref2 "content"`
- System must clear command line after successful execution

**FR3: Context Capture**
- System must capture current code state
- System must capture timing (time since start, time stuck)
- System must capture attempt number
- System must capture recent code changes
- System must capture test results

**FR4: Auto-Linking**
- System must auto-link solutions to recent problems (last 5, within 30 min)
- System must calculate confidence score for each link
- System must show linked items in notification

**FR5: Data Storage**
- System must store all contributions in database
- System must store contribution links
- System must store context as JSON
- System must support querying by session, user, problem

**FR6: Notifications**
- System must show success notification after command
- System must show error notification if command fails
- Notification must display for 10 seconds or until dismissed
- Notification must show contribution ID and details

### Non-Functional Requirements

**NFR1: Performance**
- Command execution must complete in < 500ms
- Autocomplete must appear in < 100ms after typing "/"
- Context capture must not slow down editor

**NFR2: Reliability**
- Command execution must succeed 99%+ of time
- Failed commands must show clear error message
- No data loss (all contributions saved)

**NFR3: Usability**
- Slash commands must be discoverable (autocomplete)
- Syntax must be intuitive
- Error messages must be actionable

**NFR4: Privacy**
- User contributions are anonymous by default
- Users can opt-in to public attribution
- No PII stored without consent

**NFR5: Security**
- Input must be sanitized (prevent XSS, SQL injection)
- Rate limiting: max 20 commands per minute per user
- Contributions must be tied to authenticated session

---

## Design Specifications

### Command Syntax

**Problem Command:**
```
Syntax: /problem new "content"
Length: 10-500 characters
Example: /problem new "I don't understand the move logic"
```

**Solution Command:**
```
Syntax: /solution new "content"
Length: 10-500 characters
Example: /solution new "Start pointers at widest position!"
```

**Guidance Command:**
```
Syntax: /guidance /select ref1 ref2 ... "content"
Refs: prob_X, sol_Y, guid_Z (where X, Y, Z are numbers)
Length: 10-500 characters
Example: /guidance /select prob_42 sol_18 "Remember to start wide"
```

### Auto-Linking Algorithm

```
When solution is created:
1. Find recent problems from same session (last 30 minutes)
2. Calculate confidence score for each:
   - Same session: +0.2
   - Close in time (< 10 min): +0.2
   - Same code area changed: +0.1-0.3
3. Create links with confidence > 0.5
4. Show linked problems in notification
```

### Context Structure

```json
{
  "code": "def find_asteroids():\n    left = 0\n    right = 0",
  "attemptNumber": 3,
  "testResult": {
    "passed": 0,
    "total": 5,
    "error": "Wrong Answer"
  },
  "timeStuck": 292333,
  "recentChanges": [
    "line 3: right = 0 → right = len(positions) - 1"
  ]
}
```

---

## Data Model

### Database Tables

**inline_contributions**
- Primary data table
- Fields: id, session_id, user_id, problem_id, command, subcommand, content, timestamp, context, references, suggested_category, helpful_votes
- Indexes: session_id, user_id, problem_id, command, timestamp

**contribution_links**
- Links between contributions
- Fields: id, from_contribution_id, to_contribution_id, link_type, auto_generated, confidence_score
- Indexes: from_contribution_id, to_contribution_id

### Data Flow

```
User types command
    ↓
Frontend parses command
    ↓
Frontend calls API
    ↓
Backend validates input
    ↓
Backend captures context
    ↓
Backend stores in database
    ↓
Backend creates auto-links (if solution)
    ↓
Backend returns result
    ↓
Frontend shows notification
    ↓
Command line clears
```

---

## API Endpoints

### POST /api/contributions

Create a new contribution

**Request:**
```json
{
  "sessionId": "sess_abc123",
  "problemId": "two-pointers-asteroids",
  "command": "problem",
  "subcommand": "new",
  "content": "I don't know which pointer to move",
  "context": {
    "code": "...",
    "attemptNumber": 3,
    "testResult": { "passed": 0, "total": 5 }
  }
}
```

**Response:**
```json
{
  "id": "prob_42",
  "message": "Problem captured successfully",
  "linkedContributions": [],
  "suggestedCategory": null
}
```

---

### GET /api/contributions

List contributions

**Query Parameters:**
- `sessionId` (required)
- `command` (optional: problem, solution, guidance)
- `limit` (optional, default: 50)

**Response:**
```json
{
  "contributions": [
    {
      "id": "prob_42",
      "command": "problem",
      "content": "I don't know which pointer to move",
      "timestamp": "2026-01-27T10:15:23.456Z"
    }
  ],
  "total": 5
}
```

---

### POST /api/contribution-links

Create a link between contributions

**Request:**
```json
{
  "fromContributionId": "sol_18",
  "toContributionId": "prob_42",
  "linkType": "solves",
  "autoGenerated": true,
  "confidenceScore": 0.85
}
```

**Response:**
```json
{
  "id": "link_xyz",
  "created": true
}
```

---

## Edge Cases & Error Handling

### Edge Case 1: Command in Middle of Line

**Scenario:** User types code, then adds `/problem` on same line

**Handling:** Only detect slash commands at start of line (after whitespace)

---

### Edge Case 2: Quotes in Content

**Scenario:** User types `/problem new "I can't figure this out"`

**Handling:** Support escaped quotes: `/problem new "I can't figure this out"`

---

### Edge Case 3: No Recent Problems

**Scenario:** User creates solution but no recent problems exist

**Handling:** Don't auto-link, show message: "No recent problems to link. Create links manually later."

---

### Edge Case 4: Network Failure

**Scenario:** API call fails while saving contribution

**Handling:** 
- Show error notification
- Option 1: Queue for retry (future)
- Option 2 (MVP): Ask user to try again

---

### Edge Case 5: Invalid Reference

**Scenario:** User types `/guidance /select prob_999 "content"` but prob_999 doesn't exist

**Handling:** Show error: "Reference prob_999 not found. Use /problem list to see available references."

---

## Privacy & Security

### Privacy Considerations

**Data Collection:**
- Contributions are tied to sessions, not personal identities
- Code snapshots may contain sensitive info → allow opt-out
- User can delete contributions via dashboard

**Consent:**
- Clear opt-in during onboarding
- Explain what data is collected and why
- Provide privacy controls in settings

### Security Measures

**Input Sanitization:**
```typescript
// Remove potentially dangerous characters
const sanitized = DOMPurify.sanitize(userInput.slice(0, 500))
```

**Rate Limiting:**
```
Max 20 commands per minute per user
Max 100 contributions per session
```

**Authentication:**
```
All API calls require valid session token
Contributions tied to authenticated user
```

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)

**Participants:** Jacob + 2-3 beta testers

**Goals:**
- Validate command syntax
- Test auto-linking accuracy
- Identify major bugs

**Metrics:**
- 50+ contributions created
- 0 data loss incidents
- Auto-linking accuracy > 70%

---

### Phase 2: Limited Beta (Week 2-3)

**Participants:** 20 beta users (invite-only)

**Goals:**
- Collect more diverse contributions
- Test at moderate scale
- Gather user feedback

**Metrics:**
- 200+ contributions
- User satisfaction > 4/5
- Auto-linking accuracy > 80%

**Feedback Collection:**
- Post-session survey
- In-app feedback button
- Discord channel for discussion

---

### Phase 3: Public Launch (Week 4)

**Participants:** All users

**Goals:**
- Scale to 100+ users
- Validate data flywheel
- Begin improving guidance files

**Metrics:**
- 1,000+ contributions in first month
- 50+ users contributing
- 10+ guidance files updated with aggregated insights

**Communication:**
- Announcement blog post
- Email to existing users
- Social media posts

---

## Analytics & Tracking

### Key Events to Track

```typescript
// Command usage
trackEvent('slash_command_used', {
  command: 'problem' | 'solution' | 'guidance',
  subcommand: string,
  sessionId: string,
  problemId: string,
  success: boolean,
  executionTime: number // milliseconds
})

// Auto-linking
trackEvent('auto_link_created', {
  fromType: 'solution',
  toType: 'problem',
  confidenceScore: number,
  timeGap: number // minutes between problem and solution
})

// User behavior
trackEvent('command_autocomplete_shown', {
  triggerChar: '/',
  commandsShown: number
})

trackEvent('command_autocomplete_selected', {
  selectedCommand: string
})

// Errors
trackError('slash_command_error', {
  command: string,
  errorType: string,
  errorMessage: string
})
```

### Dashboard Metrics

**Usage Metrics:**
- Total contributions by type (problem, solution, guidance)
- Contributions per user (distribution)
- Most active problems (by contribution count)
- Time to first contribution (per session)

**Quality Metrics:**
- Auto-linking accuracy (manual review sample)
- Contribution length distribution
- Reference usage (how many guidance items reference problems/solutions)

**Impact Metrics:**
- Guidance files updated (based on contributions)
- Problems with most confusion (high problem count)
- Most valuable solutions (high link count)

---

## Future Enhancements (Post-MVP)

### Phase 2: Community Features

**Public Contributions:**
- Display top contributions on problem pages
- "This insight helped 45 people" badges
- User profiles showing contributions

**Voting & Ranking:**
- Upvote/downvote contributions
- Sort by helpfulness
- Promote best explanations

**Editing:**
- Edit contributions after creation
- Version history
- Collaborative refinement

---

### Phase 3: Advanced Features

**Smart Suggestions:**
- AI suggests when to create contribution
- "You've been stuck for 5 minutes. Want to log what's confusing?"

**Contribution Templates:**
- Pre-fill common patterns
- "I don't understand [concept]"
- "This worked because [reason]"

**Cross-Problem Patterns:**
- Detect similar confusion across problems
- "You struggled with pointer initialization in 3 problems"
- Suggest pattern-level guidance

---

### Phase 4: Automation

**Auto-Generated Guidance:**
- System automatically updates guidance.yaml
- Based on aggregated contributions
- Human review before deployment

**Predictive Hints:**
- Show hints preemptively based on code patterns
- "You're about to make the 'both pointers at 0' mistake"

**Adaptive Learning Paths:**
- Personalize hint sequences
- Based on user's contribution history
- "You tend to miss initialization steps, here's an extra hint"

---

## Dependencies

### Technical Dependencies

**Frontend:**
- Monaco Editor (code editor)
- React/Next.js (UI framework)
- Framer Motion (animations)
- Lucide React (icons)

**Backend:**
- Node.js/Express or Next.js API routes
- PostgreSQL (database)
- Prisma (ORM)
- Authentication system (existing)

**External Services:**
- AI service for categorization (Claude API or GPT-4)

### Timeline Dependencies

**Prerequisites:**
- Session tracking system must be implemented first
- Database schema must be deployed
- Code editor must be integrated (Monaco)

**Blockers:**
- If session tracking is not ready, feature cannot launch
- If AI service is unavailable, categorization will be manual

---

## Open Questions

### Product Questions

**Q1:** Should contributions be anonymous or attributed?
**Decision:** Anonymous by default, opt-in attribution. Privacy-first approach.

**Q2:** Should users be able to see others' contributions during solving?
**Decision:** Not in MVP. Just collect data. Show aggregated insights only.

**Q3:** What should happen if a user creates duplicate contributions?
**Decision:** Allow duplicates. Dedupe during aggregation.

**Q4:** Should there be a limit on contribution length?
**Decision:** Yes. 10-500 characters. Long enough to be useful, short enough to be actionable.

---

### Technical Questions

**Q5:** How to handle offline scenarios?
**Decision (MVP):** Require online connection. Show error if offline. Queue for retry in future.

**Q6:** Should we use AI for auto-linking or just time-based?
**Decision (MVP):** Time-based only. AI enhancement in Phase 2.

**Q7:** How to prevent spam/abuse?
**Decision:** Rate limiting (20 commands/min) + auth requirement + manual review initially.

---

## Risks & Mitigations

### Risk 1: Low Adoption

**Risk:** Users don't use slash commands, feature collects little data

**Mitigation:**
- Prominent onboarding
- In-product prompts ("Share your breakthrough!")
- Gamification (future): "You've helped 10 people with your insights!"

**Likelihood:** Medium  
**Impact:** High  
**Status:** Monitor week 1 adoption rates

---

### Risk 2: Poor Quality Contributions

**Risk:** Users submit low-value or spam contributions

**Mitigation:**
- Require minimum length (10 chars)
- Rate limiting
- Manual review initially
- Community voting (future)

**Likelihood:** Low  
**Impact:** Medium  
**Status:** Establish moderation process

---

### Risk 3: Privacy Concerns

**Risk:** Users uncomfortable with data collection

**Mitigation:**
- Clear privacy policy
- Opt-in during onboarding
- Anonymous by default
- Allow deletion
- No PII collected

**Likelihood:** Low  
**Impact:** Medium  
**Status:** Privacy review before launch

---

### Risk 4: Technical Bugs

**Risk:** Commands fail, data lost, performance issues

**Mitigation:**
- Thorough testing (unit + integration)
- Gradual rollout (internal → beta → public)
- Monitoring & alerts
- Rollback plan

**Likelihood:** Medium  
**Impact:** High  
**Status:** Comprehensive test plan + staging environment

---

## Success Criteria

### Launch Criteria (MVP Ready)

- ✅ All 3 commands work (`/problem`, `/solution`, `/guidance`)
- ✅ Auto-linking works with > 70% accuracy
- ✅ Context capture includes code, timing, attempts
- ✅ Notifications display correctly
- ✅ No data loss in testing
- ✅ Performance < 500ms per command
- ✅ Security review passed
- ✅ Privacy policy updated

### Month 1 Success

- ✅ 100+ contributions from 30+ users
- ✅ Average 3-5 contributions per solved problem
- ✅ User satisfaction > 4/5 (survey)
- ✅ Auto-linking accuracy > 80%
- ✅ 0 critical bugs
- ✅ Feature used by > 50% of active users

### Quarter 1 Success

- ✅ 1,000+ contributions
- ✅ 10+ guidance files updated based on data
- ✅ Measurable improvement in success rates (10-15% increase)
- ✅ Users report feature as "helpful" or "very helpful"
- ✅ Ready to scale to Phase 2 (community features)

---

## Resources Required

### Development

**Week 1-2:**
- 1 fullstack engineer (20-30 hours)
- Backend: API endpoints, database schema
- Frontend: Command detection, autocomplete, notifications
- Testing: Unit + integration tests

**Week 3-4:**
- 1 engineer (10-15 hours)
- Polish & bug fixes
- Performance optimization
- Deploy to production

**Total:** 30-45 engineering hours

---

### Design

**Week 1:**
- UI/UX designer (5-8 hours)
- Autocomplete UI design
- Notification design
- Error state designs
- Mobile responsive layout

---

### Product

**Week 1-2:**
- PM (5-10 hours)
- Write PRD (this document)
- User testing plan
- Analytics setup
- Privacy review

**Week 3-4:**
- PM (5 hours)
- Beta user recruitment
- Feedback analysis
- Launch communication

---

## Appendix

### A. Command Reference

**Full Command List:**

```
/problem new "content"        - Create problem
/problem list                 - List all problems
/problem edit prob_X "..."    - Edit problem (future)
/problem link sol_X           - Link to solution (future)

/solution new "content"       - Create solution
/solution list                - List all solutions
/solution edit sol_X "..."    - Edit solution (future)
/solution link prob_X         - Link to problem (future)

/guidance /select refs "..."  - Create guidance with refs
/guidance /category X "..."   - Create guidance with category
/guidance list                - List all guidance
/guidance edit guid_X "..."   - Edit guidance (future)
```

---

### B. Error Messages

**Invalid Syntax:**
```
❌ Invalid command syntax
Use: /problem new "content"
See /help for more commands
```

**Content Too Short:**
```
❌ Content must be at least 10 characters
Try being more specific about what's confusing.
```

**Content Too Long:**
```
❌ Content must be under 500 characters
Try breaking this into multiple contributions.
```

**Rate Limit:**
```
❌ Slow down! You can create 20 commands per minute.
Wait a moment and try again.
```

**Network Error:**
```
❌ Failed to save contribution
Check your internet connection and try again.
```

**Reference Not Found:**
```
❌ Reference prob_999 not found
Use /problem list to see available references.
```

---

### C. Notification Templates

**Problem Created:**
```
✓ Problem captured (prob_42)
"I don't know which pointer to move"

Context saved:
• Current code
• Attempt #3
• 4.8 minutes on this attempt

We'll help you link this to your solution!
```

**Solution Created:**
```
✓ Solution captured (sol_18)
"I need to start at widest position!"

Auto-linked to:
• prob_42: "I don't know which pointer..."

Code change detected:
• Line 3: right = 0 → right = len(positions) - 1

Great job figuring it out!
```

**Guidance Created:**
```
✓ Guidance created (guid_7)
"Start wide, then narrow toward target"

References:
• Problem: "I don't know which pointer..."
• Solution: "I need to start at widest..."

Suggested category: key_concepts
Related pattern: two-pointers

[Confirm] [Edit Category]
```

---

### D. Sample User Flow

**Realistic Session:**

```
10:00 - User opens "Asteroid Belt" problem
10:03 - First attempt fails (both pointers at 0)
10:05 - User types: /problem new "I don't understand which pointer to move"
10:05 - Notification confirms capture
10:08 - User tries again, still fails
10:12 - User reads hint: "Don't start both pointers at 0"
10:15 - User types: /solution new "Oh! Start right at len(positions)-1"
10:15 - Notification shows auto-link to problem
10:20 - User solves the problem!
10:22 - User types: /guidance /select prob_42 sol_18 "Start at widest position first"
10:22 - AI suggests category: key_concepts
10:23 - User confirms
10:23 - Done! User helped improve the platform
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-27 | Jacob | Initial PRD for MVP |

---

## Approval

**Product Lead:** _________________ Date: _________

**Engineering Lead:** _________________ Date: _________

**Design Lead:** _________________ Date: _________

---

*For technical implementation details, see claude-slashcommand-feature.md*
