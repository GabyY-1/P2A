export type XY = [number, number];
export const normalizeLongitude = (x: number) => ((x + 180) % 360 + 360) % 360 - 180;
export const project = ([lon, lat]: XY): XY => [lon, -lat];
export const unproject = ([x, y]: XY): XY => [normalizeLongitude(x), -y];
export class Camera {
  center: XY = [0, 0]; zoom = 0; width = 1; height = 1;
  get scale() { return Math.min(this.width / 360, this.height / 180) * 2 ** this.zoom; }
  resize(w: number, h: number) { this.width = w; this.height = h; this.clamp(); }
  toScreen([x,y]: XY): XY { return [(x-this.center[0])*this.scale+this.width/2,(y-this.center[1])*this.scale+this.height/2]; }
  toWorld([x,y]: XY): XY { return [(x-this.width/2)/this.scale+this.center[0],(y-this.height/2)/this.scale+this.center[1]]; }
  pan(dx: number, dy: number) { this.center = [this.center[0]-dx/this.scale,this.center[1]-dy/this.scale]; this.clamp(); }
  zoomAt(delta: number, p: XY) { const before=this.toWorld(p); this.zoom=Math.max(0,Math.min(7,this.zoom+delta)); const after=this.toWorld(p); this.center=[this.center[0]+before[0]-after[0],this.center[1]+before[1]-after[1]]; this.clamp(); }
  clamp() { this.center[0]=normalizeLongitude(this.center[0]); const limit=Math.max(0,90-this.height/2/this.scale); this.center[1]=Math.max(-limit,Math.min(limit,this.center[1])); }
  reset() { this.center=[0,0]; this.zoom=0; }
}
export function visibleTiles(c: Camera, level=Math.floor(c.zoom)) {
  const n=2**level, a=c.toWorld([0,0]), b=c.toWorld([c.width,c.height]), result: string[]=[];
  const x0=Math.floor((a[0]+180)/360*n),x1=Math.floor((b[0]+180)/360*n);
  for(let x=x0;x<=x1;x++) for(let y=Math.max(0,Math.floor((a[1]+90)/180*n));y<=Math.min(n-1,Math.floor((b[1]+90)/180*n));y++) result.push(`${level}/${((x%n)+n)%n}/${y}`);
  return [...new Set(result)];
}
