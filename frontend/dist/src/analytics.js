/**
 * Feedback Fusion analytics: deterministic browser-side PCA and k-means.
 * This reproduces the original repository's technique, NOT its fitted joblib model.
 */
export const CATEGORIES = [
  'churches', 'resorts', 'beaches', 'parks', 'theatres', 'museums',
  'malls', 'zoo', 'restaurants', 'pubs_bars', 'local_services',
  'burger_pizza', 'hotels', 'juice_bars', 'art_galleries',
  'dance_clubs', 'swimming_pools', 'gyms', 'bakeries', 'beauty_spas',
  'cafes', 'view_points', 'monuments', 'gardens'
];
export const LABELS = Object.fromEntries(CATEGORIES.map(k => [k, ({pubs_bars:'Pubs & bars', burger_pizza:'Burgers & pizza', beauty_spas:'Beauty & spas', local_services:'Local services', view_points:'Viewpoints', juice_bars:'Juice bars', dance_clubs:'Dance clubs', art_galleries:'Art galleries', swimming_pools:'Swimming pools'}[k] || k.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase()))]));
export const COLORS = ['#6F7BF7', '#28BCAB', '#F5A65F', '#DC78B0', '#65A7E7'];
export const DEMO_PERSONAS = [
  { name: 'Wellness seekers', short: 'Wellness', icon: '✦', categories: ['beauty_spas','gyms','swimming_pools','bakeries'], insight: 'Highlight wellness packages, spa access, and restorative stays.' },
  { name: 'Urban explorers', short: 'Urban', icon: '⌘', categories: ['malls','zoo','restaurants','monuments'], insight: 'Bundle city attractions, shopping, and food experiences.' },
  { name: 'Culture & nightlife', short: 'Culture', icon: '◈', categories: ['art_galleries','pubs_bars','dance_clubs','local_services'], insight: 'Spotlight local events, galleries, and evening experiences.' },
  { name: 'Nature enthusiasts', short: 'Nature', icon: '❋', categories: ['parks','beaches','gardens','view_points'], insight: 'Promote scenic trails, outdoor activities, and eco-trips.' },
  { name: 'Food & hospitality', short: 'Food', icon: '◉', categories: ['burger_pizza','hotels','cafes','juice_bars'], insight: 'Offer curated dining lists and stay-and-dine packages.' }
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const clamp = (v, lo=0, hi=1) => Math.min(hi, Math.max(lo, v));

/** Clearly synthetic demo; never presented as original research data. */
export function generateDemoRows(count=850, seed=1401) {
  const random = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const group = i % DEMO_PERSONAS.length;
    const strong = DEMO_PERSONAS[group].categories;
    const secondary = DEMO_PERSONAS[(group + 2) % DEMO_PERSONAS.length].categories;
    const affinity = random() * 0.13;
    const values = CATEGORIES.map(category => {
      const base = strong.includes(category) ? 0.70 : secondary.includes(category) ? 0.28 : 0.16;
      return +clamp(base + affinity + (random() - 0.5) * 0.33).toFixed(4);
    });
    return { id: `D-${String(i+1).padStart(4,'0')}`, values };
  });
}

/** RFC4180-ish CSV parsing incl quotes, escaped quotes, CRLF and BOM. */
export function parseCsv(text) {
  if (typeof text !== 'string' || text.length > 12_000_000) throw new Error('CSV must be smaller than 12 MB.');
  const records = []; let record=[], field='', inQuote=false;
  text = text.replace(/^\uFEFF/, '');
  for (let i=0; i<text.length; i++) {
    const ch=text[i];
    if (ch === '"') {
      if (inQuote && text[i+1] === '"') { field += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) { record.push(field); field=''; }
    else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (ch === '\r' && text[i+1] === '\n') i++;
      record.push(field); field='';
      if (record.some(x=>x.trim())) records.push(record);
      record=[];
    } else field+=ch;
  }
  if (inQuote) throw new Error('The CSV has an unclosed quoted value.');
  record.push(field);
  if (record.some(x=>x.trim())) records.push(record);
  if (records.length < 3) throw new Error('CSV needs a header and at least two data rows.');
  if (records.length > 15001) throw new Error('Import supports up to 15,000 profiles.');
  const headers = records[0].map(h => h.trim().toLowerCase().replaceAll(' ','_'));
  const missing=CATEGORIES.filter(c => !headers.includes(c));
  if (missing.length) throw new Error(`Missing ${missing.length} required category column(s): ${missing.slice(0,4).join(', ')}${missing.length>4 ? '…' : ''}. Use data_for_clustering.csv from the repository.`);
  const indices=CATEGORIES.map(c=>headers.indexOf(c));
  const idIndex=headers.findIndex(h=>['user','user_id','id','profile_id'].includes(h));
  const rows=records.slice(1).map((cells,i)=>{
    const values=indices.map(j=>Number(cells[j]?.trim()));
    if (indices.some(j=>cells[j]===undefined || cells[j].trim()==='') || values.some(v=>!Number.isFinite(v))) throw new Error(`Invalid or missing category value on CSV line ${i+2}.`);
    if (values.some(v=>v<0)) throw new Error(`Negative ratings found on CSV line ${i+2}.`);
    return { id: idIndex>=0 && cells[idIndex]?.trim() ? cells[idIndex].trim().slice(0,60) : `U-${String(i+1).padStart(4,'0')}`, values };
  });
  // Training CSVs already have normalized 0..1 features. Raw ratings are converted
  // to per-column min-max; the exact notebook transformation must be replicated in
  // a real inference API if fitted-model equivalence is required.
  const needsNormalization = rows.some(row=>row.values.some(v=>v>1));
  if (needsNormalization) {
    const mins=CATEGORIES.map((_,j)=>Math.min(...rows.map(r=>r.values[j])));
    const maxs=CATEGORIES.map((_,j)=>Math.max(...rows.map(r=>r.values[j])));
    rows.forEach(row=> row.values=row.values.map((v,j)=> (maxs[j]===mins[j] ? 0 : (v-mins[j])/(maxs[j]-mins[j]))));
  }
  return { rows, normalized: needsNormalization };
}

const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
const length=v=>Math.sqrt(dot(v,v));
function matrixVec(m,v) { return m.map(row=>dot(row,v)); }
export function pca2D(rows) {
  if (rows.length<5) throw new Error('At least five profiles are required for five-cluster analysis.');
  const d=CATEGORIES.length, n=rows.length;
  const means=Array.from({length:d},(_,j)=> rows.reduce((s,r)=>s+r.values[j],0)/n);
  const centered=rows.map(r=>r.values.map((v,j)=>v-means[j]));
  const cov=Array.from({length:d},()=>Array(d).fill(0));
  for (const x of centered) for (let j=0;j<d;j++) for (let k=j;k<d;k++) cov[j][k]+=x[j]*x[k];
  let totalVar=0;
  for(let j=0;j<d;j++) {
    for(let k=j;k<d;k++) { cov[j][k]/=Math.max(1,n-1); cov[k][j]=cov[j][k]; }
    totalVar+=cov[j][j];
  }
  const vectors=[], eig=[];
  for(let component=0;component<2;component++) {
    let v=Array.from({length:d},(_,j)=>Math.sin((j+1)*(component+1)*3.13)+0.1);
    for(let iteration=0;iteration<130;iteration++) {
      let next=matrixVec(cov,v);
      for(const prev of vectors) { const projection=dot(next,prev); next=next.map((val,i)=>val-projection*prev[i]); }
      const mag=length(next);
      if(mag<1e-12) break;
      next=next.map(val=>val/mag);
      const delta=length(next.map((val,i)=>val-v[i]));
      v=next; if(delta<1e-9) break;
    }
    const mag=length(v); v=v.map(x=>x/(mag||1));
    vectors.push(v); eig.push(Math.max(0,dot(v,matrixVec(cov,v))));
  }
  return { points:centered.map(x=>vectors.map(v=>dot(x,v))), explained:totalVar>0?(eig[0]+eig[1])/totalVar:0 };
}

function kMeans(points, k=5, seed=42) {
  if(points.length<k) throw new Error(`At least ${k} rows are required.`);
  const rand=mulberry32(seed);
  const distance2=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
  const centers=[points[Math.floor(rand()*points.length)].slice()];
  while(centers.length<k) {
    const distances=points.map(p=>Math.min(...centers.map(c=>distance2(p,c))));
    const sum=distances.reduce((a,b)=>a+b,0);
    if(sum<=0) { centers.push(points[centers.length].slice()); continue; }
    let selection=rand()*sum, idx=0;
    for(;idx<distances.length-1;idx++) { selection-=distances[idx]; if(selection<=0)break; }
    centers.push(points[idx].slice());
  }
  const assignments=Array(points.length).fill(-1);
  for(let round=0;round<75;round++) {
    let changed=0;
    const sums=Array.from({length:k},()=>[0,0]), counts=Array(k).fill(0);
    points.forEach((p,i)=>{
      let best=0, bestDist=Infinity;
      for(let j=0;j<k;j++) {const dist=distance2(p,centers[j]); if(dist<bestDist){bestDist=dist;best=j;}}
      if(assignments[i]!==best) changed++;
      assignments[i]=best;
      sums[best][0]+=p[0]; sums[best][1]+=p[1]; counts[best]++;
    });
    for(let j=0;j<k;j++) if(counts[j]) centers[j]=[sums[j][0]/counts[j],sums[j][1]/counts[j]];
    if(!changed)break;
  }
  return assignments;
}

export function analyze(rows) {
  const {points,explained}=pca2D(rows);
  const raw=kMeans(points);
  // Stable numbering: sort by cluster size, then position. These are re-fit labels,
  // not identifiers from the original .joblib artifact.
  const counts=Array.from({length:5},(_,i)=>raw.filter(v=>v===i).length);
  const order=[0,1,2,3,4].sort((a,b)=>counts[b]-counts[a]||a-b);
  const labels=raw.map(v=>order.indexOf(v));
  const clusters=Array.from({length:5},(_,id)=>{
    const indices=labels.flatMap((label,i)=>label===id?[i]:[]);
    const means=CATEGORIES.map((_,j)=>indices.length?indices.reduce((s,i)=>s+rows[i].values[j],0)/indices.length:0);
    const top=means.map((value,i)=>({category:CATEGORIES[i],value})).sort((a,b)=>b.value-a.value).slice(0,5);
    return {id,count:indices.length,share:indices.length/rows.length,means,top};
  });
  const globalMeans=CATEGORIES.map((_,j)=>rows.reduce((s,r)=>s+r.values[j],0)/rows.length);
  const overall=globalMeans.reduce((a,b)=>a+b,0)/globalMeans.length;
  return {rows,points,labels,clusters,globalMeans,overall,explained};
}

export function encodeCsv(records) {
  const q = value => { let s=String(value ?? ''); if (/^[=+@-]/.test(s)) s="'"+s; return /[",\n\r]/.test(s)?`"${s.replaceAll('"','""')}"`:s; };
  return records.map(line=>line.map(q).join(',')).join('\r\n')+'\r\n';
}
export function resultsCsv(analysis) {
  return encodeCsv([
    ['profile_id',...CATEGORIES,'cluster','segment_name'],
    ...analysis.rows.map((row,i)=>[row.id,...row.values.map(v=>v.toFixed(4)),analysis.labels[i]+1,`Segment ${String(analysis.labels[i]+1).padStart(2,'0')}`])
  ]);
}
export function demoCsv(rows=generateDemoRows(400)) { return encodeCsv([['profile_id',...CATEGORIES],...rows.map(r=>[r.id,...r.values])]); }
