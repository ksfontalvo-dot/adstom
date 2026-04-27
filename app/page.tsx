'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type Lang = 'en' | 'es'
type Screen = 'landing' | 'topic' | 'analysing' | 'result'

interface GenerateResult {
  audience: { name: string; search_behaviour: string; trust_signals: string; brand_voice: string }
  article: { title: string; full_content: string; word_count: string }
  seo_meta: {
    slug: string; primary_keyword: string; secondary_keywords: string
    meta_description: string; est_visits: string; seo_difficulty: string
    geo_score: string; geo_tip: string
  }
  social: {
    instagram: { caption: string; hashtags: string }
    facebook: { caption: string; hashtags: string }
  }
}

interface ChatMsg { role: 'ai' | 'user'; content: string }

const T = {
  en: {
    headline: "Your brand's voice,", headline_em: "your audience's language",
    sub: "Paste your URL. Get a complete SEO blog — written in your exact brand voice, for your real audience. In seconds.",
    your_website: "YOUR WEBSITE", url_ph: "yourbrand.com.au",
    content_goal: "CONTENT GOAL",
    goal_seo: "🎯 SEO Ranking", goal_vis: "📣 Brand Visibility", goal_lead: "💬 Lead Generation",
    continue_btn: "Continue →",
    step_label: "Step 2 of 2", topic_h: "Do you have a topic in mind?",
    topic_sub: "You know your brand best. Tell us what you want to write about — or let us find the best opportunity for you.",
    opt_own_title: "I have a topic", opt_own_desc: "I'll describe what I want to write about",
    opt_auto_title: "Choose the best topic for me", opt_auto_desc: "Adstom finds the highest-impact keyword opportunity",
    topic_ph: "e.g. The benefits of natural SPF for sensitive skin...",
    generate_btn: "Generate my content →",
    an_h: "Analysing your brand",
    step1: "Scanning website & brand voice", step2: "Profiling your audience",
    step3: "Finding keyword opportunities", step4: "Writing your article",
    an_time: "This usually takes 15–20 seconds",
    writing_to: "WRITING TO", edit_btn: "✏️ Edit",
    est_visits: "Est. visits / mo", within_90: "within 90 days",
    seo_difficulty: "SEO difficulty", low_comp: "low competition",
    geo_score: "GEO score", ai_cite: "AI citation potential",
    tab_article: "Article", read_more: "Read full article ↓", show_less: "Show less ↑",
    primary_kw: "Primary keyword", secondary_kws: "Secondary keywords",
    geo_tip_label: "💡 Improve AI visibility",
    refine: "Refine your content", chat_left: (n: number) => `${n} / 2 left`,
    chat_init: "Your article is ready ✓ I've written it in your brand's exact voice — if anything doesn't sound right, tell me and I'll fix it.",
    hint1: "Make the intro shorter", hint2: "More casual tone", hint3: "Change the CTA", hint4: "Explain the SEO strategy",
    chat_ph: "Tell me what to fix or improve...",
    chat_used: "You've used your 2 free refinements.", chat_link: "Get your free PDF →",
    you: "You",
    email_h: "Get your full plan as a PDF",
    email_sub: "We'll send you this article + SEO meta + Instagram & Facebook copy — formatted and ready to publish.",
    email_ph: "you@yourbrand.com", send_pdf: "Send me the PDF →",
    email_ok: "✓ On its way — check your inbox in the next few minutes.",
    email_note: "Free — no credit card, no spam.",
    new_url: "← New URL",
    error_gen: "Something went wrong generating your content. Please try again.",
    error_url: "Please enter a website URL.",
    modal_h: "Edit audience", modal_sub: "Adjust who you're writing for — changes apply instantly.",
    modal_name: "AUDIENCE NAME", modal_search: "SEARCH BEHAVIOUR", modal_trust: "TRUST SIGNALS",
    modal_cancel: "Cancel", modal_save: "Save changes",
  },
  es: {
    headline: "La voz de tu marca,", headline_em: "el idioma de tu audiencia",
    sub: "Pega tu URL. Obtén un blog SEO completo — escrito en la voz exacta de tu marca, para tu audiencia real. En segundos.",
    your_website: "TU SITIO WEB", url_ph: "tumarca.com.co",
    content_goal: "OBJETIVO DE CONTENIDO",
    goal_seo: "🎯 Posicionamiento SEO", goal_vis: "📣 Visibilidad de Marca", goal_lead: "💬 Generación de Leads",
    continue_btn: "Continuar →",
    step_label: "Paso 2 de 2", topic_h: "¿Tienes un tema en mente?",
    topic_sub: "Tú conoces mejor tu marca. Dinos sobre qué quieres escribir — o déjanos encontrar la mejor oportunidad para ti.",
    opt_own_title: "Tengo un tema", opt_own_desc: "Describiré sobre qué quiero escribir",
    opt_auto_title: "Elige el mejor tema para mí", opt_auto_desc: "Adstom encuentra la mejor oportunidad de keyword",
    topic_ph: "ej. Los beneficios del SPF natural para piel sensible...",
    generate_btn: "Generar mi contenido →",
    an_h: "Analizando tu marca",
    step1: "Escaneando web y voz de marca", step2: "Perfilando tu audiencia",
    step3: "Encontrando oportunidades de keywords", step4: "Escribiendo tu artículo",
    an_time: "Esto suele tomar 15–20 segundos",
    writing_to: "ESCRIBIENDO PARA", edit_btn: "✏️ Editar",
    est_visits: "Visitas est. / mes", within_90: "en 90 días",
    seo_difficulty: "Dificultad SEO", low_comp: "baja competencia",
    geo_score: "Puntuación GEO", ai_cite: "Potencial cita IA",
    tab_article: "Artículo", read_more: "Leer artículo completo ↓", show_less: "Mostrar menos ↑",
    primary_kw: "Keyword principal", secondary_kws: "Keywords secundarias",
    geo_tip_label: "💡 Mejorar visibilidad en IA",
    refine: "Refinar tu contenido", chat_left: (n: number) => `${n} / 2 restantes`,
    chat_init: "Tu artículo está listo ✓ Lo escribí en la voz exacta de tu marca — si algo no suena bien, dímelo y lo corrijo.",
    hint1: "Haz la intro más corta", hint2: "Tono más casual", hint3: "Cambia el CTA", hint4: "Explica la estrategia SEO",
    chat_ph: "Dime qué corregir o mejorar...",
    chat_used: "Usaste tus 2 refinamientos gratuitos.", chat_link: "Obtén el PDF gratuito →",
    you: "Tú",
    email_h: "Recibe tu plan completo en PDF",
    email_sub: "Te enviamos este artículo + SEO meta + copies de Instagram y Facebook — formateados y listos para publicar.",
    email_ph: "tu@tumarca.com", send_pdf: "Enviarme el PDF →",
    email_ok: "✓ ¡En camino! Revisa tu bandeja de entrada en los próximos minutos.",
    email_note: "Gratis — sin tarjeta, sin spam.",
    new_url: "← Nueva URL",
    error_gen: "Algo salió mal generando tu contenido. Por favor, intenta de nuevo.",
    error_url: "Por favor ingresa la URL de tu sitio web.",
    modal_h: "Editar audiencia", modal_sub: "Ajusta para quién escribes — los cambios se aplican al instante.",
    modal_name: "NOMBRE DE AUDIENCIA", modal_search: "COMPORTAMIENTO DE BÚSQUEDA", modal_trust: "SEÑALES DE CONFIANZA",
    modal_cancel: "Cancelar", modal_save: "Guardar cambios",
  },
}

function normalizeResult(data: unknown): GenerateResult {
  const d = (data ?? {}) as Record<string, unknown>
  const aud = (d.audience ?? {}) as Record<string, string>
  const art = (d.article ?? {}) as Record<string, string>
  const meta = (d.seo_meta ?? {}) as Record<string, string>
  const soc = (d.social ?? {}) as Record<string, unknown>
  const ig = (soc.instagram ?? {}) as Record<string, string>
  const fb = (soc.facebook ?? {}) as Record<string, string>
  return {
    audience: {
      name: aud.name ?? '',
      search_behaviour: aud.search_behaviour ?? '',
      trust_signals: aud.trust_signals ?? '',
      brand_voice: aud.brand_voice ?? '',
    },
    article: {
      title: art.title ?? '',
      full_content: art.full_content ?? '',
      word_count: art.word_count ?? '',
    },
    seo_meta: {
      slug: meta.slug ?? '',
      primary_keyword: meta.primary_keyword ?? '',
      secondary_keywords: meta.secondary_keywords ?? '',
      meta_description: meta.meta_description ?? '',
      est_visits: meta.est_visits ?? '',
      seo_difficulty: meta.seo_difficulty ?? '',
      geo_score: meta.geo_score ?? '',
      geo_tip: meta.geo_tip ?? '',
    },
    social: {
      instagram: { caption: ig.caption ?? '', hashtags: ig.hashtags ?? '' },
      facebook: { caption: fb.caption ?? '', hashtags: fb.hashtags ?? '' },
    },
  }
}

function renderMarkdown(text: string): string {
  if (!text) return ''
  return text
    .replace(/## (.+)/g, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
}

// ── LANG TOGGLE ───────────────────────────────────────────
function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="lang">
      <button className={`lb ${lang === 'en' ? 'on' : ''}`} onClick={() => setLang('en')}>🇦🇺 EN</button>
      <button className={`lb ${lang === 'es' ? 'on' : ''}`} onClick={() => setLang('es')}>🇨🇴 ES</button>
    </div>
  )
}

// ── SCREEN 1: LANDING ─────────────────────────────────────
function LandingScreen({
  lang, onContinue,
}: {
  lang: Lang
  onContinue: (url: string, goal: string) => void
}) {
  const t = T[lang]
  const [url, setUrl] = useState('')
  const [goal, setGoal] = useState('seo')
  const [urlError, setUrlError] = useState(false)

  const goals = [
    { key: 'seo', label: t.goal_seo },
    { key: 'vis', label: t.goal_vis },
    { key: 'lead', label: t.goal_lead },
  ]

  function handleContinue() {
    if (!url.trim()) { setUrlError(true); return }
    setUrlError(false)
    const selectedGoal = goals.find((g) => g.key === goal)?.label ?? t.goal_seo
    onContinue(url.trim(), selectedGoal)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '60px 24px 80px' }}>
      <div className="logo fade-up">
        <div className="logo-gem">✦</div>
        <span className="logo-name">Adstom</span>
      </div>

      <h1 className="h1 fade-up" style={{ animationDelay: '.08s' }}>
        {t.headline}<br /><em>{t.headline_em}</em>
      </h1>
      <p className="sub fade-up" style={{ animationDelay: '.16s' }}>{t.sub}</p>

      <div className="card fade-up" style={{ animationDelay: '.22s' }}>
        <div className="field-label">{t.your_website}</div>
        <div className="url-row" style={{ borderColor: urlError ? '#ef4444' : '' }}>
          <span className="url-pre">https://</span>
          <input
            className="url-in"
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setUrlError(false) }}
            placeholder={t.url_ph}
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
          />
        </div>
        {urlError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: -12, marginBottom: 12 }}>{t.error_url}</p>}

        <div className="field-label">{t.content_goal}</div>
        <div className="goals">
          {goals.map((g) => (
            <div
              key={g.key}
              className={`gp ${goal === g.key ? 'on' : ''}`}
              onClick={() => setGoal(g.key)}
            >
              {g.label}
            </div>
          ))}
        </div>

        <button className="go" onClick={handleContinue}>{t.continue_btn}</button>
      </div>
    </div>
  )
}

// ── SCREEN 2: TOPIC CHOICE ────────────────────────────────
function TopicScreen({
  lang, url, goal, onGenerate, error,
}: {
  lang: Lang; url: string; goal: string
  onGenerate: (mode: 'own' | 'auto', topic: string) => void
  error: string | null
}) {
  const t = T[lang]
  const [mode, setMode] = useState<'own' | 'auto'>('own')
  const [topic, setTopic] = useState('')

  function handleGenerate() {
    if (mode === 'own' && !topic.trim()) return
    onGenerate(mode, topic.trim())
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 480 }} className="fade-up">
        <div className="step-label"><span>✦</span><span>{t.step_label}</span></div>

        <h2 className="topic-h">{t.topic_h}</h2>
        <p className="topic-sub">{t.topic_sub}</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="topic-opts">
          <div className={`topic-opt ${mode === 'own' ? 'on' : ''}`} onClick={() => setMode('own')}>
            <span className="to-icon">✍️</span>
            <div style={{ flex: 1 }}>
              <div className="to-title">{t.opt_own_title}</div>
              <div className="to-desc">{t.opt_own_desc}</div>
            </div>
            <div className="to-check">{mode === 'own' ? '✓' : ''}</div>
          </div>
          <div className={`topic-opt ${mode === 'auto' ? 'on' : ''}`} onClick={() => setMode('auto')}>
            <span className="to-icon">🎯</span>
            <div style={{ flex: 1 }}>
              <div className="to-title">{t.opt_auto_title}</div>
              <div className="to-desc">{t.opt_auto_desc}</div>
            </div>
            <div className="to-check">{mode === 'auto' ? '✓' : ''}</div>
          </div>
        </div>

        {mode === 'own' && (
          <div className="topic-input-wrap">
            <textarea
              className="topic-in"
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.topic_ph}
            />
          </div>
        )}

        <button className="next-btn" onClick={handleGenerate}>{t.generate_btn}</button>
      </div>
    </div>
  )
}

// ── SCREEN 3: ANALYSING ───────────────────────────────────
function AnalysingScreen({ lang, url }: { lang: Lang; url: string }) {
  const t = T[lang]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 24px', textAlign: 'center' }}>
      <div className="spin-wrap"><div className="spinner" /></div>
      <div className="an-h">{t.an_h}</div>
      <div className="an-url">{url}</div>
      <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 24, fontWeight: 300 }}>{t.an_time}</div>
      <div className="an-steps">
        <div className="an-step"><span>🌐</span><span>{t.step1}</span><span className="an-ck">✓</span></div>
        <div className="an-step"><span>👥</span><span>{t.step2}</span><span className="an-ck">✓</span></div>
        <div className="an-step"><span>🔍</span><span>{t.step3}</span><span className="an-ck">✓</span></div>
        <div className="an-step"><span>✍️</span><span>{t.step4}</span><span className="an-ck">✓</span></div>
      </div>
    </div>
  )
}

// ── SCREEN 4: RESULT ──────────────────────────────────────
function ResultScreen({
  lang, url, goal, result, onHome,
}: {
  lang: Lang; url: string; goal: string; result: GenerateResult; onHome: () => void
}) {
  const t = T[lang]
  const emailRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'blog' | 'meta' | 'ig' | 'fb'>('blog')
  const [expanded, setExpanded] = useState(false)
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([{ role: 'ai', content: t.chat_init }])
  const [chatsLeft, setChatsLeft] = useState(2)
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatUsed, setChatUsed] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  // Editable audience state
  const [audience, setAudience] = useState(result.audience)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFields, setEditFields] = useState({
    name: result.audience.name,
    search_behaviour: result.audience.search_behaviour,
    trust_signals: result.audience.trust_signals,
  })
  // Article + social content — updated by chat refinements
  const [articleContent, setArticleContent] = useState(result.article.full_content)
  const [socialContent, setSocialContent] = useState({
    instagram: result.social?.instagram ?? { caption: '', hashtags: '' },
    facebook: result.social?.facebook ?? { caption: '', hashtags: '' },
  })

  const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMsgs, isChatLoading])

  const sendChat = useCallback(async (text: string) => {
    if (chatsLeft <= 0 || isChatLoading || !text.trim()) return
    const userMsg: ChatMsg = { role: 'user', content: text }
    setChatMsgs((prev) => [...prev, userMsg])
    setChatInput('')
    setIsChatLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article: articleContent, userMessage: text, lang }),
      })
      const data = await res.json()
      setChatMsgs((prev) => [...prev, { role: 'ai', content: data.reply }])
      if (data.full_article) {
        setArticleContent(data.full_article)
        setExpanded(true)
        setActiveTab('blog')
      }
      if (data.instagram || data.facebook) {
        setSocialContent((prev) => ({
          instagram: data.instagram ?? prev.instagram,
          facebook: data.facebook ?? prev.facebook,
        }))
      }
      const next = chatsLeft - 1
      setChatsLeft(next)
      if (next <= 0) setChatUsed(true)
    } catch {
      setChatMsgs((prev) => [...prev, { role: 'ai', content: lang === 'es' ? 'Algo salió mal. Por favor intenta de nuevo.' : 'Something went wrong. Please try again.' }])
    } finally {
      setIsChatLoading(false)
    }
  }, [chatsLeft, isChatLoading, articleContent, lang])

  async function submitEmail() {
    const email = emailInput.trim()
    if (!email || !email.includes('@')) { setEmailError(true); return }
    setEmailError(false)
    try {
      await fetch('/api/save-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, url, goal, lang }),
      })
      setEmailSent(true)
    } catch {
      setEmailSent(true)
    }
  }

  const scrollToEmail = () => emailRef.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      {/* Topbar */}
      <div className="topbar">
        <div className="tb-gem">✦</div>
        <span className="tb-name">Adstom</span>
        <span className="tb-chip">{url}</span>
        <span className="tb-goal">{goal}</span>
        <div className="tb-r">
          <button className="back-btn" onClick={onHome}>{t.new_url}</button>
        </div>
      </div>

      <div className="result-scroll">

        {/* Audience Insight */}
        <div className="insight-card fade-up">
          <div className="ic-top">
            <span className="ic-icon">👥</span>
            <div>
              <div className="ic-label">{t.writing_to}</div>
              <div className="ic-name">{audience.name}</div>
            </div>
            <button className="ic-edit" onClick={() => {
              setEditFields({ name: audience.name, search_behaviour: audience.search_behaviour, trust_signals: audience.trust_signals })
              setShowEditModal(true)
            }}>{t.edit_btn}</button>
          </div>
          <div className="ic-bullets">
            <div className="ic-bullet">
              <span className="ic-dot" />
              <span dangerouslySetInnerHTML={{ __html: audience.search_behaviour }} />
            </div>
            <div className="ic-bullet">
              <span className="ic-dot" />
              <span>{audience.trust_signals}</span>
            </div>
            <div className="ic-bullet">
              <span className="ic-dot" />
              <span>{audience.brand_voice}</span>
            </div>
          </div>
        </div>

        {/* Article Card */}
        <div className="art-card fade-up" style={{ animationDelay: '.08s' }}>
          <div className="art-head">
            <div className="art-eyebrow">{lang === 'es' ? 'TU ARTÍCULO' : 'YOUR ARTICLE'} · {month}</div>
            <div className="art-title">{result.article?.title}</div>
            <div className="art-tags">
              <span className="tag tag-kw">{result.seo_meta?.primary_keyword}</span>
              <span className="tag tag-green">Informational</span>
              <span className="tag tag-plain">{result.article?.word_count}</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="metrics">
            <div className="met">
              <div className="met-l">{t.est_visits}</div>
              <div className="met-v g">{result.seo_meta?.est_visits}</div>
              <div className="met-s">{t.within_90}</div>
            </div>
            <div className="met">
              <div className="met-l">{t.seo_difficulty}</div>
              <div className="met-v am">{result.seo_meta?.seo_difficulty}</div>
              <div className="met-s">{t.low_comp}</div>
            </div>
            <div className="met">
              <div className="met-l">{t.geo_score}</div>
              <div className="met-v p">{result.seo_meta?.geo_score}</div>
              <div className="met-s">{t.ai_cite}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {([['blog', t.tab_article], ['meta', 'SEO Meta'], ['ig', '📱 Instagram'], ['fb', '👥 Facebook']] as [typeof activeTab, string][]).map(([key, label]) => (
              <div key={key} className={`tab ${activeTab === key ? 'on' : ''}`} onClick={() => setActiveTab(key)}>{label}</div>
            ))}
          </div>

          {/* Article Panel */}
          <div className={`panel ${activeTab === 'blog' ? 'on' : ''}`}>
            <div className={`blog-fader ${expanded ? '' : 'short'}`}>
              <div
                className="blog-body"
                dangerouslySetInnerHTML={{ __html: '<p>' + renderMarkdown(articleContent) + '</p>' }}
              />
            </div>
            <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? t.show_less : t.read_more}
            </button>
          </div>

          {/* SEO Meta Panel */}
          <div className={`panel ${activeTab === 'meta' ? 'on' : ''}`}>
            <div className="meta-list">
              <div>
                <div className="mi-k">Slug</div>
                <div className="mi-v hi">{result.seo_meta?.slug}</div>
              </div>
              <div>
                <div className="mi-k">{t.primary_kw}</div>
                <div className="mi-v">{result.seo_meta?.primary_keyword}</div>
              </div>
              <div>
                <div className="mi-k">{t.secondary_kws}</div>
                <div className="mi-v">{result.seo_meta?.secondary_keywords}</div>
              </div>
              <div>
                <div className="mi-k">Meta description</div>
                <div className="mi-v plain">{result.seo_meta?.meta_description}</div>
              </div>
              <div>
                <div className="mi-k">GEO tip</div>
                <div className="geo-tip">
                  <div className="geo-tip-label">{t.geo_tip_label}</div>
                  {result.seo_meta?.geo_tip}
                </div>
              </div>
            </div>
          </div>

          {/* Instagram Panel */}
          <div className={`panel ${activeTab === 'ig' ? 'on' : ''}`}>
            <div className="soc-caption"
              dangerouslySetInnerHTML={{ __html: (socialContent.instagram.caption ?? '').replace(/\n/g, '<br>') }} />
            <div className="soc-tags">{socialContent.instagram.hashtags}</div>
          </div>

          {/* Facebook Panel */}
          <div className={`panel ${activeTab === 'fb' ? 'on' : ''}`}>
            <div className="soc-caption"
              dangerouslySetInnerHTML={{ __html: (socialContent.facebook.caption ?? '').replace(/\n/g, '<br>') }} />
            <div className="soc-tags">{socialContent.facebook.hashtags}</div>
          </div>
        </div>

        {/* Chat */}
        <div className="chat-card fade-up" style={{ animationDelay: '.14s' }}>
          <div className="chat-hd">
            <span className="chat-live" />
            <span className="chat-hd-label">{t.refine}</span>
            <span className="chat-hd-count">{t.chat_left(chatsLeft)}</span>
          </div>

          <div className="chat-msgs">
            {chatMsgs.map((msg, i) => (
              <div key={i} className={`cmsg ${msg.role}`}>
                <div className="cav">{msg.role === 'ai' ? 'A' : 'me'}</div>
                <div className="cwrap">
                  <div className="cname">{msg.role === 'ai' ? 'Adstom' : t.you}</div>
                  <div className="cbubble" dangerouslySetInnerHTML={{ __html: msg.content }} />
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="cmsg ai">
                <div className="cav">A</div>
                <div className="cwrap">
                  <div className="cname">Adstom</div>
                  <div className="typing-ind">
                    <div className="td" /><div className="td" /><div className="td" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {!chatUsed && (
            <div className="chat-hints">
              {[t.hint1, t.hint2, t.hint3, t.hint4].map((h) => (
                <div key={h} className="hint" onClick={() => sendChat(h)}>{h}</div>
              ))}
            </div>
          )}

          {!chatUsed ? (
            <div className="chat-input-row">
              <textarea
                className="chat-in"
                rows={1}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t.chat_ph}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(chatInput) } }}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 80) + 'px'
                }}
              />
              <button
                className="send-btn"
                disabled={isChatLoading || !chatInput.trim()}
                onClick={() => sendChat(chatInput)}
              >
                <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
                  <path d="M10 6L2 2L4.5 6L2 10L10 6Z" fill="white" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="chat-used">
              {t.chat_used}{' '}
              <a onClick={scrollToEmail}>{t.chat_link}</a>
            </div>
          )}
        </div>

        {/* Email CTA */}
        <div className="email-cta fade-up" style={{ animationDelay: '.2s' }} ref={(el) => { if (el) (emailRef as React.MutableRefObject<HTMLDivElement | null>).current = el as unknown as HTMLInputElement }}>
          <div className="email-cta-icon">📩</div>
          <div className="email-cta-h">{t.email_h}</div>
          <div className="email-cta-sub">{t.email_sub}</div>

          {!emailSent ? (
            <>
              <div className="email-row">
                <input
                  ref={emailRef}
                  className="email-in"
                  type="email"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setEmailError(false) }}
                  placeholder={t.email_ph}
                  style={{ borderColor: emailError ? '#ef4444' : '' }}
                  onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
                />
                <button className="email-btn" onClick={submitEmail}>{t.send_pdf}</button>
              </div>
              {emailError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{lang === 'es' ? 'Ingresa un email válido.' : 'Please enter a valid email.'}</p>}
            </>
          ) : (
            <div className="email-ok">{t.email_ok}</div>
          )}
          <div className="email-note">{t.email_note}</div>
        </div>

      </div>

      {/* Audience Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-h">{t.modal_h}</div>
            <div className="modal-sub">{t.modal_sub}</div>
            <div className="modal-field">
              <div className="modal-label">{t.modal_name}</div>
              <input
                className="modal-input"
                value={editFields.name}
                onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
              />
            </div>
            <div className="modal-field">
              <div className="modal-label">{t.modal_search}</div>
              <textarea
                className="modal-input"
                rows={2}
                value={editFields.search_behaviour}
                onChange={(e) => setEditFields({ ...editFields, search_behaviour: e.target.value })}
              />
            </div>
            <div className="modal-field">
              <div className="modal-label">{t.modal_trust}</div>
              <textarea
                className="modal-input"
                rows={2}
                value={editFields.trust_signals}
                onChange={(e) => setEditFields({ ...editFields, trust_signals: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowEditModal(false)}>{t.modal_cancel}</button>
              <button className="modal-save" onClick={() => {
                setAudience({ ...audience, ...editFields })
                setShowEditModal(false)
              }}>{t.modal_save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── MAIN APP ──────────────────────────────────────────────
const MIN_ANALYSE_MS = 4000

export default function App() {
  const [lang, setLang] = useState<Lang>('en')
  const [screen, setScreen] = useState<Screen>('landing')
  const [url, setUrl] = useState('')
  const [goal, setGoal] = useState('')
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(mode: 'own' | 'auto', topic: string) {
    setError(null)
    setScreen('analysing')

    try {
      const [data] = await Promise.all([
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, goal, lang, topicMode: mode, topic }),
        }).then(async (res) => {
          if (!res.ok) throw new Error('API error')
          return res.json()
        }),
        new Promise((resolve) => setTimeout(resolve, MIN_ANALYSE_MS)),
      ])

      setResult(normalizeResult(data))
      setScreen('result')
    } catch {
      setError(T[lang].error_gen)
      setScreen('topic')
    }
  }

  return (
    <>
      <LangToggle lang={lang} setLang={setLang} />
      {screen === 'landing' && (
        <LandingScreen
          lang={lang}
          onContinue={(u, g) => { setUrl(u); setGoal(g); setScreen('topic') }}
        />
      )}
      {screen === 'topic' && (
        <TopicScreen
          lang={lang}
          url={url}
          goal={goal}
          onGenerate={handleGenerate}
          error={error}
        />
      )}
      {screen === 'analysing' && <AnalysingScreen lang={lang} url={url} />}
      {screen === 'result' && result && (
        <ResultScreen
          lang={lang}
          url={url}
          goal={goal}
          result={result}
          onHome={() => { setScreen('landing'); setResult(null); setError(null) }}
        />
      )}
    </>
  )
}
