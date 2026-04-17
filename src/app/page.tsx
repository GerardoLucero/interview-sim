'use client'

import { useState, useRef, useEffect } from 'react'

type InterviewType = 'system-design' | 'behavioral' | 'technical-coding' | 'architecture'
type ExperienceLevel = 'mid' | 'senior' | 'staff' | 'principal'

interface Message {
  role: 'interviewer' | 'candidate'
  content: string
}

interface Evaluation {
  overallScore: number
  breakdown: Record<string, number>
  strengths: string[]
  improvements: string[]
  verdict: string
  hireRecommendation: 'strong_yes' | 'yes' | 'lean_no' | 'no'
  nextSteps: string
}

const TYPES: { value: InterviewType; label: string; desc: string }[] = [
  { value: 'system-design',    label: 'System Design',    desc: 'Distributed systems, scalability, data modeling' },
  { value: 'behavioral',       label: 'Behavioral',       desc: 'STAR method, leadership, conflict resolution' },
  { value: 'technical-coding', label: 'Technical Coding', desc: 'Algorithms, data structures, clean code' },
  { value: 'architecture',     label: 'Architecture',     desc: 'Migrations, tradeoffs, long-term design' },
]

const LEVELS: ExperienceLevel[] = ['mid', 'senior', 'staff', 'principal']

const VERDICT: Record<string, { color: string; label: string }> = {
  strong_yes: { color: '#22c55e', label: 'Strong Yes — ready for top-tier' },
  yes:        { color: '#84cc16', label: 'Yes — solid candidate' },
  lean_no:    { color: '#f59e0b', label: 'Lean No — needs improvement' },
  no:         { color: '#ef4444', label: 'No — significant gaps' },
}

const card = { padding: 20, borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a' } as const
const btn = (active: boolean) => ({
  padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14,
  border: `1px solid ${active ? '#6366f1' : '#2a2a2a'}`,
  background: active ? '#1e1b4b' : '#1a1a1a',
  color: active ? '#818cf8' : '#e5e5e5',
})

export default function Home() {
  const [phase, setPhase] = useState<'setup' | 'chat' | 'done'>('setup')
  const [type, setType]   = useState<InterviewType>('system-design')
  const [level, setLevel] = useState<ExperienceLevel>('senior')
  const [role, setRole]   = useState('Software Engineer')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [evaluation, setEval]     = useState<Evaluation | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function start() {
    setLoading(true)
    const res  = await fetch('/api/interview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start', type, level, role }) })
    const data = await res.json()
    setSessionId(data.sessionId)
    setMessages([{ role: 'interviewer', content: data.message }])
    setPhase('chat')
    setLoading(false)
  }

  async function send() {
    if (!input.trim() || !sessionId) return
    const content = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'candidate', content }])
    setLoading(true)
    const res  = await fetch('/api/interview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'message', sessionId, content }) })
    const data = await res.json()
    setMessages(prev => [...prev, { role: 'interviewer', content: data.message }])
    setLoading(false)
  }

  async function evaluate() {
    if (!sessionId) return
    setLoading(true)
    const res  = await fetch('/api/interview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'evaluate', sessionId }) })
    const data = await res.json()
    setEval(data.evaluation)
    setPhase('done')
    setLoading(false)
  }

  function reset() {
    setPhase('setup'); setMessages([]); setSessionId(null); setEval(null)
  }

  // --- Setup ---
  if (phase === 'setup') return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Interview Sim</h1>
      <p style={{ color: '#666', margin: '0 0 40px' }}>Practice technical interviews with an AI that does not go easy on you.</p>

      <label style={{ display: 'block', fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Interview type</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        {TYPES.map(t => (
          <button key={t.value} onClick={() => setType(t.value)} style={{ ...btn(type === t.value), textAlign: 'left' as const }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{t.label}</div>
            <div style={{ fontSize: 12, color: '#555' }}>{t.desc}</div>
          </button>
        ))}
      </div>

      <label style={{ display: 'block', fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Level</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {LEVELS.map(l => <button key={l} onClick={() => setLevel(l)} style={{ ...btn(level === l), textTransform: 'capitalize' as const }}>{l}</button>)}
      </div>

      <label style={{ display: 'block', fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Role</label>
      <input value={role} onChange={e => setRole(e.target.value)}
        style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#e5e5e5', fontSize: 15, boxSizing: 'border-box' as const, marginBottom: 32 }} />

      <button onClick={start} disabled={loading}
        style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
        {loading ? 'Starting...' : 'Start Interview →'}
      </button>
    </div>
  )

  // --- Results ---
  if (phase === 'done' && evaluation) {
    const s = evaluation.overallScore
    const scoreColor = s >= 70 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444'
    const v = VERDICT[evaluation.hireRecommendation]
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Results</h2>
          <button onClick={reset} style={{ ...btn(false), fontSize: 13 }}>New interview</button>
        </div>

        <div style={{ ...card, textAlign: 'center' as const, marginBottom: 24 }}>
          <div style={{ fontSize: 64, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{s}</div>
          <div style={{ color: '#666', fontSize: 13, margin: '8px 0 16px' }}>Overall score</div>
          <span style={{ padding: '6px 16px', borderRadius: 20, background: v.color + '20', color: v.color, fontSize: 13, fontWeight: 600 }}>{v.label}</span>
        </div>

        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16 }}>Breakdown</div>
          {Object.entries(evaluation.breakdown).map(([key, val]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: '#ccc' }}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}</span>
                <span style={{ color: '#666' }}>{val}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: '#222' }}>
                <div style={{ height: '100%', borderRadius: 2, width: `${val}%`, background: val >= 70 ? '#22c55e' : val >= 50 ? '#f59e0b' : '#ef4444' }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Verdict</div>
          <p style={{ margin: 0, fontSize: 14, color: '#ccc', lineHeight: 1.6 }}>{evaluation.verdict}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ padding: 16, borderRadius: 8, background: '#0a150a', border: '1px solid #1a2e1a' }}>
            <div style={{ fontSize: 12, color: '#4ade80', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Strengths</div>
            {evaluation.strengths.map((s, i) => <p key={i} style={{ margin: '0 0 6px', fontSize: 13, color: '#86efac' }}>+ {s}</p>)}
          </div>
          <div style={{ padding: 16, borderRadius: 8, background: '#150a0a', border: '1px solid #2e1a1a' }}>
            <div style={{ fontSize: 12, color: '#f87171', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Improve</div>
            {evaluation.improvements.map((s, i) => <p key={i} style={{ margin: '0 0 6px', fontSize: 13, color: '#fca5a5' }}>↑ {s}</p>)}
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 8, background: '#0a0a15', border: '1px solid #1a1a2e' }}>
          <div style={{ fontSize: 12, color: '#818cf8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Next step</div>
          <p style={{ margin: 0, fontSize: 13, color: '#a5b4fc', lineHeight: 1.6 }}>{evaluation.nextSteps}</p>
        </div>
      </div>
    )
  }

  // --- Chat ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '14px 24px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Interview Sim</span>
          <span style={{ color: '#555', fontSize: 13, marginLeft: 12 }}>{type.replace(/-/g, ' ')} · {level} · {role}</span>
        </div>
        <button onClick={evaluate} disabled={loading || messages.length < 4}
          style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #3f1515', background: 'transparent', color: '#f87171', cursor: messages.length < 4 ? 'not-allowed' : 'pointer', fontSize: 13, opacity: messages.length < 4 ? 0.4 : 1 }}>
          End &amp; Evaluate
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, flexDirection: m.role === 'candidate' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              background: m.role === 'interviewer' ? '#1e1b4b' : '#141a0a',
              color: m.role === 'interviewer' ? '#818cf8' : '#84cc16',
            }}>
              {m.role === 'interviewer' ? 'AI' : 'ME'}
            </div>
            <div style={{
              maxWidth: '75%', padding: '12px 16px', borderRadius: 10, fontSize: 14, lineHeight: 1.65,
              background: m.role === 'interviewer' ? '#131320' : '#1a1a1a',
              border: `1px solid ${m.role === 'interviewer' ? '#22223a' : '#2a2a2a'}`,
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#818cf8' }}>AI</div>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#131320', border: '1px solid #22223a', color: '#444', fontSize: 14 }}>...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '14px 24px', borderTop: '1px solid #1a1a1a', display: 'flex', gap: 10, flexShrink: 0 }}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Type your answer... (Enter to send, Shift+Enter for newline)"
          disabled={loading}
          style={{
            flex: 1, padding: '12px 14px', borderRadius: 8, border: '1px solid #2a2a2a',
            background: '#1a1a1a', color: '#e5e5e5', fontSize: 14, resize: 'none',
            height: 76, fontFamily: 'inherit', boxSizing: 'border-box' as const,
          }} />
        <button onClick={send} disabled={loading || !input.trim()}
          style={{
            padding: '0 20px', borderRadius: 8, border: 'none', background: '#6366f1',
            color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14,
            opacity: !input.trim() || loading ? 0.4 : 1,
          }}>Send</button>
      </div>
    </div>
  )
}
