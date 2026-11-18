import {analyze, generateDemoRows, parseCsv, COLORS, CATEGORIES, LABELS, DEMO_PERSONAS, resultsCsv, demoCsv} from './analytics.js';

const svgPaths = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="3" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/><rect x="14" y="14" width="7" height="7" rx="1.3"/>',
  segments: '<path d="M12 3v7l6 4"/><circle cx="12" cy="12" r="9"/><path d="M12 12l-8 4"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/><path d="M17 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 1-2-2zm0 0a2 2 0 0 1 2-2h14"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5"/><path d="M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  download: '<path d="M12 3v13m-5-5 5 5 5-5M4 18v3h16v-3"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  arrow: '<path d="M5 12h14m-7-7 7 7-7 7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 13a9 9 0 0 1-10-10A9 9 0 1 0 21 13z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M5 5 19 19M19 5 5 19"/>',
  search: '<circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 16 4-5 4 2 5-7"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  sparkles: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 13 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
  file: '<path d="M6 2h9l5 5v15H6zM15 2v5h5M9 12h8M9 16h8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  github: '<path d="M9 19c-4 1-4-2-6-2m12 4v-3.1a2.8 2.8 0 0 0-.8-2.2c2.7-.3 5.5-1.3 5.5-6A4.8 4.8 0 0 0 18.4 6 4.4 4.4 0 0 0 18.3 2S16.7 1.5 14 3.5a14 14 0 0 0-7 0C4.3 1.5 2.7 2 2.7 2a4.4 4.4 0 0 0-.1 4 4.8 4.8 0 0 0-1.3 3.7c0 4.7 2.8 5.7 5.5 6A2.8 2.8 0 0 0 6 17.9V21" transform="translate(2 0) scale(.9)"/>',
  trend: '<path d="M3 17 9 11 13 15 21 7m-6 0h6v6"/>',
  filter: '<path d="M4 6h16M7 12h10m-7 6h4"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'
};
function icon(name, size=18) {return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgPaths[name]||svgPaths.chart}</svg>`;}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
const fmt = n => new Intl.NumberFormat('en-US').format(n);
const pct = (n,digits=1)=>`${(n*100).toFixed(digits)}%`;
const sourceLink='https://github.com/Fahed1401/Feedback-Fusion';
const originalCsvUrl='https://raw.githubusercontent.com/Fahed1401/Feedback-Fusion/main/data_for_clustering.csv';
const state={
  tab:'overview', theme:localStorage.getItem('ff-theme')==='light'?'light':'dark', mobileOpen:false,
  datasetName:'Synthetic demo dataset', source:'demo', normalized:false, selectedCluster:'all', inspectIndex:null,
  search:'', category:'all', page:0, sort:'index', reportReady:false, importedAt:null,
  analysis:analyze(generateDemoRows())
};
const app=document.querySelector('#app');
const input=document.querySelector('#file-input');
document.documentElement.dataset.theme=state.theme;

function navItem(tab,label,ico){return `<button type="button" class="nav-item ${state.tab===tab?'active':''}" data-tab="${tab}" ${state.tab===tab?'aria-current="page"':''}>${icon(ico,19)}<span>${label}</span>${state.tab===tab?'<span class="nav-indicator"></span>':''}</button>`;}
function shell(content){
 return `<div class="shell">
  <aside class="sidebar ${state.mobileOpen?'show':''}" aria-label="Main navigation">
   <div class="brand"><span class="brand-icon"><span>◈</span></span><span class="brand-name">feedback<span>fusion</span><small>AUDIENCE INTELLIGENCE</small></span></div>
   <div class="nav-label">WORKSPACE</div>
   <nav class="side-nav">${navItem('overview','Overview','overview')}${navItem('segments','Audience segments','segments')}${navItem('explorer','Profile explorer','users')}</nav>
   <div class="nav-label nav-label-tools">PROJECT</div>
   <nav class="side-nav">${navItem('data','Data sources','database')}${navItem('method','Methodology','book')}</nav>
   <div class="sidebar-spacer"></div>
   <div class="sidebar-callout"><span class="small-green-dot"></span><div><strong>Workspace ready</strong><span>${state.source==='demo'?'Explore with demo data':'Your CSV is loaded'}</span></div></div>
   <a class="github-link" target="_blank" rel="noopener noreferrer" href="${sourceLink}">${icon('github',17)} <span>View original project</span> ${icon('chevron',14)}</a>
   <div class="sidebar-footer">FEEDBACK FUSION <span>v1.0</span></div>
  </aside>
  <div class="mobile-scrim ${state.mobileOpen?'visible':''}" data-action="close-menu"></div>
  <div class="main-layout">
   <header class="topbar"><div class="topbar-left"><button class="icon-btn menu-btn" data-action="toggle-menu" aria-label="Toggle navigation">${icon('menu',21)}</button><span class="breadcrumb-parent">Workspace</span>${icon('chevron',14)}<span class="breadcrumb-current">${{overview:'Overview',segments:'Audience segments',explorer:'Profile explorer',data:'Data sources',method:'Methodology'}[state.tab]}</span></div>
    <div class="topbar-right"><span class="topbar-status"><span class="small-green-dot"></span> All systems ready</span><span class="topbar-divider"></span><button class="icon-btn theme-btn" data-action="theme" aria-label="Switch color theme" title="Toggle light/dark mode">${icon(state.theme==='dark'?'sun':'moon',19)}</button><span class="topbar-avatar" title="Feedback Fusion project">FF</span></div></header>
    <main id="main-content" class="main-content">${content}</main>
    <footer class="main-footer">© Feedback Fusion · Research to insight <span>Built for portfolio demonstration · ${state.source==='demo'?'Synthetic demo data':'User-provided data'}</span></footer>
  </div>
 </div>`;
}
function sectionHeader(eyebrow,title,subtitle,action='') {return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div>${action?`<div class="page-actions">${action}</div>`:''}</div>`;}
const btn=(title,action,ico,primary=false,extra='')=>`<button type="button" class="btn ${primary?'btn-primary':'btn-secondary'}" data-action="${action}" ${extra}>${icon(ico,17)}<span>${title}</span></button>`;
function tag(text,dot=false){return `<span class="dataset-tag">${dot?'<i class="tag-dot"></i>':''}${escapeHtml(text)}</span>`;}
function metric(label,value,foot,ico,style=''){return `<div class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon ${style}">${icon(ico,19)}</span></div><div class="metric-value">${value}</div><div class="metric-foot">${foot}</div></div>`;}
function scatter(){
 const a=state.analysis, points=a.points;const W=780,H=330,m={l:36,r:22,t:18,b:29}, cw=W-m.l-m.r,ch=H-m.t-m.b;
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
 const padX=Math.max((xmax-xmin)*.13,.1),padY=Math.max((ymax-ymin)*.13,.1);
 const px=x=>m.l+((x-xmin+padX)/(xmax-xmin+2*padX))*cw;
 const py=y=>m.t+ch-((y-ymin+padY)/(ymax-ymin+2*padY))*ch;
 const grids=Array.from({length:5},(_,i)=>`<line x1="${m.l}" y1="${m.t+i*ch/4}" x2="${W-m.r}" y2="${m.t+i*ch/4}"/><line x1="${m.l+i*cw/4}" y1="${m.t}" x2="${m.l+i*cw/4}" y2="${H-m.b}"/>`).join('');
 const stride=Math.max(1,Math.ceil(points.length/1600));
 const circles=points.map((p,i)=>({p,i})).filter((_,i)=>i%stride===0).map(({p,i})=>{
   const label=a.labels[i],faded=state.selectedCluster!=='all'&&Number(state.selectedCluster)!==label;
   return `<circle class="scatter-point ${faded?'faded':''}" cx="${px(p[0]).toFixed(1)}" cy="${py(p[1]).toFixed(1)}" r="${faded?2.7:3.6}" fill="${COLORS[label]}" opacity="${faded?.11:.86}"><title>${escapeHtml(a.rows[i].id)} · Segment ${label+1}</title></circle>`;
 }).join('');
 return `<div class="scatter-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Scatter plot of PCA components colored by five computed audience segments"><g class="chart-grid">${grids}</g><g>${circles}</g><text class="axis-label" x="${W/2}" y="${H-2}" text-anchor="middle">PRINCIPAL COMPONENT 1</text><text class="axis-label" x="13" y="${H/2}" transform="rotate(-90 13 ${H/2})" text-anchor="middle">PRINCIPAL COMPONENT 2</text></svg></div>`;
}
function pieDonut(){
 const clusters=state.analysis.clusters; let from=0;
 const path=clusters.map((c,i)=>{const portion=c.share, dash=portion*100, result=`<circle cx="64" cy="64" r="45" fill="none" stroke="${COLORS[i]}" stroke-width="14" stroke-dasharray="${dash*2.8274} ${282.74-dash*2.8274}" stroke-dashoffset="${-from*282.74}" transform="rotate(-90 64 64)"/>`;from+=portion;return result;}).join('');
 return `<div class="donut-holder"><svg viewBox="0 0 128 128" role="img" aria-label="Segment distribution donut chart"><circle cx="64" cy="64" r="45" fill="none" stroke="var(--track)" stroke-width="14"/>${path}<text x="64" y="60" class="donut-center-top" text-anchor="middle">5</text><text x="64" y="78" class="donut-center-sub" text-anchor="middle">SEGMENTS</text></svg></div>`;
}
function clusterList(compact=false){return `<div class="cluster-list">${state.analysis.clusters.map((c,i)=>`<button data-cluster="${i}" class="cluster-line ${state.selectedCluster===String(i)?'selected':''}"><span class="cluster-color" style="background:${COLORS[i]}"></span><span class="cluster-line-name">Segment ${String(i+1).padStart(2,'0')}</span><span class="cluster-line-count">${fmt(c.count)}</span><strong>${pct(c.share)}</strong></button>`).join('')}</div>`;}
function preferenceBars(clusterIndex=null,max=6){
 const a=state.analysis, means=clusterIndex===null?a.globalMeans:a.clusters[clusterIndex].means;
 const ranked=means.map((v,i)=>({key:CATEGORIES[i],value:v,ref:a.globalMeans[i]})).sort((p,q)=>q.value-p.value).slice(0,max);
 return `<div class="preference-bars">${ranked.map(({key,value,ref},i)=>`<div class="pref-row"><div class="pref-line"><span>${LABELS[key]}</span><strong>${Math.round(value*100)}<small>/100</small></strong></div><div class="pref-track"><div class="pref-fill" style="width:${Math.min(100,value*100)}%;background:${clusterIndex===null?'var(--primary)':COLORS[clusterIndex]}"></div></div>${clusterIndex!==null?`<div class="pref-caption">${value>=ref?'Above':'Below'} audience average by ${Math.abs((value-ref)*100).toFixed(0)} pts</div>`:''}</div>`).join('')}</div>`;
}
function insightMessage(){
 const top=state.analysis.globalMeans.map((v,i)=>({v,k:CATEGORIES[i]})).sort((x,y)=>y.v-x.v)[0];
 return `<div class="insight-banner"><div class="insight-icon">${icon('sparkles',22)}</div><div><div class="insight-kicker">ANALYST NOTE</div><strong>Preference patterns, made visible</strong><p>${LABELS[top.k]} has the highest average normalized rating in this dataset. Compare individual segments to uncover which experiences matter most to each group.</p></div><button class="insight-link" data-tab="segments">Explore segments ${icon('arrow',16)}</button></div>`;
}
function overview(){
 const a=state.analysis;
 return `${sectionHeader('ANALYTICS OVERVIEW','Understand your audience.','From raw travel ratings to clear, actionable visitor segments.',`${btn('Import dataset','import','upload')}${btn('Export results','export','download',true)}`)}
 <div class="hero-panel"><div class="hero-copy"><div class="hero-badges">${tag(state.source==='demo'?'SYNTHETIC DEMO':'LIVE DATASET',true)}<span class="hero-separator">/</span><span>UNSUPERVISED LEARNING</span></div><h2>Find the signal<br>in every <em>preference.</em></h2><p>Explore the natural groups hidden in visitor interests with PCA-powered K-Means segmentation.</p><button class="hero-cta" data-tab="segments">Meet your audience ${icon('arrow',18)}</button></div><div class="hero-visual" aria-hidden="true"><div class="orb orb-one"></div><div class="orb orb-two"></div><div class="orb orb-three"></div><div class="orb orb-four"></div><div class="orb orb-five"></div><div class="orb-center">◈</div><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="hero-visual-caption">DISCOVER · CLUSTER · UNDERSTAND</div></div></div>
 <div class="metrics-grid">
  ${metric('Traveler profiles',fmt(a.rows.length),state.source==='demo'?'Synthetic samples':'From imported CSV','users')}
  ${metric('Distinct segments','05','K-Means clusters identified','segments','purple')}
  ${metric('Preference dimensions','24','Travel experience categories','database','teal')}
  ${metric('PCA variance explained',pct(a.explained,1),'Combined first 2 components','trend','amber')}
 </div>
 <div class="dashboard-grid">
  <section class="panel chart-panel"><div class="panel-header"><div><h3>Audience landscape</h3><p>Two-dimensional PCA projection · each dot is one traveler</p></div><span class="panel-chip">${icon('chart',15)} PCA + K-Means</span></div>
   ${scatter()}<div class="scatter-footer"><div class="scatter-legend">${a.clusters.map((c,i)=>`<button data-cluster="${i}" class="legend-item ${state.selectedCluster===String(i)?'active':''}"><i style="background:${COLORS[i]}"></i> S${i+1}</button>`).join('')}</div><button class="reset-filter" data-cluster="all">${icon('reset',13)} Reset focus</button></div></section>
  <section class="panel composition-panel"><div class="panel-header"><div><h3>Segment composition</h3><p>Share of total audience</p></div><span class="panel-chip">5 groups</span></div>${pieDonut()}${clusterList()}</section>
 </div>
 <div class="dashboard-grid lower-grid"><section class="panel"><div class="panel-header"><div><h3>What interests your audience</h3><p>Top experiences by average normalized preference</p></div><span class="panel-chip">0–100 scale</span></div>${preferenceBars(null,6)}</section>
 <section class="panel next-panel"><div class="panel-header"><div><h3>From analysis to action</h3><p>How to use your segmentation results</p></div></div><div class="steps-list"><div class="step"><span>01</span><div><strong>Discover segments</strong><p>See distinct groups and what makes them different.</p></div>${icon('check',17)}</div><div class="step"><span>02</span><div><strong>Explore preferences</strong><p>Compare interest signals across 24 categories.</p></div>${icon('check',17)}</div><div class="step"><span>03</span><div><strong>Export your findings</strong><p>Take labeled profiles into your analysis workflow.</p></div>${icon('arrow',17)}</div></div><button class="panel-action" data-tab="method">See how the model works ${icon('arrow',17)}</button></section></div>
 ${insightMessage()}`;
}
function segmentDetail(index) {
 const c=state.analysis.clusters[index];
 const suggestions=[...DEMO_PERSONAS].map(p=>({p,match:p.categories.reduce((s,k)=>s+c.means[CATEGORIES.indexOf(k)],0)})).sort((a,b)=>b.match-a.match);
 const persona=suggestions[0].p;
 return `<section class="panel detail-panel"><div class="detail-header"><div><div class="eyebrow">SEGMENT DEEP DIVE</div><h3><span class="segment-dot" style="background:${COLORS[index]}"></span>Segment ${String(index+1).padStart(2,'0')} <span class="detail-subtitle">· ${escapeHtml(persona.name)}</span></h3><p>Suggested description based on the group's strongest preferences; not a model-generated label.</p></div><span class="detail-size">${fmt(c.count)} profiles · ${pct(c.share)}</span></div><div class="detail-grid"><div><h4>Top preference signals</h4>${preferenceBars(index,5)}</div><div class="recommendation"><div class="recommendation-icon">${icon('target',22)}</div><div class="eyebrow">POSSIBLE APPLICATION</div><h4>Tailor experiences to the audience</h4><p>${escapeHtml(persona.insight)}</p><div class="recommendation-note">Illustrative marketing idea, not a measured conversion result.</div></div></div></section>`;
}
function segments(){
 const active=state.selectedCluster==='all'?0:Number(state.selectedCluster);
 return `${sectionHeader('BEHAVIORAL SEGMENTATION','The audience, decoded.','Five distinct clusters formed from tourism rating patterns.',`${btn('Export profiles','export','download',true)}`)}
 <div class="context-notice">${icon('info',17)} <span>Labels are assigned after browser-side re-clustering. They're not the original notebook’s serialized model IDs.</span></div>
 <div class="segment-grid">${state.analysis.clusters.map((c,i)=>{
  const activeClass=active===i?'is-current':'';
  return `<button class="segment-card ${activeClass}" data-cluster="${i}" style="--segment-color:${COLORS[i]}"><div class="segment-card-top"><span class="seg-badge">S${String(i+1).padStart(2,'0')}</span><span>${icon('arrow',18)}</span></div><strong>${fmt(c.count)}</strong><span class="seg-count-label">traveler profiles</span><div class="seg-track"><span style="width:${c.share*100}%"></span></div><div class="seg-card-bottom"><span>${pct(c.share)} of audience</span><span>${active===i?'Selected':'Explore'}</span></div></button>`;
 }).join('')}</div>
 ${segmentDetail(active)}
 <div class="dashboard-grid lower-grid"><section class="panel"><div class="panel-header"><div><h3>Compare cluster sizes</h3><p>Profiles assigned per segment</p></div></div><div class="size-bars">${state.analysis.clusters.map((c,i)=>`<div class="size-bar-row"><span>S${i+1}</span><div><i style="width:${100*c.count/Math.max(...state.analysis.clusters.map(s=>s.count))}%;background:${COLORS[i]}"></i></div><strong>${fmt(c.count)}</strong></div>`).join('')}</div></section>
 <section class="panel methodology-card"><div class="panel-header"><div><h3>Built on clustering</h3><p>A practical application of unsupervised learning</p></div></div><div class="method-lines"><p><span>Algorithm</span><strong>K-Means (k = 5)</strong></p><p><span>Projection</span><strong>Principal Component Analysis</strong></p><p><span>Features</span><strong>24 tourism ratings</strong></p><p><span>Data processing</span><strong>Client-side JavaScript</strong></p></div><button class="panel-action" data-tab="method">Read methodology ${icon('arrow',17)}</button></section></div>`;
}
function filteredIndices(){
 const q=state.search.trim().toLowerCase();const a=state.analysis;
 let indices=a.rows.map((_,i)=>i).filter(i=>{
  if(state.selectedCluster!=='all'&&a.labels[i]!==Number(state.selectedCluster))return false;
  if(q&&!a.rows[i].id.toLowerCase().includes(q)&&!CATEGORIES.some((key,j)=>a.rows[i].values[j]>.65&&LABELS[key].toLowerCase().includes(q)))return false;
  if(state.category!=='all'&&a.rows[i].values[CATEGORIES.indexOf(state.category)]<.6)return false;
  return true;
 });
 if(state.sort==='rating') indices.sort((x,y)=>Math.max(...a.rows[y].values)-Math.max(...a.rows[x].values));
 else if(state.sort==='segment') indices.sort((x,y)=>a.labels[x]-a.labels[y]);
 return indices;
}
function explorerTable(){
 const a=state.analysis, all=filteredIndices(), pageSize=12, totalPages=Math.max(1,Math.ceil(all.length/pageSize));
 state.page=Math.min(state.page,totalPages-1);
 const slice=all.slice(state.page*pageSize,(state.page+1)*pageSize);
 return `<div class="explorer-table-wrap"><table class="profiles-table"><thead><tr><th>PROFILE ID</th><th>SEGMENT</th><th>TOP INTEREST</th><th>NEXT INTEREST</th><th>HIGHEST RATING</th><th></th></tr></thead><tbody>${slice.length?slice.map(i=>{
  const row=a.rows[i], ranked=row.values.map((value,j)=>({value,key:CATEGORIES[j]})).sort((x,y)=>y.value-x.value);
  const label=a.labels[i];return `<tr><td><span class="profile-icon">${icon('users',16)}</span><strong>${escapeHtml(row.id)}</strong></td><td><span class="table-seg"><i style="background:${COLORS[label]}"></i> Segment ${String(label+1).padStart(2,'0')}</span></td><td>${LABELS[ranked[0].key]}</td><td>${LABELS[ranked[1].key]}</td><td><div class="table-rating">${Math.round(ranked[0].value*100)}<small>/100</small><i style="width:${ranked[0].value*100}%;background:${COLORS[label]}"></i></div></td><td><button class="table-view" data-inspect="${i}" aria-label="View profile ${escapeHtml(row.id)}">${icon('arrow',16)}</button></td></tr>`;
 }).join(''):`<tr><td colspan="6" class="empty-result">No profiles match these filters. Try resetting them.</td></tr>`}</tbody></table></div><div class="table-footer"><span>Showing <strong>${all.length?state.page*pageSize+1:0}–${Math.min(all.length,(state.page+1)*pageSize)}</strong> of <strong>${fmt(all.length)}</strong> profiles</span><div class="pagination"><button data-action="prev" ${state.page===0?'disabled':''} aria-label="Previous page">‹</button><span>Page ${state.page+1} / ${totalPages}</span><button data-action="next" ${state.page>=totalPages-1?'disabled':''} aria-label="Next page">›</button></div></div>`;
}
function profileInspector(){
 if(state.inspectIndex===null) return '';
 const a=state.analysis,row=a.rows[state.inspectIndex],label=a.labels[state.inspectIndex];
 const top=row.values.map((v,j)=>({value:v,key:CATEGORIES[j]})).sort((x,y)=>y.value-x.value).slice(0,8);
 return `<div class="modal-backdrop" data-action="close-inspect"><section class="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title"><div class="modal-header"><div><div class="eyebrow">TRAVELER PROFILE</div><h3 id="profile-title">${escapeHtml(row.id)}</h3></div><button class="icon-btn" data-action="close-inspect" aria-label="Close profile">${icon('close',21)}</button></div><div class="modal-content"><span class="profile-cluster" style="--segment-color:${COLORS[label]}">● Segment ${String(label+1).padStart(2,'0')}</span><p>Individual normalized preference scores. This is an anonymized record, not personal identity data.</p><div class="modal-bars">${top.map(({key,value})=>`<div class="pref-row"><div class="pref-line"><span>${LABELS[key]}</span><strong>${Math.round(value*100)}/100</strong></div><div class="pref-track"><div class="pref-fill" style="width:${value*100}%;background:${COLORS[label]}"></div></div></div>`).join('')}</div></div><div class="modal-bottom"><button class="btn btn-primary" data-action="close-inspect">Close profile</button></div></section></div>`;
}
function explorer(){
 const selectOptions=CATEGORIES.map(k=>`<option value="${k}" ${state.category===k?'selected':''}>${LABELS[k]}</option>`).join('');
 return `${sectionHeader('PROFILE EXPLORER','Every profile, a pattern.','Browse clustered travelers, discover their interests, and inspect individual signals.',`${btn('Export CSV','export','download',true)}`)}
 <section class="panel explorer-panel"><div class="panel-header explorer-panel-heading"><div><h3>Traveler directory</h3><p>Search and filter the analyzed dataset</p></div><span class="panel-chip">${fmt(state.analysis.rows.length)} profiles</span></div>
 <div class="filters"><label class="search-box">${icon('search',18)}<input id="profile-search" type="search" placeholder="Search profile or interest…" value="${escapeHtml(state.search)}" autocomplete="off" aria-label="Search profiles" /></label><label class="select-wrapper">${icon('segments',16)}<select id="segment-filter" aria-label="Filter by segment"><option value="all" ${state.selectedCluster==='all'?'selected':''}>All segments</option>${state.analysis.clusters.map((c,i)=>`<option value="${i}" ${state.selectedCluster===String(i)?'selected':''}>Segment ${i+1}</option>`).join('')}</select></label><label class="select-wrapper">${icon('filter',16)}<select id="interest-filter" aria-label="Filter by interest"><option value="all">All interests</option>${selectOptions}</select></label><label class="select-wrapper sort-wrapper"><select id="sort-filter" aria-label="Sort profiles"><option value="index" ${state.sort==='index'?'selected':''}>Default order</option><option value="segment" ${state.sort==='segment'?'selected':''}>By segment</option><option value="rating" ${state.sort==='rating'?'selected':''}>Highest rating</option></select></label><button class="filter-clear" data-action="reset-filters">Reset</button></div>
 <div id="table-content">${explorerTable()}</div></section><div class="explorer-footnote">${icon('info',16)} Profiles are assigned to segments by the browser's PCA + K-Means analysis. Scores reflect normalized category ratings.</div>${profileInspector()}`;
}
function dataPage(){
 return `${sectionHeader('DATA SOURCES','Data in. Insight out.','Import the project’s processed CSV to explore your actual research dataset.',`${btn('Export results','export','download',true)}`)}
 <div class="data-two-col"><section class="panel upload-panel"><div class="panel-header"><div><h3>Import tourism ratings</h3><p>Replace the demo with your repository dataset</p></div></div><button type="button" class="drop-zone" id="drop-zone" data-action="import"><div class="drop-icon">${icon('upload',27)}</div><strong>Drag your CSV here, or click to browse</strong><span>Supports <code>data_for_clustering.csv</code> and compatible 24-column CSVs</span><span class="drop-button">Choose CSV file ${icon('arrow',16)}</span></button><div class="import-remote"><span>Or load the published dataset directly:</span><button class="btn btn-secondary" data-action="load-original">${icon('database',17)} Load original GitHub CSV</button></div><div class="upload-details"><span>${icon('check',17)} Local processing — your data stays in the browser</span><span>${icon('check',17)} CSV up to 12 MB and 15,000 profiles</span></div></section>
 <section class="panel current-data"><div class="panel-header"><div><h3>Active dataset</h3><p>Currently powering the dashboard</p></div><span class="live-label"><i></i> Loaded</span></div><div class="active-source"><span class="active-source-icon">${icon('file',24)}</span><div><strong>${escapeHtml(state.datasetName)}</strong><span>${state.source==='demo'?'Generated locally for demonstration':'Imported into this browser session'}</span></div></div><div class="source-stats"><div><span>Records</span><strong>${fmt(state.analysis.rows.length)}</strong></div><div><span>Features</span><strong>24</strong></div><div><span>Clusters</span><strong>05</strong></div></div><div class="source-status">${icon('info',17)} ${state.source==='demo'?'Demo values are synthetic, not taken from the original UCI dataset.':state.normalized?'Imported ratings were min–max normalized for browser analysis.':'Imported values used directly (already normalized 0–1).'}</div><div class="source-buttons"><button class="btn btn-secondary" data-action="download-demo">${icon('download',17)} Download sample CSV</button><button class="btn btn-outline" data-action="reset-demo">${icon('reset',17)} Reset demo</button></div></section></div>
 <section class="panel schema-panel"><div class="panel-header"><div><h3>Supported data schema</h3><p>24 numeric tourism rating categories from the original repository</p></div><span class="panel-chip">24 features</span></div><div class="schema-grid">${CATEGORIES.map((key,i)=>`<div><span class="schema-index">${String(i+1).padStart(2,'0')}</span><span>${LABELS[key]}</span><span class="schema-type">numeric</span></div>`).join('')}</div><div class="schema-footer">Expected CSV columns: all 24 names above. Extra columns such as <code>Unnamed: 0</code> or <code>profile_id</code> are accepted.</div></section>`;
}
function method(){
 return `${sectionHeader('METHODOLOGY','From data to discovery.','A transparent walkthrough of the research approach and the dashboard implementation.',`<a href="${sourceLink}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">${icon('github',17)} View research repository</a>`)}
 <div class="context-notice">${icon('info',18)} <span>This dashboard re-fits PCA and K-Means in JavaScript. It does not load the repository's <code>.joblib</code> file, so cluster assignments can differ from the saved Python model.</span></div>
 <section class="panel flow-panel"><div class="panel-header"><div><h3>Analytical pipeline</h3><p>Five stages from tourist rating signals to interpretable cohorts</p></div></div><div class="pipeline">${[
  ['01','Source data','UCI Travel Review Ratings dataset','database'],
  ['02','Preprocess','Validate CSV and normalize raw values when needed','filter'],
  ['03','Reduce dimensions','Project 24 rating features onto two principal components','chart'],
  ['04','Cluster profiles','Fit deterministic K-Means with k = 5 in the PCA plane','segments'],
  ['05','Interpret segments','Visualize cluster sizes and top category means','target']
 ].map(([n,name,description,ic])=>`<div class="pipeline-stage"><div class="pipeline-icon">${icon(ic,22)}</div><span>${n}</span><h4>${name}</h4><p>${description}</p></div>`).join('')}</div></section>
 <div class="dashboard-grid lower-grid"><section class="panel method-explainer"><div class="panel-header"><div><h3>What this project actually measures</h3><p>Travel interests, not text review sentiment</p></div></div><p>Each row represents a traveler rating profile across 24 tourism-related categories: parks, restaurants, hotels, museums, galleries, wellness venues, and more.</p><p>Unsupervised clustering identifies recurring patterns of category preference. Teams can use these patterns to explore audience segments and develop personalized tourism experiences.</p><div class="feature-pills"><span>PCA</span><span>K-Means</span><span>Exploratory analytics</span><span>24 numeric features</span></div></section>
 <section class="panel method-explainer"><div class="panel-header"><div><h3>Production integration notes</h3><p>What is still needed for model-serving parity</p></div></div><p>The source repository includes a Python notebook workflow and a saved K-Means artifact, but no web inference API or complete serialized preprocessing pipeline.</p><p>For exact model inference, export the original fitted scaler, PCA transformer, and clusterer together (for example with a scikit-learn Pipeline), serve predictions through an authenticated API, and have the frontend request those results.</p><div class="feature-pills"><span>scikit-learn Pipeline</span><span>FastAPI</span><span>Model versioning</span></div></section></div>
 <section class="panel source-credit"><div>${icon('book',22)}<div><strong>Original academic source</strong><p>UCI Machine Learning Repository — Travel Review Ratings (dataset 485). This dataset is the research basis cited in the original Feedback Fusion repository.</p></div></div><a href="https://archive.ics.uci.edu/dataset/485/travel+review+ratings" target="_blank" rel="noopener noreferrer">Visit dataset page ${icon('arrow',16)}</a></section>`;
}
function render(){
 const current={overview,segments,explorer,data:dataPage,method}[state.tab]();
 app.innerHTML=shell(current);document.documentElement.dataset.theme=state.theme;
}
function setTab(tab){if(!['overview','segments','explorer','data','method'].includes(tab))return;state.tab=tab;state.mobileOpen=false;state.inspectIndex=null;render();window.scrollTo({top:0,behavior:'auto'});}
function toast(message,error=false){const el=document.querySelector('#toast');el.textContent=message;el.className=`toast show ${error?'error':''}`;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{el.className='toast';},4800);}
function download(filename,text){const blob=new Blob([text],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
async function useParsedData(parsed,filename,source){
  const result=analyze(parsed.rows);
  state.analysis=result;state.datasetName=filename;state.source=source;state.normalized=parsed.normalized;state.selectedCluster='all';state.page=0;state.search='';state.category='all';state.inspectIndex=null;
  state.tab='overview';render();toast(`Analyzed ${fmt(result.rows.length)} profiles from ${filename}.`);
}
async function loadOriginal(){
  toast('Loading original research CSV from GitHub…');
  try{
    const response=await fetch(originalCsvUrl,{mode:'cors',cache:'no-store'});
    if(!response.ok) throw new Error(`GitHub returned HTTP ${response.status}.`);
    const parsed=parseCsv(await response.text());
    await useParsedData(parsed,'data_for_clustering.csv','github');
  }catch(e){toast('Could not fetch GitHub CSV. Download it from the repository and use Import dataset instead.',true);}
}
async function importFile(file){
 if(!file)return;
 if(!file.name.toLowerCase().endsWith('.csv')) {toast('Choose a CSV file (.csv).',true);return;}
 if(file.size>12_000_000){toast('That file exceeds the 12 MB limit.',true);return;}
 try{
  const parsed=parseCsv(await file.text());
  await useParsedData(parsed,file.name,'uploaded');
 }catch(error){toast(error.message||'Unable to parse CSV.',true);}finally{input.value='';}
}
function updateTable(){const el=document.querySelector('#table-content');if(el)el.innerHTML=explorerTable();}
document.addEventListener('click',event=>{
 const nav=event.target.closest('[data-tab]');if(nav){setTab(nav.dataset.tab);return;}
 const cluster=event.target.closest('[data-cluster]');if(cluster){state.selectedCluster=cluster.dataset.cluster;state.page=0;render();return;}
 const inspect=event.target.closest('[data-inspect]');if(inspect){state.inspectIndex=Number(inspect.dataset.inspect);render();return;}
 const button=event.target.closest('[data-action]');if(!button)return;
 const action=button.dataset.action;
 if(action==='import')input.click();
 else if(action==='load-original')loadOriginal();
 else if(action==='export'){download('feedback-fusion-clustered-profiles.csv',resultsCsv(state.analysis));toast('Clustered profiles CSV exported.');}
 else if(action==='download-demo'){download('feedback-fusion-synthetic-sample.csv',demoCsv());toast('Synthetic example CSV downloaded.');}
 else if(action==='reset-demo'){state.analysis=analyze(generateDemoRows());state.datasetName='Synthetic demo dataset';state.source='demo';state.normalized=false;state.selectedCluster='all';state.search='';state.category='all';state.page=0;state.inspectIndex=null;render();toast('Synthetic demo dataset restored.');}
 else if(action==='theme'){state.theme=state.theme==='dark'?'light':'dark';localStorage.setItem('ff-theme',state.theme);render();}
 else if(action==='toggle-menu'){state.mobileOpen=!state.mobileOpen;render();}
 else if(action==='close-menu'){state.mobileOpen=false;render();}
 else if(action==='close-inspect'){if(button.classList.contains('modal-backdrop') && event.target!==button)return;state.inspectIndex=null;render();}
 else if(action==='prev'){state.page=Math.max(0,state.page-1);updateTable();}
 else if(action==='next'){state.page++;updateTable();}
 else if(action==='reset-filters'){state.search='';state.category='all';state.selectedCluster='all';state.sort='index';state.page=0;render();}
});
document.addEventListener('input',event=>{
 if(event.target.id==='profile-search'){state.search=event.target.value;state.page=0;updateTable();}
});
document.addEventListener('change',event=>{
 if(event.target.id==='segment-filter'){state.selectedCluster=event.target.value;state.page=0;updateTable();}
 if(event.target.id==='interest-filter'){state.category=event.target.value;state.page=0;updateTable();}
 if(event.target.id==='sort-filter'){state.sort=event.target.value;state.page=0;updateTable();}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.inspectIndex!==null){state.inspectIndex=null;render();}});
input.addEventListener('change',e=>importFile(e.target.files?.[0]));
document.addEventListener('dragover',e=>{if(e.dataTransfer?.types?.includes('Files')){e.preventDefault();const dz=document.querySelector('#drop-zone');if(dz)dz.classList.add('dragging');}});
document.addEventListener('dragleave',e=>{document.querySelector('#drop-zone')?.classList.remove('dragging');});
document.addEventListener('drop',e=>{if(e.dataTransfer?.files.length){e.preventDefault();document.querySelector('#drop-zone')?.classList.remove('dragging');importFile(e.dataTransfer.files[0]);}});
render();
