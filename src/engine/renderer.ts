import earcut from 'earcut';
import {Camera,project,type XY} from './camera';
import {featureLayer,positions,type Feature} from '../data/geojson';
import {colors,type Mode} from './layers';
type Batch={buffer:WebGLBuffer;count:number;primitive:number;layer:string;color:[number,number,number,number]};
export class Renderer {
 gl:WebGL2RenderingContext;program:WebGLProgram;batches:Batch[]=[];grid:Batch;lost=false;
 constructor(public canvas:HTMLCanvasElement,public camera:Camera){
  const gl=canvas.getContext('webgl2',{antialias:true,alpha:false});if(!gl)throw new Error('WebGL2 est indisponible sur cet appareil. Active l’accélération graphique ou utilise un navigateur compatible.');this.gl=gl;
  this.program=this.createProgram();this.grid=this.makeGrid();
 }
 createProgram(){const g=this.gl;const compile=(type:number,src:string)=>{const s=g.createShader(type)!;g.shaderSource(s,src);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw new Error(g.getShaderInfoLog(s)??'Erreur shader');return s;};const vs=compile(g.VERTEX_SHADER,`#version 300 es
in vec2 a_position;uniform vec2 u_center;uniform vec2 u_size;uniform float u_scale;uniform float u_offset;void main(){vec2 p=(a_position+vec2(u_offset,0.)-u_center)*u_scale;gl_Position=vec4(p.x*2./u_size.x,-p.y*2./u_size.y,0.,1.);gl_PointSize=8.;}`);const fs=compile(g.FRAGMENT_SHADER,`#version 300 es
precision mediump float;uniform vec4 u_color;out vec4 color;void main(){color=u_color;}`);const p=g.createProgram()!;g.attachShader(p,vs);g.attachShader(p,fs);g.linkProgram(p);g.deleteShader(vs);g.deleteShader(fs);if(!g.getProgramParameter(p,g.LINK_STATUS))throw new Error('Impossible de préparer le moteur graphique.');return p;}
 batch(values:number[],primitive:number,layer:string,color:Batch['color']):Batch{const g=this.gl,b=g.createBuffer()!;g.bindBuffer(g.ARRAY_BUFFER,b);g.bufferData(g.ARRAY_BUFFER,new Float32Array(values),g.STATIC_DRAW);return{buffer:b,count:values.length/2,primitive,layer,color};}
 makeGrid(){const v:number[]=[];for(let x=-180;x<=180;x+=30)v.push(x,-90,x,90);for(let y=-90;y<=90;y+=30)v.push(-180,y,180,y);return this.batch(v,this.gl.LINES,'grid',[.38,.63,.69,.28]);}
 setData(features:Feature[]){for(const b of this.batches)this.gl.deleteBuffer(b.buffer);this.batches=[];
  for(const f of features){const layer=featureLayer(f),color=colors[layer]??colors.continents,g=f.geometry,c=g.coordinates;
   const add=(p:XY[],primitive:number)=>this.batches.push(this.batch(p.flatMap(project),primitive,layer,color));
   const line=(p:XY[])=>add(unwrap(p),this.gl.LINE_STRIP);
   const polygon=(rings:XY[][])=>{const aligned=rings.map(unwrap);const reference=aligned[0][0][0];for(const ring of aligned.slice(1)){const shift=Math.round((reference-ring[0][0])/360)*360;ring.forEach(p=>p[0]+=shift);}const flat=aligned.flatMap(r=>r.flatMap(project)),holes:number[]=[];let count=aligned[0].length;for(const r of aligned.slice(1)){holes.push(count);count+=r.length;}const idx=earcut(flat,holes,2);const v=idx.flatMap(i=>flat.slice(i*2,i*2+2));this.batches.push(this.batch(v,this.gl.TRIANGLES,layer,color));aligned.forEach(line);};
   if(g.type==='Point'||g.type==='MultiPoint')add(positions(f),this.gl.POINTS);
   else if(g.type==='LineString')line(c as XY[]);else if(g.type==='MultiLineString')(c as XY[][]).forEach(line);else if(g.type==='Polygon')polygon(c as XY[][]);else(c as XY[][][]).forEach(polygon);
  }
 }
 render(visible:Record<string,boolean>,mode:Mode){if(this.lost)return;const g=this.gl,c=this.camera,dpr=Math.min(window.devicePixelRatio||1,1.5);const w=Math.round(c.width*dpr),h=Math.round(c.height*dpr);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}g.viewport(0,0,w,h);const bg=!visible.oceans?[.94,.95,.93]:mode==='physical'?[.08,.25,.32]:[.69,.83,.86];g.clearColor(...bg as [number,number,number],1);g.clear(g.COLOR_BUFFER_BIT);g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA);g.useProgram(this.program);g.uniform2f(g.getUniformLocation(this.program,'u_center'),...c.center);g.uniform2f(g.getUniformLocation(this.program,'u_size'),c.width,c.height);g.uniform1f(g.getUniformLocation(this.program,'u_scale'),c.scale);const location=g.getAttribLocation(this.program,'a_position');g.enableVertexAttribArray(location);
  for(const b of [...this.batches,this.grid]){if(!visible[b.layer])continue;g.bindBuffer(g.ARRAY_BUFFER,b.buffer);g.vertexAttribPointer(location,2,g.FLOAT,false,0,0);g.uniform4f(g.getUniformLocation(this.program,'u_color'),...b.color);const a=c.toWorld([0,0])[0],z=c.toWorld([c.width,c.height])[0];for(let k=Math.floor((a-180)/360);k<=Math.ceil((z+180)/360);k++){g.uniform1f(g.getUniformLocation(this.program,'u_offset'),k*360);g.drawArrays(b.primitive,0,b.count);}}
 }
 restore(features:Feature[]){this.program=this.createProgram();this.grid=this.makeGrid();this.batches=[];this.lost=false;this.setData(features);}
 dispose(){for(const b of [...this.batches,this.grid])this.gl.deleteBuffer(b.buffer);this.gl.deleteProgram(this.program);}
}
function unwrap(points:XY[]):XY[]{const out:XY[]=[];for(const p of points){let x=p[0];const prev=out.at(-1);if(prev){while(x-prev[0]>180)x-=360;while(x-prev[0]<-180)x+=360;}out.push([x,p[1]]);}return out;}
export function pick(features:Feature[],c:Camera,p:XY,visible:Record<string,boolean>):Feature|undefined{
 const w=c.toWorld(p);const tolerance=8/c.scale;
 for(const f of [...features].reverse()){if(!visible[featureLayer(f)])continue;const pts=positions(f);const nearest=(x:XY):XY=>[x[0]+Math.round((w[0]-x[0])/360)*360,-x[1]];
  if(f.geometry.type.includes('Point')){if(pts.some(x=>{const q=nearest(x);return Math.hypot(w[0]-q[0],w[1]-q[1])<tolerance;}))return f;}
  else if(f.geometry.type.includes('Polygon')){const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates as XY[][]]:f.geometry.coordinates as XY[][][];if(polys.some(r=>inside(w,r[0].map(nearest))&&!r.slice(1).some(h=>inside(w,h.map(nearest)))))return f;}
  else{const lines=f.geometry.type==='LineString'?[f.geometry.coordinates as XY[]]:f.geometry.coordinates as XY[][];for(const line of lines)for(let i=1;i<line.length;i++){const a=nearest(line[i-1]),b=nearest(line[i]),dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((w[0]-a[0])*dx+(w[1]-a[1])*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(w[0]-a[0]-t*dx,w[1]-a[1]-t*dy)<tolerance)return f;}}
 }return undefined;
}
function inside(p:XY,r:XY[]){let yes=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
