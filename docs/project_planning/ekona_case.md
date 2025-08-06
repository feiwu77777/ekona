ekona - Technical Interview Use Case Brief
Objective
Design and implement a functional basic prototype demonstrating your ability to architect and build an
AI multi-agent workflow integrated within a full-stack application, with a strong emphasis on leveraging
AI tools to accelerate delivery and document their use.
The entire use case should not take you more than a few hours to complete, reflecting thoughtful
scoping, asking clarification questions if needed, smart engineering choices for a pilot, and pragmatic
use of AI-assisted development.
User Story
"As a user, I want an AI-powered assistant that can autonomously draft a complete blog post (1000
words) in Markdown format on any provided topic. The system should automatically research the topic
using recent, reliable sources from the internet, suggest and embed relevant images, provide references,
and allow me to interactively review and edit the document with natural language requests."
Scope of Work
1- AI MULTI-AGENT WORKFLOW
The whole system should be able to:
- Fetch recent, relevant articles from the internet.
- Retrieve relevant openly licensed images.
- Compose a structured Markdown blog post.
- Provide a reference list with links to sources used.
- Accept user instructions for changes in natural language.
2- FRONTEND
Interactive web interface to:
- Submit a topic.
- Preview the Markdown blog post in real time.
- Send edit/change requests.
- Review and approve suggested images (Stretched Goal)
Swiss AI boutique ekona.ai
3- BACKEND
Backend service responsible for:
- Orchestrating the agents.
- Providing API endpoints for frontend interaction.
- Monitoring the LLM calls (Stretched goal)
4- PERSISTENCE
Database to store:
- Blogs created.
- References and image metadata.
- User session state if needed
Key Expectations and Success Criteria
We encourage you to use AI tools as part of your workflow to accelerate delivery (e.g., Cursor, Lovable, v0, Windsurf,
etc.), and expect your final submission to include a clear, transparent account of what AI tools you used, for what
tasks, and how they contributed to the delivery goal (in any format you prefer). We also value a forward-looking
reflection on what you could have accomplished with more time.
Your solution must be testable, with clear instructions provided, think of this as a status update sent to a client to
show where you stand so far.
In evaluating your work, we will look for:
• Ability to break down the request into actionable items, understand requirements, and plan
execution
• A well-designed AI multi-agent workflow with clear coordination
• A coherent, well-structured Markdown blog post with sources and images
• A UI that enables topic submission, live preview, and edit requests
• Clean, modular, and documented code
• A complete and easy-to-follow README
• Clear documentation for installation and testing or online access