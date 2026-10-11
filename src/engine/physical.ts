import type{Camera}from'./camera';
const sources=[['oceans','fond_ocean'],['continents','continents'],['islands','islands'],['terrain','reliefs'],['deserts','deserts'],['vegetation','forets_arbres'],['rivers','eaux_douces'],['labels','etiquettes']] as const;
export class PhysicalAtlas{
 program:WebGLProgram;buffer:WebGLBuffer;textures:{layer:string;texture:WebGLTexture}[]=[];disposed=false;
 constructor(private gl:WebGL2RenderingContext,private camera:Camera){
 const shader=(kind:number,src:string)=>{const s=gl.createShader(kind)!;gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)??'Erreur texture');return s;};
 const v=shader(gl.VERTEX_SHADER,`#version 300 es
in vec2 p;out vec2 uv;uniform vec2 center;uniform vec2 size;uniform float scale;uniform float offset;void main(){uv=vec2((p.x+180.)/360.,(p.y+90.)/180.);vec2 q=(p+vec2(offset,0.)-center)*scale;gl_Position=vec4(q.x*2./size.x,-q.y*2./size.y,0.,1.);}`);
 const f=shader(gl.FRAGMENT_SHADER,`#version 300 es
precision mediump float;in vec2 uv;uniform sampler2D atlas;out vec4 color;void main(){color=texture(atlas,uv);}`);
 this.program=gl.createProgram()!;gl.attachShader(this.program,v);gl.attachShader(this.program,f);gl.linkProgram(this.program);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error('Erreur du programme cartographique physique.');
 this.buffer=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-180,-90,180,-90,-180,90,-180,90,180,-90,180,90]),gl.STATIC_DRAW);
 }
 async load(redraw:()=>void){for(const[layer,name]of sources){const im=new Image();im.src=`/data/official/${name}-render.svg`;await im.decode();if(this.disposed)return;const g=this.gl,t=g.createTexture()!;g.bindTexture(g.TEXTURE_2D,t);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,im);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);this.textures.push({layer,texture:t});redraw();}}
 render(visible:Record<string,boolean>,physical:boolean){const g=this.gl,c=this.camera;g.useProgram(this.program);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);const p=g.getAttribLocation(this.program,'p');g.enableVertexAttribArray(p);g.vertexAttribPointer(p,2,g.FLOAT,false,0,0);g.uniform2f(g.getUniformLocation(this.program,'center'),...c.center);g.uniform2f(g.getUniformLocation(this.program,'size'),c.width,c.height);g.uniform1f(g.getUniformLocation(this.program,'scale'),c.scale);g.activeTexture(g.TEXTURE0);g.uniform1i(g.getUniformLocation(this.program,'atlas'),0);
 for(const t of this.textures){if(!visible[t.layer]||(!physical&&['terrain','vegetation','deserts'].includes(t.layer)))continue;g.bindTexture(g.TEXTURE_2D,t.texture);const a=c.toWorld([0,0])[0],b=c.toWorld([c.width,c.height])[0];for(let k=Math.floor((a+180)/360);k<=Math.floor((b+180)/360);k++){g.uniform1f(g.getUniformLocation(this.program,'offset'),k*360);g.drawArrays(g.TRIANGLES,0,6);}}
 }
 dispose(){this.disposed=true;for(const t of this.textures)this.gl.deleteTexture(t.texture);this.gl.deleteBuffer(this.buffer);this.gl.deleteProgram(this.program);}
}
