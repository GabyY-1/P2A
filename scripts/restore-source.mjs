import {readFile,writeFile,access,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const target=new URL('../public/data/raster-v02/calques/bathymetrie_16bits.png',import.meta.url);
try{await access(target);}catch{
 const parts=await Promise.all([1,2,3,4].map(i=>readFile(new URL(`../source-data/bathymetrie_16bits.png.part${String(i).padStart(3,'0')}`,import.meta.url))));
 const data=Buffer.concat(parts);const expected='1b6a8b91288c488e020e5890b9905f83c400b92204266f3886730cf9705417da';
 if(createHash('sha256').update(data).digest('hex')!==expected)throw new Error('Les fichiers sources de bathymétrie sont incomplets ou corrompus.');
 await mkdir(new URL('../public/data/raster-v02/calques/',import.meta.url),{recursive:true});await writeFile(target,data);
}
