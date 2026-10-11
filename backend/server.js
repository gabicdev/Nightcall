import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, relative, isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";
import { openDatabase } from "./database.js";
import {
  createSessions,
  hashPassword,
  verifyPassword,
  publicUser,
} from "./accounts.js";

export function createServer({
  root = resolve("."),
  database = resolve("data/nightcall.sqlite"),
  secure = false,
  publicOrigin = "",
  iceServers = [{ urls: "stun:stun.l.google.com:19302" }],
} = {}) {
  if (publicOrigin && (!/^https:\/\/[^/]+$/.test(publicOrigin))) throw Error("NIGHTCALL_PUBLIC_ORIGIN deve ser HTTPS, sem barra final.");
  const db = openDatabase(database);
  const sessions = createSessions(db, secure);
  const attempts = new Map();
  const connections = new Map();
  const lastSeen = new Map();
  const signalingRate = new Map();
  const voicePresence = new Map(); // userId -> {channelId, until}; apenas presença, não mídia
  // Impede que clientes SSE lentos retenham buffers ilimitados na memória.
  const sendEvent = (res, payload) => {
    if (res.destroyed || res.writableEnded) return false;
    if (res.writableLength > 256 * 1024) { res.destroy(); return false; }
    res.write(payload);
    return true;
  };
  const broadcast = (ids, kind, details = {}) => {
    const payload = `event: ${kind}\ndata: ${JSON.stringify({at: Date.now(), ...details})}\n\n`;
    for (const id of new Set(ids)) for (const res of connections.get(id) || []) {
      sendEvent(res, payload);
    }
  };
  // Limpeza periódica de entradas efêmeras para sessões longas.
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
    for (const [key, value] of signalingRate) if (now - value.at > 120000) signalingRate.delete(key);
    for (const [key, value] of voicePresence) if (value.until < now) voicePresence.delete(key);
    for (const [key, value] of lastSeen) if (!connections.has(key) && now - value > 60000) lastSeen.delete(key);
  }, 60000);
  cleanupTimer.unref();
  const dummyPassword = hashPassword(randomUUID());
  const permittedOrigin = publicOrigin || null;
  const reply = (res, status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(data));
  };
  async function body(req) {
    let text = "";
    if (!req.headers["content-type"]?.startsWith("application/json"))
      throw Object.assign(Error("Envie JSON."), { status: 415 });
    for await (const part of req) {
      text += part;
      if (Buffer.byteLength(text) > 16384)
        throw Object.assign(Error("Dados grandes demais."), { status: 413 });
    }
    try {
      const value = JSON.parse(text);
      if (!value || Array.isArray(value) || typeof value !== "object")
        throw Error();
      return value;
    } catch {
      throw Object.assign(Error("JSON inválido."), { status: 400 });
    }
  }
  function validateProfile(input) {
    const { username, name, bio = "", avatar = "" } = input;
    if (
      typeof username !== "string" ||
      !/^[a-zA-Z0-9_]{3,24}$/.test(username) ||
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 60 ||
      typeof bio !== "string" ||
      bio.length > 200 ||
      typeof avatar !== "string" ||
      avatar.length > 2048
    )
      throw Object.assign(
        Error(
          "Confira nome, usuário (3–24 letras, números ou _) e bio (até 200 caracteres).",
        ),
        { status: 400 },
      );
    if (avatar) {
      let url;
      try {
        url = new URL(avatar);
      } catch {}
      if (!url || !["https:", "http:"].includes(url.protocol))
        throw Object.assign(Error("Avatar deve ser um link HTTP ou HTTPS."), {
          status: 400,
        });
    }
    return { username: username.toLowerCase(), name: name.trim(), bio, avatar };
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: http: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    try {
      const path = new URL(req.url, "http://localhost").pathname;
      // Endpoint sem dados pessoais, útil a monitores e ao diagnóstico do desktop.
      if (path === "/api/health" && ["GET", "HEAD"].includes(req.method)) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.statusCode = 200;
        return res.end(req.method === "HEAD" ? undefined : JSON.stringify({status:"ok",service:"nightcall"}));
      }
      if (path.startsWith("/api/")) {
        if (
          !["GET", "HEAD"].includes(req.method) &&
          (req.headers["sec-fetch-site"] === "cross-site" ||
            (req.headers.origin &&
              req.headers.origin !==
                (permittedOrigin || `${secure ? "https" : "http"}://${req.headers.host}`)))
        )
          return reply(res, 403, { error: "Origem não permitida." });
        if (
          req.method === "POST" &&
          ["/api/auth/register", "/api/auth/login"].includes(path)
        ) {
          const now = Date.now();
          for (const [key, entry] of attempts)
            if (entry.until <= now) attempts.delete(key);
          const key = req.socket.remoteAddress;
          const entry = attempts.get(key) || { count: 0, until: now + 60000 };
          attempts.set(key, entry);
          if (++entry.count > 20)
            return reply(res, 429, {
              error: "Muitas tentativas. Aguarde um minuto.",
            });
          const input = await body(req);
          if (
            typeof input.password !== "string" ||
            input.password.length < 10 ||
            input.password.length > 128
          )
            return reply(res, 400, {
              error: "Use uma senha de 10 a 128 caracteres.",
            });
          if (path.endsWith("/register")) {
            const profile = validateProfile(input);
            const password = await hashPassword(input.password);
            const id = randomUUID();
            db.prepare(
              "INSERT INTO users (id, username, password, name) VALUES (?,?,?,?)",
            ).run(id, profile.username, password, profile.name);
            sessions.start(req, res, id);
            return reply(res, 201, {
              user: publicUser(
                db.prepare("SELECT * FROM users WHERE id=?").get(id),
              ),
            });
          }
          const row = db
            .prepare("SELECT * FROM users WHERE username=?")
            .get(typeof input.username === "string" ? input.username : "");
          const valid = await verifyPassword(
            input.password,
            row?.password || (await dummyPassword),
          );
          if (!row || !valid)
            return reply(res, 401, { error: "Usuário ou senha incorretos." });
          sessions.start(req, res, row.id);
          return reply(res, 200, { user: publicUser(row) });
        }
        if (path === "/api/auth/logout" && req.method === "POST") {
          sessions.end(req, res);
          return reply(res, 200, { ok: true });
        }
        const user = sessions.user(req);
        if (!user) return reply(res, 401, { error: "Entre na sua conta." });
        if (path === "/api/events" && req.method === "GET") {
          if ((connections.get(user.id)?.size || 0) >= 4) return reply(res,429,{error:"Limite de conexões simultâneas."});
          res.writeHead(200, {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
          });
          res.write(`: connected\n\n`);
          if (!connections.has(user.id)) connections.set(user.id,new Set());
          connections.get(user.id).add(res);
          lastSeen.set(user.id,Date.now());
          const keepAlive=setInterval(()=>{
            if (sendEvent(res, `: keepalive\n\n`)) lastSeen.set(user.id,Date.now());
          },25000);
          req.on("close",()=>{
            clearInterval(keepAlive);
            connections.get(user.id)?.delete(res);
            if(!connections.get(user.id)?.size) connections.delete(user.id);
          });
          return;
        }
        if (path === "/api/presence" && req.method === "GET") {
          const friends = db.prepare(`SELECT CASE WHEN user_a=? THEN user_b ELSE user_a END AS id FROM friendships WHERE user_a=? OR user_b=?`).all(user.id,user.id,user.id);
          const now=Date.now();
          return reply(res,200,{online:friends.filter(f=>connections.has(f.id) || now-(lastSeen.get(f.id)||0)<60000).map(f=>f.id)});
        }
        // Diagnóstico autenticado: nunca expõe tokens, endereços internos ou credenciais TURN.
        if (path === "/api/network/status" && req.method === "GET")
          return reply(res, 200, {
            ok: true, serverTime: Date.now(),
            transport: "sse", signaling: "ready",
            secure: Boolean(secure),
            connectedSessions: connections.get(user.id)?.size || 0,
            iceConfigured: iceServers.length > 0,
            turnConfigured: iceServers.some(x => [x.urls].flat().some(u => typeof u === "string" && /^turns?:/.test(u))),
          });
        if (path === "/api/rtc/config" && req.method === "GET")
          return reply(res, 200, {iceServers, iceTransportPolicy: "all"});
        if (path === "/api/auth/me" && req.method === "GET")
          return reply(res, 200, { user: publicUser(user) });
        if (path === "/api/profile" && req.method === "PUT") {
          const profile = validateProfile(await body(req));
          db.prepare(
            "UPDATE users SET username=?, name=?, bio=?, avatar=? WHERE id=?",
          ).run(
            profile.username,
            profile.name,
            profile.bio,
            profile.avatar,
            user.id,
          );
          return reply(res, 200, {
            user: publicUser(
              db.prepare("SELECT * FROM users WHERE id=?").get(user.id),
            ),
          });
        }
        const pair = (a, b) => [a, b].sort();
        const isFriend = (a, b) => {
          const [x, y] = pair(a, b);
          return !!db.prepare("SELECT 1 FROM friendships WHERE user_a=? AND user_b=?").get(x, y);
        };
        const isBlocked = (a,b) => !!db.prepare("SELECT 1 FROM blocks WHERE (owner_id=? AND blocked_id=?) OR (owner_id=? AND blocked_id=?)").get(a,b,b,a);
        const target = (id) => db.prepare("SELECT * FROM users WHERE id=?").get(id);
        // 0.9: sinalização efêmera, apenas para amigos, sem armazenar SDP/ICE.
        if (path === "/api/calls/signal" && req.method === "POST") {
          const input = await body(req);
          const {to, type, callId, payload} = input;
          if (typeof to !== "string" || to === user.id || !target(to) ||
              !isFriend(user.id,to) || isBlocked(user.id,to))
            return reply(res,403,{error:"Chamada permitida somente entre amigos."});
          if (!["offer","answer","ice","hangup","reject","busy"].includes(type) ||
              typeof callId !== "string" || !/^[a-zA-Z0-9-]{8,80}$/.test(callId) ||
              (payload !== undefined && (typeof payload !== "object" || payload === null || Array.isArray(payload) ||
                JSON.stringify(payload).length > 12000)))
            return reply(res,400,{error:"Sinal de chamada inválido."});
          const now=Date.now();
          const rate=signalingRate.get(user.id)||{at:now,count:0};
          if(now-rate.at>10000){rate.at=now;rate.count=0;}
          signalingRate.set(user.id,rate);
          if(++rate.count>120) return reply(res,429,{error:"Muitos sinais de chamada."});
          const peers=connections.get(to);
          if (!peers?.size) return reply(res,409,{error:"Amigo não está conectado."});
          const event=`event: call\ndata: ${JSON.stringify({from:user.id,type,callId,payload:payload??null})}\n\n`;
          for(const peer of peers) sendEvent(peer,event);
          return reply(res,200,{ok:true});
        }
        if (path === "/api/blocks" && req.method === "GET") {
          const blocked = db.prepare("SELECT u.* FROM users u JOIN blocks b ON b.blocked_id=u.id WHERE b.owner_id=? ORDER BY u.username").all(user.id).map(publicUser);
          return reply(res,200,{blocked});
        }
        const blockMatch=path.match(/^\/api\/blocks\/([a-f0-9-]+)$/);
        if(blockMatch){
          const id=blockMatch[1];
          if(req.method === "POST"){
            if(id===user.id || !target(id)) return reply(res,400,{error:"Usuário inválido."});
            db.prepare("INSERT OR IGNORE INTO blocks VALUES (?,?,?)").run(user.id,id,Date.now());
            const [a,b]=pair(user.id,id);
            db.prepare("DELETE FROM friendships WHERE user_a=? AND user_b=?").run(a,b);
            db.prepare("DELETE FROM friend_requests WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)").run(user.id,id,id,user.id);
            broadcast([user.id,id],"social");
            return reply(res,200,{ok:true});
          }
          if(req.method === "DELETE"){
            db.prepare("DELETE FROM blocks WHERE owner_id=? AND blocked_id=?").run(user.id,id);
            return reply(res,200,{ok:true});
          }
        }
        const deleteMessage=path.match(/^\/api\/messages\/own\/([a-f0-9-]+)$/);
        if(deleteMessage && req.method === "DELETE"){
          const result=db.prepare("DELETE FROM messages WHERE id=? AND sender_id=?").run(deleteMessage[1],user.id);
          return reply(res,result.changes?200:404,result.changes?{ok:true}:{error:"Mensagem não encontrada."});
        }
        if (path === "/api/users/search" && req.method === "GET") {
          const username = new URL(req.url, "http://localhost").searchParams.get("username")?.replace(/^@/, "").trim();
          if (!username || !/^[a-zA-Z0-9_]{3,24}$/.test(username))
            return reply(res, 400, { error: "Informe um @usuário válido." });
          const found = db.prepare("SELECT * FROM users WHERE username=? AND id<>?").get(username, user.id);
          return reply(res, 200, { user: found ? publicUser(found) : null });
        }
        if (path === "/api/friends" && req.method === "GET") {
          const friends = db.prepare(`SELECT u.* FROM users u JOIN friendships f
            ON (f.user_a=u.id OR f.user_b=u.id) WHERE (f.user_a=? OR f.user_b=?) AND u.id<>? ORDER BY u.name`).all(user.id,user.id,user.id).map(publicUser);
          const incoming = db.prepare("SELECT u.* FROM users u JOIN friend_requests r ON u.id=r.sender_id WHERE r.receiver_id=? ORDER BY r.created_at DESC").all(user.id).map(publicUser);
          const outgoing = db.prepare("SELECT u.* FROM users u JOIN friend_requests r ON u.id=r.receiver_id WHERE r.sender_id=? ORDER BY r.created_at DESC").all(user.id).map(publicUser);
          return reply(res, 200, { friends, incoming, outgoing });
        }
        if (path === "/api/friends/request" && req.method === "POST") {
          const { userId } = await body(req);
          if (typeof userId !== "string" || userId === user.id || !target(userId)) return reply(res, 400, {error:"Usuário inválido."});
          if (isBlocked(user.id,userId)) return reply(res,403,{error:"Não é possível solicitar amizade."});
          if (isFriend(user.id,userId)) return reply(res,409,{error:"Vocês já são amigos."});
          if (db.prepare("SELECT 1 FROM friend_requests WHERE sender_id=? AND receiver_id=?").get(userId,user.id))
            return reply(res,409,{error:"Essa pessoa já enviou uma solicitação a você. Aceite na aba Pendentes."});
          db.prepare("INSERT OR IGNORE INTO friend_requests VALUES (?,?,?)").run(user.id,userId,Date.now());
          broadcast([user.id,userId],"social");
          return reply(res,200,{ok:true});
        }
        const requestMatch = path.match(/^\/api\/friends\/requests\/([a-f0-9-]+)\/(accept|reject)$/);
        if (requestMatch && req.method === "POST") {
          const [,senderId, action] = requestMatch;
          const exists = db.prepare("SELECT 1 FROM friend_requests WHERE sender_id=? AND receiver_id=?").get(senderId,user.id);
          if (!exists) return reply(res,404,{error:"Solicitação não encontrada."});
          if (isBlocked(user.id,senderId)) return reply(res,403,{error:"Usuário bloqueado."});
          if (action === "accept") {
            const [a,b] = pair(user.id,senderId);
            db.prepare("INSERT OR IGNORE INTO friendships VALUES (?,?,?)").run(a,b,Date.now());
          }
          db.prepare("DELETE FROM friend_requests WHERE sender_id=? AND receiver_id=?").run(senderId,user.id);
          broadcast([user.id,senderId],"social");
          return reply(res,200,{ok:true});
        }
        const removeMatch = path.match(/^\/api\/friends\/([a-f0-9-]+)$/);
        if (removeMatch && req.method === "DELETE") {
          const [a,b] = pair(user.id, removeMatch[1]);
          db.prepare("DELETE FROM friendships WHERE user_a=? AND user_b=?").run(a,b);
          broadcast([user.id,removeMatch[1]],"social");
          return reply(res,200,{ok:true});
        }
        // Macro 1.7–2.0: comunidades, convites, canais e permissões no servidor.
        const member = (cid) => db.prepare('SELECT role FROM community_members WHERE community_id=? AND user_id=?').get(cid,user.id);
        const community = (cid) => db.prepare('SELECT * FROM communities WHERE id=?').get(cid);
        const roleCanManage = (role) => role === 'owner' || role === 'admin';
        if (path === '/api/communities' && req.method === 'GET') {
          const communities = db.prepare(`SELECT c.id,c.name,c.owner_id ownerId,CASE WHEN m.role IN ('owner','admin') THEN c.invite_code ELSE NULL END inviteCode,m.role FROM communities c JOIN community_members m ON m.community_id=c.id WHERE m.user_id=? ORDER BY c.created_at DESC`).all(user.id);
          return reply(res,200,{communities});
        }
        if (path === '/api/communities' && req.method === 'POST') {
          const {name} = await body(req);
          const normalizedName = typeof name === 'string' ? name.trim().replace(/\s+/g,' ') : '';
          if(!normalizedName || normalizedName.length < 3 || normalizedName.length > 40) return reply(res,400,{error:'Nome inválido (3–40 caracteres).'});
          const id=randomUUID(), code=randomUUID().replaceAll('-','').slice(0,12), now=Date.now();
          db.exec('BEGIN');
          try {
            db.prepare('INSERT INTO communities VALUES (?,?,?,?,?)').run(id,normalizedName,user.id,code,now);
            db.prepare('INSERT INTO community_members VALUES (?,?,?,?)').run(id,user.id,'owner',now);
            db.prepare('INSERT INTO community_channels VALUES (?,?,?,?,?)').run(randomUUID(),id,'geral','text',now);
            db.prepare('INSERT INTO community_channels VALUES (?,?,?,?,?)').run(randomUUID(),id,'voz-geral','voice',now);
            db.exec('COMMIT');
          } catch(e){db.exec('ROLLBACK');throw e;}
          return reply(res,201,{community:{id,name:normalizedName,ownerId:user.id,inviteCode:code,role:'owner'}});
        }
        if(path === '/api/communities/join' && req.method === 'POST') {
          const {code}=await body(req);
          if(typeof code !== 'string'|| !/^[a-f0-9]{12}$/.test(code))return reply(res,400,{error:'Convite inválido.'});
          const c=db.prepare('SELECT * FROM communities WHERE invite_code=?').get(code);
          if(!c)return reply(res,404,{error:'Convite não encontrado.'});
          db.prepare('INSERT OR IGNORE INTO community_members VALUES (?,?,?,?)').run(c.id,user.id,'member',Date.now());
          broadcast([user.id],'community');
          return reply(res,200,{communityId:c.id});
        }
        const cm=path.match(/^\/api\/communities\/([a-f0-9-]+)$/);
        if(cm && req.method === 'GET') {
          const cid=cm[1], access=member(cid), c=community(cid);
          if(!c||!access)return reply(res,404,{error:'Comunidade não encontrada.'});
          const channels=db.prepare('SELECT id,name,kind FROM community_channels WHERE community_id=? ORDER BY created_at,id').all(cid);
          const members=db.prepare('SELECT u.id,u.username,u.name,m.role FROM community_members m JOIN users u ON u.id=m.user_id WHERE m.community_id=? ORDER BY m.joined_at').all(cid);
          return reply(res,200,{community:{id:c.id,name:c.name,ownerId:c.owner_id,inviteCode:roleCanManage(access.role)?c.invite_code:null,role:access.role},channels,members});
        }
        const chCreate=path.match(/^\/api\/communities\/([a-f0-9-]+)\/channels$/);
        if(chCreate && req.method === 'POST') {
          const cid=chCreate[1], access=member(cid);
          if(!roleCanManage(access?.role))return reply(res,403,{error:'Sem permissão para criar canais.'});
          const {name,kind='text'}=await body(req);
          if(typeof name!=='string'|| !/^[a-zA-Z0-9_-]{1,32}$/.test(name)||!['text','voice'].includes(kind)) return reply(res,400,{error:'Canal inválido.'});
          const id=randomUUID(); db.prepare('INSERT INTO community_channels VALUES (?,?,?,?,?)').run(id,cid,name,kind,Date.now());
          broadcast(db.prepare('SELECT user_id FROM community_members WHERE community_id=?').all(cid).map(x=>x.user_id),'community');
          return reply(res,201,{channel:{id,name,kind}});
        }
        const memberEdit=path.match(/^\/api\/communities\/([a-f0-9-]+)\/members\/([a-f0-9-]+)$/);
        if(memberEdit && req.method==='PATCH') {
          const [,cid,uid]=memberEdit, actor=member(cid), targetMember=db.prepare('SELECT role FROM community_members WHERE community_id=? AND user_id=?').get(cid,uid);
          if(actor?.role!=='owner'||!targetMember||uid===user.id)return reply(res,403,{error:'Somente o dono pode alterar cargos de outros membros.'});
          const {role}=await body(req);
          if(!['admin','member'].includes(role))return reply(res,400,{error:'Cargo inválido.'});
          db.prepare('UPDATE community_members SET role=? WHERE community_id=? AND user_id=?').run(role,cid,uid);
          broadcast([uid,user.id],'community');return reply(res,200,{ok:true});
        }
        // Presença autenticada de canais de voz: uma sala por usuário, com prazo de expiração.
        const voiceMatch=path.match(/^\/api\/channels\/([a-f0-9-]+)\/voice$/);
        if(voiceMatch){
          const ch=db.prepare('SELECT * FROM community_channels WHERE id=?').get(voiceMatch[1]);
          if(!ch || ch.kind!=='voice' || !member(ch.community_id)) return reply(res,403,{error:'Canal de voz indisponível.'});
          if(req.method==='POST'){
            const previous=voicePresence.get(user.id);
            const activeCount=[...voicePresence.entries()].filter(([id,v])=>id!==user.id&&v.channelId===ch.id&&v.until>Date.now()).length;
            if(activeCount>=4)return reply(res,409,{error:'Canal limitado a 5 participantes para preservar desempenho.'});
            voicePresence.set(user.id,{channelId:ch.id,until:Date.now()+45000});
            broadcast(db.prepare('SELECT user_id FROM community_members WHERE community_id=?').all(ch.community_id).map(m=>m.user_id),'community');
            return reply(res,200,{ok:true,changed:previous?.channelId!==ch.id});
          }
          if(req.method==='DELETE'){
            if(voicePresence.get(user.id)?.channelId===ch.id)voicePresence.delete(user.id);
            broadcast(db.prepare('SELECT user_id FROM community_members WHERE community_id=?').all(ch.community_id).map(m=>m.user_id),'community');
            return reply(res,200,{ok:true});
          }
          if(req.method==='GET'){
            const rows=db.prepare('SELECT u.id,u.username,u.name FROM users u JOIN community_members m ON m.user_id=u.id WHERE m.community_id=?').all(ch.community_id);
            return reply(res,200,{participants:rows.filter(m=>{const v=voicePresence.get(m.id);return v?.channelId===ch.id && v.until>Date.now();})});
          }
        }
        // Sinalização de voz em grupo: destino deve estar presente no MESMO canal.
        const voiceSignal=path.match(/^\/api\/channels\/([a-f0-9-]+)\/voice\/signal$/);
        if(voiceSignal && req.method==='POST'){
          const ch=db.prepare('SELECT * FROM community_channels WHERE id=?').get(voiceSignal[1]);
          if(!ch || ch.kind!=='voice' || !member(ch.community_id))return reply(res,403,{error:'Canal indisponível.'});
          const live=id=>{const v=voicePresence.get(id);return v?.channelId===ch.id && v.until>Date.now();};
          if(!live(user.id))return reply(res,403,{error:'Entre no canal antes de transmitir.'});
          const {to,type,payload}=await body(req);
          if(typeof to!=='string'||to===user.id||!live(to)||!db.prepare('SELECT 1 FROM community_members WHERE community_id=? AND user_id=?').get(ch.community_id,to))return reply(res,403,{error:'Destino não está no canal.'});
          if(!['offer','answer','ice','leave'].includes(type) || (type!=='leave' &&
             (!payload||typeof payload!=='object'||Array.isArray(payload)||JSON.stringify(payload).length>12000)))
             return reply(res,400,{error:'Sinal inválido.'});
          const now=Date.now(),rate=signalingRate.get(user.id)||{at:now,count:0};
          if(now-rate.at>10000){rate.at=now;rate.count=0;}
          signalingRate.set(user.id,rate);
          if(++rate.count>120)return reply(res,429,{error:'Limite de sinalização.'});
          const receivers=connections.get(to);if(!receivers?.size)return reply(res,409,{error:'Participante desconectado.'});
          const message=`event: voice-signal\ndata: ${JSON.stringify({channelId:ch.id,from:user.id,type,payload:payload??null})}\n\n`;
          for(const receiver of receivers)sendEvent(receiver,message);
          return reply(res,200,{ok:true});
        }
        const channelMatch=path.match(/^\/api\/channels\/([a-f0-9-]+)\/messages$/);
        if(channelMatch){
          const channel=db.prepare('SELECT * FROM community_channels WHERE id=?').get(channelMatch[1]);
          if(!channel||!member(channel.community_id))return reply(res,403,{error:'Canal privado.'});
          if(channel.kind!=='text')return reply(res,400,{error:'Canal de voz não aceita mensagens.'});
          if(req.method==='GET'){
            const before=Number(new URL(req.url,'http://localhost').searchParams.get('before'))||Date.now()+1;
            const messages=db.prepare(`SELECT m.id,m.sender_id senderId,u.name senderName,m.content,m.created_at createdAt FROM channel_messages m JOIN users u ON u.id=m.sender_id WHERE m.channel_id=? AND m.created_at<? ORDER BY m.created_at DESC LIMIT 100`).all(channel.id,before).reverse();
            return reply(res,200,{messages});
          }
          if(req.method==='POST'){
            const {content}=await body(req);
            if(typeof content!=='string'||!content.trim()||content.length>2000)return reply(res,400,{error:'Mensagem inválida.'});
            const msg={id:randomUUID(),senderId:user.id,content:content.trim(),createdAt:Date.now()};
            db.prepare('INSERT INTO channel_messages VALUES (?,?,?,?,?)').run(msg.id,channel.id,user.id,msg.content,msg.createdAt);
            broadcast(db.prepare('SELECT user_id FROM community_members WHERE community_id=?').all(channel.community_id).map(x=>x.user_id),'community');
            return reply(res,201,{message:msg});
          }
        }
        if (path === "/api/conversations" && req.method === "GET") {
          const rows = db.prepare(`SELECT u.*, MAX(m.created_at) last_message FROM messages m JOIN users u
            ON u.id = CASE WHEN m.sender_id=? THEN m.receiver_id ELSE m.sender_id END
            WHERE (m.sender_id=? OR m.receiver_id=?) GROUP BY u.id ORDER BY last_message DESC LIMIT 100`).all(user.id,user.id,user.id);
          return reply(res,200,{conversations:rows.map(row=>({...publicUser(row),lastMessage:row.last_message}))});
        }
        const chatMatch = path.match(/^\/api\/messages\/([a-f0-9-]+)$/);
        if (chatMatch) {
          const otherId = chatMatch[1];
          if (!target(otherId) || isBlocked(user.id,otherId) || !isFriend(user.id,otherId)) return reply(res,403,{error:"Mensagens permitidas apenas entre amigos."});
          if (req.method === "GET") {
            const before = Number(new URL(req.url,"http://localhost").searchParams.get("before")) || Date.now()+1;
            const messages = db.prepare(`SELECT id,sender_id senderId,receiver_id receiverId,content,created_at createdAt FROM messages
              WHERE ((sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?)) AND created_at<? ORDER BY created_at DESC LIMIT 100`).all(user.id,otherId,otherId,user.id,before).reverse();
            return reply(res,200,{messages});
          }
          if (req.method === "POST") {
            const {content} = await body(req);
            if (typeof content !== "string" || !content.trim() || content.length>2000)
              return reply(res,400,{error:"A mensagem deve ter de 1 a 2000 caracteres."});
            const message = {id:randomUUID(), senderId:user.id, receiverId:otherId, content:content.trim(), createdAt:Date.now()};
            db.prepare("INSERT INTO messages VALUES (?,?,?,?,?)").run(message.id,message.senderId,message.receiverId,message.content,message.createdAt);
            broadcast([user.id,otherId],"message",{from:user.id});
            return reply(res,201,{message});
          }
        }
        return reply(res, 404, { error: "Recurso não encontrado." });
      }
      // Somente arquivos públicos: banco, backend e configuração nunca são servidos.
      if (req.method !== "GET" && req.method !== "HEAD") return reply(res,405,{error:"Método não permitido."});
      if (
        !(
          /^\/(?:index\.html)?$/.test(path) ||
          /^\/(js|css)\/[a-zA-Z0-9_-]+\.(js|css)$/.test(path)
        )
      )
        return reply(res, 404, { error: "Não encontrado." });
      let decoded;
      try { decoded = decodeURIComponent(path); } catch { return reply(res,400,{error:"Caminho inválido."}); }
      if (decoded.includes("\0") || decoded.includes("\\") || decoded.split("/").includes(".."))
        return reply(res,403,{error:"Caminho proibido."});
      const file = resolve(root, "." + (decoded === "/" ? "/index.html" : decoded));
      const rel = relative(resolve(root),file);
      if (rel.startsWith("..") || isAbsolute(rel)) return reply(res,403,{error:"Caminho proibido."});
      if (!/[.](html|js|css|svg|png|jpg|jpeg|webp|ico|woff2?)$/i.test(file)) return reply(res,404,{error:"Recurso indisponível."});
      const content = await readFile(file);
      res.writeHead(200, {
        "Content-Type":
          {
            ".html": "text/html",
            ".js": "text/javascript",
            ".css": "text/css",
          ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2"
          }[extname(file)] + (/[.](html|js|css|svg)$/i.test(file) ? "; charset=utf-8" : ""),
      });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch (error) {
      const conflict = error.message?.includes("UNIQUE constraint");
      reply(
        res,
        conflict ? 409 : error.status || (error.code === "ENOENT" ? 404 : 500),
        {
          error: conflict
            ? "Esse usuário já existe."
            : error.status
              ? error.message
              : "Não foi possível concluir a operação.",
        },
      );
    }
  });
  server.on("close", () => {
    clearInterval(cleanupTimer);
    for (const clients of connections.values()) for(const res of clients) res.end();
    connections.clear();
    db.close();
  });
  return server;
}
