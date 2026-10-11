import type { XY } from '../engine/camera';
export type Geometry = {type: 'Point'|'MultiPoint'|'LineString'|'MultiLineString'|'Polygon'|'MultiPolygon';coordinates: unknown};
export type Feature = {type:'Feature';id:string;properties:Record<string,unknown>;geometry:Geometry};
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const pos=(v:unknown):v is XY=>Array.isArray(v)&&v.length>=2&&typeof v[0]==='number'&&typeof v[1]==='number'&&Number.isFinite(v[0])&&Number.isFinite(v[1])&&Math.abs(v[0])<=180&&Math.abs(v[1])<=90;
const line=(v:unknown,min=2):boolean=>Array.isArray(v)&&v.length>=min&&v.every(pos);
const ring=(v:unknown):boolean=>line(v,4)&&JSON.stringify((v as XY[])[0])===JSON.stringify((v as XY[]).at(-1));
const polygon=(v:unknown):boolean=>Array.isArray(v)&&v.length>0&&v.every(ring);
export function parseGeoJSON(value:unknown):Feature[] {
  if(!obj(value)) throw new Error('Le fichier doit contenir un objet GeoJSON.');
  const raw=value.type==='FeatureCollection'?value.features:value.type==='Feature'?[value]:null;
  if(!Array.isArray(raw)) throw new Error('Une Feature ou FeatureCollection est attendue.');
  const ids=new Set<string>();
  return raw.map((f,i)=>{
    if(!obj(f)||f.type!=='Feature'||!obj(f.geometry)) throw new Error(`Entité ${i+1} : géométrie manquante.`);
    const g=f.geometry,c=g.coordinates;
    const valid=g.type==='Point'?pos(c):g.type==='MultiPoint'?line(c,1):g.type==='LineString'?line(c):g.type==='MultiLineString'?Array.isArray(c)&&c.length>0&&c.every(x=>line(x)):g.type==='Polygon'?polygon(c):g.type==='MultiPolygon'?Array.isArray(c)&&c.length>0&&c.every(polygon):false;
    if(!valid) throw new Error(`Entité ${i+1} : coordonnées ou géométrie invalides.`);
    const id=String(f.id??`geo-${hash(JSON.stringify(f))}`); if(ids.has(id))throw new Error(`Identifiant dupliqué : ${id}`);ids.add(id);
    return {type:'Feature',id,geometry:g as Geometry,properties:obj(f.properties)?f.properties:{}};
  });
}
function hash(s:string){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0).toString(16);}
export function featureLayer(f:Feature):string { const layer=f.properties.layer;return typeof layer==='string'?layer:f.geometry.type.includes('Point')?'poi':f.geometry.type.includes('Line')?'rivers':'continents'; }
export function nameOf(f:Feature){return String(f.properties.name??f.properties.nom??f.id);}
export function positions(f:Feature):XY[]{const out:XY[]=[];function walk(x:unknown){if(pos(x))out.push(x);else if(Array.isArray(x))x.forEach(walk);}walk(f.geometry.coordinates);return out;}
