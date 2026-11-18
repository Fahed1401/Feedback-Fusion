import { test } from 'node:test';
import assert from 'node:assert/strict';
import {analyze,generateDemoRows,parseCsv,demoCsv,resultsCsv,CATEGORIES,pca2D} from '../src/analytics.js';
test('sample data has correct shape and sensible ranges',()=>{
 const rows=generateDemoRows(100);
 assert.equal(rows.length,100);assert.equal(rows[0].values.length,24);
 assert.ok(rows.every(r=>r.values.every(v=>v>=0&&v<=1)));
});
test('deterministic segmentation covers every row',()=>{
 const rows=generateDemoRows(160);
 const a=analyze(rows),b=analyze(rows);
 assert.deepEqual(a.labels,b.labels);
 assert.equal(a.clusters.reduce((s,c)=>s+c.count,0),rows.length);
 assert.ok(a.explained>=0&&a.explained<=1.001);
 assert.equal(new Set(a.labels).size,5);
});
test('CSV import supports project headers including optional index and quoted IDs',()=>{
 const csv='Unnamed: 0,profile_id,'+CATEGORIES.join(',')+'\r\n'+Array.from({length:6},(_,i)=>[i,'"Test, '+i+'"',...CATEGORIES.map((_,j)=>((i+j)%7)/6)].join(',')).join('\r\n');
 const {rows,normalized}=parseCsv(csv);
 assert.equal(rows.length,6);assert.equal(rows[0].id,'Test, 0');assert.equal(normalized,false);
});
test('roundtrip export and import',()=>{
 const rows=generateDemoRows(70); const {rows:again}=parseCsv(demoCsv(rows));
 assert.equal(again.length,70);const result=resultsCsv(analyze(again));
 assert.ok(result.includes('segment_name'));
});
test('input validation rejects missing columns',()=>{
 assert.throws(()=>parseCsv('a,b\n1,2\n3,4'),/Missing/);
});
test('non normalized values get normalized',()=>{
 const rows=generateDemoRows(12);const csv=[CATEGORIES.join(','),...rows.map((r,i)=>r.values.map(v=>v*5+i%2).join(','))].join('\n');
 const parsed=parseCsv(csv);assert.equal(parsed.normalized,true);
 assert.ok(parsed.rows.every(r=>r.values.every(v=>v>=0&&v<=1)));
});
test('PCA returns one coordinate per input',()=>{
 assert.equal(pca2D(generateDemoRows(20)).points.length,20);
});
