import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://eejgscizdswwgwwrlczm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamdzY2l6ZHN3d2d3d3JsY3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDI4NzAsImV4cCI6MjA5NjQxODg3MH0.0_KEY6jdyORXYcnYEh7EOf4sX__0QemA0b2qPSO8Onw";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── WORK LOCATION: 625 S 8th St, West Dundee, IL 60118 ──────────────────────
const WORK_LOCATION = { lat: 42.0912, lng: -88.2889, radius: 300 };

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  red:"#D32F2F",redDark:"#B71C1C",redDeep:"#7f0000",
  redGlow:"#D32F2F33",redDim:"#D32F2F18",
  white:"#FFFFFF",offWhite:"#F5F5F5",lightGray:"#E0E0E0",
  midGray:"#9E9E9E",darkGray:"#1A1A1A",black:"#000000",
  smoke:"#111111",charcoal:"#1C1C1C",border:"#2a2a2a",borderLight:"#3a3a3a",
  success:"#4CAF50",successDim:"#4CAF5022",warning:"#FF9800",warningDim:"#FF980022",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const haversine = (lat1,lon1,lat2,lon2) => {
  const R=6371e3,φ1=(lat1*Math.PI)/180,φ2=(lat2*Math.PI)/180;
  const Δφ=((lat2-lat1)*Math.PI)/180,Δλ=((lon2-lon1)*Math.PI)/180;
  const a=Math.sin(Δφ/2)**2+Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
};
const fmt12 = d => new Date(d).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
const fmtDate = d => new Date(d).toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"});
const fmtDateInput = d => new Date(d).toISOString().split("T")[0];
const elapsed = start => {
  const s=Math.floor((Date.now()-start)/1000);
  return `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
};
const hoursWorked = (a,b) => ((b-a)/3600000).toFixed(2);
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{background:${C.smoke};color:${C.white};font-family:'Barlow',sans-serif;min-height:100vh}
  input,select,textarea{font-family:'Barlow',sans-serif}
  input[type=date]::-webkit-calendar-picker-indicator{filter:invert(1) brightness(0.6)}
  ::-webkit-scrollbar{width:3px}
  ::-webkit-scrollbar-track{background:${C.charcoal}}
  ::-webkit-scrollbar-thumb{background:${C.red};border-radius:2px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes tickIn{0%{transform:scale(.9);opacity:0}70%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
  @keyframes glow{0%,100%{text-shadow:0 0 20px ${C.red}44}50%{text-shadow:0 0 40px ${C.red}99,0 0 80px ${C.red}33}}
  .tab-btn:hover{color:${C.white}!important;background:${C.redDim}!important}
  .action-btn:hover{transform:translateY(-1px);filter:brightness(1.15)}
  .card-hover:hover{border-color:${C.red}44!important}
  .shift-cell:hover{background:${C.redDim}!important;cursor:pointer;}
  .row-hover:hover{background:${C.redDim}!important;}
`;

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
const Card = ({children,style={}}) => (
  <div className="card-hover" style={{background:C.charcoal,border:`1px solid ${C.border}`,borderRadius:4,padding:24,...style}}>{children}</div>
);
const Divider = () => <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.borderLight},transparent)`,margin:"16px 0"}}/>;
const Badge = ({color="red",children}) => {
  const map={red:[C.redGlow,C.red],green:[C.successDim,C.success],yellow:[C.warningDim,C.warning],gray:["#ffffff11","#aaa"],blue:["#1565C022","#42A5F5"]};
  const [bg,fg]=map[color]||map.red;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:bg,color:fg,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",padding:"3px 9px",borderRadius:2,border:`1px solid ${fg}33`}}>{children}</span>;
};
const Btn = ({children,onClick,variant="primary",size="md",disabled,full,style={}}) => {
  const pad=size==="sm"?"6px 14px":"11px 22px";
  const base={
    display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,
    cursor:disabled?"not-allowed":"pointer",border:"none",borderRadius:2,
    fontFamily:"'Barlow',sans-serif",fontWeight:700,letterSpacing:.5,
    transition:"all .15s",opacity:disabled?.45:1,fontSize:size==="sm"?12:14,padding:pad,
    width:full?"100%":"auto",
    ...(variant==="primary"?{background:C.red,color:C.white,boxShadow:`0 2px 16px ${C.redGlow}`}:
        variant==="danger"?{background:"transparent",color:C.red,border:`1px solid ${C.red}55`}:
        variant==="success"?{background:C.success,color:C.white}:
        {background:"transparent",color:C.midGray,border:`1px solid ${C.border}`}),
    ...style,
  };
  return <button className="action-btn" style={base} onClick={disabled?undefined:onClick}>{children}</button>;
};
const Field = ({label,error,...props}) => (
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:11,fontWeight:700,color:C.midGray,letterSpacing:1,textTransform:"uppercase"}}>{label}</label>}
    <input {...props} style={{background:C.darkGray,border:`1px solid ${error?C.red:C.borderLight}`,borderRadius:2,color:C.white,padding:"11px 14px",fontSize:14,outline:"none",transition:"border-color .15s",...(props.style||{})}}
      onFocus={e=>e.target.style.borderColor=C.red}
      onBlur={e=>e.target.style.borderColor=error?C.red:C.borderLight}/>
    {error&&<span style={{fontSize:11,color:C.red}}>{error}</span>}
  </div>
);
const Sel = ({label,children,...props}) => (
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:11,fontWeight:700,color:C.midGray,letterSpacing:1,textTransform:"uppercase"}}>{label}</label>}
    <select {...props} style={{background:C.darkGray,border:`1px solid ${C.borderLight}`,borderRadius:2,color:C.white,padding:"11px 14px",fontSize:14,outline:"none",cursor:"pointer",...(props.style||{})}}
      onFocus={e=>e.target.style.borderColor=C.red}
      onBlur={e=>e.target.style.borderColor=C.borderLight}>{children}</select>
  </div>
);
const Spinner = ({size=20}) => (
  <div style={{width:size,height:size,border:`2px solid ${C.border}`,borderTopColor:C.red,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
);
const LiveClock = () => {
  const [t,setT]=useState(new Date());
  useEffect(()=>{const i=setInterval(()=>setT(new Date()),1000);return()=>clearInterval(i)},[]);
  return (
    <div style={{textAlign:"center",padding:"8px 0"}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:64,lineHeight:1,color:C.white,animation:"glow 3s ease infinite",letterSpacing:4}}>
        {t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
      </div>
      <div style={{color:C.midGray,fontSize:13,fontWeight:500,letterSpacing:2,textTransform:"uppercase",marginTop:6}}>
        {t.toLocaleDateString([],{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
      </div>
    </div>
  );
};
const Avatar = ({initials,size=40,active=false}) => (
  <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:active?C.red:C.darkGray,border:`2px solid ${active?C.red:C.borderLight}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:size*0.38,color:C.white,letterSpacing:1,boxShadow:active?`0 0 12px ${C.redGlow}`:"none"}}>{initials}</div>
);
const Toast = ({toast}) => toast?(
  <div style={{position:"fixed",bottom:28,right:28,zIndex:9999,background:toast.type==="error"?C.redDark:C.charcoal,border:`1px solid ${toast.type==="error"?C.red:C.success}`,color:C.white,padding:"12px 20px",borderRadius:4,fontSize:14,fontWeight:600,boxShadow:"0 8px 40px #00000088",animation:"tickIn .25s ease",display:"flex",alignItems:"center",gap:10,maxWidth:340}}>
    <span style={{fontSize:16}}>{toast.type==="error"?"⚠":"✓"}</span>{toast.msg}
  </div>
):null;
function Logo({size="md"}){
  const sm=size==="sm";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:sm?"flex-start":"center",lineHeight:1}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:sm?22:38,letterSpacing:sm?3:5,color:C.black,background:C.white,padding:sm?"2px 8px":"6px 16px",display:"inline-block",lineHeight:1.1}}>PUFF PUFF</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:sm?11:17,letterSpacing:sm?4:6,color:C.white,background:C.red,padding:sm?"1px 8px":"3px 16px",display:"inline-block",marginTop:1,lineHeight:1.3}}>SMOKE &amp; VAPE</div>
    </div>
  );
}

// ─── SCHEDULE COMPONENTS ──────────────────────────────────────────────────────
const SHIFT_COLORS = {
  Morning:  {bg:"#1565C033",border:"#42A5F5",text:"#90CAF9"},
  Afternoon:{bg:"#E65100033",border:"#FF9800",text:"#FFB74D"},  
  Evening:  {bg:"#4A148C33",border:"#AB47BC",text:"#CE93D8"},
  Closing:  {bg:"#B71C1C33",border:"#EF5350",text:"#EF9A9A"},
  Opening:  {bg:"#1B5E2033",border:"#66BB6A",text:"#A5D6A7"},
  Custom:   {bg:"#37474F33",border:"#78909C",text:"#B0BEC5"},
};

function ScheduleCalendar({shifts,employees,isAdmin,onAddShift,onDeleteShift,myEmpId}){
  const today=new Date();
  const [viewYear,setViewYear]=useState(today.getFullYear());
  const [viewMonth,setViewMonth]=useState(today.getMonth());

  const firstDay=new Date(viewYear,viewMonth,1).getDay();
  const daysInMonth=new Date(viewYear,viewMonth+1,0).getDate();
  const cells=[];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);

  const prevMonth=()=>{if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1);};
  const nextMonth=()=>{if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1);};

  const shiftsForDay=(d)=>{
    const ds=`${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return shifts.filter(s=>s.shift_date===ds && (isAdmin||s.emp_id===myEmpId));
  };

  const isPast=(d)=>{
    const cell=new Date(viewYear,viewMonth,d);
    const t=new Date(today.getFullYear(),today.getMonth(),today.getDate());
    return cell<t;
  };

  const isFutureTooFar=(d)=>{
    const cell=new Date(viewYear,viewMonth,d);
    const limit=new Date(today);
    limit.setDate(limit.getDate()+31);
    return cell>limit && !isAdmin;
  };

  return (
    <div>
      {/* Month nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <Btn variant="ghost" size="sm" onClick={prevMonth}>← Prev</Btn>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:3}}>{MONTHS[viewMonth]} {viewYear}</div>
        <Btn variant="ghost" size="sm" onClick={nextMonth}>Next →</Btn>
      </div>

      {/* Day headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
        {DAYS.map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:C.midGray,letterSpacing:1,padding:"6px 0"}}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {cells.map((d,i)=>{
          if(!d) return <div key={`empty-${i}`}/>;
          const dayShifts=shiftsForDay(d);
          const isToday=d===today.getDate()&&viewMonth===today.getMonth()&&viewYear===today.getFullYear();
          const past=isPast(d);
          const tooFar=isFutureTooFar(d);
          return (
            <div key={d} className={isAdmin&&!past?"shift-cell":""} onClick={()=>isAdmin&&!past&&onAddShift&&onAddShift(viewYear,viewMonth,d)}
              style={{minHeight:80,background:isToday?`${C.redDeep}44`:C.darkGray,border:`1px solid ${isToday?C.red:C.border}`,borderRadius:4,padding:4,opacity:past?.5:tooFar?.6:1,position:"relative",transition:"background .15s"}}>
              <div style={{fontSize:12,fontWeight:700,color:isToday?C.red:C.midGray,marginBottom:3}}>{d}</div>
              {tooFar&&!isAdmin&&<div style={{fontSize:9,color:C.midGray}}>schedule pending</div>}
              {dayShifts.map(sh=>{
                const emp=employees.find(e=>e.id===sh.emp_id||e.auth_id===sh.emp_id);
                const sc=SHIFT_COLORS[sh.shift_type]||SHIFT_COLORS.Custom;
                return (
                  <div key={sh.id} style={{background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:2,padding:"2px 4px",marginBottom:2,fontSize:10,color:sc.text,lineHeight:1.3}}>
                    <div style={{fontWeight:700}}>{sh.shift_type}</div>
                    <div>{sh.start_time}–{sh.end_time}</div>
                    {isAdmin&&<div style={{color:C.midGray,fontSize:9}}>{emp?.name??""}</div>}
                    {isAdmin&&<button onClick={e=>{e.stopPropagation();onDeleteShift(sh.id);}} style={{position:"absolute",top:2,right:2,background:"none",border:"none",color:C.midGray,cursor:"pointer",fontSize:12,lineHeight:1}}>×</button>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ADD SHIFT MODAL ──────────────────────────────────────────────────────────
function AddShiftModal({date,employees,onSave,onClose}){
  const [empId,setEmpId]=useState(employees[0]?.auth_id||employees[0]?.id||"");
  const [type,setType]=useState("Morning");
  const [start,setStart]=useState("09:00");
  const [end,setEnd]=useState("17:00");
  const [note,setNote]=useState("");

  const SHIFT_PRESETS={
    Morning:{start:"06:00",end:"14:00"},
    Afternoon:{start:"14:00",end:"22:00"},
    Evening:{start:"16:00",end:"23:00"},
    Closing:{start:"20:00",end:"00:00"},
    Opening:{start:"06:00",end:"10:00"},
    Custom:{start,end},
  };

  const handleTypeChange=(t)=>{
    setType(t);
    if(t!=="Custom"){setStart(SHIFT_PRESETS[t].start);setEnd(SHIFT_PRESETS[t].end);}
  };

  return (
    <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.charcoal,border:`1px solid ${C.border}`,borderRadius:4,padding:28,width:"100%",maxWidth:420,animation:"tickIn .2s ease"}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,marginBottom:20}}>
          ADD SHIFT — {fmtDate(date)}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Sel label="Employee" value={empId} onChange={e=>setEmpId(e.target.value)}>
            {employees.filter(e=>e.auth_id||e.id).map(e=>(
              <option key={e.id} value={e.auth_id||e.id}>{e.name}</option>
            ))}
          </Sel>
          <Sel label="Shift Type" value={type} onChange={e=>handleTypeChange(e.target.value)}>
            {Object.keys(SHIFT_COLORS).map(t=><option key={t}>{t}</option>)}
          </Sel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Start Time" type="time" value={start} onChange={e=>setStart(e.target.value)}/>
            <Field label="End Time" type="time" value={end} onChange={e=>setEnd(e.target.value)}/>
          </div>
          <Field label="Note (optional)" value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Cover register 2"/>
        </div>
        <div style={{display:"flex",gap:12,marginTop:20}}>
          <Btn full onClick={()=>onSave({emp_id:empId,shift_date:fmtDateInput(date),shift_type:type,start_time:start,end_time:end,note})}>Save Shift</Btn>
          <Btn full variant="ghost" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [authView,setAuthView]=useState("login");
  const [authUser,setAuthUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [authForm,setAuthForm]=useState({firstName:"",lastName:"",dob:"",phone:"",email:"",password:""});
  const [authErr,setAuthErr]=useState("");

  const [tab,setTab]=useState("clock");
  const [employees,setEmployees]=useState([]);
  const [roles,setRoles]=useState(["Manager","Sales Associate","Inventory","Cashier","Security","Cleaning"]);
  const [sessions,setSessions]=useState([]);
  const [timeOff,setTimeOff]=useState([]);
  const [shifts,setShifts]=useState([]);
  const [loading,setLoading]=useState(false);
  const [isAdmin,setIsAdmin]=useState(false);

  const [geoStatus,setGeoStatus]=useState("idle");
  const [geoMsg,setGeoMsg]=useState("");
  const [timer,setTimer]=useState("");
  const [toast,setToast]=useState(null);

  const [newRole,setNewRole]=useState("");
  const [inviteLoading,setInviteLoading]=useState(false);
  const [inviteSent,setInviteSent]=useState({});

  const [newEmp,setNewEmp]=useState({name:"",role:"Sales Associate",wage:"",email:""});
  const [toReq,setToReq]=useState({from:"",to:"",reason:""});

  // Schedule modal
  const [shiftModal,setShiftModal]=useState(null); // {year,month,day}

  // Edit employee modal
  const [editEmp,setEditEmp]=useState(null);
  const [deleteConfirm,setDeleteConfirm]=useState(null); // emp object to confirm delete

  const activeSess=sessions.find(s=>s.emp_id===authUser?.id&&!s.clock_out);
  const myRecord=employees.find(e=>e.auth_id===authUser?.id);
  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};

  // ── AUTH INIT ────────────────────────────────────────────────────────────────
  useEffect(()=>{
    const init=async()=>{
      const {data:{session}}=await supabase.auth.getSession();
      if(session?.user){setAuthUser(session.user);await loadProfile(session.user.id);setAuthView("app");}
      setAuthLoading(false);
    };
    init();
    const {data:{subscription}}=supabase.auth.onAuthStateChange(async(_,sess)=>{
      if(sess?.user){setAuthUser(sess.user);setAuthView("app");await loadProfile(sess.user.id);}
      else{setAuthUser(null);setAuthView("login");setIsAdmin(false);}
    });
    return()=>subscription.unsubscribe();
  },[]);

  const loadProfile=async(uid)=>{
    const {data}=await supabase.from("employees").select("*").eq("auth_id",uid).single();
    if(data) setIsAdmin(data.role==="Manager");
  };

  // ── FETCH ALL ────────────────────────────────────────────────────────────────
  const fetchAll=useCallback(async()=>{
    if(!authUser) return;
    const [e,s,t,sh]=await Promise.all([
      supabase.from("employees").select("*").order("name"),
      supabase.from("sessions").select("*").order("clock_in",{ascending:false}),
      supabase.from("time_off").select("*").order("submitted_at",{ascending:false}),
      supabase.from("shifts").select("*").order("shift_date"),
    ]);
    if(e.data) setEmployees(e.data);
    if(s.data) setSessions(s.data);
    if(t.data) setTimeOff(t.data);
    if(sh.data) setShifts(sh.data);
  },[authUser]);

  useEffect(()=>{if(authUser) fetchAll();},[authUser,fetchAll]);

  // ── TIMER ────────────────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!activeSess){setTimer("");return;}
    const i=setInterval(()=>setTimer(elapsed(new Date(activeSess.clock_in).getTime())),500);
    return()=>clearInterval(i);
  },[activeSess]);

  // ── AUTH HANDLERS ─────────────────────────────────────────────────────────────
  const handleLogin=async()=>{
    setAuthErr("");setLoading(true);
    const {error}=await supabase.auth.signInWithPassword({email:authForm.email,password:authForm.password});
    setLoading(false);
    if(error) setAuthErr(error.message);
  };

  const handleSignup=async()=>{
    setAuthErr("");setLoading(true);
    const {firstName,lastName,dob,phone,email,password}=authForm;
    if(!firstName||!lastName||!dob||!phone||!email||!password){
      setAuthErr("All fields are required.");setLoading(false);return;
    }
    const {data,error}=await supabase.auth.signUp({email,password});
    if(error){setAuthErr(error.message);setLoading(false);return;}
    const fullName=`${firstName.trim()} ${lastName.trim()}`;
    const initials=(firstName[0]+(lastName[0]||"")).toUpperCase();
    await supabase.from("employees").insert({
      auth_id:data.user.id,name:fullName,first_name:firstName.trim(),last_name:lastName.trim(),
      dob,phone,email,initials,role:"Pending",wage:0,
    });
    setLoading(false);
    showToast("Account created! An admin will assign your role.");
    setAuthView("login");
  };

  const handleLogout=async()=>{await supabase.auth.signOut();setIsAdmin(false);};

  // ── CLOCK IN/OUT ──────────────────────────────────────────────────────────────
  const clockIn=()=>{
    setGeoStatus("checking");setGeoMsg("Verifying location…");
    navigator.geolocation.getCurrentPosition(
      async(pos)=>{
        const dist=haversine(pos.coords.latitude,pos.coords.longitude,WORK_LOCATION.lat,WORK_LOCATION.lng);
        if(dist<=WORK_LOCATION.radius){
          setGeoStatus("ok");setGeoMsg(`✓ Location verified — ${Math.round(dist)}m from store`);
          const {data}=await supabase.from("sessions").insert({emp_id:authUser.id,clock_in:new Date().toISOString(),lat:pos.coords.latitude,lng:pos.coords.longitude}).select().single();
          if(data) setSessions(s=>[data,...s]);
          showToast("Clocked in successfully");
          // Notify manager
          fetch(`https://eejgscizdswwgwwrlczm.supabase.co/functions/v1/notify-clockin`,{
            method:"POST",
            headers:{"Content-Type":"application/json","Authorization":`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamdzY2l6ZHN3d2d3d3JsY3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDI4NzAsImV4cCI6MjA5NjQxODg3MH0.0_KEY6jdyORXYcnYEh7EOf4sX__0QemA0b2qPSO8Onw`},
            body:JSON.stringify({employeeName:myRecord?.name??"Employee",action:"in",time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})})
          });
        } else {
          setGeoStatus("fail");setGeoMsg(`✗ Not at store location (${Math.round(dist)}m away — must be within ${WORK_LOCATION.radius}m)`);
          showToast("Location check failed","error");
        }
      },
      async()=>{
        setGeoStatus("ok");setGeoMsg("⚠ Location unavailable — demo mode");
        const {data}=await supabase.from("sessions").insert({emp_id:authUser.id,clock_in:new Date().toISOString(),lat:null,lng:null}).select().single();
        if(data) setSessions(s=>[data,...s]);
        showToast("Clocked in (demo mode)");
        fetch(`https://eejgscizdswwgwwrlczm.supabase.co/functions/v1/notify-clockin`,{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamdzY2l6ZHN3d2d3d3JsY3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDI4NzAsImV4cCI6MjA5NjQxODg3MH0.0_KEY6jdyORXYcnYEh7EOf4sX__0QemA0b2qPSO8Onw`},
          body:JSON.stringify({employeeName:myRecord?.name??"Employee",action:"in",time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})})
        });
      }
    );
  };

  const clockOut=async()=>{
    if(!activeSess) return;
    const {data}=await supabase.from("sessions").update({clock_out:new Date().toISOString()}).eq("id",activeSess.id).select().single();
    if(data) setSessions(s=>s.map(x=>x.id===activeSess.id?data:x));
    setGeoStatus("idle");setGeoMsg("");showToast("Clocked out");
    fetch(`https://eejgscizdswwgwwrlczm.supabase.co/functions/v1/notify-clockin`,{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamdzY2l6ZHN3d2d3d3JsY3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDI4NzAsImV4cCI6MjA5NjQxODg3MH0.0_KEY6jdyORXYcnYEh7EOf4sX__0QemA0b2qPSO8Onw`},
      body:JSON.stringify({employeeName:myRecord?.name??"Employee",action:"out",time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})})
    });
  };

  // ── ADMIN: Add/Edit Employee ──────────────────────────────────────────────────
  const addEmployee=async()=>{
    if(!newEmp.name||!newEmp.wage) return;
    const parts=newEmp.name.trim().split(" ");
    const initials=(parts[0][0]+(parts[1]?parts[1][0]:"")).toUpperCase();
    const {data}=await supabase.from("employees").insert({name:newEmp.name.trim(),role:newEmp.role,wage:parseFloat(newEmp.wage),email:newEmp.email,initials,auth_id:null}).select().single();
    if(data){
      setEmployees(e=>[...e,data]);
      setNewEmp({name:"",role:roles[0],wage:"",email:""});
      showToast("Employee added");
      if(newEmp.email) sendInvite(data);
    }
  };

  const saveEditEmp=async()=>{
    if(!editEmp) return;
    const {data}=await supabase.from("employees").update({role:editEmp.role,wage:parseFloat(editEmp.wage),name:editEmp.name}).eq("id",editEmp.id).select().single();
    if(data){setEmployees(e=>e.map(x=>x.id===editEmp.id?data:x));setEditEmp(null);showToast("Employee updated");}
  };


  // ── SEND INVITE EMAIL ─────────────────────────────────────────────────────
  const sendInvite=async(emp)=>{
    if(!emp.email){showToast("No email on file for this employee","error");return;}
    setInviteLoading(true);
    try{
      const res=await fetch("https://eejgscizdswwgwwrlczm.supabase.co/functions/v1/invite-employee",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamdzY2l6ZHN3d2d3d3JsY3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDI4NzAsImV4cCI6MjA5NjQxODg3MH0.0_KEY6jdyORXYcnYEh7EOf4sX__0QemA0b2qPSO8Onw`,
        },
        body:JSON.stringify({email:emp.email,name:emp.name}),
      });
      const json=await res.json();
      if(json.ok){
        setInviteSent(s=>({...s,[emp.id]:true}));
        showToast(`Invite sent to ${emp.email} ✓`);
      } else {
        showToast(json.error||"Failed to send invite","error");
      }
    }catch(e){
      showToast("Failed to send invite","error");
    }
    setInviteLoading(false);
  };


  // ── DELETE EMPLOYEE ───────────────────────────────────────────────────────
  const deleteEmployee=async(emp)=>{
    // Delete their sessions, time off, shifts, and employee record
    await supabase.from("sessions").delete().eq("emp_id", emp.auth_id||emp.id);
    await supabase.from("time_off").delete().eq("emp_id", emp.auth_id||emp.id);
    await supabase.from("shifts").delete().eq("emp_id", emp.auth_id||emp.id);
    await supabase.from("employees").delete().eq("id", emp.id);
    // If they have an auth account, disable it via admin
    if(emp.auth_id){
      await fetch(`https://eejgscizdswwgwwrlczm.supabase.co/functions/v1/delete-employee`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamdzY2l6ZHN3d2d3d3JsY3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDI4NzAsImV4cCI6MjA5NjQxODg3MH0.0_KEY6jdyORXYcnYEh7EOf4sX__0QemA0b2qPSO8Onw`,
        },
        body:JSON.stringify({userId:emp.auth_id, email:emp.email, name:emp.name}),
      });
    }
    setEmployees(e=>e.filter(x=>x.id!==emp.id));
    setSessions(s=>s.filter(x=>x.emp_id!==(emp.auth_id||emp.id)));
    setShifts(s=>s.filter(x=>x.emp_id!==(emp.auth_id||emp.id)));
    setTimeOff(t=>t.filter(x=>x.emp_id!==(emp.auth_id||emp.id)));
    setDeleteConfirm(null);
    showToast(`${emp.name} has been removed from the system`);
  };

  // ── SHIFTS ────────────────────────────────────────────────────────────────────
  const handleAddShift=async(shiftData)=>{
    const {data}=await supabase.from("shifts").insert(shiftData).select().single();
    if(data){setShifts(s=>[...s,data]);setShiftModal(null);showToast("Shift added");}
  };

  const handleDeleteShift=async(id)=>{
    await supabase.from("shifts").delete().eq("id",id);
    setShifts(s=>s.filter(x=>x.id!==id));showToast("Shift removed");
  };

  // ── TIME OFF ──────────────────────────────────────────────────────────────────
  const submitTO=async()=>{
    if(!toReq.from||!toReq.to) return;
    const {data}=await supabase.from("time_off").insert({emp_id:authUser.id,from_date:toReq.from,to_date:toReq.to,reason:toReq.reason,status:"pending",submitted_at:new Date().toISOString()}).select().single();
    if(data){setTimeOff(r=>[data,...r]);setToReq({from:"",to:"",reason:""});showToast("Request submitted");
    fetch(`https://eejgscizdswwgwwrlczm.supabase.co/functions/v1/notify-timeoff`,{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamdzY2l6ZHN3d2d3d3JsY3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDI4NzAsImV4cCI6MjA5NjQxODg3MH0.0_KEY6jdyORXYcnYEh7EOf4sX__0QemA0b2qPSO8Onw`},
      body:JSON.stringify({employeeName:myRecord?.name??"Employee",from:toReq.from,to:toReq.to,reason:toReq.reason})
    });}
  };

  const updateTO=async(id,status)=>{
    const {data}=await supabase.from("time_off").update({status}).eq("id",id).select().single();
    if(data){setTimeOff(r=>r.map(x=>x.id===id?data:x));showToast(`Request ${status}`);}
  };

  // ── EARNINGS ──────────────────────────────────────────────────────────────────
  const weeklyEarnings=(empId)=>{
    const emp=employees.find(e=>e.auth_id===empId||e.id===empId);
    if(!emp) return "0.00";
    const w=Date.now()-7*86400000;
    return sessions.filter(s=>(s.emp_id===empId||s.emp_id===emp.auth_id)&&s.clock_out&&new Date(s.clock_in).getTime()>w)
      .reduce((a,s)=>a+parseFloat(hoursWorked(new Date(s.clock_in).getTime(),new Date(s.clock_out).getTime()))*emp.wage,0).toFixed(2);
  };

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if(authLoading) return (
    <><style>{STYLES}</style>
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,background:C.smoke}}>
      <Logo size="lg"/><Spinner size={32}/>
    </div></>
  );

  // ── AUTH SCREENS ──────────────────────────────────────────────────────────────
  if(authView!=="app") return (
    <><style>{STYLES}</style>
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:C.smoke,backgroundImage:`radial-gradient(ellipse at 50% 0%,${C.redDeep}22 0%,transparent 60%)`}}>
      <div style={{width:"100%",maxWidth:440,animation:"fadeUp .4s ease"}}>
        <div style={{textAlign:"center",marginBottom:32}}><Logo size="lg"/>
          <div style={{color:C.midGray,fontSize:13,letterSpacing:1,textTransform:"uppercase",marginTop:8}}>Employee Portal</div>
        </div>
        <Card style={{padding:32}}>
          <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:24,gap:0}}>
            {["login","signup"].map(v=>(
              <button key={v} onClick={()=>{setAuthView(v);setAuthErr("");}} style={{flex:1,padding:"10px 0",background:"none",border:"none",cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700,fontSize:13,letterSpacing:1,textTransform:"uppercase",color:authView===v?C.white:C.midGray,borderBottom:`2px solid ${authView===v?C.red:"transparent"}`,marginBottom:-1,transition:"all .2s"}}>
                {v==="login"?"Sign In":"Register"}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {authView==="signup"&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Field label="First Name" value={authForm.firstName} onChange={e=>setAuthForm(f=>({...f,firstName:e.target.value}))} placeholder="Jordan"/>
                  <Field label="Last Name" value={authForm.lastName} onChange={e=>setAuthForm(f=>({...f,lastName:e.target.value}))} placeholder="Rivera"/>
                </div>
                <Field label="Date of Birth" type="date" value={authForm.dob} onChange={e=>setAuthForm(f=>({...f,dob:e.target.value}))}/>
                <Field label="Phone Number" type="tel" value={authForm.phone} onChange={e=>setAuthForm(f=>({...f,phone:e.target.value}))} placeholder="(847) 555-0100"/>
              </>
            )}
            <Field label="Email" type="email" value={authForm.email} onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))} placeholder="you@email.com"/>
            <Field label="Password" type="password" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))} placeholder="••••••••"/>
            {authErr&&<div style={{fontSize:13,color:C.red,padding:"8px 12px",background:C.redDim,borderRadius:2,border:`1px solid ${C.red}33`}}>{authErr}</div>}
            {authView==="signup"&&<div style={{fontSize:12,color:C.midGray,lineHeight:1.5,padding:"8px 12px",background:"#ffffff08",borderRadius:2}}>ℹ Your role and wage will be assigned by your manager after registration.</div>}
            <Btn full onClick={authView==="login"?handleLogin:handleSignup} disabled={loading}>
              {loading?<Spinner size={16}/>:authView==="login"?"Sign In →":"Create Account →"}
            </Btn>
          </div>
        </Card>
        <div style={{textAlign:"center",marginTop:16,fontSize:12,color:C.midGray}}>625 S 8th St, West Dundee, IL 60118</div>
      </div>
    </div></>
  );

  // ── MAIN APP ──────────────────────────────────────────────────────────────────
  const TABS=[
    {id:"clock",label:"TIME CLOCK"},
    {id:"schedule",label:"SCHEDULE"},
    {id:"team",label:"TEAM"},
    {id:"logs",label:"LOGS"},
    {id:"timeoff",label:"TIME OFF"},
    ...(isAdmin?[{id:"admin",label:"ADMIN"}]:[]),
  ];

  return (
    <><style>{STYLES}</style>
    <div style={{minHeight:"100vh",background:C.smoke}}>

      {/* TOP BAR */}
      <div style={{background:C.black,borderBottom:`2px solid ${C.red}`,padding:"0 24px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:980,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
          <Logo size="sm"/>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            {myRecord&&(
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Avatar initials={myRecord.initials||"?"} size={32} active={!!activeSess}/>
                <div>
                  <div style={{fontSize:13,fontWeight:600,lineHeight:1.2}}>{myRecord.name}</div>
                  <div style={{fontSize:11,color:myRecord.role==="Pending"?C.warning:C.midGray}}>{myRecord.role==="Pending"?"Awaiting role assignment":myRecord.role}</div>
                </div>
                {activeSess&&<Badge color="green">● ON SHIFT</Badge>}
              </div>
            )}
            <Btn variant="ghost" size="sm" onClick={handleLogout}>Sign Out</Btn>
          </div>
        </div>
      </div>

      {/* NAV */}
      <div style={{background:C.charcoal,borderBottom:`1px solid ${C.border}`,padding:"0 24px"}}>
        <div style={{maxWidth:980,margin:"0 auto",display:"flex",overflowX:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} className="tab-btn" onClick={()=>setTab(t.id)} style={{background:"none",border:"none",padding:"14px 18px",cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700,fontSize:12,letterSpacing:1.5,whiteSpace:"nowrap",color:tab===t.id?C.white:C.midGray,borderBottom:`2px solid ${tab===t.id?C.red:"transparent"}`,marginBottom:-1,transition:"all .2s"}}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{maxWidth:980,margin:"0 auto",padding:28,animation:"fadeUp .3s ease"}}>

        {/* ══ CLOCK TAB ══ */}
        {tab==="clock"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <Card style={{backgroundImage:`radial-gradient(ellipse at 50% 0%,${C.redDeep}33 0%,transparent 70%)`}}><LiveClock/></Card>
            {myRecord?.role==="Pending"?(
              <Card>
                <div style={{textAlign:"center",padding:32}}>
                  <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2,marginBottom:8}}>ACCOUNT PENDING APPROVAL</div>
                  <div style={{color:C.midGray,fontSize:14,lineHeight:1.6}}>Your account has been created successfully.<br/>A manager will assign your role and wage before you can clock in.<br/>Please check back soon or contact your manager.</div>
                </div>
              </Card>
            ):(
              <>
                <Card>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                    <div>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2}}>{myRecord?.name??"Employee"}</div>
                      <div style={{fontSize:13,color:C.midGray,marginTop:2}}>{myRecord?.role} · ${myRecord?.wage}/hr</div>
                    </div>
                    {activeSess?<Badge color="green">● CLOCKED IN</Badge>:<Badge color="gray">● OFF SHIFT</Badge>}
                  </div>
                  {activeSess&&(
                    <div style={{textAlign:"center",padding:"20px 0",margin:"16px 0",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:56,color:C.red,letterSpacing:4,lineHeight:1}}>{timer}</div>
                      <div style={{fontSize:12,color:C.midGray,letterSpacing:1,textTransform:"uppercase",marginTop:6}}>Time on shift · Started {fmt12(activeSess.clock_in)}</div>
                    </div>
                  )}
                  <div style={{display:"flex",gap:12,marginTop:16}}>
                    {!activeSess?(
                      <Btn full onClick={clockIn} disabled={geoStatus==="checking"}>
                        {geoStatus==="checking"?<><Spinner size={16}/>Verifying Location…</>:<>▶ &nbsp;CLOCK IN</>}
                      </Btn>
                    ):(
                      <Btn full variant="danger" onClick={clockOut}>■ &nbsp;CLOCK OUT</Btn>
                    )}
                  </div>
                  {geoMsg&&<div style={{marginTop:14,padding:"10px 14px",borderRadius:2,fontSize:13,fontWeight:500,background:geoStatus==="ok"?C.successDim:geoStatus==="fail"?C.redDim:"#ffffff08",color:geoStatus==="ok"?C.success:geoStatus==="fail"?C.red:C.midGray,border:`1px solid ${geoStatus==="ok"?C.success:geoStatus==="fail"?C.red:C.borderLight}33`}}>{geoMsg}</div>}
                </Card>
                {sessions.filter(s=>s.emp_id===authUser?.id).length>0&&(
                  <Card>
                    <div style={{fontSize:11,fontWeight:700,color:C.midGray,letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>Recent Sessions</div>
                    {sessions.filter(s=>s.emp_id===authUser?.id).slice(0,5).map(s=>(
                      <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}22`}}>
                        <div style={{fontSize:13}}>{fmt12(s.clock_in)} → {s.clock_out?fmt12(s.clock_out):<Badge color="green">Active</Badge>}</div>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:s.clock_out?C.red:C.midGray,letterSpacing:1}}>
                          {s.clock_out?`${hoursWorked(new Date(s.clock_in).getTime(),new Date(s.clock_out).getTime())}h · $${(hoursWorked(new Date(s.clock_in).getTime(),new Date(s.clock_out).getTime())*myRecord?.wage).toFixed(2)}`:"—"}
                        </div>
                      </div>
                    ))}
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ SCHEDULE TAB ══ */}
        {tab==="schedule"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {isAdmin&&(
              <div style={{padding:"10px 16px",background:C.redDim,border:`1px solid ${C.red}44`,borderRadius:4,fontSize:13,color:C.lightGray}}>
                📅 <strong>Admin:</strong> Click any future date on the calendar to add a shift for an employee.
              </div>
            )}
            <Card>
              <ScheduleCalendar
                shifts={shifts}
                employees={employees}
                isAdmin={isAdmin}
                myEmpId={authUser?.id}
                onAddShift={(y,m,d)=>setShiftModal(new Date(y,m,d))}
                onDeleteShift={handleDeleteShift}
              />
            </Card>

            {/* Upcoming shifts list for employee */}
            {!isAdmin&&(
              <Card>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:2,marginBottom:16}}>MY UPCOMING SHIFTS</div>
                {(() => {
                  const today=new Date(); today.setHours(0,0,0,0);
                  const limit=new Date(today); limit.setDate(limit.getDate()+31);
                  const mine=shifts.filter(s=>{
                    const d=new Date(s.shift_date+"T00:00:00");
                    return s.emp_id===authUser?.id && d>=today && d<=limit;
                  }).sort((a,b)=>a.shift_date.localeCompare(b.shift_date));
                  if(mine.length===0) return <div style={{color:C.midGray,textAlign:"center",padding:24}}>No upcoming shifts scheduled. Check back soon.</div>;
                  return mine.map(s=>{
                    const sc=SHIFT_COLORS[s.shift_type]||SHIFT_COLORS.Custom;
                    return (
                      <div key={s.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:C.darkGray,borderRadius:4,border:`1px solid ${sc.border}33`,marginBottom:8}}>
                        <div style={{width:4,alignSelf:"stretch",background:sc.border,borderRadius:2,flexShrink:0}}/>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:14}}>{fmtDate(s.shift_date+"T12:00:00")}</div>
                          <div style={{fontSize:12,color:sc.text,marginTop:2}}>{s.shift_type} · {s.start_time} – {s.end_time}</div>
                          {s.note&&<div style={{fontSize:11,color:C.midGray,marginTop:2}}>{s.note}</div>}
                        </div>
                        <Badge color="blue">{s.shift_type}</Badge>
                      </div>
                    );
                  });
                })()}
              </Card>
            )}
          </div>
        )}

        {/* ══ TEAM TAB ══ */}
        {tab==="team"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(268px,1fr))",gap:16}}>
            {employees.map(emp=>{
              const isIn=sessions.some(s=>s.emp_id===emp.auth_id&&!s.clock_out);
              const totalSess=sessions.filter(s=>s.emp_id===emp.auth_id&&s.clock_out);
              const totalHrs=totalSess.reduce((a,s)=>a+parseFloat(hoursWorked(new Date(s.clock_in).getTime(),new Date(s.clock_out).getTime())),0).toFixed(1);
              return (
                <Card key={emp.id}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                    <Avatar initials={emp.initials||"?"} size={46} active={isIn}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:15,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{emp.name}</div>
                      <div style={{fontSize:12,color:emp.role==="Pending"?C.warning:C.midGray,marginTop:2}}>{emp.role}</div>
                      {emp.phone&&<div style={{fontSize:11,color:C.midGray}}>{emp.phone}</div>}
                    </div>
                    {isIn&&<Badge color="green">IN</Badge>}
                    {emp.role==="Pending"&&<Badge color="yellow">PENDING</Badge>}
                  </div>
                  <Divider/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {[["Hourly Rate",emp.wage?`$${emp.wage}`:"TBD"],["This Week",`$${weeklyEarnings(emp.auth_id)}`],["Total Hrs",`${totalHrs}h`],["Sessions",totalSess.length]].map(([l,v])=>(
                      <div key={l} style={{background:C.darkGray,borderRadius:2,padding:"10px 12px",border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:10,color:C.midGray,textTransform:"uppercase",letterSpacing:1}}>{l}</div>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:C.white,marginTop:3,letterSpacing:1}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {isAdmin&&(
                    <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
                      <Btn full size="sm" variant="ghost" onClick={()=>setEditEmp({...emp})}>✏ Edit Role / Wage</Btn>
                      {emp.email&&(
                        <Btn full size="sm" variant="danger" disabled={inviteSent[emp.id]||inviteLoading} onClick={()=>sendInvite(emp)}>
                          {inviteSent[emp.id]?"✓ Invite Sent":"✉ Send Invite Email"}
                        </Btn>
                      )}
                      <Btn full size="sm" onClick={()=>setDeleteConfirm(emp)} style={{background:"transparent",color:"#ef5350",border:"1px solid #ef535055",fontSize:12}}>🗑 Remove / Terminate Employee</Btn>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* ══ LOGS TAB ══ */}
        {tab==="logs"&&(
          <Card>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,marginBottom:20}}>SHIFT LOGS</div>
            {sessions.length===0?(
              <div style={{textAlign:"center",padding:40,color:C.midGray}}>No sessions recorded yet.</div>
            ):(
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid ${C.border}`}}>
                      {["Employee","Role","Date","Clock In","Clock Out","Hours","Earnings","Location"].map(h=>(
                        <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:C.midGray,letterSpacing:1.5,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.filter(s=>isAdmin||s.emp_id===authUser?.id).map(s=>{
                      const emp=employees.find(e=>e.auth_id===s.emp_id);
                      const hrs=s.clock_out?hoursWorked(new Date(s.clock_in).getTime(),new Date(s.clock_out).getTime()):null;
                      return (
                        <tr key={s.id} className="row-hover" style={{borderBottom:`1px solid ${C.border}22`,transition:"background .15s"}}>
                          <td style={{padding:"10px 12px",fontWeight:600}}>{emp?.name??<span style={{color:C.midGray}}>Unknown</span>}</td>
                          <td style={{padding:"10px 12px",color:C.midGray,fontSize:12}}>{emp?.role??""}</td>
                          <td style={{padding:"10px 12px",fontSize:12,color:C.midGray}}>{fmtDate(s.clock_in)}</td>
                          <td style={{padding:"10px 12px",fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:1}}>{fmt12(s.clock_in)}</td>
                          <td style={{padding:"10px 12px",fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:1}}>{s.clock_out?fmt12(s.clock_out):<Badge color="green">Active</Badge>}</td>
                          <td style={{padding:"10px 12px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>{hrs?`${hrs}h`:"—"}</td>
                          <td style={{padding:"10px 12px",fontFamily:"'Bebas Neue',sans-serif",color:C.red,letterSpacing:1}}>{hrs&&emp?`$${(hrs*emp.wage).toFixed(2)}`:"—"}</td>
                          <td style={{padding:"10px 12px",fontSize:11,color:C.midGray}}>{s.lat?`${parseFloat(s.lat).toFixed(4)},${parseFloat(s.lng).toFixed(4)}`:"N/A"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* ══ TIME OFF TAB ══ */}
        {tab==="timeoff"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <Card>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,marginBottom:20}}>REQUEST TIME OFF</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <Field label="From Date" type="date" value={toReq.from} onChange={e=>setToReq(r=>({...r,from:e.target.value}))}/>
                <Field label="To Date" type="date" value={toReq.to} onChange={e=>setToReq(r=>({...r,to:e.target.value}))}/>
                <Field label="Reason (optional)" value={toReq.reason} onChange={e=>setToReq(r=>({...r,reason:e.target.value}))} placeholder="Vacation, Medical, Personal…" style={{gridColumn:"1/-1"}}/>
              </div>
              <div style={{marginTop:16}}><Btn onClick={submitTO}>Submit Request →</Btn></div>
            </Card>
            <Card>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,marginBottom:20}}>{isAdmin?"ALL REQUESTS":"MY REQUESTS"}</div>
              {timeOff.filter(r=>isAdmin||r.emp_id===authUser?.id).length===0?(
                <div style={{textAlign:"center",padding:32,color:C.midGray}}>No requests on file.</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {timeOff.filter(r=>isAdmin||r.emp_id===authUser?.id).map(r=>{
                    const emp=employees.find(e=>e.auth_id===r.emp_id);
                    return (
                      <div key={r.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:C.darkGray,borderRadius:2,border:`1px solid ${C.border}`,animation:"slideIn .25s ease"}}>
                        {emp&&<Avatar initials={emp.initials||"?"} size={36}/>}
                        <div style={{flex:1,minWidth:0}}>
                          {isAdmin&&<div style={{fontWeight:700,fontSize:13,marginBottom:2}}>{emp?.name}</div>}
                          <div style={{fontSize:13,color:C.lightGray}}>{fmtDate(r.from_date+"T12:00:00")} → {fmtDate(r.to_date+"T12:00:00")}</div>
                          {r.reason&&<div style={{fontSize:12,color:C.midGray,marginTop:2}}>{r.reason}</div>}
                        </div>
                        <Badge color={r.status==="approved"?"green":r.status==="denied"?"red":"yellow"}>{r.status}</Badge>
                        {isAdmin&&r.status==="pending"&&(
                          <div style={{display:"flex",gap:8,flexShrink:0}}>
                            <Btn size="sm" onClick={()=>updateTO(r.id,"approved")}>✓ Approve</Btn>
                            <Btn size="sm" variant="danger" onClick={()=>updateTO(r.id,"denied")}>✗ Deny</Btn>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ══ ADMIN TAB ══ */}
        {tab==="admin"&&isAdmin&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>

            {/* Pending employees alert */}
            {employees.filter(e=>e.role==="Pending").length>0&&(
              <div style={{padding:"14px 18px",background:C.warningDim,border:`1px solid ${C.warning}44`,borderRadius:4,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:20}}>⚠</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:C.warning}}>{employees.filter(e=>e.role==="Pending").length} employee(s) awaiting role assignment</div>
                  <div style={{fontSize:12,color:C.midGray,marginTop:2}}>Go to the <strong>Team tab</strong> and click "Edit Role / Wage" to assign them. Use "Send Invite Email" to send them a signup link.</div>
                </div>
              </div>
            )}

            <Card>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,marginBottom:20}}>ADD EMPLOYEE MANUALLY</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
                <Field label="Full Name" value={newEmp.name} onChange={e=>setNewEmp(n=>({...n,name:e.target.value}))} placeholder="Taylor Smith"/>
                <Sel label="Role" value={newEmp.role} onChange={e=>setNewEmp(n=>({...n,role:e.target.value}))}>
                  {roles.map(r=><option key={r}>{r}</option>)}
                </Sel>
                <Field label="Hourly Wage ($)" type="number" value={newEmp.wage} onChange={e=>setNewEmp(n=>({...n,wage:e.target.value}))} placeholder="17.50"/>
                <Field label="Email" type="email" value={newEmp.email} onChange={e=>setNewEmp(n=>({...n,email:e.target.value}))} placeholder="emp@email.com"/>
              </div>
              <div style={{marginTop:16,display:"flex",gap:12,alignItems:"center"}}>
                <Btn onClick={addEmployee}>+ Add &amp; Send Invite</Btn>
                <span style={{fontSize:12,color:C.midGray}}>An invite email will be sent to the employee automatically</span>
              </div>
            </Card>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <Card>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,marginBottom:16}}>JOB ROLES</div>
                <div style={{display:"flex",gap:10,marginBottom:14}}>
                  <input value={newRole} onChange={e=>setNewRole(e.target.value)} placeholder="New role…"
                    onKeyDown={e=>{if(e.key==="Enter"&&newRole.trim()){setRoles(r=>[...r,newRole.trim()]);setNewRole("");}}}
                    style={{flex:1,background:C.darkGray,border:`1px solid ${C.borderLight}`,borderRadius:2,color:C.white,padding:"11px 14px",fontSize:14,fontFamily:"'Barlow',sans-serif",outline:"none"}}/>
                  <Btn onClick={()=>{if(newRole.trim()){setRoles(r=>[...r,newRole.trim()]);setNewRole("");}}} size="sm">Add</Btn>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {roles.map(r=>(
                    <div key={r} style={{display:"flex",alignItems:"center",gap:6,background:C.darkGray,border:`1px solid ${C.borderLight}`,padding:"5px 10px",borderRadius:2,fontSize:13}}>
                      {r}<button onClick={()=>setRoles(rs=>rs.filter(x=>x!==r))} style={{background:"none",border:"none",color:C.midGray,cursor:"pointer",fontSize:16,lineHeight:1,padding:0}}>×</button>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,marginBottom:16}}>STORE LOCATION</div>
                {[["Address","625 S 8th St, West Dundee, IL"],["Latitude","42.0912° N"],["Longitude","88.2889° W"],["Geofence Radius","300 meters"]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}22`}}>
                    <span style={{fontSize:12,color:C.midGray,textTransform:"uppercase",letterSpacing:.5}}>{l}</span>
                    <span style={{fontSize:13,fontWeight:600}}>{v}</span>
                  </div>
                ))}
                <div style={{marginTop:12,fontSize:12,color:C.midGray,lineHeight:1.6}}>Employees must be within 300m to clock in.</div>
              </Card>
            </div>
          </div>
        )}

      </div>
    </div>


    {/* DELETE CONFIRM MODAL */}
    {deleteConfirm&&(
      <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:"#1C1C1C",border:"1px solid #D32F2F",borderRadius:4,padding:32,width:"100%",maxWidth:420,animation:"tickIn .2s ease"}}>
          <div style={{fontSize:28,textAlign:"center",marginBottom:12}}>⚠️</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2,textAlign:"center",color:"#ef5350",marginBottom:8}}>CONFIRM TERMINATION</div>
          <div style={{fontSize:14,color:"#9E9E9E",textAlign:"center",lineHeight:1.7,marginBottom:24}}>
            You are about to permanently remove<br/>
            <strong style={{color:"#fff",fontSize:16}}>{deleteConfirm.name}</strong><br/>
            from the system.<br/><br/>
            <span style={{color:"#ef5350"}}>This will delete all their shifts, sessions, time off records, and revoke their access. This cannot be undone.</span>
          </div>
          <div style={{display:"flex",gap:12}}>
            <button onClick={()=>setDeleteConfirm(null)} style={{flex:1,padding:"12px",background:"transparent",border:"1px solid #2a2a2a",borderRadius:2,color:"#9E9E9E",cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700,fontSize:14}}>Cancel</button>
            <button onClick={()=>deleteEmployee(deleteConfirm)} style={{flex:1,padding:"12px",background:"#D32F2F",border:"none",borderRadius:2,color:"#fff",cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700,fontSize:14,letterSpacing:.5}}>Yes, Terminate</button>
          </div>
        </div>
      </div>
    )}

    {/* SHIFT MODAL */}
    {shiftModal&&(
      <AddShiftModal
        date={shiftModal}
        employees={employees.filter(e=>e.role!=="Pending")}
        onSave={handleAddShift}
        onClose={()=>setShiftModal(null)}
      />
    )}

    {/* EDIT EMPLOYEE MODAL */}
    {editEmp&&(
      <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{background:C.charcoal,border:`1px solid ${C.border}`,borderRadius:4,padding:28,width:"100%",maxWidth:380,animation:"tickIn .2s ease"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,marginBottom:20}}>EDIT — {editEmp.name}</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Field label="Full Name" value={editEmp.name} onChange={e=>setEditEmp(x=>({...x,name:e.target.value}))}/>
            <Sel label="Role" value={editEmp.role} onChange={e=>setEditEmp(x=>({...x,role:e.target.value}))}>
              {roles.map(r=><option key={r}>{r}</option>)}
            </Sel>
            <Field label="Hourly Wage ($)" type="number" value={editEmp.wage} onChange={e=>setEditEmp(x=>({...x,wage:e.target.value}))}/>
          </div>
          <div style={{display:"flex",gap:12,marginTop:20}}>
            <Btn full onClick={saveEditEmp}>Save Changes</Btn>
            <Btn full variant="ghost" onClick={()=>setEditEmp(null)}>Cancel</Btn>
          </div>
        </div>
      </div>
    )}

    <Toast toast={toast}/>
    </>
  );
}