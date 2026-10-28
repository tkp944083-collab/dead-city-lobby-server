

'use strict';
const http = require('node:http');
const crypto = require('node:crypto');
const rooms = new Map();
const port = Number(process.env.PORT) || 3000;
const name = s => String(s || 'Survivor').trim().slice(0, 20) || 'Survivor';
function json(res, status, body) {res.writeHead(status, {'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'});res.end(JSON.stringify(body));}
function clean(){const now=Date.now();for(const [code, room] of rooms){for(const [id,p] of room.players)if(now-p.seen>90000)room.players.delete(id);if(!room.players.size&&now-room.updated>600000)rooms.delete(code);}}
function snapshot(room){return {code:room.code,players:[...room.players.values()].map(p=>({id:p.id,name:p.name})),messages:room.messages,seed:room.seed,positions:[...room.players.values()].filter(p=>p.position).map(p=>({id:p.id,name:p.name,...p.position}))};}
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',x=>{s+=x;if(s.length>8192){reject(Error('too large'));req.destroy()}});req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch{reject(Error('bad json'))}});req.on('error',reject)})}
http.createServer(async(req,res)=>{try{clean();if(req.method==='OPTIONS')return json(res,200,{});const url=new URL(req.url,'http://localhost');if(req.method==='GET'&&url.pathname==='/')return json(res,200,{service:'Dead City lobby server',status:'online',note:'Lobby and chat only; gameplay synchronization is not implemented.'});
if(req.method!=='POST')return json(res,404,{error:'Not found'});const data=await body(req);
if(url.pathname==='/create'){if(rooms.size>=200)return json(res,503,{error:'Server is full'});let code;do{code=crypto.randomBytes(4).toString('hex').slice(0,6).toUpperCase()}while(rooms.has(code));const id=crypto.randomUUID(),token=crypto.randomBytes(24).toString('hex'),now=Date.now(),room={code,players:new Map(),messages:[],seed:crypto.randomBytes(4).readUInt32LE(),updated:now};room.players.set(id,{id,token,name:name(data.name),seen:now});rooms.set(code,room);return json(res,200,{id,token,...snapshot(room)})}
const code=String(data.code||'').toUpperCase(),room=rooms.get(code);if(!room)return json(res,404,{error:'Lobby not found or expired'});
if(url.pathname==='/join'){if(room.players.size>=15)return json(res,409,{error:'Lobby is full'});const id=crypto.randomUUID(),token=crypto.randomBytes(24).toString('hex');room.players.set(id,{id,token,name:name(data.name),seen:Date.now()});room.updated=Date.now();return json(res,200,{id,token,...snapshot(room)})}
const player=room.players.get(String(data.id||''));if(!player||player.token!==data.token)return json(res,403,{error:'Player session expired'});player.seen=Date.now();room.updated=Date.now();
if(url.pathname==='/position'){const x=Number(data.x),y=Number(data.y),angle=Number(data.angle||0);if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(angle)||x<0||x>2400||y<0||y>2400)return json(res,400,{error:'Invalid position'});player.position={x,y,angle};return json(res,200,snapshot(room))}if(url.pathname==='/poll')return json(res,200,snapshot(room));if(url.pathname==='/chat'){const message=String(data.message||'').trim().slice(0,180);if(!message)return json(res,400,{error:'Message is empty'});room.messages.push({name:player.name,text:message});room.messages=room.messages.slice(-40);return json(res,200,snapshot(room))}if(url.pathname==='/leave'){room.players.delete(player.id);return json(res,200,{ok:true})}return json(res,404,{error:'Not found'});
}catch(err){if(!res.headersSent)json(res,400,{error:'Invalid request'});}}).listen(port,'0.0.0.0',()=>console.log('Dead City lobby listening on '+port));

