import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(), dist=path.join(root,'dist');
await fs.rm(dist,{recursive:true,force:true}); await fs.mkdir(dist,{recursive:true});
for (const name of ['index.html','src','public']) await fs.cp(path.join(root,name),path.join(dist,name),{recursive:true});
console.log('Static deployment ready in dist/');
