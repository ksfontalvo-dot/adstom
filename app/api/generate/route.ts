import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a senior content strategist with 15 years of experience in e-commerce brands in Australia and Colombia. You create SEO and GEO content that sounds authentically like the brand — never generic. Core principles: 1) Mirror the brand's exact vocabulary and tone. 2) Write for the specific identified audience. 3) SEO-optimised without sacrificing readability. 4) Include FAQ section at the end for GEO optimisation so ChatGPT and Perplexity cite the content. Use Australian English for EN brands. Use Colombian Spanish (Colombia) for ES — all article content, audience insights, social captions, meta description, and geo_tip must be written entirely in Colombian Spanish when language is ES. The current year is 2026. Write all content as if today is 2026. When referencing statistics, studies or trends, you can cite older sources but frame them correctly — for example "a 2024 study found..." not "this year a study found...". Never present outdated information as current.`

const CONTENT_TOOL: Anthropic.Tool = {
  name: 'generate_seo_content',
  description: 'Generate complete SEO/GEO content for the brand, fully in the requested language.',
  input_schema: {
    type: 'object',
    properties: {
      audience: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Audience segment name and demographics' },
          search_behaviour: { type: 'string', description: 'What they search and estimated monthly volume' },
          trust_signals: { type: 'string', description: 'What builds trust with this audience' },
          brand_voice: { type: 'string', description: 'Tone, style, and formality level description' },
        },
        required: ['name', 'search_behaviour', 'trust_signals', 'brand_voice'],
      },
      article: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          full_content: {
            type: 'string',
            description: 'Minimum 800 words. Use ## for H2 headings. Use **text** for bold. Separate paragraphs with a blank line. End with 3 FAQ items formatted as "Q: question\nA: answer".',
          },
          word_count: { type: 'string', description: 'e.g. 1,200 words' },
        },
        required: ['title', 'full_content', 'word_count'],
      },
      seo_meta: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'URL slug starting with /' },
          primary_keyword: { type: 'string' },
          secondary_keywords: { type: 'string', description: 'Comma-separated list' },
          meta_description: { type: 'string', description: 'Under 155 characters' },
          est_visits: { type: 'string', description: 'e.g. 2.4K' },
          seo_difficulty: { type: 'string', description: 'e.g. 28/100' },
          geo_score: { type: 'string', description: 'High, Medium, or Low' },
          geo_tip: { type: 'string', description: 'One actionable tip to improve AI citation. Write in the same language as the article.' },
        },
        required: ['slug', 'primary_keyword', 'secondary_keywords', 'meta_description', 'est_visits', 'seo_difficulty', 'geo_score', 'geo_tip'],
      },
      social: {
        type: 'object',
        properties: {
          instagram: {
            type: 'object',
            properties: {
              caption: { type: 'string', description: 'Engaging caption with emojis, in the article language' },
              hashtags: { type: 'string', description: '10 relevant hashtags' },
            },
            required: ['caption', 'hashtags'],
          },
          facebook: {
            type: 'object',
            properties: {
              caption: { type: 'string', description: 'Facebook post ending with a question, in the article language' },
              hashtags: { type: 'string', description: '4-5 hashtags' },
            },
            required: ['caption', 'hashtags'],
          },
        },
        required: ['instagram', 'facebook'],
      },
    },
    required: ['audience', 'article', 'seo_meta', 'social'],
  },
}

export async function POST(request: Request) {
  try {
    const { url, goal, lang, topicMode, topic } = await request.json()

    const language = lang === 'es' ? 'Colombian Spanish (ES)' : 'Australian English (EN)'
    const langInstruction =
      lang === 'es'
        ? 'IMPORTANT: Write ALL content entirely in Colombian Spanish — article, audience insights, social captions, meta description, and tips. Do not use English anywhere in the output.'
        : 'Write all content in Australian English.'

    const topicPart =
      topicMode === 'own' && topic
        ? `Write about this specific topic: ${topic}`
        : `Choose the highest-impact keyword opportunity for this brand.`

    const userPrompt = `Analyse this website: ${url}.
Content goal: ${goal}.
Output language: ${language}.
${langInstruction}
${topicPart}

Use the generate_seo_content tool to return the complete result.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      tools: [CONTENT_TOOL],
      tool_choice: { type: 'tool', name: 'generate_seo_content' },
      messages: [{ role: 'user', content: userPrompt }],
    })

    console.log('[generate] stop_reason:', message.stop_reason)

    const toolUse = message.content.find((c): c is Anthropic.ToolUseBlock => c.type === 'tool_use')
    if (!toolUse) throw new Error('No tool_use block in response')

    const result = toolUse.input as Record<string, unknown>
    console.log('[generate] top-level keys:', Object.keys(result))
    console.log('[generate] has seo_meta:', 'seo_meta' in result)
    console.log('[generate] has social:', 'social' in result)
    console.log('[generate] seo_meta:', JSON.stringify(result.seo_meta))
    console.log('[generate] social keys:', result.social ? Object.keys(result.social as object) : 'missing')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Failed to generate content. Please try again.' }, { status: 500 })
  }
}
