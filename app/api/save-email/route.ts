import { NextResponse } from 'next/server'
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

function escapeCSV(field: string): string {
  const str = String(field ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function POST(request: Request) {
  try {
    const { email, url, goal, lang } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const dataDir = join(process.cwd(), 'data')
    const csvPath = join(dataDir, 'leads.csv')

    mkdirSync(dataDir, { recursive: true })

    if (!existsSync(csvPath)) {
      writeFileSync(csvPath, 'timestamp,email,url,goal,language')
    }

    const timestamp = new Date().toISOString()
    const row = [timestamp, email, url, goal, lang].map(escapeCSV).join(',')
    appendFileSync(csvPath, `\n${row}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save email error:', error)
    return NextResponse.json({ error: 'Failed to save email' }, { status: 500 })
  }
}
