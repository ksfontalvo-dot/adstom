import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are Adstom AI, a content refinement assistant. When given a blog article and user feedback, you rewrite the complete article applying the requested changes while keeping the brand voice consistent. When you rewrite or modify the article, you must also return updated Instagram and Facebook adaptations based on the new article content. Always return all four fields: reply, full_article, instagram, and facebook. The article must remain 800+ words. In reply, write 1-2 sentences explaining what you changed and why. The current year is 2026. Write all content as if today is 2026. When referencing statistics, studies or trends, frame them correctly — for example "a 2024 study found..." not "this year a study found...".`

const REFINE_TOOL: Anthropic.Tool = {
  name: 'refine_article',
  description: 'Refine the blog article and return the updated article plus updated social media content.',
  input_schema: {
    type: 'object',
    properties: {
      reply: {
        type: 'string',
        description: '1-2 sentences explaining what was changed and why. Match the language of the article.',
      },
      full_article: {
        type: 'string',
        description: 'The complete rewritten article with all changes applied. Use ## for H2 headings, **text** for bold, blank lines between paragraphs. Must be 800+ words. Match the language of the original article.',
      },
      instagram: {
        type: 'object',
        description: 'Updated Instagram post based on the new article content.',
        properties: {
          caption: { type: 'string', description: 'Engaging Instagram caption with emojis, matching the article language.' },
          hashtags: { type: 'string', description: '10 relevant hashtags.' },
        },
        required: ['caption', 'hashtags'],
      },
      facebook: {
        type: 'object',
        description: 'Updated Facebook post based on the new article content.',
        properties: {
          caption: { type: 'string', description: 'Facebook post ending with a question, matching the article language.' },
          hashtags: { type: 'string', description: '4-5 hashtags.' },
        },
        required: ['caption', 'hashtags'],
      },
    },
    required: ['reply', 'full_article', 'instagram', 'facebook'],
  },
}

export async function POST(request: Request) {
  let lang = 'en'
  try {
    const body = await request.json()
    lang = body.lang ?? 'en'
    const { article, userMessage } = body

    const langNote =
      lang === 'es'
        ? 'The article is in Colombian Spanish. Keep all output — reply, full_article, instagram, and facebook — entirely in Colombian Spanish.'
        : 'The article is in Australian English. Keep all output in Australian English.'

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: `${SYSTEM_PROMPT} ${langNote}`,
      tools: [REFINE_TOOL],
      tool_choice: { type: 'tool', name: 'refine_article' },
      messages: [
        {
          role: 'user',
          content: `Here is the current article:\n\n${article}\n\n---\n\nFeedback to apply: ${userMessage}`,
        },
      ],
    })

    const toolUse = message.content.find((c): c is Anthropic.ToolUseBlock => c.type === 'tool_use')
    if (!toolUse) throw new Error('No tool_use block in response')

    const { reply, full_article, instagram, facebook } = toolUse.input as {
      reply: string
      full_article: string
      instagram: { caption: string; hashtags: string }
      facebook: { caption: string; hashtags: string }
    }

    return NextResponse.json({ reply, full_article, instagram, facebook })
  } catch (error) {
    console.error('Chat error:', error)
    const fallback =
      lang === 'es'
        ? 'Algo salió mal. Por favor intenta de nuevo.'
        : 'Something went wrong. Please try again.'
    return NextResponse.json({ reply: fallback, full_article: null, instagram: null, facebook: null }, { status: 500 })
  }
}
