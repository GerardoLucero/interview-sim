import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import {
  generateInterviewerResponse,
  evaluateInterview,
  getOpeningQuestion,
  type InterviewType,
  type ExperienceLevel,
  type InterviewSession,
  type Message,
} from '@/lib/interview-engine'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'start') {
    const { type, level, role } = body as { type: InterviewType; level: ExperienceLevel; role: string }
    const openingQuestion = getOpeningQuestion(type)

    const session = await db.session.create({
      data: {
        type,
        level,
        role,
        messages: [{ role: 'interviewer', content: openingQuestion, timestamp: new Date().toISOString() }],
      },
    })

    return NextResponse.json({ sessionId: session.id, message: openingQuestion })
  }

  if (action === 'message') {
    const { sessionId, content } = body as { sessionId: string; content: string }

    const session = await db.session.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const messages = session.messages as unknown as Message[]
    const candidateMessage: Message = { role: 'candidate', content, timestamp: new Date().toISOString() }

    const interviewSession: InterviewSession = {
      type: session.type as InterviewType,
      level: session.level as ExperienceLevel,
      role: session.role,
      messages: [...messages, candidateMessage],
    }

    const response = await generateInterviewerResponse(interviewSession, content)
    const interviewerMessage: Message = { role: 'interviewer', content: response, timestamp: new Date().toISOString() }

    await db.session.update({
      where: { id: sessionId },
      data: { messages: [...interviewSession.messages, interviewerMessage] as unknown as Prisma.InputJsonValue },
    })

    return NextResponse.json({ message: response })
  }

  if (action === 'evaluate') {
    const { sessionId } = body as { sessionId: string }

    const session = await db.session.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const interviewSession: InterviewSession = {
      type: session.type as InterviewType,
      level: session.level as ExperienceLevel,
      role: session.role,
      messages: session.messages as unknown as Message[],
    }

    const evaluation = await evaluateInterview(interviewSession)
    await db.session.update({ where: { id: sessionId }, data: { evaluation: evaluation as unknown as Prisma.InputJsonValue } })

    return NextResponse.json({ evaluation })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Session ID required' }, { status: 400 })

  const session = await db.session.findUnique({ where: { id } })
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  return NextResponse.json(session)
}
