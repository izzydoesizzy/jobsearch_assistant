const prompts = [
  {
    id: 1,
    title: "5 Second Company Research",
    categories: ["Application", "Interview", "Market Research"],
    description: "Rapid company research format for surprise recruiter calls and interview prep.",
    outputFormat: "Markdown tables",
    promptText: `Research [Company Name] quickly and return four markdown tables.

Table 1: Social Media Links
Website | Twitter | Instagram | Facebook | TikTok | LinkedIn | YouTube | Glassdoor | Indeed | Crunchbase

Table 2: Company Info
Description | Origin Story | Founded Year | Years in Operation | Founder | CEO | Values

Table 3: Business Details
Revenue | Stock Info | Business Model | Products/Services | Competitors | Strengths/Weaknesses | Priorities | Challenges | Funding | Layoffs

Table 4: Latest News
Date | Headline 1 | Headline 2 | Headline 3 | Latest LinkedIn Post | Latest Facebook Post | Latest Twitter Post`
  },
  {
    id: 2,
    title: "Break Down Job Descriptions",
    categories: ["Application", "Resume"],
    description: "Extract required and inferred skills from a job posting with recommendations.",
    outputFormat: "Markdown tables",
    promptText: `[PASTE FULL JOB DESCRIPTION]

Analyze the posting and produce:
1) Desired Skills table: Skill | Required? (Yes/Nice-to-Have) | Suggestions
2) Skills Not Directly Mentioned table: Skill | Required? | Suggestions
For each suggestion, include what achievements or evidence I should highlight.`
  },
  {
    id: 3,
    title: "Career Highlights Matrix",
    categories: ["Resume", "Personal Brand"],
    description: "Brainstorm career evidence using an 8-column matrix with 25 customizable rows.",
    outputFormat: "Markdown table",
    promptText: `[Job Title] = YOUR JOB TITLE
[Field/Industry] = YOUR FIELD/INDUSTRY

Create a 25-row career highlights matrix with columns:
Most Common Tasks | Quantifiable Metrics | Skills Utilized | Common Tools/Software | Outcome/Impact | Time Frame | Challenges Overcome | Recognition/Awards`
  },
  {
    id: 4,
    title: "Create Company Scorecards",
    categories: ["Market Research", "Application"],
    description: "Generate 10 target company profiles with fit rationale.",
    outputFormat: "Markdown",
    promptText: `[Field/Industry] and [Job Title]

Build 10 company scorecards including:
Company Name, Website, LinkedIn URL, Description, Founded Year, CEO, Size, Revenue, Funding, Products/Services, Culture Highlights, Recent News, and Why This Company fits me.`
  },
  {
    id: 5,
    title: "Create Your Skills Section",
    categories: ["Resume", "Application"],
    description: "Create ATS-friendly skills grouped by technical, professional, and domain expertise.",
    outputFormat: "Markdown",
    promptText: `[Job Title]
[Industry]
[Years of Experience]

Create three skills lists:
1. Technical Skills
2. Professional Skills
3. Industry Expertise
Keep terms ATS-searchable and specific.`
  },
  {
    id: 6,
    title: "Create a Compelling Career Story",
    categories: ["Interview", "Personal Brand"],
    description: "Craft a 60–90 second interview narrative with progression and value proposition.",
    outputFormat: "Markdown",
    promptText: `Inputs:
- [Current Role]
- [Previous Role(s)]
- [Career Goal]
- [Key Skills]
- [Notable Achievements]

Write a spoken 60-90 second story covering progression, turning points, future direction, and unique value.`
  },
  {
    id: 7,
    title: "Create a Quick Prospective Company List",
    categories: ["Application", "Market Research"],
    description: "Find 20 companies aligned to role, location, values, and size preferences.",
    outputFormat: "Markdown table",
    promptText: `Using [Industry/Field], [Job Title], [Location Preference], [Company Size Preference], and [Values/Priorities], return a table:
Company | Description | Why It Fits | Website
Provide 20 rows.`
  },
  {
    id: 8,
    title: "Find Recruiters",
    categories: ["Networking", "LinkedIn"],
    description: "Build a recruiter targeting strategy plus outreach message.",
    outputFormat: "Markdown",
    promptText: `For [Industry], [Job Title], and [Location], provide:
1) Recruiter types to target
2) LinkedIn Boolean search strings
3) Key recruiting firms
4) Selection criteria
5) Outreach best practices
6) A sample LinkedIn outreach message`
  },
  {
    id: 9,
    title: "Generate Taglines For Your LinkedIn Banner Image",
    categories: ["LinkedIn", "Personal Brand"],
    description: "Create 20 value-based banner tagline options.",
    outputFormat: "Markdown table",
    promptText: `Given [Job Title] and [Field/Industry], generate 20 banner taglines in a table:
Description | Tagline
Include styles such as results-driven, mission-focused, and expertise-focused.`
  },
  {
    id: 10,
    title: "Generate \"Tell Me About Yourself\"",
    categories: ["Interview", "Application"],
    description: "Build a concise and structured answer mapped to target role requirements.",
    outputFormat: "Markdown",
    promptText: `[PASTE YOUR RESUME]
[PASTE FULL JOB DESCRIPTION]

Write a 60-90 second answer with:
1. Introduction
2. Professional Background with quantified achievement
3. Role Alignment to top JD requirements
4. Unique Value Proposition
5. Enthusiastic close`
  },
  {
    id: 11,
    title: "Help me Quantify My Achievements",
    categories: ["Resume", "Interview"],
    description: "Turn vague bullet points into measurable impact statements.",
    outputFormat: "Markdown",
    promptText: `Here is my bullet: [CURRENT BULLET]

Ask 3+ clarifying questions to uncover metrics, then provide:
- Conservative quantified version
- Moderate quantified version
- Strong quantified version`
  },
  {
    id: 12,
    title: "Identify Employer Objections/Concerns",
    categories: ["Interview", "Application"],
    description: "Predict hiring concerns and prepare responses to neutralize risk.",
    outputFormat: "Markdown",
    promptText: `[PASTE YOUR RESUME]
[Target Role]

Identify likely concerns (gaps, experience mismatch, career change, job hopping, education, etc.).
For each: objection, why it matters, strategy to address, and sample interview response.`
  },
  {
    id: 13,
    title: "Informational Interview Request Email",
    categories: ["Email", "Networking"],
    description: "Draft a concise outreach email requesting a 15–20 minute informational chat.",
    outputFormat: "Markdown",
    promptText: `Inputs:
[Contact Name], [Role], [Company], [How You Found Them], [Why You're Interested], [Your Situation], [What You Hope To Learn]

Output:
- 3 subject line options
- Email body under 150 words
Constraints: respectful, researched, flexible, no direct job ask.`
  },
  {
    id: 14,
    title: "Job-Specific Informational Interview Questions",
    categories: ["Networking", "Interview"],
    description: "Generate open-ended questions by topic for better informational interviews.",
    outputFormat: "Markdown",
    promptText: `Using [Target Role], [Industry], [Company], [Your Background], generate 15-20 open-ended questions grouped by:
Role & Responsibilities, Skills & Qualifications, Company & Culture, Industry Insights, Personal Experience.`
  },
  {
    id: 15,
    title: "LinkedIn Boolean Search String Generator",
    categories: ["LinkedIn", "Networking"],
    description: "Produce recruiter, hiring manager, and peer search strings with usage tips.",
    outputFormat: "Markdown",
    promptText: `Inputs: [Target Role], [Industry], [Location], [Company Size], [Additional Criteria]

Return 3 Boolean strings for:
1) Recruiters
2) Hiring Managers
3) Professionals
For each include where to run it and refinement tips.`
  },
  {
    id: 16,
    title: "Post-Interview Analysis",
    categories: ["Interview", "Email"],
    description: "Reflect on interview performance and plan follow-up actions.",
    outputFormat: "Markdown",
    promptText: `Interview details: [Company], [Role], [Date], [Interviewers], [Format]
What went well: [3-5 items]
Improve areas: [2-3 items]
Difficult questions: [list]

Generate:
performance review, interest signals, thank-you points, improvement plan, references talking points, and follow-up timeline.`
  },
  {
    id: 17,
    title: "Prepare with Customized Interview Questions",
    categories: ["Interview", "Application"],
    description: "Predict interview questions from JD and provide answer frameworks.",
    outputFormat: "Markdown",
    promptText: `[PASTE FULL JOB DESCRIPTION]

Generate questions across:
- Role-specific technical (5-7)
- Behavioral STAR (5-7)
- Culture fit (3-5)
- Situational (3-5)
For each include why asked, key points, and answer framework.`
  },
  {
    id: 18,
    title: "Rapidfire Salary Research",
    categories: ["Market Research", "Application"],
    description: "Estimate compensation and negotiation guidance for a target role.",
    outputFormat: "Markdown",
    promptText: `Use [Job Title], [Industry], [Location], [Years of Experience], [Company Size]

Provide salary ranges by level, total comp components, drivers, negotiation insights, red flags, and best research sources.`
  },
  {
    id: 19,
    title: "Restructure Achievements to Highlight Metrics",
    categories: ["Resume", "Application"],
    description: "Rewrite bullets to lead with quantified impact.",
    outputFormat: "Markdown",
    promptText: `Rewrite these bullets:
[Bullet 1]
[Bullet 2]
[Bullet 3]

For each, return:
- Original
- Metrics-first rewrite
- Alternative angle
- Strengthening suggestions
Use pattern: [Result] by [Action] which [Context].`
  },
  {
    id: 20,
    title: "Upcoming Industry Events",
    categories: ["Networking", "Market Research"],
    description: "Find conferences, meetups, and webinars with attendance strategy tips.",
    outputFormat: "Markdown",
    promptText: `For [Industry], [Location], [Interests], [Budget], provide:
1) Major conferences (6-12 months)
2) Local meetups
3) Virtual events
4) Associations
5) Tips to maximize networking ROI`
  },
  {
    id: 21,
    title: "Write Achievements for Your Resume",
    categories: ["Resume", "Application"],
    description: "Generate strong bullet points with action verbs, metrics, and outcomes.",
    outputFormat: "Markdown",
    promptText: `Inputs: [Role], [Company], [Duration], [Industry], [Responsibilities], [Projects], [Tools]

Create 8-10 bullets split across major achievements, day-to-day impact, and skills/tools.
Keep each bullet concise and impact-oriented.`
  },
  {
    id: 22,
    title: "Write Discoverable LinkedIn Headlines",
    categories: ["LinkedIn", "Personal Brand"],
    description: "Generate SEO-focused headline variants and keyword guidance.",
    outputFormat: "Markdown",
    promptText: `Given [Current Role], [Target Role], [Key Skills], [Industry], [Unique Value], write 10 headline options.
For each include character count, keywords, and best use case.
Also include recruiter keywords and common mistakes.`
  },
  {
    id: 23,
    title: "Write Your LinkedIn Work Experience Section",
    categories: ["LinkedIn", "Resume"],
    description: "Craft experience entries with summary, achievements, and SEO terms.",
    outputFormat: "Markdown",
    promptText: `Inputs: [Role], [Company], [Duration], [Industry], [Responsibilities], [Achievements], [Skills]

Output:
1) Opening statement
2) 3-5 key achievement bullets
3) Skills/tools section
Also provide SEO keywords and profile optimization tips.`
  },
  {
    id: 24,
    title: "Write Your LinkedIn \"About Me\" Summary",
    categories: ["LinkedIn", "Personal Brand"],
    description: "Build two About section versions: professional and conversational.",
    outputFormat: "Markdown",
    promptText: `Inputs:
[Background], [Experience], [Goals], [Target Audience], [Skills], [Achievements], [Passions], [Differentiator], [Current Focus]

Write 2 first-person versions (200-300 words):
- Professional tone
- Conversational tone
Structure with hook, story, expertise, current focus, CTA.`
  },
  {
    id: 25,
    title: "Write a Post-Interview Thank You Email",
    categories: ["Email", "Interview"],
    description: "Generate high-quality thank-you notes with reinforcement points.",
    outputFormat: "Markdown",
    promptText: `Inputs: [Interviewer], [Company], [Position], [Date], [Format], [Topics], [Points to Reinforce], [Additional Info]

Return:
- 3 subject options
- Email body under 200 words
- Timing recommendation
- Multi-interviewer guidance`
  },
  {
    id: 26,
    title: "Write a Professional Summary",
    categories: ["Resume", "Application"],
    description: "Create three ATS-friendly resume summary formats.",
    outputFormat: "Markdown",
    promptText: `Inputs: [Title], [Years Experience], [Industry], [Target Role], [Key Skills], [Top Achievements], [Credentials], [Differentiator]

Write three under-4-line summaries:
1) Traditional
2) Achievement-led
3) Hybrid`
  },
  {
    id: 27,
    title: "Write a Recommendation on LinkedIn",
    categories: ["LinkedIn", "Networking"],
    description: "Draft an authentic recommendation with concrete examples.",
    outputFormat: "Markdown",
    promptText: `Inputs: [Person Name], [Role], [Company], [Relationship], [Duration], [Strengths], [Examples], [Impact], [Skills], [Unique Qualities]

Write a 150-250 word recommendation, plus key phrases and related skills to endorse.`
  },
  {
    id: 28,
    title: "Write an Effective #OpenToWork Post for LinkedIn",
    categories: ["LinkedIn", "Personal Brand"],
    description: "Create confident job-search announcement posts with CTA and hashtags.",
    outputFormat: "Markdown",
    promptText: `Inputs: [Status], [Target Roles], [Industries], [Location], [Background], [Preferences], [Skills], [Impact], [Passions]

Write two versions:
1) Standard professional
2) Personal/vulnerable
Include hashtags, timing suggestions, and engagement tips.`
  },
  {
    id: 29,
    title: "Write an Elevator Pitch",
    categories: ["Interview", "Networking"],
    description: "Produce five 30-45 second pitch variations for different contexts.",
    outputFormat: "Markdown",
    promptText: `[PASTE YOUR RESUME]

Use quick-clear and impact-oriented templates to generate 5 spoken elevator pitches (30-45 seconds each).`
  },
  {
    id: 30,
    title: "Write an Email to the Hiring Manager",
    categories: ["Email", "Application"],
    description: "Create direct outreach email linking JD priorities to your achievements.",
    outputFormat: "Markdown",
    promptText: `Step 1: Review [PASTE FULL JOB DESCRIPTION]
Step 2: Review [PASTE YOUR RESUME]
Step 3: Use [Hiring Manager Name], [Your Name], [Company Name]

Draft email with:
- Personalized greeting
- Intro paragraph
- 3 bolded priorities from JD mapped to achievements
- Meeting request with specific date/time
- Professional closing with contact info`
  }
];
