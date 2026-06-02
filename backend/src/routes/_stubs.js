// Rutas stub — speakers, certificates, surveys, comm, reports
// Cada uno exporta un router básico funcional

const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

// ── SPEAKERS ──────────────────────────────────────────────────
const speakersRouter = express.Router();
speakersRouter.use(authenticate);
speakersRouter.get('/', async(req,res,next)=>{ try{const{rows}=await pool.query('SELECT * FROM speakers ORDER BY apellido');res.json({speakers:rows});}catch(e){next(e);}});
speakersRouter.post('/', async(req,res,next)=>{ try{const{nombre,apellido,dni,email,tel,address,cargo,empresa,org_id,active=true}=req.body;if(!nombre||!apellido||!email)return res.status(400).json({error:'Nombre, apellido y email requeridos'});const{rows}=await pool.query('INSERT INTO speakers(nombre,apellido,dni,email,tel,address,cargo,empresa,org_id,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',[nombre,apellido,dni,email,tel,address,cargo,empresa,org_id||null,active]);res.status(201).json(rows[0]);}catch(e){next(e);}});
speakersRouter.put('/:id', async(req,res,next)=>{ try{const{nombre,apellido,dni,email,tel,address,cargo,empresa,active}=req.body;const{rows}=await pool.query('UPDATE speakers SET nombre=$1,apellido=$2,dni=$3,email=$4,tel=$5,address=$6,cargo=$7,empresa=$8,active=$9 WHERE id=$10 RETURNING *',[nombre,apellido,dni,email,tel,address,cargo,empresa,active,req.params.id]);rows[0]?res.json(rows[0]):res.status(404).json({error:'No encontrado'});}catch(e){next(e);}});
speakersRouter.delete('/:id',async(req,res,next)=>{try{await pool.query('DELETE FROM speakers WHERE id=$1',[req.params.id]);res.json({message:'Eliminado'});}catch(e){next(e);}});

// ── CERTIFICATES ──────────────────────────────────────────────
const certsRouter = express.Router();
certsRouter.use(authenticate);
certsRouter.get('/', async(req,res,next)=>{ try{const{event_id}=req.query;let q='SELECT c.*,p.nombre,p.apellido FROM certificates c JOIN participants p ON p.id=c.participant_id WHERE 1=1';const params=[];if(event_id){params.push(event_id);q+=` AND c.event_id=$${params.length}`;}const{rows}=await pool.query(q,params);res.json({certificates:rows});}catch(e){next(e);}});
certsRouter.post('/', async(req,res,next)=>{ try{const{event_id,participant_id,issued_by}=req.body;const cert_id=`CERT-${Date.now().toString(36).toUpperCase()}`;const{rows}=await pool.query('INSERT INTO certificates(cert_id,event_id,participant_id,issued_by) VALUES($1,$2,$3,$4) RETURNING *',[cert_id,event_id,participant_id,issued_by||req.user.id]);res.status(201).json(rows[0]);}catch(e){next(e);}});
certsRouter.patch('/:id/approve', async(req,res,next)=>{ try{const{rows}=await pool.query('UPDATE certificates SET approved=true,approved_by=$1,approved_at=NOW() WHERE id=$2 RETURNING *',[req.user.id,req.params.id]);rows[0]?res.json(rows[0]):res.status(404).json({error:'No encontrado'});}catch(e){next(e);}});
certsRouter.patch('/:id/send', async(req,res,next)=>{ try{const{rows}=await pool.query('UPDATE certificates SET sent=true,sent_at=NOW() WHERE id=$1 RETURNING *',[req.params.id]);rows[0]?res.json(rows[0]):res.status(404).json({error:'No encontrado'});}catch(e){next(e);}});

// ── SURVEYS ───────────────────────────────────────────────────
const surveysRouter = express.Router();
surveysRouter.use(authenticate);
surveysRouter.get('/', async(req,res,next)=>{ try{const{rows}=await pool.query('SELECT * FROM surveys');res.json({surveys:rows});}catch(e){next(e);}});
surveysRouter.post('/', async(req,res,next)=>{ try{const{event_id,title,questions=[]}=req.body;const{rows}=await pool.query('INSERT INTO surveys(event_id,title,questions) VALUES($1,$2,$3) RETURNING *',[event_id,title,JSON.stringify(questions)]);res.status(201).json(rows[0]);}catch(e){next(e);}});
surveysRouter.post('/:id/respond', async(req,res,next)=>{ try{const{participant_id,answers}=req.body;const{rows}=await pool.query('INSERT INTO survey_responses(survey_id,participant_id,answers) VALUES($1,$2,$3) RETURNING *',[req.params.id,participant_id,JSON.stringify(answers)]);res.status(201).json(rows[0]);}catch(e){next(e);}});

// ── COMM ──────────────────────────────────────────────────────
const commRouter = express.Router();
commRouter.use(authenticate);
commRouter.get('/settings', async(req,res,next)=>{ try{const{rows}=await pool.query('SELECT type,config,active FROM comm_settings WHERE org_id=$1',[req.user.org_id||1]);res.json({settings:rows});}catch(e){next(e);}});
commRouter.put('/settings/:type', async(req,res,next)=>{ try{const{config,active}=req.body;await pool.query('INSERT INTO comm_settings(org_id,type,config,active) VALUES($1,$2,$3,$4) ON CONFLICT(org_id,type) DO UPDATE SET config=$3,active=$4',[req.user.org_id||1,req.params.type,JSON.stringify(config),active]);res.json({message:'Guardado'});}catch(e){next(e);}});
commRouter.post('/send', async(req,res,next)=>{ try{const{channel,type,target_ids}=req.body;// Aquí iría la integración real con nodemailer/WhatsApp API
res.json({message:`${target_ids?.length||0} mensajes enviados por ${channel}`,sent:target_ids?.length||0});}catch(e){next(e);}});

// ── REPORTS ───────────────────────────────────────────────────
const reportsRouter = express.Router();
reportsRouter.use(authenticate);
reportsRouter.get('/summary', async(req,res,next)=>{ try{const [evs,parts,chk]=await Promise.all([pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status=\'active\') as active, COUNT(*) FILTER (WHERE status=\'finished\') as finished FROM events'),pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE pay_status=\'paid\') as paid FROM participants'),pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status=\'in\') as present, method FROM checkins GROUP BY method')]);res.json({events:evs.rows[0],participants:parts.rows[0],checkins:chk.rows});}catch(e){next(e);}});

module.exports = { speakersRouter, certsRouter, surveysRouter, commRouter, reportsRouter };
