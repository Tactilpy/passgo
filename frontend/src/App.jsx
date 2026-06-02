import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  white:"#FFFFFF", bg:"#F5F7FC", bgAlt:"#EDF0F8",
  border:"#E2E8F4", borderMid:"#C8D3E8",
  primary:"#5B6EF5", primaryDk:"#4355D4", primaryLt:"#EEF0FF",
  primaryGlow:"rgba(91,110,245,0.18)",
  teal:"#1FD4A4", tealDk:"#17A882", tealLt:"#E4FBF4",
  coral:"#FF6060", coralLt:"#FFF0F0",
  amber:"#F5A623", amberLt:"#FFF8EC",
  purple:"#9B59F5", purpleLt:"#F3EEFF",
  text:"#18223A", textMid:"#465270", textMuted:"#8896B3", textLight:"#B8C4D8",
  grad:"linear-gradient(135deg,#5B6EF5 0%,#8B5CF6 100%)",
  gradHero:"linear-gradient(150deg,#F0F3FF 0%,#F5F0FF 55%,#F0FBF8 100%)",
  gradDark:"linear-gradient(135deg,#18223A 0%,#2D3B6E 100%)",
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CHECK_METHODS = [
  {id:"facial",icon:"👁",label:"Reconocimiento Facial",short:"Facial",color:C.primary,bg:C.primaryLt,desc:"Selfie al registrarse. Cámara te reconoce en milisegundos."},
  {id:"qr",    icon:"▦", label:"Código QR",            short:"QR",    color:C.tealDk, bg:C.tealLt,  desc:"QR único por email. Mostralo en el kiosco al entrar y salir."},
  {id:"rfid",  icon:"◈", label:"Tarjeta RFID",         short:"RFID",  color:C.amber,  bg:C.amberLt, desc:"Tarjeta entregada en el evento. Registro instantáneo."},
  {id:"huella",icon:"☉", label:"Huella Dactilar",      short:"Huella",color:C.purple, bg:C.purpleLt,desc:"Lector biométrico ZKTeco. Máxima seguridad."},
];

const ROLES = ["SuperAdmin","Admin","Organizador","Disertante","Operador"];
const SPECIALTIES = ["Cardiología","Neurología","Oncología","Pediatría","Cirugía","Lanzamiento de Producto","Marketing","Tecnología en Salud","Farmacología","Odontología","Nutrición","Capacitación Corporativa","Congreso","Otro"];
const EVENT_TYPES = ["Congreso Médico","Seminario Clínico","Seminario","Lanzamiento Producto","Jornada Médica","Capacitación Corporativa","Workshop","Otro"];

const ALL_PERMISSIONS = [
  {id:"create_events",    label:"Puede Crear Eventos"},
  {id:"edit_events",      label:"Puede Editar Eventos"},
  {id:"delete_events",    label:"Puede Eliminar Eventos"},
  {id:"create_participants",label:"Puede Crear Participantes"},
  {id:"emit_certs",       label:"Puede Emitir Certificados"},
  {id:"use_qr",           label:"Puede Utilizar QR"},
  {id:"use_facial",       label:"Puede Utilizar Facial"},
  {id:"use_rfid",         label:"Puede Utilizar RFID"},
  {id:"use_huella",       label:"Puede Utilizar Huella"},
  {id:"use_kiosco",       label:"Puede Utilizar Kioscos"},
  {id:"view_reports",     label:"Puede Acceder a Reportes"},
];

const PLAN_PERMISSIONS = {
  basico:     ["create_events","create_participants","use_qr","emit_certs"],
  pro:        ["create_events","edit_events","create_participants","emit_certs","use_qr","use_facial","use_rfid","use_kiosco","view_reports"],
  enterprise: ALL_PERMISSIONS.map(p=>p.id),
};

const CERT_THEMES = [
  {id:"classic", label:"Clásico",  bg:"#FFFDF5",border:"#C9A84C",accent:"#8B6914",grad:"linear-gradient(135deg,#FFF8DC,#FFFDF5)"},
  {id:"modern",  label:"Moderno",  bg:"#F0F3FF",border:"#5B6EF5",accent:"#3A44B0",grad:"linear-gradient(135deg,#EEF0FF,#F5F0FF)"},
  {id:"elegant", label:"Elegante", bg:"#F5F5F5",border:"#2C2C2C",accent:"#1A1A1A",grad:"linear-gradient(135deg,#F5F5F5,#EBEBEB)"},
  {id:"medical", label:"Médico",   bg:"#F0FBF8",border:"#1FD4A4",accent:"#17A882",grad:"linear-gradient(135deg,#E4FBF4,#F0FBF8)"},
];

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INIT_EVENTS = [
  {id:1,slug:"cardioplus-launch",title:"Lanzamiento: Sistema CardioPlus",type:"Lanzamiento Producto",speaker:"Ing. Ana Ferreyra",  speakerId:2,orgId:1,date:"2026-06-08",time:"11:00",endTime:"18:00",location:"Centro de Convenciones, CABA",status:"active",  attendees:41,capacity:45,color:C.amber,  methods:["facial","qr","rfid","huella"],surveyTiming:"checkout",confirmMode:"auto",   paymentType:"paid",  price:5000},
  {id:2,slug:"cardiologia-2026",  title:"Avances en Cardiología Intervencionista",type:"Congreso Médico",speaker:"Dr. Martín Rodríguez",speakerId:3,orgId:1,date:"2026-06-15",time:"09:00",endTime:"17:00",location:"Auditorio Central, CABA",status:"upcoming",attendees:48,capacity:60,color:C.primary,methods:["facial","qr"],          surveyTiming:"checkout",confirmMode:"confirm",paymentType:"free",  price:0},
  {id:3,slug:"oncologia-2026",    title:"Nuevos Fármacos en Oncología 2026",type:"Seminario Clínico",speaker:"Dra. Laura Vidal",   speakerId:4,orgId:2,date:"2026-06-22",time:"14:00",endTime:"20:00",location:"Hotel Sheraton, CABA",status:"upcoming",attendees:32,capacity:50,color:C.purple, methods:["facial","qr","rfid"],   surveyTiming:"email",   confirmMode:"auto",   paymentType:"paid",  price:3500},
  {id:4,slug:"pediatria-2026",    title:"Pediatría Preventiva 2026",type:"Jornada Médica",          speaker:"Dra. Sofía Méndez",   speakerId:5,orgId:2,date:"2026-05-20",time:"09:00",endTime:"16:00",location:"Hospital Garrahan",status:"finished",attendees:67,capacity:70,color:C.coral,  methods:["facial","qr"],          surveyTiming:"checkin", confirmMode:"confirm",paymentType:"free",  price:0},
];

const INIT_PARTICIPANTS = [
  {id:1,nombre:"Federico",  apellido:"Álvarez", dni:"28301234",nacimiento:"1985-03-15",email:"f.alvarez@gmail.com",  tel:"+54 11 5550-0001",org:"Hospital Garrahan",   role:"Cardiólogo",        facial:true, qr:true, rfid:true, huella:false,events:[1,2,4],payStatus:"paid",   payAmount:5000,payDate:"2026-05-10",payMethod:"Transferencia"},
  {id:2,nombre:"Valeria",   apellido:"Torres",  dni:"33450567",nacimiento:"1992-07-22",email:"v.torres@hospital.com",tel:"+54 11 5550-0002",org:"Clínica Santa Fe",      role:"Residente Medicina",facial:true, qr:false,rfid:false,huella:false,events:[1],   payStatus:"pending",payAmount:5000,payDate:null,         payMethod:null},
  {id:3,nombre:"Marcelo",   apellido:"Díaz",    dni:"25678901",nacimiento:"1980-11-08",email:"m.diaz@clinica.ar",    tel:"+54 11 5550-0003",org:"Clínica Santa Fe",      role:"Médico Clínico",    facial:true, qr:true, rfid:true, huella:true, events:[1,3],  payStatus:"paid",   payAmount:5000,payDate:"2026-05-12",payMethod:"Tarjeta"},
  {id:4,nombre:"Patricia",  apellido:"Ruiz",    dni:"30123456",nacimiento:"1988-04-30",email:"p.ruiz@medicos.org",   tel:"+54 11 5550-0004",org:"Instituto Médico",      role:"Especialista",      facial:false,qr:true, rfid:true, huella:false,events:[1,4],  payStatus:"partial",payAmount:2500,payDate:"2026-05-15",payMethod:"Efectivo"},
  {id:5,nombre:"Hernán",    apellido:"Molina",  dni:"27890123",nacimiento:"1983-09-12",email:"h.molina@uba.edu.ar",  tel:"+54 11 5550-0005",org:"UBA Medicina",          role:"Investigador",      facial:true, qr:false,rfid:false,huella:true, events:[1,2],  payStatus:"free",   payAmount:0,   payDate:null,         payMethod:null},
  {id:6,nombre:"Cecilia",   apellido:"Paredes", dni:"35234567",nacimiento:"1995-01-25",email:"c.paredes@gmail.com",  tel:"+54 11 5550-0006",org:"Hospital Garrahan",     role:"Médica Generalista",facial:true, qr:true, rfid:true, huella:false,events:[1],   payStatus:"paid",   payAmount:5000,payDate:"2026-05-18",payMethod:"Transferencia"},
];

const INIT_CHECKINS = [
  {id:1,participantId:1,eventId:1,checkIn:"09:03",checkOut:"13:45",method:"facial", status:"out",surveyDone:true},
  {id:2,participantId:2,eventId:1,checkIn:"09:15",checkOut:null,   method:"qr",    status:"in", surveyDone:false},
  {id:3,participantId:3,eventId:1,checkIn:"09:01",checkOut:null,   method:"rfid",  status:"in", surveyDone:false},
  {id:4,participantId:4,eventId:1,checkIn:"09:30",checkOut:"11:20",method:"facial", status:"out",surveyDone:true},
  {id:5,participantId:5,eventId:1,checkIn:"10:05",checkOut:null,   method:"huella",status:"in", surveyDone:false},
  {id:6,participantId:6,eventId:1,checkIn:"09:00",checkOut:null,   method:"qr",    status:"in", surveyDone:false},
];

const INIT_USERS = [
  {id:1,nombre:"Admin",    apellido:"General",    email:"admin@passgo.app",         role:"Admin",      active:true, plan:"enterprise",orgId:1,permissions:ALL_PERMISSIONS.map(p=>p.id),  tempPassword:false},
  {id:2,nombre:"Ana",      apellido:"Ferreyra",   email:"a.ferreyra@passgo.app",    role:"Disertante", active:true, plan:"pro",       orgId:1,permissions:PLAN_PERMISSIONS.pro,            tempPassword:false},
  {id:3,nombre:"Martín",   apellido:"Rodríguez",  email:"m.rodriguez@hospital.com", role:"Disertante", active:true, plan:"pro",       orgId:1,permissions:PLAN_PERMISSIONS.pro,            tempPassword:true},
  {id:4,nombre:"Laura",    apellido:"Vidal",      email:"l.vidal@oncologia.ar",     role:"Disertante", active:true, plan:"basico",    orgId:2,permissions:PLAN_PERMISSIONS.basico,         tempPassword:false},
  {id:5,nombre:"Sofía",    apellido:"Méndez",     email:"s.mendez@pediatria.com",   role:"Disertante", active:false,plan:"basico",    orgId:2,permissions:PLAN_PERMISSIONS.basico,         tempPassword:false},
];

const INIT_ORGS = [
  {id:1,name:"Hospital Garrahan",   razonSocial:"Hospital de Pediatría Prof. Dr. Juan P. Garrahan",ruc:"30-50003663-9",
   address:"Combate de los Pozos 1881",city:"Buenos Aires",country:"Argentina",lat:-34.6254,lng:-58.4098,
   email:"contacto@garrahan.gov.ar",email2:"admin@garrahan.gov.ar",phone:"+54 11 4308-4300",phone2:"",
   contactName:"Dra. María López",contactRole:"Directora Médica",plan:"enterprise",events:4,users:3,active:true,logo:null},
  {id:2,name:"Clínica Santa Fe",    razonSocial:"Clínica Santa Fe S.A.",ruc:"30-61234567-1",
   address:"Av. Santa Fe 3000",city:"Buenos Aires",country:"Argentina",lat:-34.5884,lng:-58.3974,
   email:"info@clinicasantafe.com.ar",email2:"",phone:"+54 11 5354-0000",phone2:"+54 11 5354-0001",
   contactName:"Lic. Carlos Ruiz",contactRole:"Gerente Administrativo",plan:"pro",events:12,users:2,active:true,logo:null},
  {id:3,name:"Laboratorio BioTech", razonSocial:"BioTech Diagnósticos S.R.L.",ruc:"30-71234567-3",
   address:"Paseo Colón 850",city:"Buenos Aires",country:"Argentina",lat:-34.6197,lng:-58.3693,
   email:"labs@biotech.com.ar",email2:"",phone:"+54 11 4344-2000",phone2:"",
   contactName:"Ing. Pablo Vargas",contactRole:"Director Técnico",plan:"basico",events:4,users:1,active:true,logo:null},
];

const INIT_SPEAKERS = [
  {id:1,nombre:"Ana",    apellido:"Ferreyra",  dni:"24567890",email:"a.ferreyra@passgo.app",  tel:"+54 11 5550-0010",address:"Av. Libertador 1200",cargo:"Ingeniera en Sistemas",empresa:"Hospital Garrahan",orgId:1,events:[1,2],active:true,foto:null,firma:null},
  {id:2,nombre:"Martín", apellido:"Rodríguez", dni:"22345678",email:"m.rodriguez@hospital.com",tel:"+54 11 5550-0011",address:"Corrientes 1500",    cargo:"Cardiólogo Jefe",      empresa:"Clínica Santa Fe",  orgId:2,events:[2],  active:true,foto:null,firma:null},
  {id:3,nombre:"Laura",  apellido:"Vidal",     dni:"26789012",email:"l.vidal@oncologia.ar",    tel:"+54 11 5550-0012",address:"Pueyrredón 800",      cargo:"Oncóloga Senior",      empresa:"Hospital Garrahan",orgId:1,events:[3],  active:true,foto:null,firma:null},
  {id:4,nombre:"Sofía",  apellido:"Méndez",    dni:"29012345",email:"s.mendez@pediatria.com",  tel:"+54 11 5550-0013",address:"Belgrano 500",        cargo:"Pediatra",             empresa:"Clínica Santa Fe",  orgId:2,events:[4],  active:false,foto:null,firma:null},
];
const INIT_COMM = {
  smtp:{host:"smtp.gmail.com",port:587,user:"",pass:"",from:"noreply@passgo.app",active:false},
  whatsapp:{provider:"evolution",url:"",apiKey:"",phoneFrom:"",active:false},
};
const INIT_AUTOMATIONS = [
  {id:1,trigger:"event_finished",action:"send_survey",  channel:"email",    enabled:true, delay:0,   label:"Enviar encuesta al finalizar evento"},
  {id:2,trigger:"cert_approved", action:"send_cert",    channel:"email",    enabled:true, delay:0,   label:"Enviar certificado al ser aprobado"},
  {id:3,trigger:"event_start",   action:"reminder",     channel:"whatsapp", enabled:false,delay:-60, label:"Recordatorio 1h antes (WhatsApp)"},
  {id:4,trigger:"event_start",   action:"reminder",     channel:"email",    enabled:true, delay:-1440,label:"Recordatorio 24h antes (Email)"},
];

const DEFAULT_SURVEY = [
  {id:1,type:"stars",   question:"¿Cómo calificás el evento en general?"},
  {id:2,type:"options", question:"¿El contenido fue relevante para tu práctica?", options:["Muy relevante","Relevante","Poco relevante","Nada relevante"]},
  {id:3,type:"options", question:"¿Cómo calificás al disertante?",               options:["Excelente","Muy bueno","Bueno","Regular"]},
  {id:4,type:"text",    question:"¿Qué mejorarías del evento?"},
  {id:5,type:"options", question:"¿Recomendarías este evento?",                  options:["Sí, definitivamente","Probablemente sí","Probablemente no","No"]},
];

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
// ─── EXPORT UTILITIES ─────────────────────────────────────────────────────────
const exportCSV = (data, filename) => {
  if(!data||!data.length) return;
  const fn = filename || 'export.csv';
  const headers = Object.keys(data[0]);
  const rows = data.map(function(row){
    return headers.map(function(h){
      var val = row[h]==null ? '' : String(row[h]);
      return (val.indexOf(',')>=0||val.indexOf('"')>=0) ? '"'+val.replace(/"/g,'""')+'"' : val;
    }).join(',');
  });
  const csv = [headers.join(',')].concat(rows).join(String.fromCharCode(10));
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fn; a.click();
  URL.revokeObjectURL(url);
};

const exportJSON = (data, filename='export.json') => {
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const printTable = (title, headers, rows) => {
  const html = `<!DOCTYPE html><html><head><title>${title}</title>
  <style>body{font-family:sans-serif;padding:20px}h2{margin-bottom:16px}
  table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}
  th{background:#6366f1;color:#fff}tr:nth-child(even){background:#f9f9f9}
  @media print{button{display:none}}</style></head><body>
  <h2>${title}</h2>
  <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c||'—'}</td>`).join('')}</tr>`).join('')}</tbody>
  </table><br><button onclick="window.print()">🖨 Imprimir / Guardar PDF</button>
  </body></html>`;
  const w = window.open('','_blank');
  w.document.write(html); w.document.close();
};


const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'Outfit',sans-serif;background:${C.bg};color:${C.text};-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.borderMid};border-radius:10px}

    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes scaleIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes scanLine{0%{top:-3px}100%{top:103%}}
    @keyframes bounceIn{0%{opacity:0;transform:scale(.6)}70%{transform:scale(1.07)}100%{opacity:1;transform:scale(1)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes slideInLeft{from{transform:translateX(-100%)}to{transform:translateX(0)}}
    @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

    .fu{animation:fadeUp .38s cubic-bezier(.22,.68,0,1.2) both}
    .fi{animation:fadeIn .28s ease both}
    .si{animation:scaleIn .3s cubic-bezier(.22,.68,0,1.2) both}
    .bi{animation:bounceIn .4s cubic-bezier(.22,.68,0,1.2) both}
    .float-a{animation:float 4s ease-in-out infinite}

    .card{background:${C.white};border:1px solid ${C.border};border-radius:16px;transition:box-shadow .2s,transform .2s,border-color .2s}
    .card-hov:hover{box-shadow:0 4px 18px rgba(91,110,245,.09);border-color:${C.borderMid}}
    .card-lift:hover{transform:translateY(-2px);box-shadow:0 10px 36px rgba(91,110,245,.12);border-color:${C.borderMid}}

    .btn{display:inline-flex;align-items:center;gap:7px;border:none;border-radius:10px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;padding:10px 18px;transition:all .18s;white-space:nowrap;justify-content:center;line-height:1}
    .btn-primary{background:${C.grad};color:#fff;box-shadow:0 3px 12px ${C.primaryGlow}}
    .btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(91,110,245,.32)}
    .btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}
    .btn-white{background:${C.white};color:${C.textMid};border:1.5px solid ${C.border}}
    .btn-white:hover{border-color:${C.primary};color:${C.primary};background:${C.primaryLt}}
    .btn-ghost{background:transparent;color:${C.textMuted};padding:8px 12px}
    .btn-ghost:hover{background:${C.bg};color:${C.text}}
    .btn-teal{background:${C.tealLt};color:${C.tealDk};border:1.5px solid ${C.teal}44}
    .btn-teal:hover{background:#c0f5e4}
    .btn-danger{background:${C.coralLt};color:${C.coral};border:1.5px solid ${C.coral}33}
    .btn-danger:hover{background:#ffd0d0}
    .btn-sm{padding:7px 13px;font-size:12px;border-radius:8px}
    .btn-lg{padding:13px 28px;font-size:15px;border-radius:12px}
    .btn-icon{padding:7px;border-radius:8px;width:34px;height:34px}

    /* FIX: Stable inputs - no re-render focus loss */
    .inp{width:100%;padding:10px 13px;background:${C.bg};border:1.5px solid ${C.border};border-radius:10px;color:${C.text};font-family:'Outfit',sans-serif;font-size:14px;font-weight:500;outline:none;transition:border-color .15s,box-shadow .15s;appearance:none;display:block}
    .inp:focus{border-color:${C.primary};background:${C.white};box-shadow:0 0 0 3px ${C.primaryGlow}}
    .inp::placeholder{color:${C.textLight}}
    .inp-err{border-color:${C.coral}!important;background:#fff5f5!important}
    .lbl{display:block;margin-bottom:6px;font-size:12px;font-weight:700;color:${C.textMid};letter-spacing:.01em}
    select.inp option{background:${C.white}}
    textarea.inp{resize:vertical;min-height:70px;line-height:1.5}

    .tag{display:inline-flex;align-items:center;gap:4px;border-radius:20px;font-size:11px;font-weight:700;padding:3px 9px;white-space:nowrap}
    .tb{background:${C.primaryLt};color:${C.primary}}
    .tg{background:${C.tealLt};color:${C.tealDk}}
    .ta{background:${C.amberLt};color:#b07400}
    .tr{background:${C.coralLt};color:${C.coral}}
    .tp{background:${C.purpleLt};color:${C.purple}}
    .tgr{background:${C.bg};color:${C.textMuted};border:1px solid ${C.border}}

    .nav-item{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:10px;font-size:13px;font-weight:600;color:${C.textMid};cursor:pointer;transition:all .15s;border:none;background:none;width:100%;text-align:left;font-family:'Outfit',sans-serif}
    .nav-item:hover{background:${C.bg};color:${C.text}}
    .nav-item.active{background:${C.primaryLt};color:${C.primary}}

    .trow{display:grid;align-items:center;padding:11px 18px;border-bottom:1px solid ${C.border};transition:background .1s}
    .trow:hover{background:${C.bg}}
    .trow:last-child{border-bottom:none}
    .thead{background:${C.bg}!important}
    .thead:hover{background:${C.bg}!important}

    .overlay{position:fixed;inset:0;background:rgba(18,26,56,.52);backdrop-filter:blur(8px);z-index:2000;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto}
    .modal{background:${C.white};border-radius:20px;width:100%;max-width:520px;box-shadow:0 24px 64px rgba(91,110,245,.2);animation:scaleIn .28s cubic-bezier(.22,.68,0,1.2);margin:auto}

    .sidebar{width:232px;height:100vh;background:${C.white};border-right:1px solid ${C.border};padding:18px 11px;display:flex;flex-direction:column;gap:1px;flex-shrink:0;position:sticky;top:0;overflow-y:auto}

    .prog-track{height:5px;background:${C.bgAlt};border-radius:99px;overflow:hidden}
    .prog-fill{height:100%;border-radius:99px;transition:width .6s ease}

    .dot-live{width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0}
    .pulse{animation:pulse 1.6s ease-in-out infinite}

    .method-sel{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;border:2px solid ${C.border};cursor:pointer;transition:all .15s;background:${C.white}}
    .method-sel:hover{border-color:${C.borderMid}}
    .method-sel.on{border-color:${C.primary};background:${C.primaryLt}}

    .kiosk-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px 14px;border-radius:22px;border:2px solid ${C.border};cursor:pointer;transition:all .2s;background:${C.white};text-align:center;user-select:none}
    .kiosk-btn:hover{transform:translateY(-3px);box-shadow:0 14px 44px rgba(91,110,245,.14)}
    .kiosk-btn:active{transform:scale(.97)}

    .step-dot{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0}

    .perm-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid ${C.border}}
    .perm-row:last-child{border-bottom:none}

    .breadcrumb{display:flex;align-items:center;gap:6px;font-size:12px;color:${C.textMuted};flex-wrap:wrap;margin-bottom:16px}
    .breadcrumb-sep{color:${C.textLight}}
    .breadcrumb-link{cursor:pointer;color:${C.textMuted};font-weight:600}
    .breadcrumb-link:hover{color:${C.primary}}
    .breadcrumb-cur{color:${C.text};font-weight:700}

    .face-box{border-radius:18px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;transition:all .3s}
    .face-corner{position:absolute;width:22px;height:22px;border:2px solid ${C.primary};border-radius:3px}
    .scan-bar{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${C.primary},transparent);animation:scanLine 1.5s linear infinite}

    .survey-opt{padding:10px 14px;border-radius:10px;border:1.5px solid ${C.border};cursor:pointer;transition:all .14s;font-size:13px;font-weight:600;text-align:left;background:${C.white};font-family:'Outfit',sans-serif;width:100%}
    .survey-opt:hover{border-color:${C.primary};background:${C.primaryLt};color:${C.primary}}
    .survey-opt.picked{border-color:${C.primary};background:${C.primaryLt};color:${C.primary}}

    .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);border-radius:14px;padding:13px 22px;box-shadow:0 12px 40px rgba(0,0,0,.18);display:flex;align-items:center;gap:11px;z-index:9999;min-width:240px;animation:toastIn .3s cubic-bezier(.22,.68,0,1.2)}

    /* Confirmation popup */
    .confirm-popup{position:fixed;inset:0;background:rgba(18,26,56,.6);backdrop-filter:blur(10px);z-index:3000;display:flex;align-items:center;justify-content:center;padding:16px}

    /* Payment badges */
    .pay-paid{background:#E4FBF4;color:#17A882;border:1px solid #17A88244}
    .pay-pending{background:${C.coralLt};color:${C.coral};border:1px solid ${C.coral}44}
    .pay-partial{background:${C.amberLt};color:#b07400;border:1px solid ${C.amber}44}
    .pay-free{background:${C.bg};color:${C.textMuted};border:1px solid ${C.border}}

    .page-in{animation:fadeIn .25s ease both}
    .hr{height:1px;background:${C.border};margin:6px 0}
    .avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}

    @media(max-width:860px){
      .sidebar{display:none}.mob-bar{display:flex!important}
      .hide-mob{display:none!important}
      .pricing-grid{grid-template-columns:1fr!important}
      .cert-preview-grid{grid-template-columns:1fr!important}
    }
    .mob-bar{display:none}
    @media(max-width:560px){
      .kiosk-grid{grid-template-columns:1fr 1fr!important}
      .hero-h1{font-size:clamp(28px,8vw,48px)!important}
      .reg-two-col{grid-template-columns:1fr!important}
    }
  `}</style>
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const Logo = ({size=34,dark=false}) => (
  <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
    <div style={{width:size,height:size,background:C.grad,borderRadius:size*.28,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:size*.52,boxShadow:`0 3px 10px ${C.primaryGlow}`}}>P</div>
    <span style={{fontSize:size*.54,fontWeight:900,color:dark?"#fff":C.text,letterSpacing:"-0.04em",lineHeight:1}}>
      Pass<span style={{color:dark?"rgba(255,255,255,.65)":C.primary}}>go</span>
    </span>
  </div>
);

const Av = ({name="?",bg=C.primaryLt,color=C.primary,size=34}) => (
  <div className="avatar" style={{width:size,height:size,background:bg,color,fontSize:size*.35}}>
    {String(name).split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()}
  </div>
);

const STag = ({status}) => {
  const m={active:{l:"En curso",c:"tg"},upcoming:{l:"Próximo",c:"tb"},finished:{l:"Finalizado",c:"tgr"},in:{l:"Presente",c:"tg"},out:{l:"Salió",c:"tr"}};
  const s=m[status]||{l:status,c:"tgr"};
  return <span className={`tag ${s.c}`}><span style={{width:5,height:5,borderRadius:"50%",background:"currentColor",display:"inline-block"}}/>{s.l}</span>;
};

const MTag = ({method}) => {
  const m={facial:{l:"Facial",i:"👁",c:"tp"},qr:{l:"QR",i:"▦",c:"tb"},rfid:{l:"RFID",i:"◈",c:"ta"},huella:{l:"Huella",i:"☉",c:"tg"},manual:{l:"Manual",i:"✎",c:"tgr"}};
  const s=m[method]||{l:method,i:"?",c:"tgr"};
  return <span className={`tag ${s.c}`}>{s.i} {s.l}</span>;
};

const PayBadge = ({status}) => {
  const m={paid:{l:"Pagado ✓",c:"pay-paid"},pending:{l:"Pendiente",c:"pay-pending"},partial:{l:"Parcial",c:"pay-partial"},free:{l:"Gratuito",c:"pay-free"}};
  const s=m[status]||{l:status,c:"pay-free"};
  return <span className={`tag ${s.c}`}>{s.l}</span>;
};

const Stat = ({icon,label,value,accent=C.primary,delay=0,sub}) => (
  <div className="card card-hov fu" style={{padding:20,animationDelay:`${delay}ms`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div>
        <div style={{fontSize:12,color:C.textMuted,marginBottom:7,fontWeight:500}}>{label}</div>
        <div style={{fontSize:30,fontWeight:900,color:C.text,lineHeight:1,letterSpacing:"-0.02em"}}>{value}</div>
        {sub&&<div style={{fontSize:11,color:C.textMuted,marginTop:4}}>{sub}</div>}
      </div>
      <div style={{width:40,height:40,borderRadius:12,background:`${accent}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{icon}</div>
    </div>
  </div>
);

// Toast notification
const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg,type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3200);
  },[]);
  const ToastEl = toast ? (
    <div className="toast" style={{background:toast.type==="success"?C.teal:toast.type==="error"?C.coral:C.primary,color:"#fff"}}>
      <span style={{fontSize:20}}>{toast.type==="success"?"✅":toast.type==="error"?"❌":"ℹ️"}</span>
      <span style={{fontSize:14,fontWeight:700}}>{toast.msg}</span>
    </div>
  ) : null;
  return {show, ToastEl};
};

// Breadcrumbs
const Breadcrumbs = ({items, onNav}) => (
  <div className="breadcrumb">
    {items.map((item,i) => (
      <span key={i} style={{display:"flex",alignItems:"center",gap:6}}>
        {i>0&&<span className="breadcrumb-sep">›</span>}
        {i<items.length-1
          ? <span className="breadcrumb-link" onClick={()=>onNav&&onNav(item.view)}>{item.label}</span>
          : <span className="breadcrumb-cur">{item.label}</span>
        }
      </span>
    ))}
  </div>
);

// Stable form field (FIX: prevents focus loss on re-render)
const Field = ({label, id, type="text", placeholder, value, onChange, error, half, options, rows}) => {
  const handleChange = useCallback(e=>onChange(id,e.target.value),[id,onChange]);
  return (
    <div style={{flex:half?"1 1 calc(50% - 5px)":"1 1 100%"}}>
      {label&&<label className="lbl">{label}</label>}
      {type==="select"
        ?<select className={`inp${error?" inp-err":""}`} value={value} onChange={handleChange}>
          <option value="">Seleccionar...</option>
          {(options||[]).map(o=><option key={o} value={o}>{o}</option>)}
        </select>
        :type==="textarea"
        ?<textarea className={`inp${error?" inp-err":""}`} placeholder={placeholder} value={value} onChange={handleChange} rows={rows||3}/>
        :<input className={`inp${error?" inp-err":""}`} type={type} placeholder={placeholder} value={value||""} onChange={handleChange}/>
      }
      {error&&<div style={{fontSize:11,color:C.coral,marginTop:3,fontWeight:600}}>⚠ {error}</div>}
    </div>
  );
};

// ─── FACE CAPTURE ─────────────────────────────────────────────────────────────
const FaceCapture = ({onCapture, size=170, liveRecognition=false}) => {
  const [st, setSt]     = useState("idle");
  const [cnt, setCnt]   = useState(3);
  const [camErr, setCamErr] = useState(null);
  const videoRef  = useRef();
  const streamRef = useRef();
  const timerRef  = useRef();

  const stopCamera = useCallback(()=>{
    if(streamRef.current){
      streamRef.current.getTracks().forEach(t=>t.stop());
      streamRef.current=null;
    }
  },[]);

  const startCamera = useCallback(async()=>{
    setCamErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:640,height:480}});
      streamRef.current = stream;
      if(videoRef.current){ videoRef.current.srcObject=stream; videoRef.current.play(); }
      setSt("camera");
    } catch(e){
      setCamErr("No se pudo acceder a la cámara. Verificá los permisos del navegador.");
      setSt("idle");
    }
  },[]);

  const capture = useCallback(()=>{
    setSt("countdown"); setCnt(3);
    let c=3;
    timerRef.current=setInterval(()=>{
      c--; setCnt(c);
      if(c===0){
        clearInterval(timerRef.current);
        setSt("scanning");
        // In real: canvas.getContext('2d').drawImage(video,...) then send to face recognition API
        setTimeout(()=>{
          setSt("done");
          stopCamera();
          onCapture&&onCapture(true);
        },2000);
      }
    },1000);
  },[stopCamera,onCapture]);

  const reset = useCallback(()=>{
    clearInterval(timerRef.current);
    stopCamera();
    setSt("idle");
    onCapture&&onCapture(false);
  },[stopCamera,onCapture]);

  useEffect(()=>()=>{ clearInterval(timerRef.current); stopCamera(); },[stopCamera]);

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
      {camErr&&<div style={{background:C.coralLt,border:`1px solid ${C.coral}44`,borderRadius:10,padding:10,fontSize:12,color:C.coral,maxWidth:size}}>{camErr}</div>}
      <div className="face-box" style={{
        width:size,height:size,
        background:st==="done"?C.tealLt:st==="camera"||st==="scanning"||st==="countdown"?"#000":C.bg,
        border:`2px ${st==="idle"?"dashed":"solid"} ${st==="done"?C.teal:st==="scanning"||st==="camera"||st==="countdown"?C.primary:C.border}`,
        overflow:"hidden"
      }}>
        {(st==="camera"||st==="scanning"||st==="countdown")&&(
          <video ref={videoRef} autoPlay playsInline muted
            style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
        )}
        {st==="idle"&&<><span style={{fontSize:38}}>📷</span><span style={{fontSize:11,color:C.textMuted,fontWeight:600}}>Cámara apagada</span></>}
        {st==="countdown"&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)"}}>
            <span style={{fontSize:72,fontWeight:900,color:"#fff",textShadow:"0 2px 10px rgba(0,0,0,.5)"}}>{cnt}</span>
          </div>
        )}
        {st==="scanning"&&<>
          <div className="scan-bar"/>
          <div className="face-corner" style={{top:8,left:8,borderRight:"none",borderBottom:"none"}}/>
          <div className="face-corner" style={{top:8,right:8,borderLeft:"none",borderBottom:"none"}}/>
          <div className="face-corner" style={{bottom:8,left:8,borderRight:"none",borderTop:"none"}}/>
          <div className="face-corner" style={{bottom:8,right:8,borderLeft:"none",borderTop:"none"}}/>
        </>}
        {st==="done"&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:C.tealLt,gap:8}}>
          <span style={{fontSize:38,animation:"bounceIn .4s"}}>✅</span>
          <span style={{fontSize:12,color:C.tealDk,fontWeight:700}}>Rostro registrado</span>
        </div> }
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
        {st==="idle"&&<button className="btn btn-primary btn-sm" onClick={startCamera}>📷 Activar cámara</button>}
        {st==="camera"&&<button className="btn btn-primary btn-sm" onClick={capture}>📸 Capturar</button>}
        {st==="done"&&<button className="btn btn-teal btn-sm" onClick={reset}>↺ Repetir</button>}
        {(st==="camera"||st==="scanning"||st==="countdown")&&st!=="done"&&(
          <button className="btn btn-white btn-sm" onClick={reset}>✕ Cancelar</button>
        )}
        <button className="btn btn-white btn-sm">📁 Subir foto</button>
      </div>
      {liveRecognition&&st==="camera"&&(
        <div style={{fontSize:11,color:C.primary,fontWeight:600,textAlign:"center"}}>
          🔍 Modo reconocimiento activo — mirá la cámara
        </div>
      )}
    </div>
  );
};

// QR generator (canvas-based, no external lib needed for preview)
const QRDisplay = ({value="PASSGO-QR", size=130}) => {
  const canvasRef = useRef();
  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,size,size);
    // Simple visual QR placeholder (real: use qrcode.js)
    const cell = Math.floor(size/12);
    const hash = value.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
    for(let r=0;r<12;r++){
      for(let c=0;c<12;c++){
        const fill = (((r*13+c*7+hash)%3)===0)||
          (r<3&&c<3)||(r<3&&c>8)||(r>8&&c<3); // finder patterns
        ctx.fillStyle = fill?"#5B6EF5":"#fff";
        ctx.fillRect(c*cell,r*cell,cell-1,cell-1);
      }
    }
    // Border
    ctx.strokeStyle=C.primary; ctx.lineWidth=2;
    [[2,2,18,18],[2,2,18,0],[2,2,0,18]].forEach(()=>{});
  },[value,size]);
  return (
    <div style={{padding:8,background:"#fff",borderRadius:10,border:`1px solid ${C.border}`,display:"inline-block"}}>
      <canvas ref={canvasRef} width={size} height={size} style={{display:"block",borderRadius:6}}/>
    </div>
  );
};

// Access confirmation popup
const AccessConfirmPopup = ({participant, event, method, onAccept, onReject, mode="entry"}) => {
  const m = CHECK_METHODS.find(x=>x.id===method)||CHECK_METHODS[0];
  const isEntry = mode==="entry";
  return (
  <div className="confirm-popup" onClick={onReject}>
    <div className="card si" style={{maxWidth:420,padding:0,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
      {/* Header */}
      <div style={{background:isEntry?C.grad:"linear-gradient(135deg,#FF6060,#ff8c8c)",padding:"16px 24px",textAlign:"center"}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,.8)",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>
          {isEntry?"✅ Confirmación de ingreso":"👋 Confirmación de salida"}
        </div>
        <div style={{fontSize:15,color:"#fff",fontWeight:800}}>{event?.title}</div>
      </div>
      {/* Participant info */}
      <div style={{padding:"22px 28px"}}>
        <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:20}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:C.primaryLt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0,border:`3px solid ${C.primary}33`}}>
            {participant?.facial?"📷":"👤"}
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:900,letterSpacing:"-0.01em",marginBottom:2}}>
              {participant?.nombre} {participant?.apellido}
            </div>
            <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>{participant?.role||"Participante"}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <span className="tag tgr" style={{fontSize:10}}>DNI: {participant?.dni||"—"}</span>
              <span style={{display:"inline-flex",alignItems:"center",gap:3,borderRadius:20,fontSize:10,fontWeight:700,padding:"3px 9px",background:m.bg,color:m.color}}>
                {m.icon} {m.short}
              </span>
            </div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
          <div style={{padding:"10px 14px",borderRadius:10,background:C.bg}}>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:2}}>Organización</div>
            <div style={{fontSize:12,fontWeight:700}}>{participant?.org||"—"}</div>
          </div>
          <div style={{padding:"10px 14px",borderRadius:10,background:C.bg}}>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:2}}>Email</div>
            <div style={{fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{participant?.email||"—"}</div>
          </div>
          <div style={{padding:"10px 14px",borderRadius:10,background:C.bg}}>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:2}}>Evento</div>
            <div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{event?.title||"—"}</div>
          </div>
          <div style={{padding:"10px 14px",borderRadius:10,background:C.bg}}>
            <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:2}}>Hora</div>
            <div style={{fontSize:12,fontWeight:700}}>{new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-white" style={{flex:1}} onClick={onReject}>✕ Cancelar</button>
          <button className="btn btn-primary" style={{flex:2}} onClick={onAccept}>
            ✓ {isEntry?"Confirmar ingreso":"Confirmar salida"}
          </button>
        </div>
      </div>
    </div>
  </div>
  );
}
// ─── SURVEY ───────────────────────────────────────────────────────────────────
const SurveyScreen = ({event, onDone}) => {
  const [answers,setAnswers]=useState({});
  const [cur,setCur]=useState(0);
  const [done,setDone]=useState(false);
  const qs=DEFAULT_SURVEY;
  const q=qs[cur];
  const answer=val=>{
    const na={...answers,[q.id]:val};
    setAnswers(na);
    if(cur<qs.length-1) setTimeout(()=>setCur(c=>c+1),300);
    else setTimeout(()=>setDone(true),300);
  };
  if(done) return (
    <div style={{minHeight:"100vh",background:C.gradHero,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="card si" style={{maxWidth:400,padding:36,textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:12,animation:"bounceIn .4s"}}>🙏</div>
        <div style={{fontSize:22,fontWeight:900,color:C.tealDk,marginBottom:8}}>¡Gracias por tu opinión!</div>
        <p style={{fontSize:14,color:C.textMuted,marginBottom:24,lineHeight:1.6}}>Tu feedback nos ayuda a mejorar cada evento.</p>
        <button className="btn btn-primary" style={{width:"100%"}} onClick={onDone}>Cerrar</button>
      </div>
    </div>
  );
  return (
    <div style={{minHeight:"100vh",background:C.gradHero,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div className="card si" style={{maxWidth:440,width:"100%",padding:32}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <Logo size={24}/>
          <span style={{fontSize:12,color:C.textMuted,fontWeight:600}}>{cur+1}/{qs.length}</span>
        </div>
        <div className="prog-track" style={{marginBottom:22}}>
          <div className="prog-fill" style={{width:`${(cur/qs.length)*100}%`,background:C.grad}}/>
        </div>
        {event&&<div style={{fontSize:10,color:C.textMuted,marginBottom:7,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em"}}>{event.title}</div>}
        <div style={{fontSize:15,fontWeight:800,marginBottom:18,lineHeight:1.4}} className="fi" key={q.id}>{q.question}</div>
        {q.type==="stars"&&(
          <div className="fi" style={{display:"flex",gap:6,justifyContent:"center",margin:"8px 0 4px"}} key={`s${q.id}`}>
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>answer(n)} style={{fontSize:30,cursor:"pointer",transition:"transform .1s",border:"none",background:"transparent",filter:n<=(answers[q.id]||0)?"none":"grayscale(1)"}}
                onMouseEnter={e=>e.target.style.transform="scale(1.2)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}>⭐</button>
            ))}
          </div>
        )}
        {q.type==="options"&&(
          <div className="fi" style={{display:"flex",flexDirection:"column",gap:8}} key={`o${q.id}`}>
            {q.options.map(opt=>(
              <button key={opt} className={`survey-opt${answers[q.id]===opt?" picked":""}`} onClick={()=>answer(opt)}>{opt}</button>
            ))}
          </div>
        )}
        {q.type==="text"&&(
          <div className="fi" key={`t${q.id}`}>
            <textarea className="inp" placeholder="Escribí tu respuesta..." rows={3}
              value={answers[q.id]||""} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}/>
            <button className="btn btn-primary" style={{width:"100%",marginTop:10}} onClick={()=>answer(answers[q.id]||"")}>
              {cur===qs.length-1?"Finalizar →":"Siguiente →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── KIOSK SCREEN ─────────────────────────────────────────────────────────────
const KioskScreen = ({event, mode="entry", onExit, participants=INIT_PARTICIPANTS, checkins:extCheckins, setCheckins:setExtCheckins}) => {
  const [activeMode, setActiveMode] = useState(mode);
  const [scanning,   setScanning]   = useState(null);
  const [cameraActive,setCameraActive]=useState(false);
  const [showConfirm,setShowConfirm]=useState(null); // {participant, method}
  const [result,     setResult]     = useState(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [now,        setNow]        = useState(new Date());
  const [localCheckins, setLocalCheckins] = useState(INIT_CHECKINS);
  const checkins = extCheckins || localCheckins;
  const setCheckins = extCheckins ? setExtCheckins : setLocalCheckins;
  const videoRef = useRef();
  const streamRef = useRef();

  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(t); },[]);

  const stopCam=useCallback(()=>{
    if(streamRef.current){ streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null; }
    setCameraActive(false);
  },[]);

  const startFacialScan=useCallback(async()=>{
    setScanning("facial");
    try {
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"}});
      streamRef.current=stream;
      if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play();}
      setCameraActive(true);
      // Simulate face recognition after 3s
      setTimeout(()=>{
        stopCam();
        const p=participants[Math.floor(Math.random()*participants.length)];
        setScanning(null);
        if(event.confirmMode==="confirm") setShowConfirm({participant:p,method:"facial"});
        else handleAccess(p,"facial");
      },3000);
    } catch(e){
      setScanning(null);
      alert("No se pudo acceder a la cámara. Verificá los permisos.");
    }
  },[participants,event,stopCam]);

  const handleMethodClick=useCallback((m)=>{
    if(scanning||result) return;
    if(m.id==="facial"){ startFacialScan(); return; }
    setScanning(m.id);
    setTimeout(()=>{
      const p=participants[Math.floor(Math.random()*participants.length)];
      setScanning(null);
      if(event.confirmMode==="confirm") setShowConfirm({participant:p,method:m.id});
      else handleAccess(p,m.id);
    },2200);
  },[scanning,result,participants,event,startFacialScan]);

  const handleAccess=useCallback((participant,method)=>{
    const evId=event.id;
    const existing=checkins.find(c=>c.participantId===participant.id&&c.eventId===evId);
    const timeStr=now.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
    // Anti-duplicate validation
    if(activeMode==="entry"&&existing?.status==="in"){
      setResult({name:`${participant.nombre} ${participant.apellido}`,action:"entry",method,time:timeStr,duplicate:true});
      setTimeout(()=>setResult(null),3500);
      return;
    }
    if(activeMode==="exit"&&(existing?.status==="out"||!existing)){
      setResult({name:`${participant.nombre} ${participant.apellido}`,action:"exit",method,time:timeStr,duplicate:!existing?"noentry":true});
      setTimeout(()=>setResult(null),3500);
      return;
    }
    setShowConfirm(null);
    // Update checkins state (shared with AppShell)
    setCheckins(prev => {
      if(activeMode==="entry"){
        if(existing){
          return prev.map(c=>c.id===existing.id?{...c,status:"in",checkIn:timeStr}:c);
        }
        return [...prev, {id:Date.now(),participantId:participant.id,eventId:evId,checkIn:timeStr,checkOut:null,method,status:"in",surveyDone:false}];
      } else {
        return prev.map(c=>c.participantId===participant.id&&c.eventId===evId?{...c,status:"out",checkOut:timeStr}:c);
      }
    });
    setResult({name:`${participant.nombre} ${participant.apellido}`,action:activeMode,method,time:timeStr,duplicate:false});
    if(activeMode==="exit"&&event.surveyTiming==="checkout"){
      setTimeout(()=>{ setResult(null); setShowSurvey(true); },3500);
    } else {
      setTimeout(()=>setResult(null),3500);
    }
  },[activeMode,event,checkins,setCheckins,now]);

  useEffect(()=>()=>stopCam(),[stopCam]);

  const ev=event||INIT_EVENTS[0];
  const actM=CHECK_METHODS.filter(m=>ev.methods.includes(m.id));
  const isEntry=activeMode==="entry";
  const cols=actM.length<=2?`repeat(${actM.length},1fr)`:"repeat(2,1fr)";

  if(showSurvey) return <SurveyScreen event={ev} onDone={()=>setShowSurvey(false)}/>;

  return (
    <div style={{minHeight:"100vh",background:isEntry?C.gradHero:"linear-gradient(150deg,#FFF5F5 0%,#FFF0F5 50%,#FFF8F0 100%)",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:`radial-gradient(circle,${isEntry?C.primaryLt:C.coralLt},transparent)`,top:-120,right:-70,pointerEvents:"none"}}/>

      {/* Top bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 22px",background:"rgba(255,255,255,.78)",backdropFilter:"blur(14px)",borderBottom:`1px solid ${C.border}`,zIndex:10,position:"relative"}}>
        <Logo size={28}/>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:1}}>Evento activo</div>
          <div style={{fontSize:13,fontWeight:800,maxWidth:280}}>{ev.title}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:20,fontWeight:900,color:isEntry?C.primary:C.coral,letterSpacing:"-0.02em"}}>{now.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}</div>
          <div style={{fontSize:10,color:C.textMuted}}>{now.toLocaleDateString("es-AR",{weekday:"short",day:"numeric",month:"short"})}</div>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{display:"flex",justifyContent:"center",gap:8,padding:"12px 0 0",zIndex:5,position:"relative"}}>
        {[["entry","🟢 ENTRADA"],["exit","🔴 SALIDA"]].map(([m,l])=>(
          <button key={m} onClick={()=>{setActiveMode(m);stopCam();setScanning(null);}} style={{
            padding:"8px 22px",borderRadius:11,border:`2px solid ${activeMode===m?(m==="entry"?C.teal:C.coral):C.border}`,
            background:activeMode===m?(m==="entry"?C.tealLt:C.coralLt):C.white,
            color:activeMode===m?(m==="entry"?C.tealDk:C.coral):C.textMuted,
            fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:13,cursor:"pointer",transition:"all .18s"
          }}>{l}</button>
        ))}
      </div>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"18px",position:"relative",zIndex:1}}>
        {/* Camera preview when facial active */}
        {cameraActive&&(
          <div style={{marginBottom:16,borderRadius:16,overflow:"hidden",border:`3px solid ${C.primary}`,boxShadow:`0 0 0 4px ${C.primaryGlow}`}}>
            <video ref={videoRef} autoPlay playsInline muted style={{width:220,height:165,objectFit:"cover",display:"block"}}/>
            <div style={{background:C.primaryLt,padding:"6px 12px",textAlign:"center",fontSize:11,color:C.primary,fontWeight:700}}>
              🔍 Reconociendo rostro...
            </div>
          </div>
        )}

        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginBottom:6}}>
            <span className="dot-live pulse" style={{background:isEntry?C.teal:C.coral}}/>
            <span style={{fontSize:11,color:isEntry?C.tealDk:C.coral,fontWeight:800,textTransform:"uppercase",letterSpacing:".1em"}}>
              {isEntry?"Kiosco de entrada":"Kiosco de salida"}
            </span>
          </div>
          <div style={{fontSize:"clamp(17px,3vw,26px)",fontWeight:900,letterSpacing:"-0.02em",marginBottom:4}}>
            {isEntry?"Registrá tu ingreso":"Registrá tu salida"}
          </div>
          <div style={{fontSize:13,color:C.textMuted}}>Elegí tu método de acceso</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:cols,gap:14,width:"100%",maxWidth:560}} className="kiosk-grid">
          {actM.map(m=>(
            <div key={m.id} className="kiosk-btn" onClick={()=>handleMethodClick(m)}
              style={{borderColor:scanning===m.id?m.color:C.border,background:scanning===m.id?m.bg:C.white,minHeight:150}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:scanning===m.id?m.color:m.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,transition:"all .22s"}}>
                {scanning===m.id?<div style={{width:24,height:24,border:"2.5px solid rgba(255,255,255,.35)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>:m.icon}
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:scanning===m.id?m.color:C.text}}>{m.short}</div>
                {scanning===m.id&&<div style={{fontSize:11,color:m.color,marginTop:2}}>Procesando...</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:18,fontSize:11,color:C.textMuted,textAlign:"center"}}>📍 {ev.location} · 🕐 {ev.time}</div>
      </div>

      {/* Confirmation popup */}
      {showConfirm&&(
        <AccessConfirmPopup
          participant={showConfirm.participant}
          event={ev}
          method={showConfirm.method}
          mode={activeMode}
          onAccept={()=>handleAccess(showConfirm.participant,showConfirm.method)}
          onReject={()=>setShowConfirm(null)}
        />
      )}

      {/* Result toast */}
      {result&&(
        <div className="toast" style={{
          background:result.duplicate?C.amber:result.duplicate==="noentry"?C.coral:result.action==="entry"?C.teal:C.coral,
          color:"#fff",flexDirection:"column",alignItems:"flex-start",gap:3
        }}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:24}}>{result.duplicate?"⚠️":result.action==="entry"?"✅":"👋"}</span>
            <div>
              <div style={{fontSize:14,fontWeight:900}}>
                {result.duplicate==="noentry"
                  ? "No registró entrada primero"
                  : result.duplicate
                  ? `Ya registró ${result.action==="entry"?"entrada":"salida"} hoy`
                  : result.action==="entry"?"¡Bienvenido/a!":"¡Hasta pronto!"}
              </div>
              <div style={{fontSize:12,opacity:.9}}>{result.name} · {result.time}</div>
            </div>
          </div>
        </div>
      )}

      {onExit&&<button onClick={onExit} style={{position:"fixed",bottom:10,right:10,background:"rgba(255,255,255,.8)",border:`1px solid ${C.border}`,borderRadius:8,padding:"4px 10px",fontSize:10,color:C.textMuted,cursor:"pointer",fontFamily:"Outfit,sans-serif",zIndex:200}}>✕ Salir</button>}
    </div>
  );
};

// ─── CERTIFICATE DESIGNER ─────────────────────────────────────────────────────
const CertificatesView = ({events=INIT_EVENTS, participants=INIT_PARTICIPANTS, checkins=INIT_CHECKINS, onNav}) => {
  const [tab, setTab]           = useState("designer");
  const [theme, setTheme]       = useState(CERT_THEMES[0]);
  const [selEvent, setSelEvent] = useState(events.find(e=>e.status==="finished")||events[0]);
  const [logo, setLogo]         = useState(null); // null = no logo, string = data URL
  const [logoPos, setLogoPos]   = useState({x:"center",size:60});
  const [certData, setCertData] = useState({
    title:"Certificado de Participación",
    subtitle:"Se certifica que",
    body:"ha participado satisfactoriamente en el evento",
    footer:"Certificado emitido digitalmente a través de la plataforma Passgo.",
    orgName:"Instituto de Capacitación",
    signerName:"Dr. Martín Rodríguez",
    signerRole:"Director Académico",
    signer2Name:"",
    signer2Role:"",
    showHours:true,
    hours:"4",
    showDate:true,
    showId:true,
  });
  const [issuing,    setIssuing]    = useState(false);
  const [issued,     setIssued]     = useState([]); // cert records
  const [selMode,    setSelMode]    = useState("checkout");
  const [selParts,   setSelParts]   = useState([]);
  const [showMassSend,setShowMassSend] = useState(false);
  const [preview,  setPreview]  = useState(null);
  const {show,ToastEl}          = useToast();
  const fileRef                 = useRef();

  const upd = useCallback((k,v)=>setCertData(d=>({...d,[k]:v})),[]);

  const handleLogoUpload = e => {
    const file=e.target.files?.[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>setLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  const doIssue = () => {
    setIssuing(true);
    setTimeout(()=>{
      const targets = selMode==="all" ? participants
        : selMode==="checkout" ? participants.filter(p=>eventCheckins.some(c=>c.participantId===p.id))
        : participants.filter(p=>selParts.includes(p.id));
      const newCerts = targets.map(p=>({
        id:Date.now()+p.id, participantId:p.id,
        participantName:`${p.nombre} ${p.apellido}`, email:p.email,
        eventId:selEvent?.id, eventName:selEvent?.title,
        certId:`CERT-${Date.now().toString(36).toUpperCase()}-${p.id}`,
        issuedAt:new Date().toLocaleString("es-AR"), status:"issued", approved:false, sent:false,
      }));
      setIssued(prev=>[...prev,...newCerts]);
      setIssuing(false); setTab("sent");
      show(`✅ ${newCerts.length} certificado${newCerts.length!==1?"s":""} generados`);
    },1500);
  };
  const approveCert = id => setIssued(prev=>prev.map(c=>c.id===id?{...c,approved:true}:c));
  const sendCert    = id => setIssued(prev=>prev.map(c=>c.id===id?{...c,sent:true}:c));
  const revokeCert  = id => { if(window.confirm("¿Revocar certificado?")) setIssued(prev=>prev.filter(c=>c.id!==id)); };
  const toggleSelPart = pid => setSelParts(prev=>prev.includes(pid)?prev.filter(x=>x!==pid):[...prev,pid]);

  const CertPreview = ({attendee, scale=1}) => {
    const t=theme;
    const name=attendee?`${attendee.nombre} ${attendee.apellido}`:"[Nombre Completo del Participante]";
    const certId=`CERT-${Math.random().toString(36).substr(2,8).toUpperCase()}`;
    const baseW=600;
    return (
      <div style={{
        width:baseW, background:t.grad, border:`3px solid ${t.border}`, borderRadius:10,
        padding:"36px 48px", position:"relative", overflow:"hidden",
        fontFamily:"'Outfit',sans-serif", boxShadow:scale<1?"0 4px 16px rgba(0,0,0,.1)":"0 8px 40px rgba(0,0,0,.12)",
        transform:`scale(${scale})`, transformOrigin:"top left",
      }}>
        {/* Corner decorations */}
        {[{top:10,left:10,borderRight:"none",borderBottom:"none"},{top:10,right:10,borderLeft:"none",borderBottom:"none"},
          {bottom:10,left:10,borderRight:"none",borderTop:"none"},{bottom:10,right:10,borderLeft:"none",borderTop:"none"}].map((s,i)=>(
          <div key={i} style={{position:"absolute",width:32,height:32,border:`2px solid ${t.border}`,borderRadius:i===0?"6px 0 0 0":i===1?"0 6px 0 0":i===2?"0 0 0 6px":"0 0 6px 0",...s}}/>
        ))}
        <div style={{height:2,background:`linear-gradient(90deg,transparent,${t.border},transparent)`,marginBottom:22}}/>

        {/* Logo area */}
        <div style={{textAlign:"center",marginBottom:18}}>
          {logo
            ?<img src={logo} alt="Logo" style={{height:logoPos.size,objectFit:"contain",display:"block",margin:"0 auto 8px"}}/>
            :<div style={{height:12}}/>
          }
          <div style={{fontSize:12,fontWeight:700,color:t.accent,textTransform:"uppercase",letterSpacing:".1em",opacity:.65}}>{certData.orgName}</div>
        </div>

        {/* Title */}
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{fontSize:26,fontWeight:900,color:t.accent,letterSpacing:"-0.02em",lineHeight:1.1}}>{certData.title}</div>
          <div style={{height:2,background:`linear-gradient(90deg,transparent,${t.border},transparent)`,margin:"8px auto 0",maxWidth:280}}/>
        </div>

        {/* Name */}
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{fontSize:13,color:t.accent,opacity:.7,marginBottom:6,fontWeight:500}}>{certData.subtitle}</div>
          <div style={{fontSize:24,fontWeight:900,color:t.accent,borderBottom:`1.5px solid ${t.border}`,display:"inline-block",padding:"0 20px 5px",letterSpacing:"-0.01em"}}>{name}</div>
        </div>

        {/* Body */}
        <div style={{textAlign:"center",marginBottom:certData.showHours?12:18}}>
          <div style={{fontSize:13,color:t.accent,opacity:.8,lineHeight:1.55}}>{certData.body}</div>
          <div style={{fontSize:16,fontWeight:800,color:t.accent,margin:"5px 0"}}>"{selEvent?.title}"</div>
          {certData.showDate&&<div style={{fontSize:11,color:t.accent,opacity:.65}}>
            {selEvent&&new Date(selEvent.date).toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})} · {selEvent?.location}
          </div> }
        </div>

        {certData.showHours&&(
          <div style={{textAlign:"center",marginBottom:14}}>
            <span style={{display:"inline-block",background:`${t.border}22`,border:`1px solid ${t.border}`,borderRadius:20,padding:"3px 14px",fontSize:12,fontWeight:700,color:t.accent}}>
              Duración: {certData.hours} horas académicas
            </span>
          </div>
        )}

        <div style={{height:2,background:`linear-gradient(90deg,transparent,${t.border},transparent)`,margin:"14px 0"}}/>

        {/* Signatures */}
        <div style={{display:"flex",justifyContent:certData.signer2Name?"space-between":"space-around",alignItems:"flex-end",padding:"0 20px"}}>
          <div style={{textAlign:"center"}}>
            <div style={{width:110,height:1,background:t.border,marginBottom:4,margin:"0 auto 4px"}}/>
            <div style={{fontSize:11,fontWeight:700,color:t.accent}}>{certData.signerName}</div>
            <div style={{fontSize:10,color:t.accent,opacity:.6}}>{certData.signerRole}</div>
          </div>
          {certData.signer2Name&&(
            <div style={{textAlign:"center"}}>
              <div style={{width:110,height:1,background:t.border,marginBottom:4,margin:"0 auto 4px"}}/>
              <div style={{fontSize:11,fontWeight:700,color:t.accent}}>{certData.signer2Name}</div>
              <div style={{fontSize:10,color:t.accent,opacity:.6}}>{certData.signer2Role}</div>
            </div>
          )}
          {certData.showDate&&(
            <div style={{textAlign:"center",opacity:.5}}>
              <div style={{fontSize:10,color:t.accent,fontWeight:700}}>{new Date().toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})}</div>
              {certData.showId&&<div style={{fontSize:9,color:t.accent}}>{certId}</div>}
            </div>
          )}
        </div>
        <div style={{textAlign:"center",marginTop:12}}>
          <div style={{fontSize:9,color:t.accent,opacity:.35}}>{certData.footer}</div>
        </div>
      </div>
    );
  };

  const eventCheckins=checkins.filter(c=>c.eventId===selEvent?.id&&c.checkOut);
  const eligibleP=participants.filter(p=>eventCheckins.some(c=>c.participantId===p.id));

  return (
    <div style={{padding:"20px 24px",maxWidth:1100}} className="page-in">
      {ToastEl}
      <Breadcrumbs items={[{label:"Dashboard",view:"dashboard"},{label:"Certificados"}]} onNav={onNav}/>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:20,fontWeight:900,letterSpacing:"-0.02em",marginBottom:3}}>Certificados</div>
        <div style={{fontSize:12,color:C.textMuted}}>Diseñá, personalicen y emití certificados de participación digitales o en PDF</div>
      </div>

      <div style={{display:"flex",gap:3,borderBottom:`1px solid ${C.border}`,marginBottom:20}}>
        {[["designer","🎨 Diseñar"],["issue","📤 Emitir"],["sent","✅ Enviados"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"7px 16px",background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:13,fontWeight:700,color:tab===k?C.primary:C.textMuted,borderBottom:`2.5px solid ${tab===k?C.primary:"transparent"}`,marginBottom:-1,transition:"all .14s"}}>{l}</button>
        ))}
      </div>

      {/* DESIGNER */}
      {tab==="designer"&&(
        <div className="cert-preview-grid" style={{display:"grid",gridTemplateColumns:"290px 1fr",gap:20,alignItems:"start"}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Event */}
            <div className="card" style={{padding:16}}>
              <label className="lbl">Evento</label>
              <select className="inp" value={selEvent?.id}
                onChange={e=>setSelEvent(events.find(ev=>ev.id===parseInt(e.target.value)))}>
                {events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>
            {/* Theme */}
            <div className="card" style={{padding:16}}>
              <label className="lbl" style={{marginBottom:9}}>Estilo visual</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                {CERT_THEMES.map(t=>(
                  <div key={t.id} onClick={()=>setTheme(t)} style={{padding:"9px 10px",borderRadius:9,cursor:"pointer",border:`2px solid ${theme.id===t.id?t.border:C.border}`,background:t.grad,transition:"all .16s"}}>
                    <div style={{width:"100%",height:5,background:t.border,borderRadius:2,marginBottom:5}}/>
                    <div style={{fontSize:11,fontWeight:700,color:t.accent}}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Logo */}
            <div className="card" style={{padding:16}}>
              <label className="lbl" style={{marginBottom:9}}>Logo personalizado</label>
              <input type="file" accept="image/*" ref={fileRef} style={{display:"none"}} onChange={handleLogoUpload}/>
              {logo
                ?<div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                    <img src={logo} style={{height:40,objectFit:"contain",borderRadius:6,border:`1px solid ${C.border}`}}/>
                    <div>
                      <button className="btn btn-white btn-sm" onClick={()=>fileRef.current.click()}>Cambiar</button>
                      <button className="btn btn-danger btn-sm" style={{marginLeft:4}} onClick={()=>setLogo(null)}>✕</button>
                    </div>
                  </div>
                :<button className="btn btn-white btn-sm" style={{width:"100%",marginBottom:8}} onClick={()=>fileRef.current.click()}>📁 Subir logo</button>
              }
              {logo&&(
                <div>
                  <label className="lbl" style={{fontSize:10,marginBottom:4}}>Tamaño del logo</label>
                  <input type="range" min={30} max={120} value={logoPos.size}
                    onChange={e=>setLogoPos(p=>({...p,size:parseInt(e.target.value)}))}
                    style={{width:"100%",accentColor:C.primary}}/>
                  <div style={{fontSize:10,color:C.textMuted,textAlign:"right"}}>{logoPos.size}px</div>
                </div>
              )}
            </div>
            {/* Colors */}
            <div className="card" style={{padding:16}}>
              <label className="lbl" style={{marginBottom:9}}>Personalizar colores</label>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                <label style={{fontSize:11,color:C.textMid,fontWeight:600,flex:1}}>Color acento</label>
                <input type="color" value={theme.accent} style={{width:34,height:28,borderRadius:6,border:`1px solid ${C.border}`,cursor:"pointer",padding:2}}
                  onChange={e=>setTheme(t=>({...t,accent:e.target.value,border:e.target.value}))}/>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <label style={{fontSize:11,color:C.textMid,fontWeight:600,flex:1}}>Color fondo</label>
                <input type="color" value={theme.bg} style={{width:34,height:28,borderRadius:6,border:`1px solid ${C.border}`,cursor:"pointer",padding:2}}
                  onChange={e=>setTheme(t=>({...t,bg:e.target.value,grad:e.target.value}))}/>
              </div>
            </div>
            {/* Text fields */}
            <div className="card" style={{padding:16,display:"flex",flexDirection:"column",gap:8}}>
              <label className="lbl" style={{marginBottom:0}}>Textos del certificado</label>
              {[["title","Título","Certificado de Participación"],["orgName","Organización","Instituto..."],
                ["body","Texto cuerpo","ha participado en..."],["signerName","Firmante 1","Dr. Nombre"],
                ["signerRole","Cargo firmante 1","Director"],["signer2Name","Firmante 2 (opcional)",""],
                ["signer2Role","Cargo firmante 2",""],["footer","Pie de página","Emitido digitalmente..."],
              ].map(([k,lbl,ph])=>(
                <div key={k}>
                  <label className="lbl" style={{fontSize:10,marginBottom:2}}>{lbl}</label>
                  <input className="inp" style={{fontSize:12,padding:"6px 9px"}} placeholder={ph}
                    value={certData[k]||""} onChange={e=>upd(k,e.target.value)}/>
                </div>
              ))}
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:4}}>
                {[["showHours","Horas"],["showDate","Fecha"],["showId","ID único"]].map(([k,l])=>(
                  <label key={k} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",fontSize:12,fontWeight:600,color:C.textMid}}>
                    <input type="checkbox" checked={certData[k]} onChange={e=>upd(k,e.target.checked)} style={{accentColor:C.primary}}/>
                    {l}
                  </label>
                ))}
                {certData.showHours&&(
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <label style={{fontSize:12,fontWeight:600,color:C.textMid}}>Hs:</label>
                    <input className="inp" type="number" value={certData.hours} style={{width:50,padding:"4px 7px",fontSize:12}}
                      onChange={e=>upd("hours",e.target.value)}/>
                  </div>
                )}
              </div>
            </div>
            <button className="btn btn-primary" style={{width:"100%"}} onClick={()=>setTab("issue")}>Continuar a emitir →</button>
          </div>

          {/* Live preview */}
          <div>
            <div style={{fontSize:11,fontWeight:800,color:C.textMuted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Vista previa en vivo</div>
            <div style={{overflowX:"auto",borderRadius:12,boxShadow:"0 6px 28px rgba(0,0,0,.09)"}}>
              <CertPreview attendee={null}/>
            </div>
            <div style={{marginTop:10,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
              <button className="btn btn-white btn-sm" onClick={()=>setPreview(participants[0])}>👁 Preview con nombre real</button>
              <button className="btn btn-white btn-sm">🖨️ Imprimir prueba</button>
              <button className="btn btn-white btn-sm">📥 Exportar PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* ISSUE */}
      {tab==="issue"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,alignItems:"start"}} className="cert-preview-grid">
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div className="card" style={{padding:20}}>
              <div style={{fontSize:14,fontWeight:800,marginBottom:12}}>Generar certificados</div>
              <label className="lbl">Evento</label>
              <select className="inp" style={{marginBottom:12}} value={selEvent?.id}
                onChange={e=>setSelEvent(events.find(ev=>ev.id===parseInt(e.target.value)))}>
                {events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
              <label className="lbl">¿A quiénes emitir?</label>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
                {[["all",`Todos con check-out (${eligibleP.length} personas)`],["manual","Selección manual"]].map(([v,l])=>(
                  <label key={v} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",borderRadius:9,border:`1.5px solid ${C.border}`,cursor:"pointer",fontSize:12,fontWeight:600,background:C.bg}}>
                    <input type="radio" name="certTarget" defaultChecked={v==="all"} style={{accentColor:C.primary}}/>
                    {l}
                  </label>
                ))}
              </div>
              <label className="lbl">Método de entrega</label>
              <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
                {[["email","📧 Email"],["download","📥 PDF"],["both","📧+📥 Ambos"]].map(([v,l])=>(
                  <button key={v} className="btn btn-white btn-sm"
                    style={{borderColor:v==="both"?C.primary:undefined,background:v==="both"?C.primaryLt:undefined,color:v==="both"?C.primary:undefined}}>{l}</button>
                ))}
              </div>
              {!issued
                ?<button className="btn btn-primary" style={{width:"100%"}} onClick={doIssue} disabled={issuing||!eligibleP.length}>
                    {issuing?"Emitiendo...":eligibleP.length?`🎓 Emitir ${eligibleP.length} certificados`:"Sin participantes elegibles"}
                  </button>
                :<div style={{background:C.tealLt,border:`1px solid ${C.teal}44`,borderRadius:10,padding:14,textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:4}}>✅</div>
                  <div style={{fontWeight:800,color:C.tealDk,marginBottom:2}}>¡Certificados emitidos!</div>
                  <div style={{fontSize:12,color:C.textMuted}}>{eligibleP.length} certificados enviados</div>
                </div>
              }
            </div>
            <div className="card" style={{overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:800}}>Participantes elegibles ({eligibleP.length})</div>
              {eligibleP.length===0&&<div style={{padding:20,textAlign:"center",color:C.textMuted,fontSize:13}}>Ningún participante completó check-out en este evento.</div>}
              {eligibleP.map(p=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 16px",borderBottom:`1px solid ${C.border}`}}>
                  <input type="checkbox" defaultChecked style={{accentColor:C.primary,flexShrink:0}}/>
                  <Av name={`${p.nombre} ${p.apellido}`} size={28}/>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{p.nombre} {p.apellido}</div><div style={{fontSize:11,color:C.textMuted}}>{p.email}</div></div>
                  <span style={{fontSize:11}}>✅</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:800,color:C.textMuted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Vista previa</div>
            <div style={{height:320,overflow:"hidden",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,.08)",position:"relative"}}>
              <div style={{transform:"scale(0.52)",transformOrigin:"top left",position:"absolute",top:0,left:0}}>
                <CertPreview attendee={eligibleP[0]||participants[0]}/>
              </div>
            </div>
            <div style={{display:"flex",gap:7,marginTop:8}}>
              <button className="btn btn-white btn-sm" style={{flex:1}}>📥 PDF prueba</button>
              <button className="btn btn-white btn-sm" style={{flex:1}}>🖨️ Imprimir</button>
            </div>
          </div>
        </div>
      )}

      {/* SENT */}
      {tab==="sent"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:18}}>
            <Stat icon="🎓" label="Emitidos"   value={issued.length}                              accent={C.primary}/>
            <Stat icon="✅" label="Aprobados"  value={issued.filter(c=>c.approved).length}        accent={C.teal}/>
            <Stat icon="📧" label="Enviados"   value={issued.filter(c=>c.sent).length}            accent={C.purple}/>
            <Stat icon="⏳" label="Pendientes" value={issued.filter(c=>!c.approved).length}       accent={C.amber}/>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <input className="inp" placeholder="🔍 Buscar certificado..." style={{flex:1,minWidth:180,maxWidth:300}}/>
            <button className="btn btn-white btn-sm" onClick={()=>setShowMassSend(true)}>📤 Envío masivo</button>
            <button className="btn btn-white btn-sm" onClick={()=>{
              if(!issued.length){show("Sin certificados para exportar","error");return;}
              exportCSV(
                issued.map(c=>({ID:c.certId,Participante:c.participantName,Email:c.email,Evento:c.eventName||"",Emitido:c.issuedAt,Aprobado:c.approved?"Sí":"No",Enviado:c.sent?"Sí":"No"})),
                `certificados_${(selEvent?.title?.split(' ').join('_').replace(/[^a-zA-Z0-9_]/g,''))||'lote'}_${new Date().toISOString().slice(0,10)}.csv`
              );
              show(`${issued.length} certificados exportados`);
            }}>📦 Exportar lote CSV</button>
          </div>
          {issued.length===0
            ? <div style={{textAlign:"center",padding:"40px 0",color:C.textMuted}}>
                <div style={{fontSize:32,marginBottom:10}}>🎓</div>
                <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>Sin certificados generados</div>
                <div style={{fontSize:12}}>Generá certificados desde la pestaña "Emitir"</div>
              </div>
            : <div className="card" style={{overflow:"hidden"}}>
                <div className="trow thead" style={{gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1fr 1fr"}}>
                  {["Participante","Evento","ID Cert","Estado","Aprobado","Acciones"].map(h=>(
                    <div key={h} style={{fontSize:10,fontWeight:800,color:C.textMuted,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</div>
                  ))}
                </div>
                {issued.map(c=>(
                  <div key={c.id} className="trow" style={{gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1fr 1fr"}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:700}}>{c.participantName}</div>
                      <div style={{fontSize:10,color:C.textMuted}}>{c.email}</div>
                    </div>
                    <div style={{fontSize:11,color:C.textMid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.eventName}</div>
                    <div style={{fontSize:10,fontFamily:"monospace",color:C.primary}}>{c.certId}</div>
                    <span className={`tag ${c.sent?"tg":c.approved?"tb":"ta"}`} style={{fontSize:9}}>
                      {c.sent?"enviado":c.approved?"aprobado":"pendiente"}
                    </span>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      {c.approved
                        ? <span style={{fontSize:14}}>✅</span>
                        : <button className="btn btn-white btn-sm" style={{fontSize:10,padding:"3px 8px"}} onClick={()=>approveCert(c.id)}>Aprobar</button>}
                    </div>
                    <div style={{display:"flex",gap:4}}>
                      {!c.sent&&c.approved&&(
                        <button className="btn btn-white btn-sm" style={{fontSize:10,padding:"3px 7px"}}
                          onClick={()=>{sendCert(c.id);show("Certificado enviado por email");}}>📧</button>
                      )}
                      <button className="btn btn-white btn-sm" style={{fontSize:10,padding:"3px 7px"}}
                        onClick={()=>printTable(`Certificado — ${c.participantName}`,
                          ["Campo","Valor"],
                          [["Participante",c.participantName],["ID",c.certId],["Evento",c.eventName||""],["Emitido",c.issuedAt],["Estado",c.approved?"Aprobado":"Pendiente"]]
                        )}>📄</button>
                      <button className="btn btn-danger btn-sm" style={{fontSize:10,padding:"3px 7px"}}
                        onClick={()=>revokeCert(c.id)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}


      {/* Individual preview modal */}
      {preview&&(
        <div className="overlay" onClick={()=>setPreview(null)}>
          <div style={{maxWidth:640,width:"100%",animation:"scaleIn .28s cubic-bezier(.22,.68,0,1.2)"}} onClick={e=>e.stopPropagation()}>
            <CertPreview attendee={preview}/>
            <div style={{display:"flex",gap:8,marginTop:10,justifyContent:"center"}}>
              <button className="btn btn-white" onClick={()=>setPreview(null)}>Cerrar</button>
              <button className="btn btn-primary">📥 Descargar PDF</button>
              <button className="btn btn-white">🖨️ Imprimir</button>
            </div>
          </div>
        </div>
      )}
    {showMassSend&&<MassSendModal event={selEvent} participants={eligibleP} onClose={()=>setShowMassSend(false)}/>}
    </div>
  );
};

// ─── USER MANAGEMENT ──────────────────────────────────────────────────────────
const UserModal = ({user, onSave, onClose}) => {
  const isEdit = !!user?.id;
  const [form, setForm] = useState({
    nombre:   user?.nombre||"",
    apellido: user?.apellido||"",
    email:    user?.email||"",
    role:     user?.role||"Disertante",
    plan:     user?.plan||"pro",
    orgId:    user?.orgId||1,
    phone:    user?.phone||"",
    active:   user?.active!==undefined?user.active:true,
    tempPassword: !isEdit,
    password: "",
    permissions: user?.permissions||PLAN_PERMISSIONS.pro,
  });
  const [errors, setErrors] = useState({});
  const {show,ToastEl} = useToast();

  const upd = useCallback((k,v)=>setForm(f=>({...f,[k]:v})),[]);

  // Auto-set permissions when plan changes
  useEffect(()=>{
    if(!isEdit) setForm(f=>({...f,permissions:PLAN_PERMISSIONS[f.plan]||[]}));
  },[form.plan,isEdit]);

  const validate = () => {
    const e={};
    if(!form.nombre.trim())   e.nombre="Requerido";
    if(!form.apellido.trim()) e.apellido="Requerido";
    if(!form.email.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email="Email inválido";
    if(!isEdit&&!form.password.trim()) e.password="Requerida";
    else if(!isEdit&&form.password.length<6) e.password="Mínimo 6 caracteres";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const togglePerm=(pid)=>setForm(f=>({...f,permissions:f.permissions.includes(pid)?f.permissions.filter(x=>x!==pid):[...f.permissions,pid]}));

  const handleSave=()=>{
    if(!validate()) return;
    onSave({...form, id:user?.id||Date.now()});
    show(isEdit?"Usuario actualizado":"Usuario creado. Se envió email de bienvenida.");
    setTimeout(onClose,800);
  };

  return (
    <div className="overlay" onClick={onClose}>
      {ToastEl}
      <div className="modal" style={{padding:26,maxWidth:560}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontSize:17,fontWeight:900}}>{isEdit?"Editar usuario":"Nuevo usuario"}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:14}}>
          <Field id="nombre"   label="Nombre *"   placeholder="Nombre"        value={form.nombre}   onChange={upd} error={errors.nombre}   half/>
          <Field id="apellido" label="Apellido *"  placeholder="Apellido"      value={form.apellido} onChange={upd} error={errors.apellido} half/>
          <Field id="email"    label="Email *"     type="email" placeholder="email@dominio.com" value={form.email} onChange={upd} error={errors.email}/>
          <Field id="phone"    label="Teléfono"    placeholder="+54 11 ..."               value={form.phone}    onChange={upd} half/>
          {!isEdit&&<Field id="password" label="Contraseña temporal *" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={upd} error={errors.password}/>}
          <div style={{flex:"1 1 100%",display:"flex",gap:16,padding:"10px 14px",borderRadius:10,background:C.bg}}>
            <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:12,fontWeight:600,color:C.textMid}}>
              <input type="checkbox" checked={form.tempPassword} onChange={e=>upd("tempPassword",e.target.checked)} style={{accentColor:C.primary}}/>
              Forzar cambio de contraseña al primer acceso
            </label>
          </div>
          <div style={{flex:"1 1 calc(50% - 5px)"}}>
            <label className="lbl">Rol</label>
            <select className="inp" value={form.role} onChange={e=>upd("role",e.target.value)}>
              {ROLES.map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
          <div style={{flex:"1 1 calc(50% - 5px)"}}>
            <label className="lbl">Plan</label>
            <select className="inp" value={form.plan} onChange={e=>upd("plan",e.target.value)}>
              {["basico","pro","enterprise"].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Permissions */}
        <div className="card" style={{padding:14,marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:800,color:C.textMid,textTransform:"uppercase",letterSpacing:".06em"}}>Permisos</div>
            <div style={{display:"flex",gap:5}}>
              <button className="btn btn-ghost btn-sm" style={{fontSize:10}} onClick={()=>setForm(f=>({...f,permissions:ALL_PERMISSIONS.map(p=>p.id)}))}>Todos</button>
              <button className="btn btn-ghost btn-sm" style={{fontSize:10}} onClick={()=>setForm(f=>({...f,permissions:[]}))}>Ninguno</button>
            </div>
          </div>
          <div style={{maxHeight:200,overflowY:"auto"}}>
            {ALL_PERMISSIONS.map(p=>(
              <div key={p.id} className="perm-row">
                <span style={{fontSize:12,color:C.textMid,fontWeight:500}}>{p.label}</span>
                <input type="checkbox" checked={form.permissions.includes(p.id)} onChange={()=>togglePerm(p.id)} style={{accentColor:C.primary}}/>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:14}}>
          <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:13,fontWeight:600,color:C.textMid}}>
            <input type="checkbox" checked={form.active} onChange={e=>upd("active",e.target.checked)} style={{accentColor:C.primary}}/>
            Usuario activo
          </label>
          {!isEdit&&(
            <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:13,fontWeight:600,color:C.textMid,marginLeft:12}}>
              <input type="checkbox" checked={form.tempPassword} onChange={e=>upd("tempPassword",e.target.checked)} style={{accentColor:C.primary}}/>
              Forzar cambio de contraseña
            </label>
          )}
        </div>

        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" style={{flex:1}} onClick={handleSave}>
            {isEdit?"Guardar cambios":"Crear usuario y enviar email"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── PUBLIC REGISTER ──────────────────────────────────────────────────────────
const PublicRegister = ({event, onBack}) => {
  const [step, setStep]   = useState(1);
  const [method, setMethod] = useState(null);
  const [faceDone, setFaceDone] = useState(false);
  const [busy, setBusy]   = useState(false);
  const [form, setForm]   = useState({nombre:"",apellido:"",dni:"",nacimiento:"",telefono:"",email:""});
  const [errors, setErrors] = useState({});
  const {show,ToastEl}    = useToast();

  const ev = event||INIT_EVENTS[0];
  const pubM = ev.methods.filter(m=>["facial","qr"].includes(m));

  const upd = useCallback((k,v)=>setForm(f=>({...f,[k]:v})),[]);

  const validate = () => {
    const e={};
    if(!form.nombre.trim())   e.nombre="Requerido";
    if(!form.apellido.trim()) e.apellido="Requerido";
    if(!form.dni.trim()||!/^\d{6,8}$/.test(form.dni.replace(/\D/g,""))) e.dni="DNI inválido";
    if(!form.nacimiento) e.nacimiento="Requerido";
    if(!form.telefono.trim()) e.telefono="Requerido";
    if(!form.email.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email="Email inválido";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = () => {
    if(!validate()) return;
    if(method==="facial"&&!faceDone){setErrors(e=>({...e,face:"Registrá tu foto facial"}));return;}
    setBusy(true);
    setTimeout(()=>{ setBusy(false); setStep(4); },1200);
  };

  return (
    <div style={{minHeight:"100vh",background:C.gradHero,display:"flex",flexDirection:"column"}}>
      {ToastEl}
      <div style={{padding:"12px 5%",borderBottom:`1px solid ${C.border}`,background:"rgba(255,255,255,.9)",backdropFilter:"blur(12px)",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100}}>
        <Logo size={28}/>
        {onBack&&<button className="btn btn-ghost btn-sm" onClick={onBack}>← Volver</button>}
      </div>
      <div style={{flex:1,padding:"24px 5% 48px",display:"flex",flexDirection:"column",alignItems:"center"}}>
        {/* Event banner */}
        <div className="card fu" style={{width:"100%",maxWidth:500,padding:16,marginBottom:18,overflow:"hidden",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${ev.color},${ev.color}44)`}}/>
          <div style={{fontSize:10,fontWeight:800,color:C.textMuted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:3}}>Registrarse para</div>
          <div style={{fontSize:15,fontWeight:800,marginBottom:3}}>{ev.title}</div>
          <div style={{display:"flex",gap:10,fontSize:12,color:C.textMuted,flexWrap:"wrap"}}>
            <span>📅 {new Date(ev.date).toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}</span>
            <span>🕐 {ev.time}</span>
            <span>📍 {ev.location}</span>
          </div>
          {ev.paymentType==="paid"&&<div style={{marginTop:8}}><PayBadge status="pending"/> <span style={{fontSize:12,color:C.textMid,marginLeft:6}}>Valor: ${ev.price?.toLocaleString()}</span></div>}
        </div>

        {/* Steps indicator */}
        {step<4&&(
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:20,flexWrap:"wrap",justifyContent:"center"}}>
            {["Método","Mis datos","Biometría"].map((s,i)=>{
              const n=i+1,done=step>n,active=step===n;
              return (
                <div key={s} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div className="step-dot" style={{background:done?C.teal:active?C.primary:"transparent",border:`2px solid ${done?C.teal:active?C.primary:C.borderMid}`,color:done||active?"#fff":C.textMuted}}>{done?"✓":n}</div>
                  <span style={{fontSize:12,fontWeight:active?700:500,color:active?C.primary:C.textMuted}}>{s}</span>
                  {i<2&&<div style={{width:18,height:1,background:C.borderMid}}/>}
                </div>
              );
            })}
          </div>
        )}

        {/* Step 1: Method */}
        {step===1&&(
          <div className="card si" style={{width:"100%",maxWidth:460,padding:26}}>
            <div style={{fontSize:18,fontWeight:900,marginBottom:4}}>¿Cómo querés ingresar?</div>
            <div style={{fontSize:12,color:C.textMuted,marginBottom:18,lineHeight:1.5}}>Elegí un método. RFID y Huella se configuran presencialmente.</div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {pubM.map(mid=>{
                const m=CHECK_METHODS.find(x=>x.id===mid);
                const sel=method===mid;
                return (
                  <div key={mid} className={`method-sel${sel?" on":""}`} onClick={()=>setMethod(mid)}
                    style={{borderColor:sel?m.color:undefined,background:sel?m.bg:undefined}}>
                    <div style={{width:42,height:42,borderRadius:11,background:sel?m.color:m.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0,transition:"all .18s"}}>
                      <span style={{filter:sel?"brightness(10)":"none"}}>{m.icon}</span>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:800,color:sel?m.color:C.text}}>{m.label}</div>
                      <div style={{fontSize:11,color:C.textMuted,marginTop:1}}>{m.desc}</div>
                    </div>
                    <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${sel?m.color:C.borderMid}`,background:sel?m.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {sel&&<span style={{color:"#fff",fontSize:9,fontWeight:900}}>✓</span>}
                    </div>
                  </div>
                );
              })}
              {!pubM.length&&<div style={{textAlign:"center",padding:20,color:C.textMuted,fontSize:13}}>Este evento no tiene registro online disponible.</div>}
            </div>
            {pubM.length>0&&<button className="btn btn-primary" style={{width:"100%",marginTop:18}} disabled={!method} onClick={()=>setStep(2)}>Continuar →</button>}
          </div>
        )}

        {/* Step 2: Form */}
        {step===2&&(
          <div className="card si" style={{width:"100%",maxWidth:500,padding:26}}>
            <div style={{fontSize:18,fontWeight:900,marginBottom:3}}>Tus datos personales</div>
            <div style={{fontSize:12,color:C.textMuted,marginBottom:16}}>Todos los campos son obligatorios.</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:9}}>
              <Field id="nombre"     label="Nombre *"           placeholder="Tu nombre"       value={form.nombre}     onChange={upd} error={errors.nombre}     half/>
              <Field id="apellido"   label="Apellido *"         placeholder="Tu apellido"     value={form.apellido}   onChange={upd} error={errors.apellido}   half/>
              <Field id="dni"        label="N° Documento *"     placeholder="Ej: 30123456"    value={form.dni}        onChange={upd} error={errors.dni}        half/>
              <Field id="nacimiento" label="Fecha nacimiento *" type="date"                   value={form.nacimiento} onChange={upd} error={errors.nacimiento} half/>
              <Field id="telefono"   label="Teléfono *"         placeholder="+54 11 0000-0000" value={form.telefono} onChange={upd} error={errors.telefono}/>
              <Field id="email"      label="Email *"            type="email" placeholder="correo@email.com" value={form.email} onChange={upd} error={errors.email}/>
            </div>
            <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:10,marginTop:12,fontSize:11,color:C.textMuted,lineHeight:1.5}}>
              🔒 Tus datos se usan únicamente para gestionar tu asistencia. No se comparten con terceros.
            </div>
            <div style={{display:"flex",gap:8,marginTop:16}}>
              <button className="btn btn-ghost" onClick={()=>setStep(1)}>← Atrás</button>
              <button className="btn btn-primary" style={{flex:1}} onClick={()=>{if(validate())setStep(3);}}>Continuar →</button>
            </div>
          </div>
        )}

        {/* Step 3: Biometric */}
        {step===3&&(
          <div className="card si" style={{width:"100%",maxWidth:460,padding:26}}>
            {method==="facial"?(
              <>
                <div style={{fontSize:18,fontWeight:900,marginBottom:3}}>Registrá tu rostro</div>
                <div style={{fontSize:12,color:C.textMuted,marginBottom:16,lineHeight:1.5}}>
                  Tu foto se usará para reconocerte automáticamente al entrar y salir. Mirá de frente con buena luz.
                </div>
                <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
                  <FaceCapture onCapture={ok=>setFaceDone(ok)} size={165}/>
                </div>
                {errors.face&&<div style={{fontSize:11,color:C.coral,textAlign:"center",marginBottom:8,fontWeight:600}}>⚠ {errors.face}</div>}
                <div style={{background:C.primaryLt,borderRadius:9,padding:10,fontSize:11,color:C.primary,marginBottom:14,lineHeight:1.5}}>
                  💡 Buena luz frontal · Sin lentes de sol · Mirá directo a la cámara
                </div>
              </>
            ):(
              <>
                <div style={{fontSize:18,fontWeight:900,marginBottom:3}}>Confirmá tus datos</div>
                <div style={{fontSize:12,color:C.textMuted,marginBottom:14}}>Revisá antes de confirmar. Tu QR llegará al email.</div>
                <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:14,marginBottom:14}}>
                  {[["Nombre",`${form.nombre} ${form.apellido}`],["Documento",form.dni],["Nacimiento",form.nacimiento],["Teléfono",form.telefono],["Email",form.email]].map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                      <span style={{color:C.textMuted}}>{k}</span><span style={{fontWeight:700}}>{v||"—"}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:C.tealLt,borderRadius:9,padding:10,fontSize:11,color:C.tealDk,marginBottom:14}}>
                  📧 Recibirás tu QR en <strong>{form.email}</strong>
                </div>
              </>
            )}
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-ghost" onClick={()=>setStep(2)}>← Editar</button>
              <button className="btn btn-primary" style={{flex:1}} disabled={busy||(method==="facial"&&!faceDone)} onClick={submit}>
                {busy?"Registrando...":"Confirmar →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step===4&&(
          <div className="card si" style={{width:"100%",maxWidth:440,padding:30,textAlign:"center"}}>
            <div style={{width:80,height:80,borderRadius:"50%",background:C.tealLt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,margin:"0 auto 14px",animation:"bounceIn .5s"}}>🎉</div>
            <div style={{fontSize:22,fontWeight:900,color:C.tealDk,marginBottom:7}}>¡Registro completado!</div>
            <p style={{fontSize:13,color:C.textMid,lineHeight:1.65,marginBottom:20}}>
              {method==="facial"
                ?"Tu rostro fue registrado. Acercate al kiosco de ENTRADA y mirá la cámara. Al salir, repetí en el kiosco de SALIDA."
                :`Tu QR fue enviado a ${form.email}. Mostralo al entrar y al salir del evento.`}
            </p>
            {method==="qr"&&(
              <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginBottom:18}}>
                <div style={{fontSize:10,fontWeight:800,color:C.textMuted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Tu QR personal</div>
                <div style={{display:"flex",justifyContent:"center",marginBottom:6}}>
                  <QRDisplay value={`PASSGO-${form.dni}-${ev.id}`} size={120}/>
                </div>
                <div style={{fontSize:11,color:C.textMuted}}>{form.nombre} {form.apellido}</div>
              </div>
            )}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
              <button className="btn btn-primary" onClick={()=>{setStep(1);setMethod(null);setForm({nombre:"",apellido:"",dni:"",nacimiento:"",telefono:"",email:""});setFaceDone(false);}}>
                Registrar otra persona
              </button>
              {onBack&&<button className="btn btn-white" onClick={onBack}>Volver al inicio</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── LIVE ATTENDANCE ──────────────────────────────────────────────────────────
const LiveAttendance = ({event, onBack, onKiosk, onRegister, onNav, participants=INIT_PARTICIPANTS, checkins=INIT_CHECKINS, setCheckins}) => {
  const [filter, setFilter]  = useState("all");
  const [search, setSearch]  = useState("");
  const [scanning, setScanning] = useState(null);
  const [result, setResult]  = useState(null);
  const [now, setNow]        = useState(new Date());
  const {show,ToastEl}       = useToast();

  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(t); },[]);

  const evCheckins = checkins.filter(c=>c.eventId===event.id);
  const enriched = evCheckins.map(c=>({
    ...c, participant: participants.find(p=>p.id===c.participantId)||{}
  }));

  const filtered = enriched.filter(a=>{
    if(filter==="in"&&a.status!=="in") return false;
    if(filter==="out"&&a.status!=="out") return false;
    const name=`${a.participant.nombre||""} ${a.participant.apellido||""}`.toLowerCase();
    if(search&&!name.includes(search.toLowerCase())&&!(a.participant.email||"").includes(search.toLowerCase())) return false;
    return true;
  });

  const inCount  = evCheckins.filter(c=>c.status==="in").length;
  const outCount = evCheckins.filter(c=>c.status==="out").length;
  const actM     = CHECK_METHODS.filter(m=>event.methods.includes(m.id));

  const doScan = mid => {
    setScanning(mid);
    setTimeout(()=>{ setScanning(null); setResult({name:"Dr. Juan Pérez",method:mid,action:"entrada",time:now.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}); },2000);
  };

  return (
    <div style={{padding:"18px 22px",maxWidth:1080}} className="page-in">
      {ToastEl}
      <Breadcrumbs items={[{label:"Dashboard",view:"dashboard"},{label:"Eventos",view:"events"},{label:event.title}]} onNav={onNav||onBack}/>

      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <STag status={event.status}/>
        <span style={{fontWeight:800,fontSize:14,flex:1}}>{event.title}</span>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button className="btn btn-white btn-sm" onClick={()=>onRegister(event)}>📝 Registrar</button>
          <button className="btn btn-white btn-sm" onClick={()=>onKiosk(event,"entry")}>🟢 Entrada</button>
          <button className="btn btn-white btn-sm" onClick={()=>onKiosk(event,"exit")}>🔴 Salida</button>
          <div style={{display:"flex",gap:8}}><button className="btn btn-primary btn-sm" onClick={()=>onNav("events")}>+ Nuevo evento</button><button className="btn btn-white btn-sm" onClick={onBack}>← Volver</button></div>
        </div>
      </div>

      {/* Event link */}
      <div style={{background:C.primaryLt,border:`1px solid ${C.primary}33`,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:C.primary,fontWeight:700}}>🔗 Link de registro:</span>
        <span style={{fontSize:11,color:C.primary,fontFamily:"monospace",background:"rgba(91,110,245,.1)",padding:"2px 8px",borderRadius:5}}>
          https://passgo.app/evento/{event.slug}
        </span>
        <button className="btn btn-white btn-sm" style={{fontSize:10}} onClick={()=>show("Link copiado al portapapeles")}>📋 Copiar</button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10,marginBottom:16}}>
        {[{l:"Presentes",v:inCount,c:C.teal},{l:"Salieron",v:outCount,c:C.coral},{l:"Total",v:evCheckins.length,c:C.primary},{l:"Cap.",v:event.capacity,c:C.textMuted},{l:"Encuestas",v:evCheckins.filter(c=>c.surveyDone).length,c:C.purple}].map(s=>(
          <div key={s.l} className="card" style={{padding:14}}>
            <div style={{fontSize:26,fontWeight:900,color:s.c,lineHeight:1,letterSpacing:"-0.02em"}}>{s.v}</div>
            <div style={{fontSize:11,color:C.textMuted,marginTop:3}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Quick checkin */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:800,color:C.textMuted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Check-in rápido</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {actM.map(m=>(
            <div key={m.id} className="card card-hov" onClick={()=>!scanning&&doScan(m.id)}
              style={{padding:"11px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,borderColor:scanning===m.id?m.color:undefined,background:scanning===m.id?m.bg:undefined,flex:"1 1 120px",maxWidth:170}}>
              <div style={{width:34,height:34,borderRadius:10,background:scanning===m.id?m.color:m.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                {scanning===m.id?<div style={{width:14,height:14,border:"2px solid rgba(255,255,255,.35)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>:m.icon}
              </div>
              <span style={{fontSize:12,fontWeight:700,color:scanning===m.id?m.color:C.text,lineHeight:1.2}}>{m.short}</span>
            </div>
          ))}
        </div>
      </div>

      {result&&(
        <div className="overlay" onClick={()=>setResult(null)}>
          <div className="modal" style={{padding:32,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:72,height:72,borderRadius:"50%",background:C.tealLt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,margin:"0 auto 14px",animation:"bounceIn .4s"}}>✅</div>
            <div style={{fontSize:18,fontWeight:900,color:C.teal,marginBottom:4}}>¡{result.action} registrada!</div>
            <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{result.name}</div>
            <div style={{fontSize:12,color:C.textMuted,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
              <MTag method={result.method}/> · {result.time}
            </div>
            <button className="btn btn-primary" style={{width:"100%"}} onClick={()=>setResult(null)}>Continuar</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        <input className="inp" placeholder="🔍 Buscar..." value={search}
          onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:150,maxWidth:280}}/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[["all","Todos"],["in","Presentes"],["out","Salieron"]].map(([k,l])=>(
            <button key={k} className={`btn btn-sm ${filter===k?"btn-primary":"btn-white"}`} onClick={()=>setFilter(k)}>{l}</button>
          ))}
        </div>
        <select className="inp" style={{maxWidth:160,fontSize:12}}>
          <option>Todos los métodos</option>
          {CHECK_METHODS.map(m=><option key={m.id}>{m.label}</option>)}
        </select>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.tealDk}}>
          <span className="dot-live pulse" style={{background:C.teal,width:7,height:7}}/>En vivo
        </div>
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        <div className="trow thead" style={{gridTemplateColumns:"2fr 1.2fr .8fr .8fr 1fr 1fr .6fr"}}>
          {["Participante","Especialidad","Entrada","Salida","Método","Estado","Encuesta"].map(h=>(
            <div key={h} style={{fontSize:10,fontWeight:800,color:C.textMuted,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</div>
          ))}
        </div>
        {filtered.length===0&&<div style={{padding:24,textAlign:"center",color:C.textMuted,fontSize:13}}>Sin resultados</div>}
        {filtered.map(a=>(
          <div key={a.id} className="trow" style={{gridTemplateColumns:"2fr 1.2fr .8fr .8fr 1fr 1fr .6fr"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Av name={`${a.participant.nombre||"?"} ${a.participant.apellido||""}`}/>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>{a.participant.nombre} {a.participant.apellido}</div>
                <div style={{fontSize:11,color:C.textMuted}}>{a.participant.email}</div>
              </div>
            </div>
            <div style={{fontSize:12,color:C.textMid}}>{a.participant.role}</div>
            <div style={{fontSize:13,fontWeight:700,color:C.tealDk}}>{a.checkIn}</div>
            <div style={{fontSize:13,color:a.checkOut?C.text:C.textLight}}>{a.checkOut||"—"}</div>
            <MTag method={a.method}/>
            <STag status={a.status}/>
            <span style={{fontSize:14}}>{a.surveyDone?"✅":"—"}</span>
          </div>
        ))}
      </div>
      <div style={{marginTop:10,display:"flex",gap:7,flexWrap:"wrap"}}>
        <button className="btn btn-white btn-sm" onClick={()=>exportCSV(
          displayed.map(c=>{const p=participants.find(x=>x.id===c.participantId)||{}; return {Nombre:`${p.nombre} ${p.apellido}`,DNI:p.dni,Email:p.email,Org:p.org,Entrada:c.checkIn,Salida:c.checkOut||'—',Método:c.method,Estado:c.status==='in'?'Presente':'Salió'};}),
          `asistentes_${event.slug||event.id}_${new Date().toISOString().slice(0,10)}.csv`
        )}>📥 CSV</button>
        <button className="btn btn-white btn-sm" onClick={()=>printTable(
          `Asistentes — ${event.title}`,
          ['Nombre','DNI','Email','Organización','Entrada','Salida','Método','Estado'],
          displayed.map(c=>{const p=participants.find(x=>x.id===c.participantId)||{}; return [`${p.nombre} ${p.apellido}`,p.dni,p.email,p.org,c.checkIn,c.checkOut||'—',c.method,c.status==='in'?'Presente':'Salió'];})
        )}>📄 PDF</button>
        <button className="btn btn-white btn-sm" onClick={()=>exportJSON(
          displayed.map(c=>{const p=participants.find(x=>x.id===c.participantId)||{}; return {...c, participant:{nombre:p.nombre,apellido:p.apellido,dni:p.dni,email:p.email}};}),
          `checkins_${event.id}.json`
        )}>📊 JSON</button>
        <button className="btn btn-white btn-sm" onClick={()=>show("Informe enviado al coordinador del evento")}>📧 Email informe</button>
      </div>
    </div>
  );
};

// ─── EVENTS MANAGER ───────────────────────────────────────────────────────────
const EventsManager = ({onSelect, onRegister, onMetrics, onSurvey, onNav, events, setEvents, orgs=INIT_ORGS, speakers=INIT_SPEAKERS}) => {
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);
  const {show,ToastEl}        = useToast();

  const [newForm, setNewForm] = useState({
    title:"",type:"Seminario",date:"",time:"",endTime:"",
    location:"",capacity:"50",methods:["facial","qr"],
    surveyTiming:"checkout",confirmMode:"auto",paymentType:"free",price:"0",
    orgId:"",speakerId:"",certType:"standard",delivery:"email",
  });
  const [newErrors, setNewErrors] = useState({});

  const updNew = useCallback((k,v)=>setNewForm(f=>({...f,[k]:v})),[]);
  const toggleM = useCallback((mid)=>setNewForm(f=>({...f,methods:f.methods.includes(mid)?f.methods.filter(x=>x!==mid):[...f.methods,mid]})),[]);

  const filtered = events.filter(e=>{
    if(filter!=="all"&&e.status!==filter) return false;
    if(search&&!e.title.toLowerCase().includes(search.toLowerCase())&&!e.speaker.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const validateNew = () => {
    const e={};
    if(!newForm.title.trim())    e.title    = "Requerido";
    if(!newForm.date)             e.date     = "Fecha requerida";
    if(!newForm.location.trim()) e.location = "Requerido";
    if(!newForm.methods.length)  e.methods  = "Seleccioná al menos un método";
    setNewErrors(e);
    return !Object.keys(e).length;
  };

  const handleCreate = () => {
    if(!validateNew()) return;
    const slug = newForm.title.toLowerCase().split(' ').join('-').replace(/[^a-z0-9-]/g,'').slice(0,30)+"-"+Date.now().toString(36);
    const newEv = {
      ...newForm, id:Date.now(), slug, status:"upcoming",
      attendees:0, capacity:parseInt(newForm.capacity)||50,
      color:[C.primary,C.teal,C.purple,C.amber,C.coral][Math.floor(Math.random()*5)],
      orgId:parseInt(newForm.orgId)||1,
      speakerId:parseInt(newForm.speakerId)||null,
      price:parseFloat(newForm.price)||0,
    };
    setEvents(evs=>[newEv,...evs]);
    setShowNew(false);
    setNewForm({title:"",type:"Seminario",date:"",time:"",endTime:"",location:"",capacity:"50",methods:["facial","qr"],surveyTiming:"checkout",confirmMode:"auto",paymentType:"free",price:"0"});
    show(`Evento creado. Link: passgo.app/evento/${slug}`);
  };

  const handleDelete = (id) => {
    if(!window.confirm("¿Eliminar este evento?")) return;
    setEvents(evs=>evs.filter(e=>e.id!==id));
    show("Evento eliminado","error");
  };

  const EventFormModal = () => (
    <div className="overlay" onClick={()=>setShowNew(false)}>
      <div className="modal" style={{padding:24,maxWidth:560}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:17,fontWeight:900}}>Nuevo evento</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowNew(false)}>✕</button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:9,marginBottom:12}}>
          <Field id="title"    label="Nombre del evento *" placeholder="Ej: Congreso Cardiología" value={newForm.title}    onChange={updNew} error={newErrors.title}    />
          <div style={{flex:"1 1 calc(50% - 5px)"}}>
            <label className="lbl">Tipo de evento</label>
            <select className="inp" value={newForm.type} onChange={e=>updNew("type",e.target.value)}>
              {EVENT_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{flex:"1 1 calc(50% - 5px)"}}>
            <label className="lbl">Organización</label>
            <select className="inp" value={newForm.orgId||""} onChange={e=>updNew("orgId",e.target.value)}>
              <option value="">Seleccionar organización</option>
              {(orgs||[]).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div style={{flex:"1 1 calc(50% - 5px)"}}>
            <label className="lbl">Disertante principal</label>
            <select className="inp" value={newForm.speakerId||""} onChange={e=>updNew("speakerId",e.target.value)}>
              <option value="">Seleccionar disertante</option>
              {(speakers||[]).map(s=><option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>)}
            </select>
          </div>
          <Field id="date"     label="Fecha *"           type="date"                         value={newForm.date}     onChange={updNew} error={newErrors.date}     half/>
          <Field id="time"     label="Hora inicio"       type="time"                         value={newForm.time}     onChange={updNew}                            half/>
          <Field id="endTime"  label="Hora fin"          type="time"                         value={newForm.endTime}  onChange={updNew}                            half/>
          <Field id="location" label="Ubicación *"       placeholder="Auditorio / Hotel..."  value={newForm.location} onChange={updNew} error={newErrors.location} />
          <Field id="capacity" label="Capacidad"         type="number" placeholder="50"      value={newForm.capacity} onChange={updNew}                            half/>
          <div style={{flex:"1 1 calc(50% - 5px)"}}>
            <label className="lbl">Tipo de evento</label>
            <select className="inp" value={newForm.paymentType} onChange={e=>updNew("paymentType",e.target.value)}>
              <option value="free">Gratuito</option>
              <option value="paid">De pago</option>
            </select>
          </div>
          {newForm.paymentType==="paid"&&<Field id="price" label="Precio ($)" type="number" placeholder="0" value={newForm.price} onChange={updNew} half/>}
        </div>

        {/* Methods */}
        <div style={{marginBottom:12}}>
          <label className="lbl" style={{marginBottom:8}}>Métodos de acceso *</label>
          {newErrors.methods&&<div style={{fontSize:11,color:C.coral,marginBottom:6,fontWeight:600}}>⚠ {newErrors.methods}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {CHECK_METHODS.map(m=>{
              const sel=newForm.methods.includes(m.id);
              const online=["facial","qr"].includes(m.id);
              return (
                <div key={m.id} className={`method-sel${sel?" on":""}`} onClick={()=>toggleM(m.id)}
                  style={{borderColor:sel?m.color:undefined,background:sel?m.bg:undefined}}>
                  <input type="checkbox" checked={sel} onChange={()=>toggleM(m.id)} onClick={e=>e.stopPropagation()} style={{accentColor:C.primary}}/>
                  <div style={{width:30,height:30,borderRadius:8,background:sel?m.color:m.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,transition:"all .16s",flexShrink:0}}>
                    <span style={{filter:sel?"brightness(10)":"none"}}>{m.icon}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:sel?m.color:C.text}}>{m.label}</div>
                    <div style={{fontSize:10,color:C.textMuted}}>{online?"Registro online + presencial":"Solo presencial (hardware)"}</div>
                  </div>
                  {sel&&<span className={`tag ${online?"tb":"ta"}`} style={{fontSize:10}}>{online?"Online":"HW"}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Config */}
        <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
          <div style={{flex:1}}>
            <label className="lbl">Modo confirmación</label>
            <select className="inp" value={newForm.confirmMode} onChange={e=>updNew("confirmMode",e.target.value)}>
              <option value="auto">Automático (sin confirmación)</option>
              <option value="confirm">Mostrar pantalla de confirmación</option>
            </select>
          </div>
          <div style={{flex:1}}>
            <label className="lbl">Encuesta</label>
            <select className="inp" value={newForm.surveyTiming} onChange={e=>updNew("surveyTiming",e.target.value)}>
              <option value="checkin">Al entrar</option>
              <option value="checkout">Al salir</option>
              <option value="email">Por email</option>
            </select>
          </div>
        </div>

        {/* Auto-generated link preview */}
        {newForm.title&&(
          <div style={{background:C.primaryLt,borderRadius:9,padding:10,marginBottom:12,fontSize:11}}>
            <span style={{color:C.primary,fontWeight:700}}>🔗 Link generado: </span>
            <span style={{color:C.primary,fontFamily:"monospace"}}>
              passgo.app/evento/{newForm.title.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"").slice(0,25)}...
            </span>
          </div>
        )}

        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-ghost" onClick={()=>setShowNew(false)}>Cancelar</button>
          <button className="btn btn-primary" style={{flex:1}} onClick={handleCreate}>Crear evento</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{padding:"18px 22px",maxWidth:1160}} className="page-in">
      {ToastEl}
      <Breadcrumbs items={[{label:"Dashboard",view:"dashboard"},{label:"Eventos"}]} onNav={id=>onNav(id)}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,letterSpacing:"-0.02em",marginBottom:2}}>Eventos</div>
          <div style={{color:C.textMuted,fontSize:12}}>Gestioná eventos, métodos de acceso, encuestas y links de registro</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowNew(true)}>＋ Nuevo evento</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        <input className="inp" placeholder="🔍 Buscar evento o disertante..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:150,maxWidth:280}}/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[["all","Todos"],["active","En curso"],["upcoming","Próximos"],["finished","Finalizados"]].map(([k,l])=>(
            <button key={k} className={`btn btn-sm ${filter===k?"btn-primary":"btn-white"}`} onClick={()=>setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {filtered.map(e=>(
          <div key={e.id} className="card card-lift" style={{padding:20,cursor:"pointer",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${e.color},${e.color}33)`,borderRadius:"16px 16px 0 0"}}/>
            <div onClick={()=>onSelect(e)}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:4}}>
                <STag status={e.status}/><span className="tag tp" style={{fontSize:10}}>{e.type}</span>
              </div>
              <div style={{fontSize:14,fontWeight:800,marginBottom:6,lineHeight:1.3,letterSpacing:"-0.01em"}}>{e.title}</div>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
                <Av name={e.speaker} bg={`${e.color}18`} color={e.color} size={24}/>
                <span style={{fontSize:12,color:C.textMid,fontWeight:600}}>{e.speaker}</span>
              </div>
              <div style={{display:"flex",gap:10,fontSize:11,color:C.textMuted,marginBottom:7,flexWrap:"wrap"}}>
                <span>📅 {new Date(e.date).toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</span>
                <span>🕐 {e.time}</span>
                <span>📍 {e.location.split(",")[0]}</span>
              </div>
              <div style={{display:"flex",gap:4,marginBottom:7,flexWrap:"wrap"}}>
                {e.methods.map(m=><MTag key={m} method={m}/>)}
                {e.paymentType==="paid"&&<PayBadge status="paid"/>}
              </div>
              <div style={{fontSize:10,color:C.primary,fontFamily:"monospace",background:C.primaryLt,padding:"2px 7px",borderRadius:4,marginBottom:8}}>🔗 passgo.app/evento/{e.slug}</div>
              <div style={{height:1,background:C.border,marginBottom:8}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textMuted,marginBottom:4}}>
                <span>Asistentes</span><span style={{fontWeight:800,color:C.text}}>{e.attendees}/{e.capacity}</span>
              </div>
              <div className="prog-track"><div className="prog-fill" style={{width:`${Math.round((e.attendees/e.capacity)*100)}%`,background:e.color}}/></div>
            </div>
            <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
              <button className="btn btn-white btn-sm" style={{flex:1,fontSize:11}} onClick={e2=>{e2.stopPropagation();onRegister(e);}}>📝 Registrar</button>
              <button className="btn btn-white btn-sm" style={{flex:1,fontSize:11}} onClick={e2=>{e2.stopPropagation();onMetrics(e);}}>📊 Métricas</button>
              <button className="btn btn-white btn-sm" style={{flex:1,fontSize:11}} onClick={e2=>{e2.stopPropagation();onSurvey(e);}}>📋 Encuesta</button>
              <button className="btn btn-danger btn-sm" style={{padding:"6px 9px",fontSize:11}} onClick={e2=>{e2.stopPropagation();handleDelete(e.id);}}>🗑</button>
            </div>
          </div>
        ))}
      </div>
      {showNew&&<EventFormModal/>}
    </div>
  );
};

// ─── PARTICIPANTS DB ──────────────────────────────────────────────────────────
const ParticipantsView = ({onRegister, participants, setParticipants, onNav, events=INIT_EVENTS}) => {
  const [search, setSearch]       = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [payFilter, setPayFilter] = useState("");
  const [evFilter,  setEvFilter]  = useState("");
  const [showDetail, setShowDetail] = useState(null);
  const {show,ToastEl}            = useToast();

  const filtered = participants.filter(p=>{
    const name=`${p.nombre} ${p.apellido}`.toLowerCase();
    if(search&&!name.includes(search.toLowerCase())&&!p.email.includes(search.toLowerCase())&&!p.dni.includes(search)) return false;
    if(orgFilter&&p.org!==orgFilter) return false;
    if(payFilter&&p.payStatus!==payFilter) return false;
    if(evFilter&&!(p.events||[]).includes(Number(evFilter))) return false;
    return true;
  });

  const orgs=[...new Set(participants.map(p=>p.org))];

  return (
    <div style={{padding:"18px 22px",maxWidth:1100}} className="page-in">
      {ToastEl}
      <Breadcrumbs items={[{label:"Dashboard",view:"dashboard"},{label:"Participantes"}]} onNav={onNav}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,letterSpacing:"-0.02em",marginBottom:2}}>Participantes</div>
          <div style={{color:C.textMuted,fontSize:12}}>Base de datos central de todos los asistentes</div>
        </div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          <button className="btn btn-white btn-sm">📥 Importar CSV</button>
          <button className="btn btn-white btn-sm" onClick={()=>exportCSV(
            filtered.map(p=>({Nombre:`${p.nombre} ${p.apellido}`,DNI:p.dni,Email:p.email,Tel:p.tel,Org:p.org,Rol:p.role,Pago:p.payStatus,Monto:p.payAmount||0})),
            `participantes_${new Date().toISOString().slice(0,10)}.csv`
          )}>📤 Exportar CSV</button>
          <button className="btn btn-primary btn-sm" onClick={()=>onRegister(null)}>＋ Registrar</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:16}}>
        <Stat icon="👥" label="Total"       value={participants.length} accent={C.primary}/>
        <Stat icon="👁"  label="Foto facial" value={participants.filter(p=>p.facial).length} accent={C.purple} sub={`${Math.round(participants.filter(p=>p.facial).length/participants.length*100)}%`}/>
        <Stat icon="▦"  label="Con QR"      value={participants.filter(p=>p.qr).length}     accent={C.tealDk}/>
        <Stat icon="◈"  label="RFID"        value={participants.filter(p=>p.rfid).length}    accent={C.amber}/>
        <Stat icon="💳" label="Pagados"     value={participants.filter(p=>p.payStatus==="paid").length} accent={C.teal}/>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <input className="inp" placeholder="🔍 Buscar nombre, email o DNI..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:180,maxWidth:300}}/>
        <select className="inp" style={{maxWidth:180}} value={orgFilter} onChange={e=>setOrgFilter(e.target.value)}>
          <option value="">Todas las organizaciones</option>
          {orgs.map(o=><option key={o}>{o}</option>)}
        </select>
        <select className="inp" style={{maxWidth:180}} value={evFilter} onChange={e=>setEvFilter(e.target.value)}>
          <option value="">Todos los eventos</option>
          {(events||[]).map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        <select className="inp" style={{maxWidth:150}} value={payFilter} onChange={e=>setPayFilter(e.target.value)}>
          <option value="">Todos los pagos</option>
          <option value="paid">Pagado</option>
          <option value="pending">Pendiente</option>
          <option value="partial">Parcial</option>
          <option value="free">Gratuito</option>
        </select>
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        <div className="trow thead" style={{gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1fr 1fr"}}>
          {["Participante","Organización","Accesos","Eventos","Pago","Acciones"].map(h=>(
            <div key={h} style={{fontSize:10,fontWeight:800,color:C.textMuted,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</div>
          ))}
        </div>
        {filtered.length===0&&<div style={{padding:24,textAlign:"center",color:C.textMuted,fontSize:13}}>Sin resultados</div>}
        {filtered.map(p=>(
          <div key={p.id} className="trow" style={{gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1fr 1fr"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Av name={`${p.nombre} ${p.apellido}`}/>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>{p.nombre} {p.apellido}</div>
                <div style={{fontSize:10,color:C.textMuted}}>DNI {p.dni} · {p.email}</div>
              </div>
            </div>
            <div style={{fontSize:12,color:C.textMid}}>{p.org}</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {p.facial&&<span className="tag tp" style={{fontSize:9,padding:"2px 6px"}}>👁</span>}
              {p.qr&&    <span className="tag tb" style={{fontSize:9,padding:"2px 6px"}}>▦</span>}
              {p.rfid&&  <span className="tag ta" style={{fontSize:9,padding:"2px 6px"}}>◈</span>}
              {p.huella&&<span className="tag tg" style={{fontSize:9,padding:"2px 6px"}}>☉</span>}
            </div>
            <span className="tag tb" style={{fontSize:11}}>{p.events?.length||0} ev.</span>
            <PayBadge status={p.payStatus}/>
            <div style={{display:"flex",gap:4}}>
              <button className="btn btn-white btn-sm" style={{padding:"4px 8px",fontSize:11}} onClick={()=>setShowDetail(p)}>Ver</button>
              <button className="btn btn-white btn-sm" style={{padding:"4px 8px",fontSize:11}}>Editar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Participant detail modal */}
      {showDetail&&(
        <div className="overlay" onClick={()=>setShowDetail(null)}>
          <div className="modal" style={{padding:26}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Av name={`${showDetail.nombre} ${showDetail.apellido}`} size={44}/>
                <div>
                  <div style={{fontSize:17,fontWeight:900}}>{showDetail.nombre} {showDetail.apellido}</div>
                  <div style={{fontSize:12,color:C.textMuted}}>{showDetail.role} · {showDetail.org}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowDetail(null)}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[["DNI",showDetail.dni],["Nacimiento",showDetail.nacimiento],["Email",showDetail.email],["Teléfono",showDetail.tel]].map(([k,v])=>(
                <div key={k} style={{background:C.bg,borderRadius:9,padding:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.textMuted,marginBottom:3}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:600}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:8}}>Métodos registrados</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {CHECK_METHODS.map(m=>(
                  <span key={m.id} className={`tag ${showDetail[m.id]?"tg":"tgr"}`}>{m.icon} {m.short}: {showDetail[m.id]?"✓ Activo":"—"}</span>
                ))}
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:8}}>Estado de pago</div>
              <div style={{background:C.bg,borderRadius:9,padding:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <PayBadge status={showDetail.payStatus}/>
                  {showDetail.payAmount>0&&<span style={{fontSize:13,fontWeight:800}}>$ {showDetail.payAmount?.toLocaleString()}</span>}
                </div>
                {showDetail.payDate&&<div style={{fontSize:11,color:C.textMuted}}>Fecha: {showDetail.payDate} · Método: {showDetail.payMethod}</div>}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:8}}>Historial de eventos ({showDetail.events?.length||0})</div>
              {showDetail.events?.map(evId=>{
                const ev=events.find(e=>e.id===evId);
                return ev?<div key={evId} style={{fontSize:12,padding:"6px 0",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>{ev.title}</span><STag status={ev.status}/>
                </div>:null;
              })}
            </div>
            <button className="btn btn-white" style={{width:"100%"}} onClick={()=>setShowDetail(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── METRICS ──────────────────────────────────────────────────────────────────
const MetricsView = ({event, checkins=INIT_CHECKINS, onBack, onNav}) => {
  const evC    = checkins.filter(c=>c.eventId===event.id);
  const total  = evC.length;
  const inC    = evC.filter(c=>c.status==="in").length;
  const outC   = evC.filter(c=>c.status==="out").length;
  const survC  = evC.filter(c=>c.surveyDone).length;
  const mCounts= CHECK_METHODS.reduce((a,m)=>({...a,[m.id]:evC.filter(c=>c.method===m.id).length}),{});
  return (
    <div style={{padding:"18px 22px",maxWidth:900}} className="page-in">
      <Breadcrumbs items={[{label:"Dashboard",view:"dashboard"},{label:"Eventos",view:"events"},{label:"Métricas"}]} onNav={id=>onBack(id)}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,marginBottom:2}}>Métricas del evento</div>
          <div style={{fontSize:12,color:C.textMuted}}>{event.title}</div>
        </div>
        <button className="btn btn-white btn-sm" onClick={onBack}>← Volver</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}>
        <Stat icon="👥" label="Total inscritos"      value={total} accent={C.primary}/>
        <Stat icon="🟢" label="Presentes"             value={inC}   accent={C.teal}/>
        <Stat icon="🔴" label="Salieron"              value={outC}  accent={C.coral}/>
        <Stat icon="📋" label="Encuestas completadas" value={survC} accent={C.purple} sub={total?`${Math.round((survC/total)*100)}%`:""}/>
      </div>
      <div className="card" style={{padding:20,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:800,marginBottom:14}}>Flujo de asistencia por hora</div>
        <div style={{display:"flex",gap:6,alignItems:"flex-end",height:90}}>
          {[["09:00",4],["09:30",12],["10:00",8],["10:30",6],["11:00",5],["11:30",3],["12:00",2],["13:00",1]].map(([h,v])=>(
            <div key={h} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{height:`${(v/12)*74}px`,background:C.grad,borderRadius:"3px 3px 0 0",width:"100%",minHeight:3}}/>
              <span style={{fontSize:8,color:C.textMuted,fontWeight:600}}>{h}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{padding:20,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:800,marginBottom:14}}>Métodos de acceso</div>
        {CHECK_METHODS.filter(m=>event.methods.includes(m.id)).map(m=>{
          const cnt=mCounts[m.id]||0, pct=total?Math.round((cnt/total)*100):0;
          return (
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:32,height:32,borderRadius:9,background:m.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{m.icon}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:700}}>{m.short}</span>
                  <span style={{fontSize:11,color:C.textMuted}}>{cnt} ({pct}%)</span>
                </div>
                <div className="prog-track"><div className="prog-fill" style={{width:`${pct}%`,background:m.color}}/></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="card" style={{padding:20}}>
        <div style={{fontSize:13,fontWeight:800,marginBottom:4}}>Encuesta</div>
        <div style={{fontSize:11,color:C.textMuted,marginBottom:14}}>{survC} respuestas</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <span style={{fontSize:26}}>⭐⭐⭐⭐☆</span>
          <span style={{fontSize:22,fontWeight:900,color:C.amber}}>4.2</span>
          <span style={{fontSize:11,color:C.textMuted}}>/ 5</span>
        </div>
        {[["¿Recomendarías?","Sí, definitivamente",65,"Probablemente sí",25]].map(([q,l1,v1,l2,v2])=>(
          <div key={q}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:8}}>{q}</div>
            {[[l1,v1],[l2,v2],["No",10]].map(([l,v])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <span style={{fontSize:11,color:C.textMid,width:150,flexShrink:0}}>{l}</span>
                <div className="prog-track" style={{flex:1}}><div className="prog-fill" style={{width:`${v}%`,background:C.grad}}/></div>
                <span style={{fontSize:11,color:C.textMuted,width:28,textAlign:"right"}}>{v}%</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
const CalendarView = ({onSelect, events, onNav}) => {
  const [curr, setCurr]     = useState(new Date(2026,5,1));
  const [selDay, setSelDay] = useState(null);
  const [calView, setCalView] = useState("month"); // month | week | day | all
  const yr=curr.getFullYear(), mo=curr.getMonth();
  const fd=new Date(yr,mo,1).getDay(), days=new Date(yr,mo+1,0).getDate();
  const today=new Date();
  const MONTHS=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DAYS_SHORT=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const evOn=d=>events.filter(e=>{const dd=new Date(e.date);return dd.getFullYear()===yr&&dd.getMonth()===mo&&dd.getDate()===d;});
  // Week view: get 7 days starting from Monday of curr week
  const getWeekDays = () => {
    const d = new Date(curr);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day===0?6:day-1));
    return Array.from({length:7},(_,i)=>{ const dd=new Date(monday); dd.setDate(monday.getDate()+i); return dd; });
  };
  const weekDays = getWeekDays();
  const evOnDate = (dt) => events.filter(e=>{ const dd=new Date(e.date); return dd.toDateString()===dt.toDateString(); });
  const sortedEvents = [...events].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const monthView = calView==="month" ? (
      <div style={{display:"grid",gridTemplateColumns:"1fr 250px",gap:20,alignItems:"start"}}>
        <div className="card" style={{padding:22}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <button className="btn btn-white btn-sm" style={{padding:"5px 12px",fontSize:16}} onClick={()=>setCurr(new Date(yr,mo-1,1))}>‹</button>
            <div style={{fontSize:16,fontWeight:800}}>{MONTHS[mo]} {yr}</div>
            <button className="btn btn-white btn-sm" style={{padding:"5px 12px",fontSize:16}} onClick={()=>setCurr(new Date(yr,mo+1,1))}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:5}}>
            {["Do","Lu","Ma","Mi","Ju","Vi","Sa"].map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:C.textMuted,padding:"3px 0",fontWeight:700}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
            {Array.from({length:fd}).map((_,i)=><div key={`e${i}`}/>)}
            {Array.from({length:days}).map((_,i)=>{
              const day=i+1, evs=evOn(day);
              const isToday=today.getDate()===day&&today.getMonth()===mo&&today.getFullYear()===yr;
              const isSel=selDay===day;
              return (
                <div key={day} onClick={()=>setSelDay(isSel?null:day)} style={{
                  aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  borderRadius:9,fontSize:12,fontWeight:evs.length?800:400,cursor:"pointer",transition:"all .12s",gap:2,
                  background:isSel?C.primary:isToday?C.primaryLt:"transparent",
                  color:isSel?"#fff":isToday?C.primary:C.text
                }}>
                  <span>{day}</span>
                  {evs.length>0&&<div style={{display:"flex",gap:2}}>{evs.slice(0,3).map((e,idx)=><div key={idx} style={{width:4,height:4,borderRadius:"50%",background:isSel?"#fff":e.color}}/>)}</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:800,color:C.textMuted,marginBottom:10,textTransform:"uppercase",letterSpacing:".08em"}}>
            {selDay?`${selDay} de ${MONTHS[mo]}`:"Próximos eventos"}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {(selDay?evOn(selDay):events.filter(e=>e.status!=="finished")).map(e=>(
              <div key={e.id} className="card card-hov" style={{padding:14,cursor:"pointer"}} onClick={()=>onSelect(e)}>
                <div style={{height:3,borderRadius:2,background:e.color,marginBottom:8}}/>
                <div style={{fontSize:12,fontWeight:800,marginBottom:3,lineHeight:1.3}}>{e.title}</div>
                <div style={{fontSize:11,color:C.textMuted}}>{e.speaker}</div>
                <div style={{fontSize:11,color:C.textMuted,marginTop:4,display:"flex",gap:7}}>🕐 {e.time} <STag status={e.status}/></div>
              </div>
            ))}
            {selDay&&evOn(selDay).length===0&&<div style={{color:C.textMuted,fontSize:12,textAlign:"center",padding:20}}>Sin eventos este día</div>}
          </div>
        </div>
      </div>
  ) : null;


  return (
    <div style={{padding:"18px 22px",maxWidth:960}} className="page-in">
      <Breadcrumbs items={[{label:"Dashboard",view:"dashboard"},{label:"Calendario"}]} onNav={onNav}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div style={{fontSize:20,fontWeight:900,letterSpacing:"-0.02em"}}>Calendario</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[["day","Día"],["week","Semana"],["month","Mes"],["all","Ver todo"]].map(([k,l])=>(
            <button key={k} className={`btn btn-sm ${calView===k?"btn-primary":"btn-white"}`} onClick={()=>setCalView(k)}>{l}</button>
          ))}
        </div>
      </div>
      {/* Week view */}
      {calView==="week"&&(
        <div className="card" style={{padding:20,marginBottom:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <button className="btn btn-white btn-sm" onClick={()=>setCurr(d=>{const nd=new Date(d);nd.setDate(nd.getDate()-7);return nd;})}>‹ Semana ant.</button>
            <div style={{fontSize:14,fontWeight:800}}>Semana del {weekDays[0].getDate()} al {weekDays[6].getDate()} de {MONTHS[weekDays[0].getMonth()]} {weekDays[0].getFullYear()}</div>
            <button className="btn btn-white btn-sm" onClick={()=>setCurr(d=>{const nd=new Date(d);nd.setDate(nd.getDate()+7);return nd;})}>Sig. semana ›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
            {weekDays.map((wd,i)=>{
              const evs=evOnDate(wd);
              const isT=wd.toDateString()===today.toDateString();
              return (
                <div key={i} style={{textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.textMuted,fontWeight:700,marginBottom:6}}>{DAYS_SHORT[wd.getDay()]}</div>
                  <div style={{fontSize:16,fontWeight:isT?900:600,color:isT?C.primary:C.text,marginBottom:6,
                    width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 6px",
                    background:isT?C.primaryLt:"transparent"}}>{wd.getDate()}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:3,minHeight:40}}>
                    {evs.map(e=>(
                      <div key={e.id} onClick={()=>onSelect(e)} style={{fontSize:10,fontWeight:700,padding:"3px 5px",borderRadius:5,background:e.color+"22",color:e.color,cursor:"pointer",lineHeight:1.3,textAlign:"left"}}>{e.title.slice(0,20)}{e.title.length>20?"...":""}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day view */}
      {calView==="day"&&(
        <div className="card" style={{padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <button className="btn btn-white btn-sm" onClick={()=>setCurr(d=>{const nd=new Date(d);nd.setDate(nd.getDate()-1);return nd;})}>‹ Ayer</button>
            <div style={{fontSize:16,fontWeight:800}}>{DAYS_SHORT[curr.getDay()]} {curr.getDate()} de {MONTHS[curr.getMonth()]} {curr.getFullYear()}</div>
            <button className="btn btn-white btn-sm" onClick={()=>setCurr(d=>{const nd=new Date(d);nd.setDate(nd.getDate()+1);return nd;})}>Mañana ›</button>
          </div>
          {evOnDate(curr).length===0
            ? <div style={{textAlign:"center",padding:"40px 0",color:C.textMuted,fontSize:13}}>Sin eventos este día</div>
            : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {evOnDate(curr).map(e=>(
                  <div key={e.id} className="card card-hov" style={{padding:16,cursor:"pointer",borderLeft:`4px solid ${e.color}`}} onClick={()=>onSelect(e)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div style={{fontSize:14,fontWeight:800}}>{e.title}</div>
                      <STag status={e.status}/>
                    </div>
                    <div style={{fontSize:12,color:C.textMuted}}>🕐 {e.time} – {e.endTime||"—"} · 📍 {e.location}</div>
                    <div style={{fontSize:12,color:C.textMid,marginTop:4}}>👤 {e.speaker}</div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* All events list */}
      {calView==="all"&&(
        <div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {sortedEvents.map(e=>(
              <div key={e.id} className="card card-hov" style={{padding:16,cursor:"pointer",display:"flex",gap:14,alignItems:"center",borderLeft:`4px solid ${e.color}`}} onClick={()=>onSelect(e)}>
                <div style={{textAlign:"center",minWidth:44}}>
                  <div style={{fontSize:10,color:C.textMuted,fontWeight:700,textTransform:"uppercase"}}>{MONTHS[new Date(e.date).getMonth()].slice(0,3)}</div>
                  <div style={{fontSize:24,fontWeight:900,color:e.color,lineHeight:1}}>{new Date(e.date).getDate()}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:800,marginBottom:3}}>{e.title}</div>
                  <div style={{fontSize:11,color:C.textMuted}}>🕐 {e.time} · 📍 {e.location} · 👤 {e.speaker}</div>
                </div>
                <STag status={e.status}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month view */}
      {monthView}
    </div>
  );
};

// ─── PLANS EDITOR ─────────────────────────────────────────────────────────────
const PlansEditor = ({onNav}) => {
  const [plans, setPlans] = useState([
    {id:"basico",    name:"Básico",     price:"15", highlight:false, features:["3 eventos/mes","QR + Manual","Registro online (QR)","Lista de asistentes","Exportar Excel"]},
    {id:"pro",       name:"Pro",        price:"40", highlight:true,  features:["Eventos ilimitados","Facial + QR + RFID","Registro online","Reportes avanzados","Encuestas","Multi-disertante","Soporte prioritario"]},
    {id:"enterprise",name:"Enterprise", price:"80", highlight:false, features:["Todo Pro incluido","Huella dactilar","Multiorganización","Branding propio","API REST","Soporte 24/7"]},
  ]);
  const [saved, setSaved] = useState(false);
  const upd=(id,k,v)=>setPlans(p=>p.map(pl=>pl.id===id?{...pl,[k]:v}:pl));
  const addF=(id)=>setPlans(p=>p.map(pl=>pl.id===id?{...pl,features:[...pl.features,"Nueva característica"]}:pl));
  const remF=(id,i)=>setPlans(p=>p.map(pl=>pl.id===id?{...pl,features:pl.features.filter((_,j)=>j!==i)}:pl));
  const updF=(id,i,v)=>setPlans(p=>p.map(pl=>pl.id===id?{...pl,features:pl.features.map((f,j)=>j===i?v:f)}:pl));
  return (
    <div style={{padding:"18px 22px",maxWidth:1000}} className="page-in">
      <Breadcrumbs items={[{label:"Dashboard",view:"dashboard"},{label:"Editor de planes"}]} onNav={onNav}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,marginBottom:2}}>Editor de planes</div>
          <div style={{color:C.textMuted,fontSize:12}}>Configurá los planes que aparecen en la landing pública</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2500);}}>
          {saved?"✅ Guardado":"Guardar cambios"}
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
        {plans.map(pl=>(
          <div key={pl.id} className="card" style={{padding:22,border:pl.highlight?`2px solid ${C.primary}`:undefined,boxShadow:pl.highlight?`0 4px 20px ${C.primaryGlow}`:undefined,position:"relative"}}>
            {pl.highlight&&<div className="tag tb" style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",fontSize:10,whiteSpace:"nowrap"}}>⭐ Más popular</div>}
            <div style={{marginBottom:10}}>
              <label className="lbl">Nombre</label>
              <input className="inp" value={pl.name} onChange={e=>upd(pl.id,"name",e.target.value)} style={{fontSize:13}}/>
            </div>
            <div style={{marginBottom:10,display:"flex",gap:8,alignItems:"flex-end"}}>
              <div style={{flex:1}}>
                <label className="lbl">Precio USD/mes</label>
                <input className="inp" type="number" value={pl.price} onChange={e=>upd(pl.id,"price",e.target.value)} style={{fontSize:13}}/>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",fontSize:12,fontWeight:600,color:C.textMid,paddingBottom:4}}>
                <input type="checkbox" checked={pl.highlight} onChange={e=>upd(pl.id,"highlight",e.target.checked)} style={{accentColor:C.primary}}/>
                Destacado
              </label>
            </div>
            <label className="lbl">Características</label>
            <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:8}}>
              {pl.features.map((f,i)=>(
                <div key={i} style={{display:"flex",gap:4}}>
                  <input className="inp" value={f} style={{fontSize:11,padding:"5px 8px"}} onChange={e=>updF(pl.id,i,e.target.value)}/>
                  <button className="btn btn-danger btn-sm" style={{padding:"4px 6px",flexShrink:0,fontSize:11}} onClick={()=>remF(pl.id,i)}>✕</button>
                </div>
              ))}
            </div>
            <button className="btn btn-white btn-sm" style={{width:"100%",fontSize:11}} onClick={()=>addF(pl.id)}>+ Característica</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── REPORTS ──────────────────────────────────────────────────────────────────
const ReportsView = ({events, participants, checkins, onNav}) => {
  const methodCounts = {
    facial: checkins.filter(c=>c.method==="facial").length,
    qr:     checkins.filter(c=>c.method==="qr").length,
    rfid:   checkins.filter(c=>c.method==="rfid").length,
    huella: checkins.filter(c=>c.method==="huella").length,
  };
  const totalCheckins = checkins.length || 1;
  const paidTotal = participants.filter(p=>p.payStatus==="paid").reduce((a,p)=>a+(p.payAmount||0),0);
  const pendingTotal = participants.filter(p=>p.payStatus==="pending").reduce((a,p)=>a+(p.payAmount||0),0);

  return (
  <div style={{padding:"18px 22px",maxWidth:1000}} className="page-in">
    <Breadcrumbs items={[{label:"Dashboard",view:"dashboard"},{label:"Reportes"}]} onNav={onNav}/>
    <div style={{fontSize:20,fontWeight:900,marginBottom:3}}>Reportes y métricas</div>
    <div style={{color:C.textMuted,fontSize:12,marginBottom:20}}>Resumen global · Exportar en Excel, PDF o CSV</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}>
      <Stat icon="🎪" label="Total eventos"      value={events.length}                    accent={C.primary}/>
      <Stat icon="🟢" label="Eventos activos"    value={events.filter(e=>e.status==="active").length}   accent={C.teal}/>
      <Stat icon="🏁" label="Finalizados"        value={events.filter(e=>e.status==="finished").length} accent={C.textMuted}/>
      <Stat icon="👥" label="Participantes"      value={participants.length}               accent={C.primary}/>
      <Stat icon="✅" label="Presentes"          value={checkins.filter(c=>c.status==="in").length}     accent={C.teal}/>
      <Stat icon="💳" label="Pagos recibidos"    value={participants.filter(p=>p.payStatus==="paid").length} accent={C.amber}/>
    </div>
    {/* Access method breakdown */}
    <div className="card" style={{padding:20,marginBottom:20}}>
      <div style={{fontSize:13,fontWeight:800,marginBottom:14}}>Accesos por método</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12}}>
        {CHECK_METHODS.map(m=>{
          const cnt = methodCounts[m.id]||0;
          const pct = Math.round((cnt/totalCheckins)*100);
          return (
            <div key={m.id} style={{display:"flex",flexDirection:"column",gap:6}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:16}}>{m.icon}</span>
                  <span style={{fontSize:12,fontWeight:700}}>{m.short}</span>
                </div>
                <span style={{fontSize:13,fontWeight:900,color:m.color}}>{cnt}</span>
              </div>
              <div className="prog-track">
                <div className="prog-fill" style={{width:`${pct}%`,background:m.color}}/>
              </div>
              <div style={{fontSize:10,color:C.textMuted,textAlign:"right"}}>{pct}% del total</div>
            </div>
          );
        })}
      </div>
    </div>
    {/* Payments */}
    <div className="card" style={{padding:20,marginBottom:20}}>
      <div style={{fontSize:13,fontWeight:800,marginBottom:14}}>Resumen de ingresos</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        {[
          {l:"Pagados",v:`$${paidTotal.toLocaleString("es-AR")}`,c:C.teal,n:participants.filter(p=>p.payStatus==="paid").length},
          {l:"Pendientes",v:`$${pendingTotal.toLocaleString("es-AR")}`,c:C.coral,n:participants.filter(p=>p.payStatus==="pending").length},
          {l:"Parciales",v:participants.filter(p=>p.payStatus==="partial").length,c:C.amber,n:participants.filter(p=>p.payStatus==="partial").length},
          {l:"Gratuitos",v:participants.filter(p=>p.payStatus==="free").length,c:C.textMuted,n:participants.filter(p=>p.payStatus==="free").length},
        ].map(s=>(
          <div key={s.l} style={{textAlign:"center",padding:"14px 10px",borderRadius:12,background:C.bg}}>
            <div style={{fontSize:22,fontWeight:900,color:s.c,marginBottom:2}}>{s.v}</div>
            <div style={{fontSize:11,color:C.textMuted}}>{s.l}{typeof s.n==="number"?` (${s.n})`:"" }</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:20}}>
      {[{ico:"📊",t:"Por tipo de evento",d:"Congreso, seminario, lanzamiento...",c:C.primary},
        {ico:"👤",t:"Por disertante",    d:"Historial y asistencia por orador", c:C.purple},
        {ico:"📅",t:"Por período",       d:"Comparativa mensual y anual",       c:C.teal},
        {ico:"🔄",t:"Métodos de acceso", d:"Facial, QR, RFID, Huella",          c:C.amber},
        {ico:"💳",t:"Ingresos",          d:"Pagados, pendientes, parciales",    c:C.coral},
        {ico:"🏢",t:"Por organización",  d:"Comparativa entre organizaciones",  c:C.purple},
      ].map(r=>(
        <div key={r.t} className="card card-lift" style={{padding:20,cursor:"pointer"}}>
          <div style={{width:40,height:40,borderRadius:11,background:`${r.c}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:12}}>{r.ico}</div>
          <div style={{fontSize:13,fontWeight:800,marginBottom:4}}>{r.t}</div>
          <div style={{fontSize:11,color:C.textMuted,marginBottom:12,lineHeight:1.5}}>{r.d}</div>
          <div style={{display:"flex",gap:5}}>
            <button className="btn btn-white btn-sm" style={{flex:1,fontSize:10}} onClick={()=>exportCSV(
              r.t==="Métodos de acceso"?CHECK_METHODS.map(m=>({Método:m.short,Accesos:checkins.filter(c=>c.method===m.id).length})):
              r.t==="Ingresos"?participants.map(p=>({Nombre:`${p.nombre} ${p.apellido}`,Estado:p.payStatus,Monto:p.payAmount||0})):
              events.map(e=>({Título:e.title,Tipo:e.type,Fecha:e.date,Estado:e.status,Asistentes:e.attendees})),
              `reporte_${r.t.split(' ').join('_').toLowerCase()}.csv`
            )}>CSV</button>
            <button className="btn btn-white btn-sm" style={{flex:1,fontSize:10}} onClick={()=>printTable(
              r.t,['#','Nombre','Detalle'],
              events.slice(0,20).map((e,i)=>[i+1,e.title,e.date])
            )}>PDF</button>
            <button className="btn btn-white btn-sm" style={{flex:1,fontSize:10}} onClick={()=>exportJSON(
              events.map(e=>({id:e.id,title:e.title,date:e.date,status:e.status})),
              `${r.t.replace(/\s+/g,'_')}.json`
            )}>JSON</button>
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};

// ─── ORG MODAL ────────────────────────────────────────────────────────────────
const OrgModal = ({org, onSave, onClose}) => {
  const isEdit = !!org?.id;
  const [form, setForm] = useState({
    name:  org?.name  || "",
    plan:  org?.plan  || "pro",
    active: org?.active !== undefined ? org.active : true,
    permissions: org ? (PLAN_PERMISSIONS[org.plan]||[]) : PLAN_PERMISSIONS.pro,
  });
  const [errors, setErrors] = useState({});
  const {show, ToastEl} = useToast();

  const upd = useCallback((k,v) => setForm(f=>({...f,[k]:v})),[]);

  // Auto-set permissions when plan changes
  useEffect(()=>{
    setForm(f=>({...f, permissions: PLAN_PERMISSIONS[f.plan]||[]}));
  },[form.plan]);

  const togglePerm = (pid) => setForm(f=>({
    ...f, permissions: f.permissions.includes(pid)
      ? f.permissions.filter(x=>x!==pid)
      : [...f.permissions, pid]
  }));

  const validate = () => {
    const e = {};
    if(!form.name.trim()) e.name = "Requerido";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if(!validate()) return;
    const saved = {
      ...form,
      id: org?.id || Date.now(),
      events: org?.events || 0,
      users:  org?.users  || 0,
    };
    onSave(saved);
    show(isEdit ? "Organización actualizada" : "Organización creada. Se generaron credenciales.");
    setTimeout(onClose, 800);
  };

  return (
    <div className="overlay" onClick={onClose}>
      {ToastEl}
      <div className="modal" style={{padding:26, maxWidth:520}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontSize:17,fontWeight:900}}>{isEdit?"Editar organización":"Nueva organización"}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:14}}>
          <Field id="name" label="Nombre de la organización *" placeholder="Hospital / Empresa / Instituto" value={form.name} onChange={upd} error={errors.name}/>
          <div style={{flex:"1 1 100%"}}>
            <label className="lbl">Plan contratado</label>
            <select className="inp" value={form.plan} onChange={e=>upd("plan",e.target.value)}>
              {["basico","pro","enterprise"].map(p=>(
                <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Permissions */}
        <div className="card" style={{padding:14,marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:800,color:C.textMid,textTransform:"uppercase",letterSpacing:".06em"}}>
              Permisos del plan
            </div>
            <div style={{display:"flex",gap:5}}>
              <button className="btn btn-ghost btn-sm" style={{fontSize:10}} onClick={()=>setForm(f=>({...f,permissions:ALL_PERMISSIONS.map(p=>p.id)}))}>Todos</button>
              <button className="btn btn-ghost btn-sm" style={{fontSize:10}} onClick={()=>setForm(f=>({...f,permissions:[]}))}>Ninguno</button>
            </div>
          </div>
          <div style={{maxHeight:200,overflowY:"auto"}}>
            {ALL_PERMISSIONS.map(p=>(
              <div key={p.id} className="perm-row">
                <span style={{fontSize:12,color:C.textMid,fontWeight:500}}>{p.label}</span>
                <input type="checkbox" checked={form.permissions.includes(p.id)} onChange={()=>togglePerm(p.id)} style={{accentColor:C.primary}}/>
              </div>
            ))}
          </div>
        </div>

        {!isEdit && (
          <div className="card" style={{padding:14,marginBottom:14,background:C.amberLt,border:`1px solid ${C.amber}44`}}>
            <div style={{fontSize:12,fontWeight:700,color:"#b07400",marginBottom:4}}>⚡ Credenciales automáticas</div>
            <div style={{fontSize:11,color:"#8a5900"}}>
              Se generarán automáticamente: usuario administrador, contraseña temporal y email de bienvenida con acceso al portal.
            </div>
          </div>
        )}

        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:16}}>
          <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:13,fontWeight:600,color:C.textMid}}>
            <input type="checkbox" checked={form.active} onChange={e=>upd("active",e.target.checked)} style={{accentColor:C.primary}}/>
            Organización activa
          </label>
        </div>

        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" style={{flex:1}} onClick={handleSave}>
            {isEdit ? "Guardar cambios" : "Crear organización"}
          </button>
        </div>
      </div>
    </div>
  );
};


// ─── ORGS VIEW ────────────────────────────────────────────────────────────────
const OrgsView = ({orgs, setOrgs, events, onNav, onSelectOrg}) => {
  const [search,    setSearch]    = useState("");
  const [showModal, setShowModal] = useState(null);
  const {show, ToastEl}           = useToast();
  const filtered = orgs.filter(o=>`${o.name} ${o.contactName||""} ${o.city||""}`.toLowerCase().includes(search.toLowerCase()));
  const handleSave = data => { setOrgs(p=>p.some(x=>x.id===data.id)?p.map(x=>x.id===data.id?data:x):[...p,data]); setShowModal(null); };
  const handleDelete = id => { if(!window.confirm("¿Eliminar esta organización?")) return; setOrgs(p=>p.filter(x=>x.id!==id)); show("Eliminada","error"); };
  return (
    <div style={{padding:"18px 22px",maxWidth:1100}} className="page-in">
      {ToastEl}
      <Breadcrumbs items={[{label:"Dashboard",view:"dashboard"},{label:"Organizaciones"}]} onNav={onNav}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div><div style={{fontSize:20,fontWeight:900,marginBottom:2}}>Organizaciones</div><div style={{fontSize:12,color:C.textMuted}}>Empresas, hospitales e instituciones</div></div>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowModal("new")}>＋ Nueva organización</button>
      </div>
      <input className="inp" placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:340,marginBottom:16}}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {filtered.map(o=>{
          const evCt=events.filter(e=>e.orgId===o.id).length;
          return (
            <div key={o.id} className="card" style={{padding:20,position:"relative"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:C.grad,borderRadius:"16px 16px 0 0"}}/>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
                <div style={{width:52,height:52,borderRadius:12,background:C.bg,border:`2px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                  {o.logo?<img src={o.logo} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<span style={{fontSize:22}}>🏢</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                    <div style={{fontSize:14,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name}</div>
                    <span style={{width:7,height:7,borderRadius:"50%",background:o.active?C.teal:C.coral,flexShrink:0}}/>
                  </div>
                  <span className={`tag ${o.plan==="enterprise"?"tp":o.plan==="pro"?"tb":"ta"}`} style={{fontSize:9}}>{o.plan}</span>
                </div>
              </div>
              <div style={{fontSize:11,color:C.textMid,marginBottom:2}}>👤 {o.contactName||"—"}{o.contactRole?` · ${o.contactRole}`:""}</div>
              <div style={{fontSize:11,color:C.textMid,marginBottom:2}}>📧 {o.email||"—"}</div>
              <div style={{fontSize:11,color:C.textMid,marginBottom:2}}>📱 {o.phone||"—"}</div>
              <div style={{fontSize:11,color:C.textMuted,marginBottom:12}}>📍 {[o.city,o.country].filter(Boolean).join(", ")||"—"}</div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderTop:`1px solid ${C.border}`,marginBottom:12}}>
                <span style={{fontSize:11,color:C.textMuted}}>🎪 {evCt} evento{evCt!==1?"s":""}</span>
                <span style={{fontSize:11,color:C.textMuted}}>👥 {o.users} usuario{o.users!==1?"s":""}</span>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button className="btn btn-white btn-sm" style={{flex:1,fontSize:11}} onClick={()=>onSelectOrg(o)}>📋 Ver eventos</button>
                <button className="btn btn-white btn-sm" style={{fontSize:11}} onClick={()=>setShowModal(o)}>✏️</button>
                <button className="btn btn-danger btn-sm" style={{fontSize:11}} onClick={()=>handleDelete(o.id)}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
      {showModal&&<OrgModal org={showModal==="new"?null:showModal} onSave={handleSave} onClose={()=>setShowModal(null)}/>}
    </div>
  );
};

// ─── ORG DETAIL VIEW ──────────────────────────────────────────────────────────
const OrgDetailView = ({org, events, setEvents, onBack, onNav}) => {
  const orgEvents = events.filter(e=>e.orgId===org.id);
  const {show, ToastEl} = useToast();
  return (
    <div style={{padding:"18px 22px",maxWidth:1050}} className="page-in">
      {ToastEl}
      <Breadcrumbs items={[{label:"Dashboard",view:"dashboard"},{label:"Organizaciones",view:"orgs"},{label:org.name}]} onNav={onNav}/>
      <div className="card" style={{padding:20,marginBottom:20,display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{width:64,height:64,borderRadius:14,background:C.bg,border:`2px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
          {org.logo?<img src={org.logo} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<span style={{fontSize:28}}>🏢</span>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:900,marginBottom:3}}>{org.name}</div>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:6}}>{org.razonSocial}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {org.email&&<span className="tag tgr" style={{fontSize:10}}>📧 {org.email}</span>}
            {org.phone&&<span className="tag tgr" style={{fontSize:10}}>📱 {org.phone}</span>}
            {org.city&&<span className="tag tgr" style={{fontSize:10}}>📍 {org.city}</span>}
            <span className={`tag ${org.plan==="enterprise"?"tp":org.plan==="pro"?"tb":"ta"}`} style={{fontSize:10}}>{org.plan}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-primary btn-sm" onClick={()=>onNav("events")}>＋ Nuevo evento</button>
          <button className="btn btn-white btn-sm" onClick={onBack}>← Volver</button>
        </div>
      </div>
      <div style={{fontSize:15,fontWeight:800,marginBottom:12}}>Eventos de {org.name} ({orgEvents.length})</div>
      {orgEvents.length===0
        ? <div style={{textAlign:"center",padding:40,color:C.textMuted}}><div style={{fontSize:32,marginBottom:10}}>🎪</div><div>Sin eventos aún</div></div>
        : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
            {orgEvents.map(e=>(
              <div key={e.id} className="card card-lift" style={{padding:18,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${e.color},${e.color}33)`}}/>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><STag status={e.status}/><span className="tag tp" style={{fontSize:10}}>{e.type}</span></div>
                <div style={{fontSize:13,fontWeight:800,marginBottom:5,lineHeight:1.3}}>{e.title}</div>
                <div style={{fontSize:11,color:C.textMuted,marginBottom:5}}>📅 {new Date(e.date).toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"})} · 🕐 {e.time}</div>
                <div style={{fontSize:11,color:C.textMuted,marginBottom:10}}>📍 {e.location}</div>
                <div className="prog-track"><div className="prog-fill" style={{width:`${Math.round((e.attendees/e.capacity)*100)}%`,background:e.color}}/></div>
                <div style={{fontSize:10,color:C.textMuted,marginTop:4}}>{e.attendees}/{e.capacity} asistentes</div>
              </div>
            ))}
          </div>
      }
    </div>
  );
};

// ─── ORG MODAL (FULL) ─────────────────────────────────────────────────────────

// ─── SPEAKER MODAL + VIEW ─────────────────────────────────────────────────────
const SpeakerModal = ({speaker, onSave, onClose, events=INIT_EVENTS}) => {
  const isEdit = !!speaker?.id;
  const [form, setForm] = useState({
    nombre:speaker?.nombre||"",apellido:speaker?.apellido||"",dni:speaker?.dni||"",
    email:speaker?.email||"",tel:speaker?.tel||"",address:speaker?.address||"",
    cargo:speaker?.cargo||"",empresa:speaker?.empresa||"",orgId:speaker?.orgId||"",
    events:speaker?.events||[],active:speaker?.active!==undefined?speaker.active:true,
    foto:speaker?.foto||null,firma:speaker?.firma||null,
  });
  const [errors, setErrors] = useState({});
  const {show, ToastEl} = useToast();
  const fotoRef = useRef(); const firmaRef = useRef();
  const upd = useCallback((k,v)=>setForm(f=>({...f,[k]:v})),[]);
  const toggleEv = id => setForm(f=>({...f,events:f.events.includes(id)?f.events.filter(x=>x!==id):[...f.events,id]}));
  const handleImg = (key,e) => { const file=e.target.files[0]; if(!file) return; const r=new FileReader(); r.onload=ev=>upd(key,ev.target.result); r.readAsDataURL(file); };
  const validate = () => { const e={}; if(!form.nombre.trim()) e.nombre="Requerido"; if(!form.apellido.trim()) e.apellido="Requerido"; if(!form.email.trim()) e.email="Requerido"; setErrors(e); return !Object.keys(e).length; };
  const handleSave = () => { if(!validate()) return; onSave({...form,id:speaker?.id||Date.now()}); show(isEdit?"Actualizado":"Disertante creado"); setTimeout(onClose,700); };
  return (
    <div className="overlay" onClick={onClose}>
      {ToastEl}
      <div className="modal" style={{padding:0,maxWidth:560,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:17,fontWeight:900}}>{isEdit?"Editar disertante":"Nuevo disertante"}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{padding:"20px 24px",maxHeight:"65vh",overflowY:"auto"}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:18}}>
            <div style={{textAlign:"center"}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:C.bg,border:`2px dashed ${C.borderMid}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",cursor:"pointer",margin:"0 auto 6px"}} onClick={()=>fotoRef.current?.click()}>
                {form.foto?<img src={form.foto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:28}}>👤</span>}
              </div>
              <button className="btn btn-white btn-sm" style={{fontSize:10}} onClick={()=>fotoRef.current?.click()}>Foto</button>
              <input ref={fotoRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleImg("foto",e)}/>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{width:120,height:72,borderRadius:10,background:C.bg,border:`2px dashed ${C.borderMid}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",cursor:"pointer",margin:"0 auto 6px"}} onClick={()=>firmaRef.current?.click()}>
                {form.firma?<img src={form.firma} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<span style={{fontSize:11,color:C.textMuted}}>Firma digital</span>}
              </div>
              <button className="btn btn-white btn-sm" style={{fontSize:10}} onClick={()=>firmaRef.current?.click()}>Firma</button>
              <input ref={firmaRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleImg("firma",e)}/>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:12,fontWeight:600,color:C.textMid,marginTop:8}}>
              <input type="checkbox" checked={form.active} onChange={e=>upd("active",e.target.checked)} style={{accentColor:C.primary}}/> Activo
            </label>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:14}}>
            <Field id="nombre"   label="Nombre *"    placeholder="Nombre"           value={form.nombre}   onChange={upd} error={errors.nombre}   half/>
            <Field id="apellido" label="Apellido *"   placeholder="Apellido"         value={form.apellido} onChange={upd} error={errors.apellido} half/>
            <Field id="dni"      label="Documento"    placeholder="DNI/Pasaporte"    value={form.dni}      onChange={upd} half/>
            <Field id="email"    label="Correo *"     type="email" placeholder="email@empresa.com" value={form.email} onChange={upd} error={errors.email}/>
            <Field id="tel"      label="Teléfono"     placeholder="+54 11..."        value={form.tel}      onChange={upd} half/>
            <Field id="address"  label="Dirección"    placeholder="Calle y número"  value={form.address}  onChange={upd} half/>
            <Field id="cargo"    label="Cargo"        placeholder="Dr. / Lic."      value={form.cargo}    onChange={upd} half/>
            <Field id="empresa"  label="Empresa"      placeholder="Organización"    value={form.empresa}  onChange={upd} half/>
          </div>
          <div style={{marginBottom:8}}><label className="lbl">Eventos vinculados</label>
            <div style={{maxHeight:130,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:10,padding:8}}>
              {events.map(ev=>(
                <label key={ev.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",cursor:"pointer",fontSize:12,borderBottom:`1px solid ${C.border}`}}>
                  <input type="checkbox" checked={form.events.includes(ev.id)} onChange={()=>toggleEv(ev.id)} style={{accentColor:C.primary}}/>
                  <span style={{fontWeight:600}}>{ev.title}</span><STag status={ev.status}/>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div style={{padding:"14px 24px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" style={{flex:1}} onClick={handleSave}>{isEdit?"Guardar":"Crear disertante"}</button>
        </div>
      </div>
    </div>
  );
};

const SpeakersView = ({speakers, setSpeakers, events=INIT_EVENTS, onNav}) => {
  const [search,    setSearch]    = useState("");
  const [evFilter,  setEvFilter]  = useState("");
  const [showModal, setShowModal] = useState(null);
  const {show, ToastEl}           = useToast();
  const filtered = speakers.filter(s=>{
    const n=`${s.nombre} ${s.apellido} ${s.empresa}`.toLowerCase();
    if(search&&!n.includes(search.toLowerCase())) return false;
    if(evFilter&&!s.events.includes(Number(evFilter))) return false;
    return true;
  });
  const handleSave = data => { setSpeakers(p=>p.some(x=>x.id===data.id)?p.map(x=>x.id===data.id?data:x):[...p,data]); setShowModal(null); };
  const handleDelete = id => { if(!window.confirm("¿Eliminar?")) return; setSpeakers(p=>p.filter(x=>x.id!==id)); show("Eliminado","error"); };
  return (
    <div style={{padding:"18px 22px",maxWidth:1050}} className="page-in">
      {ToastEl}
      <Breadcrumbs items={[{label:"Dashboard",view:"dashboard"},{label:"Disertantes"}]} onNav={onNav}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div><div style={{fontSize:20,fontWeight:900,marginBottom:2}}>Disertantes</div><div style={{fontSize:12,color:C.textMuted}}>Oradores y expositores</div></div>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowModal("new")}>＋ Nuevo disertante</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <input className="inp" placeholder="🔍 Buscar nombre, empresa..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:200,maxWidth:300}}/>
        <select className="inp" style={{maxWidth:220}} value={evFilter} onChange={e=>setEvFilter(e.target.value)}>
          <option value="">Todos los eventos</option>
          {events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {filtered.map(s=>(
          <div key={s.id} className="card" style={{padding:18}}>
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:C.primaryLt,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,border:`2px solid ${C.border}`}}>
                {s.foto?<img src={s.foto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:22}}>👤</span>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:800,marginBottom:1}}>{s.nombre} {s.apellido}</div>
                <div style={{fontSize:11,color:C.textMuted,marginBottom:3}}>{s.cargo}</div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:s.active?C.teal:C.textLight,display:"inline-block"}}/>
                  <span style={{fontSize:10,color:C.textMuted}}>{s.active?"Activo":"Inactivo"}</span>
                </div>
              </div>
            </div>
            <div style={{fontSize:11,color:C.textMid,marginBottom:3}}>🏢 {s.empresa}</div>
            <div style={{fontSize:11,color:C.textMid,marginBottom:3}}>📧 {s.email}</div>
            <div style={{fontSize:11,color:C.textMid,marginBottom:10}}>📱 {s.tel}</div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>Eventos ({s.events.length})</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                {s.events.slice(0,2).map(evId=>{const ev=events.find(e=>e.id===evId); return ev?<span key={evId} className="tag tgr" style={{fontSize:9}}>{ev.title.slice(0,22)}</span>:null;})}
                {s.events.length>2&&<span className="tag tgr" style={{fontSize:9}}>+{s.events.length-2}</span>}
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button className="btn btn-white btn-sm" style={{flex:1,fontSize:11}} onClick={()=>setShowModal(s)}>✏️ Editar</button>
              <button className="btn btn-danger btn-sm" style={{fontSize:11}} onClick={()=>handleDelete(s.id)}>🗑</button>
            </div>
          </div>
        ))}
        {filtered.length===0&&<div style={{color:C.textMuted,fontSize:13,padding:24,gridColumn:"1/-1",textAlign:"center"}}>Sin resultados</div>}
      </div>
      {showModal&&<SpeakerModal speaker={showModal==="new"?null:showModal} onSave={handleSave} onClose={()=>setShowModal(null)} events={events}/>}
    </div>
  );
};

// ─── COMM SETTINGS ────────────────────────────────────────────────────────────
const CommSettings = ({onNav}) => {
  const [comm, setComm]   = useState(INIT_COMM);
  const [autos, setAutos] = useState(INIT_AUTOMATIONS);
  const [tab, setTab]     = useState("smtp");
  const {show, ToastEl}   = useToast();
  const upd = (section,k,v) => setComm(c=>({...c,[section]:{...c[section],[k]:v}}));
  const toggleAuto = id => setAutos(prev=>prev.map(a=>a.id===id?{...a,enabled:!a.enabled}:a));
  const save = () => show("Configuración guardada");
  const WA_PROVIDERS = [{id:"evolution",label:"Evolution API (Open Source)"},{id:"twilio",label:"Twilio WhatsApp"},{id:"meta",label:"Meta Business API"},{id:"baileys",label:"Baileys (Node.js)"}];
  return (
    <div style={{padding:"18px 22px",maxWidth:860}} className="page-in">
      {ToastEl}
      <Breadcrumbs items={[{label:"Dashboard",view:"dashboard"},{label:"Comunicaciones"}]} onNav={onNav}/>
      <div style={{fontSize:20,fontWeight:900,marginBottom:3}}>Canales de comunicación</div>
      <div style={{color:C.textMuted,fontSize:12,marginBottom:20}}>Configurá correo SMTP, WhatsApp y automatizaciones de envío</div>
      <div style={{display:"flex",gap:3,borderBottom:`1px solid ${C.border}`,marginBottom:20}}>
        {[["smtp","📧 SMTP / Correo"],["whatsapp","💬 WhatsApp"],["automations","⚙️ Automatizaciones"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"7px 16px",background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:700,color:tab===k?C.primary:C.textMuted,borderBottom:`2.5px solid ${tab===k?C.primary:"transparent"}`,marginBottom:-1,transition:"all .14s"}}>{l}</button>
        ))}
      </div>
      {tab==="smtp"&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:comm.smtp.active?C.teal:C.coral}}/><span style={{fontSize:13,fontWeight:700}}>{comm.smtp.active?"Conectado":"Sin configurar"}</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:14}}>
            <Field id="host" label="Servidor SMTP" placeholder="smtp.gmail.com" value={comm.smtp.host} onChange={(_,v)=>upd("smtp","host",v)} half/>
            <Field id="port" label="Puerto"         placeholder="587"            value={String(comm.smtp.port)} onChange={(_,v)=>upd("smtp","port",v)} half/>
            <Field id="user" label="Usuario"        placeholder="tu@email.com"  value={comm.smtp.user} onChange={(_,v)=>upd("smtp","user",v)} half/>
            <Field id="pass" label="Contraseña"     type="password" placeholder="App password" value={comm.smtp.pass} onChange={(_,v)=>upd("smtp","pass",v)} half/>
            <Field id="from" label="Correo remitente" placeholder="noreply@passgo.app" value={comm.smtp.from} onChange={(_,v)=>upd("smtp","from",v)}/>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <button className="btn btn-white btn-sm" onClick={()=>show("Email de prueba enviado")}>📧 Probar conexión</button>
            <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:13,fontWeight:600,color:C.textMid}}><input type="checkbox" checked={comm.smtp.active} onChange={e=>upd("smtp","active",e.target.checked)} style={{accentColor:C.primary}}/> Canal activo</label>
          </div>
          <div style={{padding:12,borderRadius:10,background:C.bg,border:`1px solid ${C.border}`,fontSize:11,color:C.textMuted}}>💡 <strong>Gmail:</strong> usá contraseña de aplicación en Seguridad → Verificación en 2 pasos → Contraseñas de apps.</div>
        </div>
      )}
      {tab==="whatsapp"&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:comm.whatsapp.active?C.teal:C.coral}}/><span style={{fontSize:13,fontWeight:700}}>{comm.whatsapp.active?"Conectado":"Sin configurar"}</span>
          </div>
          <div style={{marginBottom:14}}><label className="lbl">Proveedor WhatsApp</label>
            <select className="inp" value={comm.whatsapp.provider} onChange={e=>upd("whatsapp","provider",e.target.value)}>
              {WA_PROVIDERS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:14}}>
            <Field id="url"       label="URL de la API"    placeholder="https://api.tuservidor.com" value={comm.whatsapp.url}       onChange={(_,v)=>upd("whatsapp","url",v)}/>
            <Field id="apiKey"    label="API Key / Token"  placeholder="Bearer xxxxx"               value={comm.whatsapp.apiKey}    onChange={(_,v)=>upd("whatsapp","apiKey",v)} half/>
            <Field id="phoneFrom" label="Número remitente" placeholder="+54911..."                  value={comm.whatsapp.phoneFrom} onChange={(_,v)=>upd("whatsapp","phoneFrom",v)} half/>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <button className="btn btn-white btn-sm" onClick={()=>show("Mensaje de prueba enviado")}>💬 Probar</button>
            <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:13,fontWeight:600,color:C.textMid}}><input type="checkbox" checked={comm.whatsapp.active} onChange={e=>upd("whatsapp","active",e.target.checked)} style={{accentColor:C.primary}}/> Canal activo</label>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {WA_PROVIDERS.map(p=>(
              <div key={p.id} className={`card ${comm.whatsapp.provider===p.id?"":"card-hov"}`} style={{padding:14,cursor:"pointer",borderColor:comm.whatsapp.provider===p.id?C.primary:undefined,background:comm.whatsapp.provider===p.id?C.primaryLt:undefined}} onClick={()=>upd("whatsapp","provider",p.id)}>
                <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{p.label}</div>
                <div style={{fontSize:10,color:C.textMuted}}>{p.id==="evolution"?"Auto-hosted, gratuito":p.id==="twilio"?"Pago, alta confiabilidad":p.id==="meta"?"Oficial Meta Business":"Node.js, gratuito, no oficial"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab==="automations"&&(
        <div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Reglas de automatización</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
            {autos.map(a=>(
              <div key={a.id} className="card" style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{a.label}</div>
                  <div style={{display:"flex",gap:6}}><span className="tag tgr" style={{fontSize:9}}>{a.trigger}</span><span className="tag tb" style={{fontSize:9}}>{a.channel}</span>{a.delay!==0&&<span className="tag ta" style={{fontSize:9}}>{a.delay<0?`${Math.abs(a.delay/60)}h antes`:`${a.delay}min después`}</span>}</div>
                </div>
                <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:12,fontWeight:700,color:a.enabled?C.tealDk:C.textMuted}}><input type="checkbox" checked={a.enabled} onChange={()=>toggleAuto(a.id)} style={{accentColor:C.primary}}/>{a.enabled?"Activa":"Inactiva"}</label>
              </div>
            ))}
          </div>
          <div style={{padding:12,borderRadius:10,background:C.amberLt,border:`1px solid ${C.amber}44`,fontSize:11,color:"#8a5900"}}>⚡ Las automatizaciones se ejecutan en el backend Node.js. Esta interfaz configura las reglas.</div>
        </div>
      )}
      <div style={{marginTop:18}}><button className="btn btn-primary" onClick={save}>Guardar configuración</button></div>
    </div>
  );
};

// ─── MASS SEND MODAL ──────────────────────────────────────────────────────────
const MassSendModal = ({event, participants=[], onClose, comm=INIT_COMM}) => {
  const [channel, setChannel] = useState("email");
  const [target,  setTarget]  = useState("all");
  const [msgType, setMsgType] = useState("survey");
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const {show, ToastEl}       = useToast();
  const count = target==="all"?participants.length:participants.filter(p=>p.payStatus==="paid").length;
  const handleSend = () => { setSending(true); setTimeout(()=>{setSending(false);setDone(true);show(`${count} mensajes enviados`);},1800); };
  return (
    <div className="overlay" onClick={onClose}>
      {ToastEl}
      <div className="modal" style={{padding:26,maxWidth:460}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontSize:16,fontWeight:900}}>📤 Envío masivo</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {event&&<div style={{marginBottom:14,padding:"8px 12px",borderRadius:10,background:C.primaryLt,fontSize:12,fontWeight:700,color:C.primary}}>🎪 {event.title}</div>}
        <div style={{marginBottom:14}}><label className="lbl">Canal de envío</label>
          <div style={{display:"flex",gap:7}}>
            {[["email","📧 Email"],["whatsapp","💬 WhatsApp"]].map(([v,l])=>(
              <button key={v} className={`btn btn-sm ${channel===v?"btn-primary":"btn-white"}`} onClick={()=>setChannel(v)} style={{flex:1}}>{l}</button>
            ))}
          </div>
          {channel==="whatsapp"&&!comm.whatsapp.active&&<div style={{fontSize:10,color:C.coral,marginTop:4}}>⚠ WhatsApp no configurado. Activalo en Comunicaciones → WhatsApp.</div>}
        </div>
        <div style={{marginBottom:14}}><label className="lbl">Tipo de mensaje</label>
          <div style={{display:"flex",gap:7}}>
            {[["survey","Encuesta"],["cert","Certificado"],["reminder","Recordatorio"]].map(([v,l])=>(
              <button key={v} className={`btn btn-sm ${msgType===v?"btn-primary":"btn-white"}`} onClick={()=>setMsgType(v)}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:18}}><label className="lbl">Destinatarios</label>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {[["all","✅ Todos los participantes"],["paid","💳 Solo pagados"],["speakers","🎤 Disertantes"]].map(([v,l])=>(
              <label key={v} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:600,padding:"8px 12px",borderRadius:9,background:target===v?C.primaryLt:C.bg,border:`1px solid ${target===v?C.primary:C.border}`}}>
                <input type="radio" name="target" value={v} checked={target===v} onChange={()=>setTarget(v)} style={{accentColor:C.primary}}/>{l}
              </label>
            ))}
          </div>
        </div>
        {done?<div style={{textAlign:"center",padding:16,color:C.tealDk,fontWeight:800}}>✅ {count} mensajes enviados</div>
          :<button className="btn btn-primary" style={{width:"100%"}} onClick={handleSend} disabled={sending}>
            {sending?<span style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}><span style={{width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}}/>Enviando...</span>:`Enviar a ${count} ${channel==="email"?"correos":"WhatsApp"}`}
          </button>}
      </div>
    </div>
  );
};

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
const AdminView = ({users, setUsers, orgs, setOrgs, onNav}) => {
  const [tab, setTab]         = useState("users");
  const [showUserModal, setShowUserModal] = useState(null); // null|"new"|user_obj
  const [showOrgModal, setShowOrgModal]   = useState(false);
  const {show,ToastEl}        = useToast();

  const handleSaveUser = useCallback(userData => {
    if(userData.id && users.some(u=>u.id===userData.id)){
      setUsers(u=>u.map(x=>x.id===userData.id?{...x,...userData}:x));
    } else {
      setUsers(u=>[...u,{...userData,id:Date.now()}]);
    }
    setShowUserModal(null);
  },[users,setUsers]);

  const handleDeleteUser = id => {
    if(!window.confirm("¿Eliminar este usuario?")) return;
    setUsers(u=>u.filter(x=>x.id!==id));
    show("Usuario eliminado","error");
  };

  const handleRecovery = u => show(`Email de recuperación enviado a ${u.email}`);

  return (
    <div style={{padding:"18px 22px",maxWidth:1000}} className="page-in">
      {ToastEl}
      <Breadcrumbs items={[{label:"Dashboard",view:"dashboard"},{label:"Administración"}]} onNav={onNav}/>
      <div style={{fontSize:20,fontWeight:900,marginBottom:3}}>Administración</div>
      <div style={{color:C.textMuted,fontSize:12,marginBottom:18}}>Gestión de cuentas, organizaciones y configuración</div>

      <div style={{display:"flex",gap:3,borderBottom:`1px solid ${C.border}`,marginBottom:18}}>
        {[["users","👥 Usuarios"],["orgs","🏢 Organizaciones"],["settings","⚙️ Configuración"],["logs","📋 Auditoría"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"7px 14px",background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontSize:12,fontWeight:700,color:tab===k?C.primary:C.textMuted,borderBottom:`2.5px solid ${tab===k?C.primary:"transparent"}`,marginBottom:-1,transition:"all .14s"}}>{l}</button>
        ))}
      </div>

      {tab==="users"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:7}}>
              <input className="inp" placeholder="🔍 Buscar usuario..." style={{maxWidth:240,fontSize:13}}/>
              <select className="inp" style={{maxWidth:150,fontSize:13}}><option>Todos los roles</option>{ROLES.map(r=><option key={r}>{r}</option>)}</select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowUserModal("new")}>＋ Nuevo usuario</button>
          </div>
          <div className="card" style={{overflow:"hidden"}}>
            <div className="trow thead" style={{gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr"}}>
              {["Usuario","Rol","Plan","Estado","Acciones"].map(h=><div key={h} style={{fontSize:10,fontWeight:800,color:C.textMuted,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</div>)}
            </div>
            {users.map(u=>(
              <div key={u.id} className="trow" style={{gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Av name={`${u.nombre} ${u.apellido}`}/>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6}}>
                      {u.nombre} {u.apellido}
                      {u.tempPassword&&<span className="tag ta" style={{fontSize:9,padding:"1px 6px"}}>⚠ Temp</span>}
                    </div>
                    <div style={{fontSize:10,color:C.textMuted}}>{u.email}</div>
                  </div>
                </div>
                <span className={`tag ${u.role==="Admin"?"tp":"tb"}`} style={{fontSize:10}}>{u.role}</span>
                <span className="tag tgr" style={{fontSize:10}}>{u.plan}</span>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:u.active?C.teal:C.textLight,display:"inline-block"}}/>
                  <span style={{fontSize:11,color:C.textMuted}}>{u.active?"Activo":"Inactivo"}</span>
                </div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  <button className="btn btn-white btn-sm" style={{padding:"3px 7px",fontSize:10}} onClick={()=>setShowUserModal(u)}>Editar</button>
                  <button className="btn btn-white btn-sm" style={{padding:"3px 7px",fontSize:10}} onClick={()=>handleRecovery(u)}>🔑</button>
                  <button className="btn btn-danger btn-sm" style={{padding:"3px 7px",fontSize:10}} onClick={()=>handleDeleteUser(u.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="orgs"&&(
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowOrgModal(true)}>＋ Nueva organización</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
            {orgs.map(o=>(
              <div key={o.id} className="card" style={{padding:20}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{fontSize:15,fontWeight:800}}>{o.name}</div>
                  <span className={`tag ${o.plan==="enterprise"?"tp":o.plan==="pro"?"tb":"ta"}`} style={{fontSize:10}}>{o.plan}</span>
                </div>
                <div style={{fontSize:11,color:C.textMuted,marginBottom:12}}>📅 {o.events} eventos · 👤 {o.users} usuarios</div>
                <div style={{marginBottom:12}}>
                  <label className="lbl" style={{fontSize:10,marginBottom:6}}>Permisos del plan</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {(PLAN_PERMISSIONS[o.plan]||[]).slice(0,4).map(pid=>{
                      const perm=ALL_PERMISSIONS.find(p=>p.id===pid);
                      return perm?<span key={pid} className="tag tg" style={{fontSize:9,padding:"2px 6px"}}>{perm.label.replace("Puede ","")}</span>:null;
                    })}
                    {(PLAN_PERMISSIONS[o.plan]||[]).length>4&&<span className="tag tgr" style={{fontSize:9}}>+{(PLAN_PERMISSIONS[o.plan]||[]).length-4} más</span>}
                  </div>
                </div>
                <button className="btn btn-white btn-sm" style={{width:"100%",fontSize:11}} onClick={()=>setShowOrgModal(o)}>Editar organización</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="settings"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[{t:"Reconocimiento facial",d:"Umbral de confianza para el match",v:"85%"},{t:"Sesión máxima",d:"Expiración JWT",v:"8h"},{t:"Check-in anticipado",d:"Minutos antes del inicio",v:"30 min"},{t:"Rate limiting",d:"Requests por IP por minuto",v:"100"},{t:"Métodos por defecto",d:"Al crear evento",v:"Facial + QR"},{t:"Auditoría de accesos",d:"Logs automáticos de acceso",v:"Activo"}].map(s=>(
            <div key={s.t} className="card" style={{padding:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <div><div style={{fontWeight:700,fontSize:13,marginBottom:2}}>{s.t}</div><div style={{fontSize:11,color:C.textMuted}}>{s.d}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span className="tag tb" style={{fontSize:11}}>{s.v}</span><button className="btn btn-white btn-sm">Editar</button></div>
            </div>
          ))}
        </div>
      )}

      {tab==="logs"&&(
        <div className="card" style={{overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"center"}}>
            <input className="inp" placeholder="🔍 Filtrar logs..." style={{flex:1,fontSize:12}}/>
            <select className="inp" style={{maxWidth:150,fontSize:12}}><option>Todos los tipos</option><option>Acceso</option><option>Error</option><option>Modificación</option></select>
          </div>
          {[
            {t:"2026-06-01 11:42","user":"Admin General","action":"Creó usuario Dr. Carlos Ibáñez","type":"create"},
            {t:"2026-06-01 11:30","user":"Dr. Martín Rodríguez","action":"Inició sesión","type":"access"},
            {t:"2026-06-01 10:15","user":"Admin General","action":"Modificó evento CardioPlus","type":"edit"},
            {t:"2026-06-01 09:03","user":"Federico Álvarez","action":"Check-in facial en CardioPlus","type":"checkin"},
            {t:"2026-06-01 08:58","user":"Sistema","action":"Rate limit activado para IP 192.168.1.44","type":"security"},
          ].map((l,i)=>(
            <div key={i} className="trow" style={{gridTemplateColumns:"1fr 1fr 2fr auto"}}>
              <span style={{fontSize:11,color:C.textMuted,fontFamily:"monospace"}}>{l.t}</span>
              <span style={{fontSize:12,fontWeight:600}}>{l.user}</span>
              <span style={{fontSize:12,color:C.textMid}}>{l.action}</span>
              <span className={`tag ${l.type==="create"?"tg":l.type==="edit"?"ta":l.type==="security"?"tr":l.type==="checkin"?"tb":"tgr"}`} style={{fontSize:9}}>{l.type}</span>
            </div>
          ))}
        </div>
      )}

      {showUserModal&&<UserModal user={showUserModal==="new"?null:showUserModal} onSave={handleSaveUser} onClose={()=>setShowUserModal(null)}/>}
      {showOrgModal&&<OrgModal org={showOrgModal==="new"?null:showOrgModal} onSave={data=>{ setOrgs(o=>o.some(x=>x.id===data.id)?o.map(x=>x.id===data.id?data:x):[...o,data]); setShowOrgModal(null); }} onClose={()=>setShowOrgModal(null)}/>}
    </div>
  );
};

// ─── DASHBOARD HOME ───────────────────────────────────────────────────────────
const DashHome = ({onSelect, onRegister, onKiosk, role, events, users, checkins, onNav, currentUser}) => {
  const activeEv=events.find(e=>e.status==="active");
  const upcoming=events.filter(e=>e.status==="upcoming");
  const speakerName = role==="speaker" ? (currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : "Disertante") : null;
  // Speaker: filter events by speakerId
  const myEvents = role==="speaker" && currentUser
    ? events.filter(e=>e.speakerId===currentUser.id)
    : events;
  const myActiveEv = myEvents.find(e=>e.status==="active") || activeEv;
  const myUpcoming = myEvents.filter(e=>e.status==="upcoming");
  return (
    <div style={{padding:"18px 22px",maxWidth:1120}} className="page-in">
      <div style={{marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,letterSpacing:"-0.02em",marginBottom:2}}>
            {role==="speaker"?"Bienvenido/a":"Panel general"}{speakerName?`, ${speakerName}`:""}! 👋
          </div>
          <div style={{color:C.textMuted,fontSize:12}}>{new Date().toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
        </div>
        {role==="speaker"&&currentUser&&(
          <div style={{padding:"10px 16px",borderRadius:12,background:C.primaryLt,border:`1px solid ${C.primary}33`}}>
            <div style={{fontSize:10,color:C.primary,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:2}}>
              {currentUser.role} · Plan {currentUser.plan}
            </div>
            <div style={{fontSize:11,color:C.textMid}}>{currentUser.email}</div>
          </div>
        )}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:10,marginBottom:18}}>
        <Stat icon="🟢" label="En curso"   value={myEvents.filter(e=>e.status==="active").length}   accent={C.teal}   delay={0}/>
        <Stat icon="📅" label="Próximos"   value={myUpcoming.length}                                 accent={C.primary} delay={50}/>
        <Stat icon="👥" label="En vivo"    value={(checkins||[]).filter(c=>c.status==="in").length}   accent={C.amber}   delay={100}/>
        <Stat icon="🏁" label="Realizados" value={myEvents.filter(e=>e.status==="finished").length}  accent={C.purple}  delay={150}/>
      </div>
      {myActiveEv&&(
        <div className="fu" style={{background:"linear-gradient(135deg,#E4FBF4 0%,#EEF0FF 100%)",border:`1.5px solid ${C.teal}44`,borderRadius:16,padding:20,marginBottom:18,display:"flex",gap:18,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:180}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
              <span className="dot-live pulse" style={{background:C.teal,boxShadow:`0 0 0 3px ${C.tealLt}`}}/>
              <span style={{fontSize:10,color:C.tealDk,fontWeight:800,textTransform:"uppercase",letterSpacing:".09em"}}>Evento en curso</span>
            </div>
            <div style={{fontSize:16,fontWeight:900,marginBottom:3,letterSpacing:"-0.01em"}}>{myActiveEv.title}</div>
            <div style={{fontSize:11,color:C.textMid}}>👤 {myActiveEv.speaker} · 📍 {myActiveEv.location}</div>
          </div>
          <div style={{display:"flex",gap:16}}>
            {[[String((checkins||[]).filter(c=>c.eventId===myActiveEv.id&&c.status==="in").length),"Presentes",C.teal],[String((checkins||[]).filter(c=>c.eventId===myActiveEv.id&&c.status==="out").length),"Salieron",C.coral],[String(myActiveEv.capacity),"Cap.",C.textMuted]].map(([v,l,col])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontSize:26,fontWeight:900,color:col,lineHeight:1}}>{v}</div>
                <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button className="btn btn-teal btn-sm" onClick={()=>onSelect(myActiveEv)}>Ver asistentes →</button>
            <button className="btn btn-white btn-sm" onClick={()=>onKiosk(myActiveEv,"entry")}>🟢 Entrada</button>
            <button className="btn btn-white btn-sm" onClick={()=>onKiosk(myActiveEv,"exit")}>🔴 Salida</button>
          </div>
        </div>
      )}
      <div style={{fontSize:15,fontWeight:800,marginBottom:12,letterSpacing:"-0.01em"}}>{role==="speaker"?"Mis eventos":"Todos los eventos"}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
        {myEvents.map(e=>(
          <div key={e.id} className="card card-lift" style={{padding:18,cursor:"pointer",overflow:"hidden",position:"relative"}} onClick={()=>onSelect(e)}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${e.color},${e.color}33)`,borderRadius:"16px 16px 0 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:7,flexWrap:"wrap",gap:4}}>
              <STag status={e.status}/><span className="tag tp" style={{fontSize:10}}>{e.type}</span>
            </div>
            <div style={{fontSize:13,fontWeight:800,marginBottom:6,lineHeight:1.3}}>{e.title}</div>
            <div style={{fontSize:11,color:C.textMuted,marginBottom:6,display:"flex",gap:10}}>
              <span>📅 {new Date(e.date).toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</span>
              <span>🕐 {e.time}</span>
            </div>
            <div style={{height:1,background:C.border,marginBottom:7}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.textMuted,marginBottom:4}}>
              <span>Asistentes</span><span style={{fontWeight:800,color:C.text}}>{e.attendees}/{e.capacity}</span>
            </div>
            <div className="prog-track"><div className="prog-fill" style={{width:`${Math.round((e.attendees/e.capacity)*100)}%`,background:e.color}}/></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── APP SHELL ────────────────────────────────────────────────────────────────
const NAV = [
  {id:"dashboard",  ico:"⊟",   label:"Panel general"},
  {id:"events",     ico:"🎪",  label:"Eventos"},
  {id:"orgs",       ico:"🏢",  label:"Organizaciones"},
  {id:"attendees",  ico:"👥",  label:"Participantes"},
  {id:"speakers",   ico:"🎤",  label:"Disertantes"},
  {id:"calendar",   ico:"📅",  label:"Calendario"},
  {id:"certs",      ico:"🎓",  label:"Certificados"},
  {id:"reports",    ico:"📊",  label:"Reportes"},
  {id:"comm",       ico:"📡",  label:"Comunicaciones"},
  {id:"plans",      ico:"💳",  label:"Editor de planes"},
  {id:"admin",      ico:"⚙️",  label:"Administración"},
];

const AppShell = ({role, onLogout, loginEmail}) => {
  // Centralized state
  const [events,       setEvents]       = useState(INIT_EVENTS);
  const [participants, setParticipants] = useState(INIT_PARTICIPANTS);
  const [checkins,     setCheckins]     = useState(INIT_CHECKINS);
  const [users,        setUsers]        = useState(INIT_USERS);
  const [orgs,         setOrgs]         = useState(INIT_ORGS);
  const [speakers,     setSpeakers]     = useState(INIT_SPEAKERS);

  // Navigation state
  // Current logged-in user
  const currentUser = users.find(u=>u.email===(loginEmail||"admin@passgo.app")) || users[0];
  const displayName = currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : (role==="speaker"?"Disertante":"Admin");

  const [view,      setView]      = useState("dashboard");
  const [orgView,   setOrgView]   = useState(null);
  const [event,     setEvent]     = useState(null);
  const [kioskEv,   setKioskEv]   = useState(null);
  const [kioskMode, setKioskMode] = useState("entry");
  const [regEv,     setRegEv]     = useState(null);
  const [metEv,     setMetEv]     = useState(null);
  const [survEv,    setSurvEv]    = useState(null);
  const [mobOpen,   setMobOpen]   = useState(false);
  const [navHistory,setNavHistory]= useState(["dashboard"]);

  // Full-screen modes
  if(kioskEv) return <KioskScreen event={kioskEv} mode={kioskMode} onExit={()=>setKioskEv(null)} participants={participants} checkins={checkins} setCheckins={setCheckins}/>;
  if(regEv)   return <PublicRegister event={regEv} onBack={()=>setRegEv(null)}/>;

  const goView = (id, pushHistory=true) => {
    setView(id);
    if(pushHistory) setNavHistory(h=>[...h,id]);
    setEvent(null); setMetEv(null); setMobOpen(false);
  };

  const goBack = () => {
    if(navHistory.length>1){
      const prev=navHistory[navHistory.length-2];
      setNavHistory(h=>h.slice(0,-1));
      setView(prev);
      setEvent(null); setMetEv(null);
    }
  };

  const goSelect  = ev  => { setEvent(ev);  setView("live");    setNavHistory(h=>[...h,"live"]); };
  const goKiosk   = (ev,m) => { setKioskEv(ev); setKioskMode(m||"entry"); };
  const goRegister= ev  => setRegEv(ev);
  const goMetrics = ev  => { setMetEv(ev);  setView("metrics"); setNavHistory(h=>[...h,"metrics"]); };
  const goSurvey  = ev  => setSurvEv(ev);

  const navItems = role==="speaker"
    ? NAV.filter(n=>!["plans","admin","orgs","comm"].includes(n.id))
    : NAV;

  const renderView = () => {
    if(view==="live"&&event)    return <LiveAttendance event={event} onBack={goBack} onKiosk={goKiosk} onRegister={goRegister} onNav={goView} participants={participants} checkins={checkins} setCheckins={setCheckins}/>;
    if(view==="metrics"&&metEv) return <MetricsView event={metEv} checkins={checkins} onBack={goBack} onNav={goView}/>;
    switch(view){
      case "dashboard": return <DashHome onSelect={goSelect} onRegister={goRegister} onKiosk={goKiosk} role={role} events={events} users={users} checkins={checkins} onNav={goView} currentUser={currentUser}/>;
      case "events":    return <EventsManager onSelect={goSelect} onRegister={goRegister} onMetrics={goMetrics} onSurvey={goSurvey} onNav={goView} events={events} setEvents={setEvents} orgs={orgs} speakers={speakers}/>;
      case "orgs":      return <OrgsView orgs={orgs} setOrgs={setOrgs} events={events} onNav={goView} onSelectOrg={org=>{setOrgView(org);goView("orgDetail");}}/>;
      case "orgDetail": return orgView?<OrgDetailView org={orgView} events={events} setEvents={setEvents} onBack={goBack} onNav={goView}/>:null;
      case "attendees": return <ParticipantsView onRegister={goRegister} onNav={goView} participants={participants} setParticipants={setParticipants} events={events}/>;
      case "speakers":  return <SpeakersView speakers={speakers} setSpeakers={setSpeakers} events={events} onNav={goView}/>;
      case "calendar":  return <CalendarView onSelect={goSelect} events={events} onNav={goView}/>;
      case "certs":     return <CertificatesView events={events} participants={participants} checkins={checkins} onNav={goView}/>;
      case "reports":   return <ReportsView events={events} participants={participants} checkins={checkins} onNav={goView}/>;
      case "comm":      return <CommSettings onNav={goView}/>;
      case "plans":     return <PlansEditor onNav={goView}/>;
      case "admin":     return <AdminView users={users} setUsers={setUsers} orgs={orgs} setOrgs={setOrgs} onNav={goView}/>;
      default:          return <DashHome onSelect={goSelect} onRegister={goRegister} onKiosk={goKiosk} role={role} events={events} users={users} checkins={checkins} onNav={goView} currentUser={currentUser}/>;
    }
  };

  const activeId = view==="live"?"events":view==="metrics"?"events":view;

  return (
    <div style={{display:"flex",minHeight:"100vh"}}>
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{marginBottom:16,paddingLeft:2}}><Logo size={26}/></div>
        {role==="speaker"&&(
          <div style={{padding:"9px 11px",borderRadius:10,background:C.primaryLt,marginBottom:10,border:`1px solid ${C.borderMid}`}}>
            <div style={{fontSize:9,color:C.primary,textTransform:"uppercase",letterSpacing:".07em",marginBottom:1,fontWeight:800}}>Disertante</div>
            <div style={{fontSize:12,fontWeight:800}}>{displayName}</div>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:1,flex:1}}>
          {navItems.map(item=>(
            <button key={item.id} className={`nav-item ${activeId===item.id?"active":""}`}
              onClick={()=>goView(item.id)}>
              <span style={{fontSize:15,width:19,textAlign:"center",flexShrink:0}}>{item.ico}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="hr"/>
        {navHistory.length>1&&(
          <button className="nav-item" onClick={goBack}>
            <span style={{fontSize:15,width:19,textAlign:"center"}}>←</span>
            <span>Volver atrás</span>
          </button>
        )}
        <button className="nav-item" onClick={onLogout}>
          <span style={{fontSize:15,width:19,textAlign:"center"}}>⏏</span>
          <span>Cerrar sesión</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:300,display:"flex"}}>
          <div style={{width:232,background:C.white,borderRight:`1px solid ${C.border}`,padding:"16px 11px",display:"flex",flexDirection:"column",gap:1,animation:"slideInLeft .22s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <Logo size={24}/><button className="btn btn-ghost btn-sm" onClick={()=>setMobOpen(false)}>✕</button>
            </div>
            {navItems.map(item=>(
              <button key={item.id} className={`nav-item ${activeId===item.id?"active":""}`} onClick={()=>{goView(item.id);setMobOpen(false);}}>
                <span style={{fontSize:15,width:19,textAlign:"center"}}>{item.ico}</span><span>{item.label}</span>
              </button>
            ))}
            <div className="hr"/>
            <button className="nav-item" onClick={onLogout}><span style={{fontSize:15,width:19,textAlign:"center"}}>⏏</span><span>Cerrar sesión</span></button>
          </div>
          <div style={{flex:1,background:"rgba(0,0,0,.38)"}} onClick={()=>setMobOpen(false)}/>
        </div>
      )}

      {/* Main content */}
      <div style={{flex:1,overflow:"auto",background:C.bg}}>
        <div className="mob-bar" style={{padding:"11px 14px",borderBottom:`1px solid ${C.border}`,justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,.94)",backdropFilter:"blur(12px)"}}>
          <Logo size={22}/>
          <button className="btn btn-ghost" style={{padding:"5px 9px",fontSize:18}} onClick={()=>setMobOpen(true)}>☰</button>
        </div>
        {renderView()}
      </div>

      {survEv&&(
        <div className="overlay" onClick={()=>setSurvEv(null)}>
          <div className="modal" style={{padding:26,maxWidth:500}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:16,fontWeight:900}}>Encuesta · {survEv.title}</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setSurvEv(null)}>✕</button>
            </div>
            <div style={{marginBottom:14}}>
              <label className="lbl">¿Cuándo mostrar la encuesta?</label>
              <div style={{display:"flex",gap:7}}>
                {[["checkin","Al entrar"],["checkout","Al salir"],["email","Por email"]].map(([v,l])=>(
                  <button key={v} className={`btn btn-sm ${survEv.surveyTiming===v?"btn-primary":"btn-white"}`}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {DEFAULT_SURVEY.map((q,i)=>(
                <div key={q.id} className="card" style={{padding:12}}>
                  <div style={{display:"flex",gap:7,alignItems:"center"}}>
                    <span className={`tag ${q.type==="stars"?"ta":q.type==="options"?"tb":"tg"}`} style={{flexShrink:0,fontSize:10}}>{q.type==="stars"?"⭐":q.type==="options"?"☰":"✎"}</span>
                    <input className="inp" defaultValue={q.question} style={{flex:1,fontSize:12,padding:"5px 8px"}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:7}}>
              <button className="btn btn-white btn-sm" onClick={()=>setSurvEv(null)} style={{flex:1}}>Agregar pregunta</button>
              <button className="btn btn-primary" style={{flex:1}} onClick={()=>setSurvEv(null)}>Guardar encuesta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
const Landing = ({onLogin}) => (
  <div style={{minHeight:"100vh",background:C.white,overflowX:"hidden"}}>
    <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 5%",height:58,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:200,background:"rgba(255,255,255,.95)",backdropFilter:"blur(14px)"}}>
      <Logo size={30}/>
      <div className="hide-mob" style={{display:"flex",gap:2}}>
        {["Funcionalidades","Precios","Contacto"].map(l=><button key={l} className="btn btn-ghost" style={{fontSize:13,padding:"7px 12px"}}>{l}</button>)}
      </div>
      <div style={{display:"flex",gap:7}}>
        <button className="btn btn-white btn-sm" onClick={onLogin}>Iniciar sesión</button>
        <button className="btn btn-primary btn-sm" onClick={onLogin}>Empezar gratis →</button>
      </div>
    </nav>

    <div style={{padding:"60px 5% 52px",background:C.gradHero,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",width:380,height:380,borderRadius:"50%",background:`radial-gradient(circle,${C.primaryLt},transparent)`,top:-100,right:-60,pointerEvents:"none"}}/>
      <div style={{maxWidth:600,position:"relative",zIndex:1}}>
        <div className="tag tb fu" style={{marginBottom:16,padding:"5px 13px",fontSize:12}}>✦ Gestión inteligente de eventos y accesos</div>
        <h1 className="hero-h1 fu" style={{fontSize:"clamp(30px,5vw,58px)",fontWeight:900,lineHeight:1.06,letterSpacing:"-0.04em",marginBottom:16,animationDelay:"60ms"}}>
          El acceso a tus eventos,{" "}
          <span style={{background:C.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>sin fricciones</span>
        </h1>
        <p className="fu" style={{fontSize:15,color:C.textMid,lineHeight:1.65,marginBottom:26,maxWidth:480,animationDelay:"120ms"}}>
          Facial, QR, RFID y huella dactilar. Registro online, kiosco de entrada/salida, certificados y encuestas. Todo en una plataforma.
        </p>
        <div className="fu" style={{display:"flex",gap:10,animationDelay:"180ms",flexWrap:"wrap"}}>
          <button className="btn btn-primary btn-lg" onClick={onLogin}>Probar demo →</button>
          <button className="btn btn-white btn-lg">Ver cómo funciona</button>
        </div>
      </div>
      <div className="float-a hide-mob" style={{position:"absolute",right:"4%",top:"50%",transform:"translateY(-50%)",width:280,zIndex:1,display:"flex",flexDirection:"column",gap:10}}>
        <div className="card" style={{padding:18,boxShadow:"0 12px 36px rgba(91,110,245,.13)"}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
            <span className="dot-live pulse" style={{background:C.teal,boxShadow:`0 0 0 3px ${C.tealLt}`}}/>
            <span style={{fontSize:10,color:C.tealDk,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em"}}>En vivo</span>
          </div>
          <div style={{fontSize:13,fontWeight:800,marginBottom:8}}>Lanzamiento CardioPlus</div>
          <div style={{display:"flex",gap:14}}>
            {[["41","Presentes",C.teal],["4","Salieron",C.coral]].map(([v,l,col])=>(
              <div key={l}><div style={{fontSize:20,fontWeight:900,color:col}}>{v}</div><div style={{fontSize:10,color:C.textMuted}}>{l}</div></div>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {CHECK_METHODS.map(m=>(
            <div key={m.id} className="card" style={{padding:11,textAlign:"center"}}>
              <div style={{fontSize:18,marginBottom:3}}>{m.icon}</div>
              <div style={{fontSize:10,fontWeight:800}}>{m.short}</div>
              <div style={{fontSize:9,color:C.tealDk,fontWeight:700}}>✓ Activo</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={{background:C.gradDark,padding:"18px 5%"}}>
      <div style={{display:"flex",gap:28,justifyContent:"center",flexWrap:"wrap",maxWidth:720,margin:"0 auto"}}>
        {[["100%","Cloud Scalable"],["< 2s","Check-in"],["99.9%","Uptime"],["24/7","Soporte"]].map(([v,l])=>(
          <div key={l} style={{textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:900,color:C.white,letterSpacing:"-0.02em"}}>{v}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.5)",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={{padding:"52px 5%",background:C.white}}>
      <div style={{maxWidth:1040,margin:"0 auto",textAlign:"center",marginBottom:36}}>
        <div className="tag tb" style={{marginBottom:10,fontSize:11}}>Funcionalidades</div>
        <div style={{fontSize:"clamp(20px,3.5vw,32px)",fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Una plataforma, infinitas posibilidades</div>
        <p style={{fontSize:14,color:C.textMid,maxWidth:420,margin:"0 auto",lineHeight:1.65}}>Cubrimos todo el ciclo del evento, desde el registro hasta el certificado.</p>
      </div>
      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,maxWidth:1040,margin:"0 auto",scrollbarWidth:"none"}}>
        {[
          {i:"👁",t:"Facial",         d:"Selfie al registrarse. Identificación instantánea.",         c:C.primary},
          {i:"▦", t:"QR Personal",    d:"QR único por email. Entrada y salida sin contacto.",         c:C.purple},
          {i:"◈", t:"RFID",           d:"Tarjeta de acceso. Registro al instante.",                   c:C.amber},
          {i:"☉", t:"Huella",         d:"Lector ZKTeco USB. Máxima seguridad.",                       c:C.teal},
          {i:"📝",t:"Registro online", d:"El participante se autogestiona desde su celular.",          c:C.primary},
          {i:"📊",t:"Métricas",        d:"Dashboard en tiempo real con flujo de asistencia.",         c:C.coral},
          {i:"📋",t:"Encuestas",       d:"Configurable por evento. Estrellas, opciones y texto.",     c:C.purple},
          {i:"🎓",t:"Certificados",    d:"Diseñador visual personalizable. PDF y email.",              c:C.teal},
        ].map(f=>(
          <div key={f.t} style={{flexShrink:0,width:190,background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:20,transition:"all .18s",cursor:"default"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(91,110,245,.11)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
            <div style={{width:42,height:42,borderRadius:12,background:`${f.c}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:12}}>{f.i}</div>
            <div style={{fontSize:14,fontWeight:800,marginBottom:5}}>{f.t}</div>
            <div style={{fontSize:11,color:C.textMid,lineHeight:1.55}}>{f.d}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={{padding:"52px 5%",background:C.bg}}>
      <div style={{maxWidth:860,margin:"0 auto",textAlign:"center"}}>
        <div className="tag tg" style={{marginBottom:10,fontSize:11}}>Registro sin fricciones</div>
        <div style={{fontSize:"clamp(20px,3.5vw,32px)",fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>El participante se registra solo</div>
        <p style={{fontSize:13,color:C.textMid,marginBottom:36,lineHeight:1.65}}>Link único por evento. El organizador lo comparte y listo.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>
          {[{n:"1",i:"🔗",t:"Recibe el link",   d:"Por email o WhatsApp del organizador."},
            {n:"2",i:"📝",t:"Completa sus datos",d:"Nombre, DNI, nacimiento, teléfono, email."},
            {n:"3",i:"👁",t:"Facial o QR",       d:"Selfie o QR enviado automáticamente."},
            {n:"4",i:"✅",t:"Entra al evento",   d:"Reconocimiento en < 2 segundos."}].map(s=>(
            <div key={s.n} className="card" style={{padding:20,textAlign:"left"}}>
              <div style={{fontSize:9,fontWeight:900,color:C.primary,marginBottom:8,textTransform:"uppercase",letterSpacing:".1em"}}>Paso {s.n}</div>
              <div style={{fontSize:26,marginBottom:8}}>{s.i}</div>
              <div style={{fontSize:13,fontWeight:800,marginBottom:5}}>{s.t}</div>
              <div style={{fontSize:11,color:C.textMid,lineHeight:1.55}}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={{padding:"52px 5%",background:C.white}}>
      <div style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
        <div className="tag tp" style={{marginBottom:10,fontSize:11}}>Planes</div>
        <div style={{fontSize:"clamp(20px,3.5vw,32px)",fontWeight:900,letterSpacing:"-0.03em",marginBottom:6}}>Empezá gratis</div>
        <p style={{fontSize:13,color:C.textMid,marginBottom:36}}>Planes configurables desde el panel de administración.</p>
        <div className="pricing-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          {[
            {name:"Básico",     price:"15",features:["3 eventos/mes","QR + Manual","Registro online (QR)","Exportar Excel"],hi:false},
            {name:"Pro",        price:"40",features:["Eventos ilimitados","Facial + QR + RFID","Encuestas","Reportes","Multi-disertante"],hi:true},
            {name:"Enterprise", price:"80",features:["Todo Pro incluido","Huella dactilar","Multiorg.","API REST","Soporte 24/7"],hi:false},
          ].map(p=>(
            <div key={p.name} className="card" style={{padding:24,textAlign:"left",border:p.hi?`2px solid ${C.primary}`:undefined,boxShadow:p.hi?`0 6px 28px ${C.primaryGlow}`:undefined,position:"relative"}}>
              {p.hi&&<div className="tag tb" style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",fontSize:10,whiteSpace:"nowrap"}}>⭐ Popular</div>}
              <div style={{fontSize:16,fontWeight:900,marginBottom:5}}>{p.name}</div>
              <div style={{marginBottom:18}}><span style={{fontSize:32,fontWeight:900,color:p.hi?C.primary:C.text,letterSpacing:"-0.03em"}}>USD {p.price}</span><span style={{fontSize:11,color:C.textMuted}}>/mes</span></div>
              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:18}}>
                {p.features.map(f=><div key={f} style={{display:"flex",gap:7,fontSize:12,color:C.textMid}}><span style={{color:C.teal,fontWeight:900}}>✓</span>{f}</div>)}
              </div>
              <button className={`btn ${p.hi?"btn-primary":"btn-white"}`} style={{width:"100%",padding:"10px 0",fontSize:13}} onClick={onLogin}>Comenzar</button>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={{background:C.grad,padding:"48px 5%",textAlign:"center"}}>
      <div style={{fontSize:"clamp(20px,3.5vw,32px)",fontWeight:900,color:"#fff",marginBottom:8,letterSpacing:"-0.03em"}}>¿Tenés un evento en mente?</div>
      <p style={{fontSize:13,color:"rgba(255,255,255,.75)",marginBottom:24,maxWidth:380,margin:"0 auto 24px",lineHeight:1.65}}>Configurá tu primer evento en menos de 5 minutos.</p>
      <button className="btn btn-white btn-lg" style={{fontWeight:800}} onClick={onLogin}>Empezar gratis →</button>
    </div>

    <footer style={{padding:"22px 5%",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
      <Logo size={24}/>
      <div style={{color:C.textMuted,fontSize:11}}>© 2026 Passgo · Gestión inteligente de eventos</div>
      <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
        {["Privacidad","Términos","Contacto","Soporte"].map(l=><span key={l} style={{fontSize:11,color:C.textMuted,cursor:"pointer"}}>{l}</span>)}
      </div>
    </footer>
  </div>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const Login = ({onLogin, onBack}) => {
  const [form, setForm]   = useState({email:"admin@passgo.app",password:"",role:"admin"});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const upd = useCallback((k,v)=>setForm(f=>({...f,[k]:v})),[]);

  const validate = () => {
    const e={};
    if(!form.email.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email="Email inválido";
    if(!forgotMode&&!form.password.trim()) e.password="Requerida";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = () => {
    if(!validate()) return;
    if(forgotMode){ setForgotSent(true); return; }
    setLoading(true);
    setTimeout(()=>onLogin(form.role, form.email),1000);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",background:C.gradHero}}>
      <div className="hide-mob" style={{width:"42%",background:C.grad,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 36px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",width:320,height:320,borderRadius:"50%",background:"rgba(255,255,255,.06)",top:-80,right:-80}}/>
        <div style={{position:"relative",zIndex:1,color:"#fff",textAlign:"center"}}>
          <Logo size={40} dark/>
          <div style={{fontSize:22,fontWeight:900,marginTop:20,marginBottom:8,letterSpacing:"-0.02em",lineHeight:1.2}}>Gestión de eventos<br/>sin complicaciones</div>
          <p style={{fontSize:13,opacity:.75,lineHeight:1.65,maxWidth:260}}>Facial, QR, RFID, huella y encuestas. Todo en una sola plataforma.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:28,textAlign:"left"}}>
            {["✓ Registro online con selfie o QR","✓ Kiosco de entrada y salida","✓ Métricas en tiempo real","✓ Certificados automáticos","✓ Encuestas configurables"].map(f=>(
              <div key={f} style={{fontSize:12,opacity:.85,fontWeight:600}}>{f}</div>
            ))}
          </div>
        </div>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"22px 16px"}}>
        <div style={{maxWidth:360,width:"100%"}} className="si">
          <div className="mob-bar" style={{display:"flex",justifyContent:"center",marginBottom:14}}><Logo size={32}/></div>
          {!forgotSent?(
            <>
              <div style={{fontSize:22,fontWeight:900,marginBottom:3,letterSpacing:"-0.02em"}}>{forgotMode?"Recuperar contraseña":"Bienvenido 👋"}</div>
              <div style={{color:C.textMuted,fontSize:12,marginBottom:20}}>{forgotMode?"Ingresá tu email y te enviamos el link.":"Ingresá a tu cuenta para continuar."}</div>
              <div className="card" style={{padding:24,boxShadow:"0 10px 36px rgba(91,110,245,.11)"}}>
                <div style={{marginBottom:13}}>
                  <label className="lbl">Email</label>
                  <input className={`inp${errors.email?" inp-err":""}`} type="email" value={form.email} onChange={e=>upd("email",e.target.value)} placeholder="email@passgo.app"/>
                  {errors.email&&<div style={{fontSize:11,color:C.coral,marginTop:3,fontWeight:600}}>⚠ {errors.email}</div>}
                </div>
                {!forgotMode&&(
                  <>
                    <div style={{marginBottom:16}}>
                      <label className="lbl">Contraseña</label>
                      <input className={`inp${errors.password?" inp-err":""}`} type="password" value={form.password} onChange={e=>upd("password",e.target.value)} placeholder="••••••••"/>
                      {errors.password&&<div style={{fontSize:11,color:C.coral,marginTop:3,fontWeight:600}}>⚠ {errors.password}</div>}
                    </div>
                    <div style={{marginBottom:18}}>
                      <label className="lbl">Ingresar como</label>
                      <div style={{display:"flex",gap:7}}>
                        {[["admin","Administrador"],["speaker","Disertante"]].map(([r,l])=>(
                          <div key={r} onClick={()=>upd("role",r)} style={{flex:1,padding:"8px 6px",borderRadius:9,border:`2px solid ${form.role===r?C.primary:C.border}`,background:form.role===r?C.primaryLt:C.bg,cursor:"pointer",textAlign:"center",transition:"all .14s"}}>
                            <div style={{fontSize:11,fontWeight:700,color:form.role===r?C.primary:C.textMid}}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <button className="btn btn-primary" style={{width:"100%",padding:"11px 0",fontSize:14}} onClick={handleSubmit} disabled={loading}>
                  {loading?"Ingresando...":forgotMode?"Enviar link de recuperación →":"Iniciar sesión →"}
                </button>
                <div style={{textAlign:"center",marginTop:10,fontSize:12}}>
                  {!forgotMode
                    ?<span style={{color:C.textMuted}}>¿Olvidaste tu contraseña? <span style={{color:C.primary,cursor:"pointer",fontWeight:700}} onClick={()=>setForgotMode(true)}>Recuperar</span></span>
                    :<span style={{color:C.primary,cursor:"pointer",fontWeight:700}} onClick={()=>setForgotMode(false)}>← Volver al login</span>
                  }
                </div>
              </div>
            </>
          ):(
            <div className="card" style={{padding:28,textAlign:"center",boxShadow:"0 10px 36px rgba(91,110,245,.11)"}}>
              <div style={{fontSize:40,marginBottom:12}}>📧</div>
              <div style={{fontSize:18,fontWeight:900,marginBottom:6}}>Email enviado</div>
              <p style={{fontSize:13,color:C.textMuted,marginBottom:20,lineHeight:1.6}}>Revisá tu bandeja de entrada en <strong>{form.email}</strong> para recuperar tu contraseña.</p>
              <button className="btn btn-primary" style={{width:"100%"}} onClick={()=>{setForgotMode(false);setForgotSent(false);}}>← Volver al login</button>
            </div>
          )}
          <div style={{textAlign:"center",marginTop:12}}>
            <button className="btn btn-ghost btn-sm" onClick={onBack}>← Volver al inicio</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [page,  setPage]  = useState("landing");
  const [role,  setRole]  = useState("admin");
  const [email, setEmail] = useState("admin@passgo.app");
  return (
    <>
      <GS/>
      {page==="landing" && <Landing onLogin={()=>setPage("login")}/>}
      {page==="login"   && <Login   onBack={()=>setPage("landing")} onLogin={(r,em)=>{setRole(r);setEmail(em||"admin@passgo.app");setPage("app");}}/>}
      {page==="app"     && <AppShell role={role} onLogout={()=>setPage("landing")} loginEmail={email}/>}
    </>
  );
}
