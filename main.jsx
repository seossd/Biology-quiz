import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, CheckCircle2, RotateCcw, Search, Sparkles, Star, Trophy, XCircle, ClipboardList } from 'lucide-react';
import { WORDS } from './words';
import './styles.css';

const STORAGE = {
  wrong: 'bio-vocab-wrong-v1',
  starred: 'bio-vocab-starred-v1',
  history: 'bio-vocab-history-v1'
};

function loadSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
  catch { return new Set(); }
}
function saveSet(key, set) { localStorage.setItem(key, JSON.stringify([...set])); }
function shuffle(arr) {
  return [...arr].map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);
}
function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[\s·,./()\[\]{}:;!?~`'"“”‘’_-]/g, '')
    .replace(/조직계통/g, '조직계')
    .trim();
}
function isCorrect(input, answer) {
  const a = normalize(input);
  const b = normalize(answer);
  if (!a) return false;
  if (a === b) return true;
  const parts = String(answer).split(/[,/，;；·]|또는|혹은|및/).map(normalize).filter(Boolean);
  return parts.some(p => a === p || (p.length >= 3 && a.includes(p)) || (a.length >= 3 && p.includes(a)));
}
function getWordKey(item) { return item.en; }

function App() {
  const [mode, setMode] = useState('learn');
  const [wrongSet, setWrongSet] = useState(() => loadSet(STORAGE.wrong));
  const [starredSet, setStarredSet] = useState(() => loadSet(STORAGE.starred));
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE.history) || '[]'); } catch { return []; }
  });

  useEffect(() => saveSet(STORAGE.wrong, wrongSet), [wrongSet]);
  useEffect(() => saveSet(STORAGE.starred, starredSet), [starredSet]);
  useEffect(() => localStorage.setItem(STORAGE.history, JSON.stringify(history.slice(0, 20))), [history]);

  const stats = useMemo(() => ({
    total: WORDS.length,
    wrong: wrongSet.size,
    starred: starredSet.size,
    learned: Math.max(0, WORDS.length - wrongSet.size)
  }), [wrongSet, starredSet]);

  const toggleStar = (en) => {
    setStarredSet(prev => {
      const next = new Set(prev);
      next.has(en) ? next.delete(en) : next.add(en);
      return next;
    });
  };
  const markWrong = (en) => setWrongSet(prev => new Set(prev).add(en));
  const markCorrect = (en) => setWrongSet(prev => { const next = new Set(prev); next.delete(en); return next; });
  const resetWrong = () => setWrongSet(new Set());
  const addHistory = (record) => setHistory(prev => [record, ...prev].slice(0, 20));

  return (
    <div className="app-shell">
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <header className="hero">
        <div>
          <p className="eyebrow"><Sparkles size={16} /> 생명 시험범위 · 영어단어 {WORDS.length}개</p>
          <h1>한글 뜻 주관식 퀴즈</h1>
          <p className="hero-text">학습용에서는 뜻을 확인하며 외우고, 시험용에서는 실제 시험처럼 입력해서 채점함. 오답은 자동 저장돼서 다시 풀 수 있음.</p>
        </div>
        <div className="mode-tabs" role="tablist">
          <button className={mode === 'learn' ? 'active' : ''} onClick={() => setMode('learn')}><BookOpen size={18}/> 학습용</button>
          <button className={mode === 'exam' ? 'active' : ''} onClick={() => setMode('exam')}><ClipboardList size={18}/> 시험용</button>
        </div>
      </header>

      <section className="dashboard">
        <Stat label="전체 단어" value={stats.total} />
        <Stat label="오답 단어" value={stats.wrong} tone="bad" />
        <Stat label="별표 단어" value={stats.starred} tone="star" />
        <Stat label="최근 최고점" value={history.length ? `${Math.max(...history.map(h => h.score))}%` : '-'} tone="good" />
      </section>

      {mode === 'learn' ? (
        <LearnMode wrongSet={wrongSet} starredSet={starredSet} toggleStar={toggleStar} markWrong={markWrong} markCorrect={markCorrect} resetWrong={resetWrong} />
      ) : (
        <ExamMode wrongSet={wrongSet} starredSet={starredSet} markWrong={markWrong} markCorrect={markCorrect} addHistory={addHistory} />
      )}
    </div>
  );
}

function Stat({ label, value, tone = '' }) {
  return <div className={`stat ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function LearnMode({ wrongSet, starredSet, toggleStar, markWrong, markCorrect, resetWrong }) {
  const [scope, setScope] = useState('all');
  const [order, setOrder] = useState('random');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [query, setQuery] = useState('');

  const pool = useMemo(() => {
    let base = WORDS;
    if (scope === 'wrong') base = WORDS.filter(w => wrongSet.has(w.en));
    if (scope === 'starred') base = WORDS.filter(w => starredSet.has(w.en));
    return order === 'random' ? shuffle(base) : base;
  }, [scope, order, wrongSet, starredSet]);

  useEffect(() => { setIndex(0); setRevealed(false); }, [scope, order]);

  const item = pool[index] || null;
  const progress = pool.length ? Math.round(((index + 1) / pool.length) * 100) : 0;
  const next = () => { setIndex(i => pool.length ? (i + 1) % pool.length : 0); setRevealed(false); };
  const prev = () => { setIndex(i => pool.length ? (i - 1 + pool.length) % pool.length : 0); setRevealed(false); };
  const filteredList = WORDS.filter(w => (w.en + w.ko).toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="content-grid">
      <section className="panel main-card">
        <div className="tool-row">
          <select value={scope} onChange={e => setScope(e.target.value)}>
            <option value="all">전체 단어</option>
            <option value="wrong">오답만</option>
            <option value="starred">별표만</option>
          </select>
          <select value={order} onChange={e => setOrder(e.target.value)}>
            <option value="random">랜덤 순서</option>
            <option value="original">엑셀 순서</option>
          </select>
          <button className="ghost" onClick={resetWrong}><RotateCcw size={16}/> 오답 초기화</button>
        </div>

        {item ? <>
          <div className="progress-line"><span style={{ width: `${progress}%` }} /></div>
          <div className="card-topline">{index + 1} / {pool.length}</div>
          <button className={`star-button ${starredSet.has(item.en) ? 'on' : ''}`} onClick={() => toggleStar(item.en)} aria-label="별표"><Star size={24} /></button>
          <div className="word-card">
            <p className="word-label">영어 단어</p>
            <h2>{item.en}</h2>
            <div className={`answer-box ${revealed ? 'show' : ''}`}>
              <span>한글 뜻</span>
              <strong>{revealed ? item.ko : '눌러서 정답 확인'}</strong>
            </div>
          </div>
          <div className="action-row">
            <button onClick={prev} className="secondary">이전</button>
            <button onClick={() => setRevealed(v => !v)} className="primary">{revealed ? '정답 숨기기' : '정답 보기'}</button>
            <button onClick={() => { markWrong(item.en); next(); }} className="danger-soft"><XCircle size={17}/> 헷갈림</button>
            <button onClick={() => { markCorrect(item.en); next(); }} className="success-soft"><CheckCircle2 size={17}/> 외움</button>
            <button onClick={next} className="secondary">다음</button>
          </div>
        </> : <EmptyState text="이 범위에 해당하는 단어가 아직 없음." />}
      </section>

      <aside className="panel side-card">
        <h3>단어장</h3>
        <div className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="영어/한글 검색" /></div>
        <div className="word-list">
          {filteredList.map(w => <div className="mini-word" key={w.en}>
            <button className={starredSet.has(w.en) ? 'mini-star on' : 'mini-star'} onClick={() => toggleStar(w.en)}><Star size={15}/></button>
            <div><b>{w.en}</b><span>{w.ko}</span></div>
            {wrongSet.has(w.en) && <em>오답</em>}
          </div>)}
        </div>
      </aside>
    </main>
  );
}

function ExamMode({ wrongSet, starredSet, markWrong, markCorrect, addHistory }) {
  const [scope, setScope] = useState('all');
  const [count, setCount] = useState('20');
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState([]);
  const [instant, setInstant] = useState(true);
  const inputRef = useRef(null);

  const available = useMemo(() => {
    if (scope === 'wrong') return WORDS.filter(w => wrongSet.has(w.en));
    if (scope === 'starred') return WORDS.filter(w => starredSet.has(w.en));
    return WORDS;
  }, [scope, wrongSet, starredSet]);

  useEffect(() => { if (started) inputRef.current?.focus(); }, [started, idx]);

  const startExam = () => {
    const n = count === 'all' ? available.length : Math.min(Number(count), available.length);
    setQueue(shuffle(available).slice(0, n));
    setIdx(0); setInput(''); setAnswers([]); setStarted(true);
  };

  const submit = () => {
    const item = queue[idx];
    if (!item) return;
    const ok = isCorrect(input, item.ko);
    const record = { ...item, input, ok };
    setAnswers(prev => [...prev, record]);
    ok ? markCorrect(item.en) : markWrong(item.en);
    setInput('');
    if (idx + 1 >= queue.length) {
      const final = [...answers, record];
      const score = Math.round((final.filter(a => a.ok).length / final.length) * 100);
      addHistory({ date: new Date().toLocaleString('ko-KR'), score, total: final.length, correct: final.filter(a => a.ok).length });
      setIdx(queue.length);
    } else setIdx(i => i + 1);
  };

  const current = queue[idx];
  const done = started && idx >= queue.length;
  const correctCount = answers.filter(a => a.ok).length;
  const score = answers.length ? Math.round((correctCount / answers.length) * 100) : 0;
  const wrongAnswers = answers.filter(a => !a.ok);

  if (!started) return (
    <section className="panel exam-setup">
      <div>
        <p className="eyebrow"><Trophy size={16}/> 시험용 설정</p>
        <h2>실전처럼 한글 뜻 입력하기</h2>
        <p>정답을 입력하고 Enter를 누르면 바로 다음 문제로 넘어감. 틀린 단어는 오답노트에 자동 저장됨.</p>
      </div>
      <div className="setup-grid">
        <label>출제 범위<select value={scope} onChange={e => setScope(e.target.value)}><option value="all">전체 단어</option><option value="wrong">오답만</option><option value="starred">별표만</option></select></label>
        <label>문항 수<select value={count} onChange={e => setCount(e.target.value)}><option value="10">10문제</option><option value="20">20문제</option><option value="30">30문제</option><option value="all">전체</option></select></label>
        <label className="check-label"><input type="checkbox" checked={instant} onChange={e => setInstant(e.target.checked)} /> 채점 결과를 풀이 중 표시</label>
      </div>
      <button className="primary big" disabled={!available.length} onClick={startExam}>시험 시작하기 · {available.length}개 가능</button>
      {!available.length && <p className="warning">선택한 범위에 단어가 없음. 전체 단어를 선택해줘.</p>}
    </section>
  );

  if (done) return (
    <section className="panel result-card">
      <p className="eyebrow"><Trophy size={16}/> 시험 결과</p>
      <h2>{score}점</h2>
      <p className="result-summary">{queue.length}문제 중 {correctCount}개 정답, {wrongAnswers.length}개 오답</p>
      <div className="score-ring"><span>{score}%</span></div>
      <div className="action-row center">
        <button className="primary" onClick={() => setStarted(false)}>새 시험 만들기</button>
        <button className="danger-soft" disabled={!wrongAnswers.length} onClick={() => { setQueue(shuffle(wrongAnswers)); setIdx(0); setAnswers([]); setInput(''); }}>틀린 것만 재시험</button>
      </div>
      <h3>오답 체크</h3>
      <div className="review-list">
        {wrongAnswers.length ? wrongAnswers.map(a => <div className="review-item" key={a.en}>
          <b>{a.en}</b>
          <p>내 답: <span className="wrong-text">{a.input || '(빈칸)'}</span></p>
          <p>정답: <span className="right-text">{a.ko}</span></p>
        </div>) : <EmptyState text="오답 없음. 깔끔하게 다 맞음!" />}
      </div>
    </section>
  );

  return (
    <section className="panel exam-card">
      <div className="exam-head">
        <span>{idx + 1} / {queue.length}</span>
        <strong>현재 정답률 {score}%</strong>
      </div>
      <div className="progress-line"><span style={{ width: `${Math.round((idx / queue.length) * 100)}%` }} /></div>
      <div className="word-card exam-word">
        <p className="word-label">다음 영어 단어의 한글 뜻은?</p>
        <h2>{current.en}</h2>
      </div>
      <form onSubmit={e => { e.preventDefault(); submit(); }} className="answer-form">
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder="한글 뜻 입력" autoComplete="off" />
        <button className="primary">제출</button>
      </form>
      {instant && answers.length > 0 && <div className={`last-feedback ${answers.at(-1).ok ? 'ok' : 'no'}`}>
        {answers.at(-1).ok ? '방금 문제 정답!' : <>방금 문제 오답 · 정답은 <b>{answers.at(-1).ko}</b></>}
      </div>}
    </section>
  );
}

function EmptyState({ text }) { return <div className="empty">{text}</div>; }

createRoot(document.getElementById('root')).render(<App />);
