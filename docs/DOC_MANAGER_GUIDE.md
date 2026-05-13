# Documentation Manager - Quick Reference Guide

**Project:** Shoreline Documentation Manager  
**Purpose:** Maintain accurate, up-to-date documentation for Shoreline Studio  
**Created:** May 13, 2026

---

## 📚 What's in This Project

### Core Documents:
1. **DEVELOPER_REFERENCE.md** (28,000 words)
   - Technical documentation for developers
   - System architecture, database schema, API routes
   - Code examples and implementation details
   
2. **USER_EXPERIENCE_GUIDE.md** (15,000 words)
   - User-facing documentation
   - Getting started, tutorials, FAQs
   - Step-by-step guides and troubleshooting

3. **CHANGELOG.md**
   - Tracks all documentation updates
   - Links changes to code updates
   - Review schedule and health metrics

---

## 🔄 How to Request Documentation Updates

### Simple Template:

Just tell me what changed in natural language! I'll handle the rest.

**Examples:**

```
"I added Stripe payment integration. Users can now purchase 
credits from the dashboard. New API route at /api/payments/checkout"
```

```
"Changed the credit cost for text posts from 2 to 1 credit"
```

```
"Fixed a bug where brand discovery wasn't saving storefront colors"
```

```
"Removed the 'Playful & Energetic' voice option - wasn't being used"
```

---

## 🎯 What I Do When You Report Changes

### My Workflow:

1. **Search** - I scan both documents to find affected sections
2. **Update** - I modify all relevant sections across both docs
3. **Log** - I add an entry to CHANGELOG.md with details
4. **Return** - I provide updated markdown files for you to download

### What I Update:

- **Developer Reference:**
  - API routes if you add/change endpoints
  - Database schema if tables/columns change
  - Component documentation if UI changes
  - Environment variables if new configs added
  - Code examples if implementation changes

- **User Experience Guide:**
  - Feature descriptions if user-facing changes
  - Step-by-step guides if workflows change
  - FAQ if common questions arise
  - Troubleshooting if new issues discovered
  - Pricing if costs change

- **Changelog:**
  - New entry with date, type, and description
  - List of affected sections
  - Context for why change was made
  - Updated statistics

---

## 📋 Common Update Scenarios

### Scenario 1: New Feature Added

**You say:**
```
"Added content scheduling feature. Users can schedule posts for 
future dates. New table: scheduled_posts. New API route: 
/api/posts/schedule"
```

**I update:**
- Developer Reference → Add database schema entry
- Developer Reference → Document new API route
- Developer Reference → Update roadmap (move from planned to implemented)
- User Experience Guide → Add "Scheduling Posts" section
- User Experience Guide → Update "Managing Your Library" section
- Changelog → Log the feature addition

---

### Scenario 2: Pricing Change

**You say:**
```
"Credit packages changed:
- Starter: 100 credits for $10 (was 50 for $5)
- Pro: 300 credits for $25 (was 150 for $12)"
```

**I update:**
- Developer Reference → Pricing & Business Model section
- User Experience Guide → Understanding Credits section
- User Experience Guide → FAQ pricing questions
- Changelog → Log the pricing update

---

### Scenario 3: Bug Fix

**You say:**
```
"Fixed: Images now correctly use brand colors from brand discovery. 
The architect wasn't receiving color_theme data properly."
```

**I update:**
- Developer Reference → Image Generation System section (clarify data flow)
- Developer Reference → Troubleshooting section (add fix note)
- User Experience Guide → Working with Images (if user-visible improvement)
- Changelog → Log the fix

---

### Scenario 4: Feature Removal

**You say:**
```
"Removed the 'Gemini' architect mode. Now only using Gemma, 
Groq, and OpenRouter. Gemini was too slow."
```

**I update:**
- Developer Reference → Remove Gemini from architect modes table
- Developer Reference → Update code examples
- Developer Reference → Note in changelog as deprecated
- Changelog → Log the removal with reason

---

## ⚡ Quick Commands

### To get specific section:
```
"Show me the current API routes documentation"
"What does the credit system section say?"
"Pull up the brand discovery explanation"
```

### To check documentation status:
```
"What's the last update logged in changelog?"
"Is [feature] documented yet?"
"Show me the pending updates list"
```

### To review sections:
```
"Is the Stripe integration documented?"
"Check if the new voice option is in the user guide"
"Verify the database schema includes payment_transactions"
```

---

## 📊 Update Frequency Guidelines

### Update documentation when:

**✅ Definitely Update:**
- New user-facing features added
- Database schema changes
- New API routes created
- Pricing/credit costs change
- Major bug fixes that change behavior
- Features removed/deprecated
- Environment variables added

**⚠️ Consider Updating:**
- Minor UI text changes
- Internal refactoring (if affects examples)
- Performance improvements (if user-visible)
- Third-party API version updates

**❌ Skip Updating:**
- Code formatting changes
- Internal variable renames (not user-facing)
- Comment updates in code
- Test file changes
- Dev environment tweaks

---

## 🎨 Documentation Style Guide

### I maintain these standards:

**Tone:**
- Developer Reference: Technical, precise, detailed
- User Experience Guide: Friendly, clear, encouraging

**Code Examples:**
- Always use TypeScript syntax highlighting
- Include comments for clarity
- Show both correct and incorrect approaches when helpful

**Structure:**
- Use consistent heading hierarchy
- Keep related information together
- Cross-reference between documents when appropriate

**Formatting:**
- Tables for structured data (pricing, features, API params)
- Code blocks for technical examples
- Numbered lists for sequential steps
- Bullet points for non-sequential items
- Emojis sparingly (only for visual hierarchy)

---

## 🔍 Finding Information in Docs

### Developer Reference Sections:
1. System Architecture - High-level design
2. Tech Stack - Technologies used
3. Database Schema - Tables and relationships
4. Authentication - Clerk + Supabase setup
5. Core Features - Brand discovery, content gen, images, credits
6. Components - Dashboard, Profile, GenerateDashboard
7. Database Functions - RPCs and stored procedures
8. API Routes - All endpoints with examples
9. Environment Variables - Config required
10. Deployment - Vercel, migrations, troubleshooting
11. Pricing - Business model and economics
12. Roadmap - Future plans (5 phases)
13. Third-Party APIs - External integrations

### User Experience Guide Sections:
1. What is Shoreline - Value proposition
2. Who it's for - Target customers
3. Getting Started - Account setup
4. Profile Setup - Business configuration
5. Brand Discovery - How it learns your brand
6. Creating Posts - Generation workflow
7. Post Modes - 6 different formats
8. Voice & Tone - 6 personality options
9. Images - Photo generation
10. Content Library - Managing saved posts
11. Credits - Understanding the system
12. Tips - Optimization strategies
13. FAQ - Common questions
14. Troubleshooting - Problem solving

---

## 📅 Maintenance Schedule

### Weekly:
- Review new changes reported
- Update affected sections
- Log updates in changelog

### Monthly:
- Verify all code examples still work
- Check for broken cross-references
- Update statistics in changelog

### Quarterly (March, June, September, December):
- Full documentation audit
- Update roadmap based on progress
- Review FAQ for new common questions
- Check troubleshooting section completeness

**Next Review:** June 15, 2026

---

## 💾 Version Control

### Current Versions:
- DEVELOPER_REFERENCE.md: v1.0 (May 13, 2026)
- USER_EXPERIENCE_GUIDE.md: v1.0 (May 13, 2026)
- CHANGELOG.md: v1.0 (May 13, 2026)

### Version Numbering:
- **Major (X.0)**: Complete rewrites, restructuring
- **Minor (1.X)**: New major sections added
- **Patch (1.0.X)**: Small updates, fixes

---

## 🆘 Troubleshooting Documentation Issues

### If documentation seems outdated:
```
"Review the [section name] - I think it's outdated"
```

### If you can't find something:
```
"Where is [feature] documented?"
"Search for [keyword] across both documents"
```

### If something is unclear:
```
"The [section] needs clarification on [topic]"
"Can you expand the [section] with more details?"
```

### If you need a new section:
```
"Add a new section to [document] about [topic]"
```

---

## 📈 Success Metrics

**Documentation is successful when:**
- ✅ New developers can onboard using Developer Reference alone
- ✅ Users rarely need support for documented features
- ✅ All current features have corresponding documentation
- ✅ Code examples work without modification
- ✅ Updates happen within 24 hours of code changes

**Current Status:** 🟢 All metrics green (as of May 13, 2026)

---

## 🎯 Your Next Steps

1. **Bookmark this project** - Easy access for updates
2. **Download all 3 files** - Save to your repo
3. **Test the system** - Report a small change and see how it works
4. **Set reminders** - Weekly updates, quarterly reviews
5. **Share with team** - When you hire, they use this too

---

## 📞 How to Use This System

### Standard Workflow:

```
┌─────────────────────────────────────┐
│ 1. Make code changes                │
│ 2. Test in dev                      │
│ 3. Deploy to production             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. Switch to this project           │
│ 5. Tell me what changed             │
│ 6. I update the docs                │
│ 7. Download updated files           │
│ 8. Commit to repo                   │
└─────────────────────────────────────┘
```

---

## ✨ Pro Tips

1. **Batch updates** - Save up 2-3 changes, report them together
2. **Be specific** - "Added Stripe" vs "Added Stripe checkout with webhooks"
3. **Include context** - Why the change was made helps me document it better
4. **Review my updates** - Always scan what I changed before downloading
5. **Version control docs** - Commit them alongside code changes

---

## 🚀 Ready to Go!

The system is now fully operational. Just tell me about your next change and I'll update the docs!

**Example to try:**
```
"Let's test this. Pretend I just added a new voice option called 
'Casual & Friendly' between Warm & Conversational and Playful & Energetic"
```

I'll show you exactly how I update the docs, and you can see the system in action!

---

*Documentation Manager v1.0 - Ready to maintain your docs! 📚*
