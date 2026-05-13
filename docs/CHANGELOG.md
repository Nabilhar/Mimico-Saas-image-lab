# Shoreline Studio Documentation Changelog

**Project:** Shoreline Studio (shorelinestudio.ca)  
**Maintained by:** Documentation Manager (Claude Project)  
**Last Updated:** May 13, 2026

---

## About This Changelog

This file tracks all changes to the Shoreline Studio documentation suite. Every time a feature is added, removed, or updated in the codebase, corresponding documentation changes are logged here.

### Change Types:
- **FEATURE** - New functionality added
- **UPDATE** - Existing content modified/improved
- **FIX** - Corrected errors or outdated information
- **REMOVAL** - Deprecated features removed
- **REFACTOR** - Documentation restructured without content changes

### Format:
```
## YYYY-MM-DD - [TYPE] - Brief Description

### Changes Made:
- [Affected Document] → [Section] - [What Changed]
- [Affected Document] → [Section] - [What Changed]

**Context:** Why this change was needed
**Files Updated:** List of files modified
```

---

## 2026-05-13 - FEATURE - Initial Documentation Suite

### Changes Made:
- **DEVELOPER_REFERENCE.md** → Created complete technical documentation
  - System Architecture Overview
  - Tech Stack & Database Schema
  - Authentication Flow (Clerk + Supabase)
  - Core Features (Brand Discovery, Content Generation, Image Generation, Credit System)
  - Key Components Reference
  - Database Functions & RPCs
  - API Routes Documentation
  - Environment Variables
  - Deployment & Maintenance
  - Pricing & Business Model
  - Future Roadmap (5 phases)
  - Third-Party API Integration (6 services)

- **USER_EXPERIENCE_GUIDE.md** → Created complete user-facing documentation
  - What is Shoreline Studio & Who It's For
  - Getting Started Guide
  - Business Profile Setup
  - Brand Discovery Explanation
  - Post Creation Walkthrough
  - 6 Post Modes Explained
  - 6 Voice Options Explained
  - Image Generation Guide
  - Content Library Management
  - Credits System
  - Tips for Better Results
  - FAQ (25+ questions)
  - Troubleshooting Guide

**Context:** Initial documentation created to support pre-launch phase. Covers all features implemented through May 2026.

**Files Updated:**
- DEVELOPER_REFERENCE.md (v1.0) - 28,000 words
- USER_EXPERIENCE_GUIDE.md (v1.0) - 15,000 words
- CHANGELOG.md (v1.0) - Created

**Word Count:** ~43,000 total words across both guides

---

## Documentation Update Queue

*Future changes will be logged below this line*

---

## 2026-05-13 - UPDATE - Welcome Credits Increased

### Changes Made:
- **USER_EXPERIENCE_GUIDE.md** → Getting Started section
  - Updated Step 2: Welcome bonus increased from 10 to 25 credits
  - Updated calculation: "12 text posts or 5 posts with images" (was "5 text posts or 2 posts with images")
  
- **USER_EXPERIENCE_GUIDE.md** → Understanding Credits section
  - Updated welcome bonus amount: 25 credits (was 10)
  - Updated post calculation examples

- **DEVELOPER_REFERENCE.md** → Credit System section
  - Updated initial credit allocation: 25 credits (was 10)
  
- **DEVELOPER_REFERENCE.md** → API Routes section
  - Updated code example in `/api/user/claim-welcome-credits` to award 25 credits

- **DEVELOPER_REFERENCE.md** → Pricing & Business Model section
  - Updated customer acquisition strategy: 25 credits for early users (was 10-25)

**Context:** Increased welcome bonus to give new users more opportunity to test the platform. 25 credits allows for 5 complete posts with images, providing better first-time experience.

**Files Updated:**
- DEVELOPER_REFERENCE.md (v1.1)
- USER_EXPERIENCE_GUIDE.md (v1.1)
- CHANGELOG.md (v1.1)

**Affected Sections:** 5 sections across both documents

---

## Pending Updates (To Be Documented)

*When you report changes, they'll be listed here temporarily until documented*

**Current Status:** ✅ All features through May 13, 2026 documented

---

## Statistics

**Total Updates:** 2  
**Last Major Version:** 1.1  
**Total Documentation Words:** ~43,000  
**Last Review Date:** May 13, 2026

---

## Quick Reference: How to Request Updates

### Template for Reporting Changes:

**For New Features:**
```
FEATURE: [Feature Name]
- What: [Brief description]
- Where: [File/component location]
- User Impact: [How users interact with it]
- Technical Details: [API routes, database changes, etc.]
```

**For Updates:**
```
UPDATE: [What Changed]
- Old Behavior: [Previous state]
- New Behavior: [Current state]
- Affected Areas: [Which parts of the app]
```

**For Bug Fixes:**
```
FIX: [What Was Fixed]
- Issue: [What was wrong]
- Solution: [How it was fixed]
- Documentation Impact: [Which sections need updating]
```

**For Removals:**
```
REMOVAL: [What Was Removed]
- Feature: [What's being deprecated]
- Reason: [Why it's being removed]
- Replacement: [Alternative solution, if any]
- Migration: [How users should adapt]
```

---

## Review Schedule

**Quarterly Reviews:** Every 3 months, full documentation audit
- March, June, September, December
- Check for outdated information
- Verify all links and code examples
- Update statistics and roadmap

**Next Scheduled Review:** June 15, 2026

---

## Documentation Health Metrics

**Current Status: 🟢 Healthy**

- ✅ All current features documented
- ✅ Code examples tested
- ✅ User guides complete
- ✅ API documentation current
- ✅ Troubleshooting sections comprehensive

**Last Health Check:** May 13, 2026

---

*End of Changelog*
