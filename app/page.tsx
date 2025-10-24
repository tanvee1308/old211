
'use client';
import { useEffect, useState } from 'react';
import DrawingCanvas from '../components/DrawingCanvas';
import { makeShareImage } from '../lib/makeShareImage';

type Entry = { id:string; imgUrl:string; word:string; meaning:string; language:string; createdAt:number };

const LANGS = ['Hindi','Urdu','Marathi','Gujarati','Punjabi','Bengali','Tamil','Telugu','Malayalam','Kannada','Sindhi','Konkani','Odia','Sinhala','Nepali'];

export default function Page(){
  const [img,setImg]=useState<string|null>(null);
  const [word,setWord]=useState('');
  const [meaning,setMeaning]=useState('');
  const [language,setLanguage]=useState('Hindi');
  const [entries,setEntries]=useState<Entry[]>([]); const [pageNum,setPageNum]=useState(1); const [total,setTotal]=useState(0); const [pageSize] = useState(30);
  const [submitting,setSubmitting]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);

  
  async function load(p:number = pageNum){
    setLoading(true);
    try{
      const res = await fetch(`/api/list?page=${p}&pageSize=${pageSize}`);
      const out = await res.json();
      setEntries(out.entries||[]); setTotal(out.totalCount||0);
    }finally{ setLoading(false); }
  }
  }
  useEffect(()=>{ load(1); },[]);

  async function handleSubmit(){
    if(!img){ setError('Please draw your word first.'); return; }
    if(!meaning.trim()){ setError('Please add a meaning.'); return; }
    setError(null); setSubmitting(true);
    try{
      const res = await fetch('/api/submit',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ word, meaning, language, dataUrl: img }) });
      const out = await res.json();
      if(!res.ok) throw new Error(out.error||'Failed to save');
      setWord(''); setMeaning(''); setLanguage('Hindi'); setImg(null);
      await load(1); setPageNum(1);
    }catch(e:any){ setError(e.message||'Error'); }finally{ setSubmitting(false); }
  }

  async function share(entry: Entry){
    const { blob, fileName } = await makeShareImage({ doodleUrl: entry.imgUrl, language: entry.language, meaning: entry.meaning, word: entry.word });
    if (navigator.share && navigator.canShare?.({ files: [new File([blob], fileName)] })) {
      await navigator.share({ title: 'MY DOODLE DICTIONARY SUBMISSION', text: `${entry.word?entry.word+' — ':''}${entry.meaning} (${entry.language})`, files: [new File([blob], fileName, { type: 'image/png' })] });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      alert('Saved image. You can share it from your gallery 📲');
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="h1">THE DOODLE WALL</h1><div style={{textAlign:"center", marginTop:4, fontSize:12, opacity:.8}}>by The Desi Dictionary</div>
      </div>

      <div style={{textAlign:'center',marginTop:'.5rem'}}><a className="wallBtn" href="#wall">View the Wall of Words</a></div>

<div className="intro">
        <p>✏️ Add a word you love — silly, sweet, or just so desi.</p>
        <p>💬 Every word teaches someone something new.</p>
        <p>🌸 Aiyo! Arrey! Oye! Whatever your word is, doodle it and drop it on the wall.</p>
        <p>💛 One word from you, one word learned by someone else.</p>
        <p>🚫 No galis & rude words allowed please!!</p>
      </div>

      <DrawingCanvas onExport={(d)=>setImg(d)} />

      <div className="inputRow">
        <select className="select" value={language} onChange={(e)=>setLanguage(e.target.value)}>
          {LANGS.map(l=> <option key={l} value={l}>{l}</option>)}
        </select>
        <input className="input" value={word} onChange={e=>setWord(e.target.value)} placeholder="Word (optional)" />
        <input className="input" value={meaning} onChange={e=>setMeaning(e.target.value)} placeholder="Meaning" />
      </div>
      {error && <p style={{color:'#b00020', textAlign:'center'}}>{error}</p>}
      <div style={{textAlign:'center'}}>
        <button className="addBtn" onClick={handleSubmit} disabled={submitting}>{submitting?'ADDING…':'💛 ADD TO WALL OF WORDS'}</button>
        <div className="note" style={{marginTop:6}}>Every word teaches someone something new.</div>
      </div>

      <h2 id="wall" className="title" style={{marginTop:'2rem', textAlign:'center'}}>WALL OF WORDS — {total} doodles and counting</h2>

      {loading ? <p className="note" style={{textAlign:'center'}}>Loading…</p> : (
        <div className="grid">
          {entries.map((e)=>(
            <button key={e.id} className="card" onClick={()=>share(e)} title="Share my Doodle Dictionary submission" aria-label="Share my Doodle Dictionary submission" style={{textAlign:'left', padding:0, cursor:'pointer'}}>
              <span className="cardTopCorner" aria-hidden />
              <span className="cardBottomCorner" aria-hidden />
              <div className="badge">{e.language}</div>
              <img src={e.imgUrl} alt={e.word||'Doodle'} style={{width:'100%', display:'block', aspectRatio:'4 / 3', objectFit:'cover'}}/>
              <div className="footerStrip">
                {e.word && <div style={{fontWeight:800, marginBottom:2}}>{e.word}</div>}
                <div style={{fontSize:14, lineHeight:1.35}}>{e.meaning}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="pager"><button onClick={()=>{ const p=Math.max(1,pageNum-1); setPageNum(p); load(p); }} disabled={pageNum<=1}>Prev</button><span>Page {pageNum} of {Math.max(1, Math.ceil((total||0)/pageSize))}</span><button onClick={()=>{ const tp=Math.max(1, Math.ceil((total||0)/pageSize)); const p=Math.min(tp, pageNum+1); setPageNum(p); load(p); }} disabled={pageNum>=Math.max(1, Math.ceil((total||0)/pageSize))}>Next</button></div>
      )}

    </div>
  );
}
