// routes/organizations.js
const router = require('express').Router();
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

router.get('/',     async (req, res, next) => { try { const {rows}=await pool.query('SELECT * FROM organizations ORDER BY name'); res.json({organizations:rows}); } catch(e){next(e);} });
router.get('/:id',  async (req, res, next) => { try { const {rows}=await pool.query('SELECT * FROM organizations WHERE id=$1',[req.params.id]); rows[0]?res.json(rows[0]):res.status(404).json({error:'No encontrado'}); } catch(e){next(e);} });
router.post('/',    async (req, res, next) => { try { const {name,razon_social,ruc,address,city,country,email,phone,contact_name,contact_role,plan='pro'}=req.body; if(!name||!email) return res.status(400).json({error:'Nombre y email requeridos'}); const {rows}=await pool.query('INSERT INTO organizations (name,razon_social,ruc,address,city,country,email,phone,contact_name,contact_role,plan) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',[name,razon_social,ruc,address,city,country||'Argentina',email,phone,contact_name,contact_role,plan]); res.status(201).json(rows[0]); } catch(e){next(e);} });
router.put('/:id',  async (req, res, next) => { try { const {name,razon_social,ruc,address,city,country,email,phone,contact_name,contact_role,plan,active}=req.body; const {rows}=await pool.query('UPDATE organizations SET name=$1,razon_social=$2,ruc=$3,address=$4,city=$5,country=$6,email=$7,phone=$8,contact_name=$9,contact_role=$10,plan=$11,active=$12 WHERE id=$13 RETURNING *',[name,razon_social,ruc,address,city,country,email,phone,contact_name,contact_role,plan,active,req.params.id]); rows[0]?res.json(rows[0]):res.status(404).json({error:'No encontrado'}); } catch(e){next(e);} });
router.delete('/:id',async(req,res,next)=>{ try{const{rows}=await pool.query('DELETE FROM organizations WHERE id=$1 RETURNING id',[req.params.id]);rows[0]?res.json({message:'Eliminado'}):res.status(404).json({error:'No encontrado'});}catch(e){next(e);}});

module.exports = router;
