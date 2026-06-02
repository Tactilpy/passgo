// routes/participants.js
const router = require('express').Router();
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/',    async(req,res,next)=>{ try{const{rows}=await pool.query('SELECT * FROM participants ORDER BY created_at DESC LIMIT 500');res.json({participants:rows});}catch(e){next(e);}});
router.post('/',   async(req,res,next)=>{ try{const{nombre,apellido,dni,email,tel,org,role,pay_status='free',pay_amount=0}=req.body;if(!nombre||!apellido)return res.status(400).json({error:'Nombre y apellido requeridos'});const{rows}=await pool.query('INSERT INTO participants (nombre,apellido,dni,email,tel,org,role,pay_status,pay_amount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[nombre,apellido,dni,email,tel,org,role,pay_status,pay_amount]);res.status(201).json(rows[0]);}catch(e){next(e);}});
router.put('/:id', async(req,res,next)=>{ try{const{nombre,apellido,dni,email,tel,org,role,pay_status,pay_amount}=req.body;const{rows}=await pool.query('UPDATE participants SET nombre=$1,apellido=$2,dni=$3,email=$4,tel=$5,org=$6,role=$7,pay_status=$8,pay_amount=$9 WHERE id=$10 RETURNING *',[nombre,apellido,dni,email,tel,org,role,pay_status,pay_amount,req.params.id]);rows[0]?res.json(rows[0]):res.status(404).json({error:'No encontrado'});}catch(e){next(e);}});
router.delete('/:id',async(req,res,next)=>{try{await pool.query('DELETE FROM participants WHERE id=$1',[req.params.id]);res.json({message:'Eliminado'});}catch(e){next(e);}});
module.exports = router;
