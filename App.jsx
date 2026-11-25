import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity, Bell, CalendarDays, ChevronLeft, CircleHelp, Clock3,
  ExternalLink, House, Menu, Radio, Search, Shield, Trophy, Tv,
  X, LogIn, LogOut, Plus, Trash2, RefreshCw, Settings, Info
} from 'lucide-react'
import { supabase, backendReady } from './supabase'

const demoMatches = [
  { id: 'demo-1', home_team: 'الفريق الأول', away_team: 'الفريق الثاني', competition: 'مثال توضيحي', kickoff: null, status: 'scheduled', score: null, is_demo: true },
  { id: 'demo-2', home_team: 'نادي تجريبي', away_team: 'نادي آخر', competition: 'بيانات تجريبية', kickoff: null, status: 'scheduled', score: null, is_demo: true }
]

const demoChannels = [
  { id: 'demo-c1', name: 'القناة الرياضية الرسمية', description: 'أضف رابط القناة الرسمي بعد التحقق من شروط الاستخدام والترخيص.', official_url: '', embed_url: '', is_active: true, is_demo: true }
]

const navItems = [
  ['home', 'الرئيسية', House], ['matches', 'المباريات', CalendarDays],
  ['live', 'مباشر', Radio], ['channels', 'القنوات', Tv]
]

function formatKickoff(value) {
  if (!value) return 'لم يحدد الموعد'
  return new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Baghdad' }).format(new Date(value))
}

function statusLabel(status) {
  return ({ live: 'مباشرة', scheduled: 'قادمة', finished: 'انتهت', postponed: 'مؤجلة' })[status] || 'غير محددة'
}

export default function App() {
  const [page, setPage] = useState('home')
  const [matches, setMatches] = useState(demoMatches)
  const [channels, setChannels] = useState(demoChannels)
  const [session, setSession] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginMessage, setLoginMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [adminTab, setAdminTab] = useState('matches')
  const [matchForm, setMatchForm] = useState({ home_team: '', away_team: '', competition: '', kickoff: '', status: 'scheduled' })
  const [channelForm, setChannelForm] = useState({ name: '', description: '', official_url: '', embed_url: '' })

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadData() {
    if (!supabase) return
    setLoading(true)
    const [m, c] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff', { ascending: true }).limit(100),
      supabase.from('channels').select('*').eq('is_active', true).order('name')
    ])
    if (!m.error) setMatches(m.data || [])
    if (!c.error) setChannels(c.data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [session])

  async function signIn(e) {
    e.preventDefault()
    setLoginMessage('')
    if (!supabase) return setLoginMessage('اربط Supabase أولاً عبر إعداد متغيرات البيئة.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoginMessage(error ? 'تعذر تسجيل الدخول. تحقق من البيانات وإعداد المستخدم في Supabase.' : '')
    if (!error) { setShowLogin(false); setPassword(''); setPage('admin') }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    setPage('home')
  }

  async function addMatch(e) {
    e.preventDefault()
    if (!supabase || !session) return
    const payload = { ...matchForm, kickoff: matchForm.kickoff ? new Date(matchForm.kickoff).toISOString() : null }
    const { error } = await supabase.from('matches').insert(payload)
    if (error) alert('لم تتم الإضافة: ' + error.message)
    else { setMatchForm({ home_team: '', away_team: '', competition: '', kickoff: '', status: 'scheduled' }); loadData() }
  }

  async function deleteMatch(id) {
    if (!supabase || !session || !confirm('هل تريد حذف المباراة؟')) return
    const { error } = await supabase.from('matches').delete().eq('id', id)
    if (error) alert(error.message); else loadData()
  }

  async function addChannel(e) {
    e.preventDefault()
    if (!supabase || !session) return
    const { error } = await supabase.from('channels').insert({ ...channelForm, is_active: true })
    if (error) alert('لم تتم الإضافة: ' + error.message)
    else { setChannelForm({ name: '', description: '', official_url: '', embed_url: '' }); loadData() }
  }

  async function deleteChannel(id) {
    if (!supabase || !session || !confirm('هل تريد حذف القناة؟')) return
    const { error } = await supabase.from('channels').delete().eq('id', id)
    if (error) alert(error.message); else loadData()
  }

  const filteredMatches = useMemo(() => matches.filter(m =>
    `${m.home_team} ${m.away_team} ${m.competition}`.toLowerCase().includes(search.toLowerCase())
  ), [matches, search])

  const liveMatches = filteredMatches.filter(m => m.status === 'live')
  const visibleChannels = channels.filter(c => c.is_active !== false)

  function go(next) { setPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => go('home')} aria-label="الرئيسية">
        <span className="brand-mark"><Trophy size={22}/></span>
        <span><b>MALAEb</b><small>منصة ملاعب الرياضية</small></span>
      </button>
      <nav className="desktop-nav">
        {navItems.map(([id, label, Icon]) => <button key={id} className={page === id ? 'nav-link active' : 'nav-link'} onClick={() => go(id)}><Icon size={17}/>{label}</button>)}
      </nav>
      <div className="top-actions">
        <button className="icon-btn" onClick={() => go('help')} title="معلومات"><CircleHelp size={19}/></button>
        {session ? <button className="admin-btn" onClick={() => go('admin')}><Settings size={16}/> الإدارة</button> : <button className="admin-btn" onClick={() => setShowLogin(true)}><LogIn size={16}/> دخول المدير</button>}
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Activity size={14}/> عالم الرياضة بين يديك</span>
          <h1>كل المباريات،<br/><em>في مكان واحد.</em></h1>
          <p>تابع جدول المباريات والنتائج والقنوات الرياضية من مصادرها الرسمية.</p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => go('matches')}>استعرض المباريات <ChevronLeft size={18}/></button>
            <button className="secondary-btn" onClick={() => go('channels')}>القنوات الرسمية <Tv size={17}/></button>
          </div>
        </div>
        <div className="hero-art"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="ball">⚽</div><div className="hero-tag"><Radio size={15}/> تغطية رياضية</div></div>
      </section>

      <div className="notice"><Info size={17}/><span>النسخة الأولى: عند عدم ربط قاعدة البيانات ستظهر بيانات توضيحية فقط، وليست مباريات أو نتائج حقيقية.</span></div>

      <div className="section-head">
        <div><span className="section-kicker">تابع كل جديد</span><h2>{page === 'live' ? 'المباريات المباشرة' : page === 'channels' ? 'القنوات الرياضية' : page === 'admin' ? 'لوحة الإدارة' : page === 'help' ? 'معلومات المنصة' : 'المباريات والبطولات'}</h2></div>
        <label className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن فريق أو بطولة"/></label>
      </div>

      {(page === 'home' || page === 'matches' || page === 'live') && <>
        <div className="stats-row">
          <div className="stat-card"><span className="stat-icon green"><Radio size={19}/></span><div><b>{liveMatches.length}</b><small>مباريات مباشرة</small></div></div>
          <div className="stat-card"><span className="stat-icon blue"><CalendarDays size={19}/></span><div><b>{filteredMatches.length}</b><small>مباريات معروضة</small></div></div>
          <div className="stat-card"><span className="stat-icon gold"><Tv size={19}/></span><div><b>{visibleChannels.length}</b><small>قنوات مضافة</small></div></div>
        </div>
        <div className="match-list">
          {(page === 'live' ? liveMatches : filteredMatches).map(m => <article className="match-card" key={m.id}>
            <div className="match-meta"><span className={m.status === 'live' ? 'live-pill' : 'status-pill'}>{m.status === 'live' && <i/>}{statusLabel(m.status)}</span><span>{m.competition}</span></div>
            <div className="teams"><div className="team"><span className="team-badge"><Shield size={23}/></span><b>{m.home_team}</b></div><div className="score">{m.score || 'VS'}</div><div className="team"><span className="team-badge"><Shield size={23}/></span><b>{m.away_team}</b></div></div>
            <div className="match-footer"><span><Clock3 size={15}/>{formatKickoff(m.kickoff)}</span>{m.is_demo && <span className="demo-label">مثال تجريبي</span>}</div>
            {session && !m.is_demo && <button className="delete-btn" onClick={() => deleteMatch(m.id)}><Trash2 size={15}/> حذف</button>}
          </article>)}
          {filteredMatches.length === 0 && <div className="empty-state">لا توجد مباريات مطابقة حالياً.</div>}
        </div>
      </>}

      {(page === 'home' || page === 'channels') && <section className="channels-section">
        <div className="subhead"><div><span className="section-kicker">المشاهدة من المصدر</span><h2>القنوات الرياضية</h2></div><button className="text-btn" onClick={() => go('channels')}>عرض الكل <ChevronLeft size={16}/></button></div>
        <div className="channel-grid">
          {visibleChannels.map(c => <article className="channel-card" key={c.id}><div className="channel-logo"><Tv size={27}/></div><div className="channel-info"><b>{c.name}</b><p>{c.description || 'القناة الرسمية'}</p></div>{c.official_url ? <a className="watch-btn" href={c.official_url} target="_blank" rel="noreferrer">الموقع الرسمي <ExternalLink size={15}/></a> : <span className="pending-btn">بانتظار إضافة الرابط</span>}</article>)}
        </div>
        <p className="small-note">يتم فتح موقع القناة الرسمي. لا يتم إعادة بث المحتوى أو تجاوز قيود التضمين.</p>
      </section>}

      {page === 'admin' && <section className="admin-panel">
        {!session ? <div className="empty-state">يجب تسجيل الدخول بحساب المدير للوصول إلى لوحة التحكم.<button className="primary-btn" onClick={() => setShowLogin(true)}>تسجيل الدخول</button></div> : <>
          <div className="admin-welcome"><div><h3>مرحباً بك في الإدارة</h3><p>{session.user.email}</p></div><button className="secondary-btn" onClick={signOut}><LogOut size={16}/> تسجيل الخروج</button></div>
          <div className="admin-tabs"><button className={adminTab === 'matches' ? 'selected' : ''} onClick={() => setAdminTab('matches')}>إدارة المباريات</button><button className={adminTab === 'channels' ? 'selected' : ''} onClick={() => setAdminTab('channels')}>إدارة القنوات</button></div>
          {!backendReady && <div className="notice">يجب إعداد Supabase قبل حفظ البيانات.</div>}
          {adminTab === 'matches' ? <><form className="admin-form" onSubmit={addMatch}><h3><Plus size={18}/> إضافة مباراة</h3><div className="form-grid"><input required placeholder="الفريق الأول" value={matchForm.home_team} onChange={e => setMatchForm({...matchForm, home_team:e.target.value})}/><input required placeholder="الفريق الثاني" value={matchForm.away_team} onChange={e => setMatchForm({...matchForm, away_team:e.target.value})}/><input placeholder="البطولة" value={matchForm.competition} onChange={e => setMatchForm({...matchForm, competition:e.target.value})}/><input type="datetime-local" value={matchForm.kickoff} onChange={e => setMatchForm({...matchForm, kickoff:e.target.value})}/><select value={matchForm.status} onChange={e => setMatchForm({...matchForm, status:e.target.value})}><option value="scheduled">قادمة</option><option value="live">مباشرة</option><option value="finished">انتهت</option><option value="postponed">مؤجلة</option></select></div><button className="primary-btn" disabled={!backendReady}>حفظ المباراة</button></form><div className="admin-items">{matches.filter(m => !m.is_demo).map(m => <div key={m.id}><span>{m.home_team} × {m.away_team}</span><button onClick={() => deleteMatch(m.id)}><Trash2 size={16}/></button></div>)}</div></> :
          <><form className="admin-form" onSubmit={addChannel}><h3><Plus size={18}/> إضافة قناة رسمية</h3><div className="form-grid"><input required placeholder="اسم القناة" value={channelForm.name} onChange={e => setChannelForm({...channelForm, name:e.target.value})}/><input placeholder="وصف القناة" value={channelForm.description} onChange={e => setChannelForm({...channelForm, description:e.target.value})}/><input required type="url" placeholder="رابط الموقع الرسمي" value={channelForm.official_url} onChange={e => setChannelForm({...channelForm, official_url:e.target.value})}/><input type="url" placeholder="رابط التضمين (إن كان مسموحاً)" value={channelForm.embed_url} onChange={e => setChannelForm({...channelForm, embed_url:e.target.value})}/></div><button className="primary-btn" disabled={!backendReady}>حفظ القناة</button></form><div className="admin-items">{channels.filter(c => !c.is_demo).map(c => <div key={c.id}><span>{c.name}</span><button onClick={() => deleteChannel(c.id)}><Trash2 size={16}/></button></div>)}</div></>}
        </>}
      </section>}

      {page === 'help' && <section className="help-card"><h3>عن منصة ملاعب</h3><p>منصة رياضية لعرض جداول المباريات والنتائج وروابط القنوات الرسمية. هذه النسخة لا تستضيف بثاً تلفزيونياً ولا تعرض روابط غير مرخصة.</p><p>لإظهار بيانات حقيقية، اربط مزود بيانات رياضية مرخصاً من خلال خادم وسيط يحفظ مفاتيح API بعيداً عن المتصفح.</p></section>}
    </main>

    <footer><div className="footer-brand"><Trophy size={20}/> <b>MALAEb</b></div><span>منصة رياضية مستقلة • المحتوى المرئي لدى أصحابه</span><span>© {new Date().getFullYear()} MALAEb</span></footer>

    <nav className="mobile-nav">{navItems.map(([id, label, Icon]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => go(id)}><Icon size={19}/><small>{label}</small></button>)}</nav>

    {showLogin && <div className="modal-backdrop" onClick={() => setShowLogin(false)}><form className="login-modal" onSubmit={signIn} onClick={e => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => setShowLogin(false)}><X size={19}/></button><div className="login-icon"><Shield size={25}/></div><h2>دخول المدير</h2><p>لوحة إدارة MALAEb محمية بحساب Supabase.</p><label>البريد الإلكتروني<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com"/></label><label>كلمة المرور<input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور"/></label>{loginMessage && <div className="error-msg">{loginMessage}</div>}<button className="primary-btn full-btn" type="submit">تسجيل الدخول</button></form></div>}
  </div>
}