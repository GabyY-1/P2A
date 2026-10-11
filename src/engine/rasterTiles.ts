import type {Camera} from './camera';
export type Tile={key:string;z:number;x:number;y:number;worldX:number};
export function rasterTiles(c:Camera,z:number):Tile[]{const nx=2**(z+1),ny=2**z,a=c.toWorld([0,0]),b=c.toWorld([c.width,c.height]),out:Tile[]=[];const left=Math.floor((a[0]+180)/360*nx),right=Math.ceil((b[0]+180)/360*nx)-1,top=Math.max(0,Math.floor((a[1]+90)/180*ny)),bottom=Math.min(ny-1,Math.ceil((b[1]+90)/180*ny)-1);for(let wx=left;wx<=right;wx++)for(let y=top;y<=bottom;y++){const x=((wx%nx)+nx)%nx;out.push({key:`${z}/${x}/${y}`,z,x,y,worldX:wx});}return out;}
export function rasterLevel(c:Camera){let z=Math.max(0,Math.min(4,Math.ceil(Math.log2(c.scale*360/512))));while(z>0&&rasterTiles(c,z).length>128)z--;return z;}
