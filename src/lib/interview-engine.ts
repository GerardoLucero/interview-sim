import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

export type InterviewType = 'system-design' | 'behavioral' | 'technical-coding' | 'architecture'
export type ExperienceLevel = 'mid' | 'senior' | 'staff' | 'principal'

export interface InterviewSession {
  type: InterviewType
  level: ExperienceLevel
  role: string
  messages: Message[]
}

export interface Message {
  role: 'interviewer' | 'candidate'
  content: string
  timestamp: string
}

export interface InterviewEvaluation {
  overallScore: number  // 0-100
  breakdown: {
    technicalDepth: number
    problemSolving: number
    communication: number
    tradeoffReasoning: number
    practicalExperience: number
  }
  strengths: string[]
  improvements: string[]
  verdict: string
  hireRecommendation: 'strong_yes' | 'yes' | 'lean_no' | 'no'
  nextSteps: string
}

const INTERVIEWER_PERSONAS: Record<InterviewType, string> = {
  'system-design': `You are a Staff Engineer at a top-tier tech company conducting a system design interview.
You ask candidates to design large-scale distributed systems. You probe for: scalability decisions, data modeling,
consistency tradeoffs, failure modes, and real-world operational concerns. You give hints when stuck but push back on vague answers.`,

  'behavioral': `You are an Engineering Manager conducting a behavioral interview using the STAR method.
You focus on: leadership, conflict resolution, technical decisions with business impact, failure and learning,
cross-functional collaboration. You dig deeper when answers are too high-level.`,

  'technical-coding': `You are a Senior Engineer conducting a technical interview. You ask algorithmic and
system-level coding questions. You care about: problem decomposition, edge cases, time/space complexity,
clean code, and practical engineering judgment — not just textbook solutions.`,

  'architecture': `You are a Principal Engineer conducting an architecture review interview. You present real
architectural challenges and ask candidates to design, critique, and improve systems. You focus on:
technology choices, migration strategies, team and operational implications, and long-term maintainability.`,
}

const OPENING_QUESTIONS: Record<InterviewType, string[]> = {
  'system-design': [
    "Let's design a URL shortener like bit.ly that needs to handle 100M URLs and 10B redirects per month. Walk me through your approach.",
    "Design a real-time notification system for a social platform with 50M daily active users.",
    "How would you design a distributed job queue that needs to process 1M tasks per hour with at-most-once delivery guarantees?",
    "Design the backend for a ride-sharing app — focus on the matching system and real-time location tracking.",
  ],
  'behavioral': [
    "Tell me about a time you had to make a significant technical decision with incomplete information. What was the outcome?",
    "Describe a situation where you disagreed with your team or manager on a technical approach. How did you handle it?",
    "Tell me about the most complex system you've built. What would you do differently now?",
    "Give me an example of when you had to balance technical debt against shipping speed. What did you decide?",
  ],
  'technical-coding': [
    "Given a list of intervals, merge all overlapping ones and return the result. How would you approach this?",
    "Design a rate limiter that supports multiple users and multiple time windows. What data structure would you use?",
    "How would you implement a LRU cache with O(1) get and put operations?",
    "Given a large log file that doesn't fit in memory, find the top 10 most frequent IP addresses.",
  ],
  'architecture': [
    "We have a monolith handling 10K requests/minute and need to start migrating to microservices. Where would you start?",
    "Our PostgreSQL database is becoming a bottleneck at 50K writes/minute. Walk me through how you'd solve this.",
    "We need to add real-time features to an existing REST API-based application. What are your options?",
    "Our CI/CD pipeline takes 45 minutes and is blocking deployments. How would you approach fixing this?",
  ],
}

export function getOpeningQuestion(type: InterviewType): string {
  const questions = OPENING_QUESTIONS[type]
  return questions[Math.floor(Math.random() * questions.length)]
}

export async function generateInterviewerResponse(
  session: InterviewSession,
  candidateAnswer: string
): Promise<string> {
  const history = session.messages.map(m =>
    `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`
  ).join('\n\n')

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4.6'),
    system: `${INTERVIEWER_PERSONAS[session.type]}

You are interviewing a candidate for a ${session.level}-level ${session.role} position.
Keep responses concise (2-4 sentences). Ask one focused follow-up question or probe deeper.
If the answer is complete, transition naturally to the next topic or begin wrapping up.
Do not reveal that you are an AI. Stay in character throughout.`,
    prompt: `Interview history:
${history}

Candidate's latest answer: ${candidateAnswer}

Respond as the interviewer. Ask a follow-up, probe deeper, or transition to the next topic.`,
    maxTokens: 300,
  })

  return text
}

export async function evaluateInterview(session: InterviewSession): Promise<InterviewEvaluation> {
  const transcript = session.messages.map(m =>
    `${m.role === 'interviewer' ? 'INTERVIEWER' : 'CANDIDATE'}: ${m.content}`
  ).join('\n\n')

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4.6'),
    system: `You are a senior hiring committee evaluating an interview transcript.
Be honest and calibrated — a score of 70+ means you would hire. Return only valid JSON, no markdown.`,
    prompt: `Evaluate this ${session.type} interview for a ${session.level} ${session.role} position.

TRANSCRIPT:
${transcript}

Score on each dimension (0-100) and provide feedback.

Return JSON only:
{
  "overallScore": 72,
  "breakdown": {
    "technicalDepth": 80,
    "problemSolving": 75,
    "communication": 70,
    "tradeoffReasoning": 65,
    "practicalExperience": 72
  },
  "strengths": ["3-4 specific things the candidate did well"],
  "improvements": ["3-4 specific areas to improve with concrete advice"],
  "verdict": "2-3 sentence honest assessment of this candidate",
  "hireRecommendation": "strong_yes | yes | lean_no | no",
  "nextSteps": "One concrete thing to study or practice to improve for the next interview"
}`,
    maxTokens: 800,
  })

  try {
    return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()) as InterviewEvaluation
  } catch {
    return {
      overallScore: 0, breakdown: { technicalDepth: 0, problemSolving: 0, communication: 0, tradeoffReasoning: 0, practicalExperience: 0 },
      strengths: [], improvements: ['Could not evaluate — transcript may be too short'],
      verdict: 'Evaluation incomplete.', hireRecommendation: 'lean_no', nextSteps: 'Complete a full interview session to get an evaluation.',
    }
  }
}
