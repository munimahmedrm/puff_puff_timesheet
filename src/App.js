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
  .sidebar-btn:hover{background:${C.redDim}!important;color:${C.white}!important;}

  .app-sidebar{
    width:220px;flex-shrink:0;background:${C.black};border-right:2px solid ${C.red};
    display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:200;
    transition:transform .25s ease;
  }

  @media (max-width: 860px){
    .main-area{margin-left:0!important;}
    .app-sidebar{transform:translateX(-100%);}
    .app-sidebar.sidebar-open{transform:translateX(0)!important;}
    .mobile-topbar{display:flex!important;}
    .sidebar-overlay{display:block!important;}
  }
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

// ─── TEAM AVAILABILITY GRID ───────────────────────────────────────────────────
const AVAIL_DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function AvailabilityGrid({employees,availability,isAdmin,authUserId,onSave}){
  const visibleEmployees=employees.filter(e=>e.role!=="Terminated"&&(isAdmin||e.auth_id===authUserId));

  const getAvail=(empId,day)=>availability.find(a=>a.emp_id===empId&&a.day===day);

  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:760}}>
        <thead>
          <tr>
            <th style={{textAlign:"left",padding:"10px 12px",borderBottom:`2px solid ${C.border}`,minWidth:160,position:"sticky",left:0,background:C.charcoal,zIndex:2}}>
              <span style={{fontSize:11,color:C.midGray,letterSpacing:1,textTransform:"uppercase"}}>Team Member</span>
            </th>
            {AVAIL_DAYS.map(d=>(
              <th key={d} style={{textAlign:"center",padding:"10px 8px",borderBottom:`2px solid ${C.border}`,minWidth:104}}>
                <div style={{fontSize:12,color:C.white,fontWeight:700,letterSpacing:.5}}>{d}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleEmployees.length===0&&(
            <tr><td colSpan={8} style={{textAlign:"center",padding:32,color:C.midGray}}>No employees to display.</td></tr>
          )}
          {visibleEmployees.map(emp=>{
            const eid=emp.auth_id||emp.id;
            const isMe=eid===authUserId;
            return (
              <tr key={emp.id} className="row-hover" style={{borderBottom:`1px solid ${C.border}22`}}>
                <td style={{padding:"10px 12px",position:"sticky",left:0,background:C.charcoal,zIndex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Avatar initials={emp.initials||"?"} size={32}/>
                    <div style={{fontWeight:700,fontSize:13}}>{emp.name}</div>
                  </div>
                </td>
                {AVAIL_DAYS.map(day=>{
                  const av=getAvail(eid,day);
                  const isAvailable=av?av.available:false;
                  return (
                    <td key={day} style={{padding:6,textAlign:"center",verticalAlign:"middle"}}>
                      {isMe?(
                        <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"center"}}>
                          <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
                            <input type="checkbox" checked={isAvailable} onChange={e=>onSave(day,"available",e.target.checked)} style={{accentColor:C.red,width:15,height:15,cursor:"pointer"}}/>
                            <span style={{fontSize:11,color:isAvailable?C.success:C.midGray}}>{isAvailable?"Available":"Unavailable"}</span>
                          </label>
                          {isAvailable&&(
                            <div style={{display:"flex",gap:4,alignItems:"center"}}>
                              <input type="time" value={av?.start_time||"09:00"} onChange={e=>onSave(day,"start_time",e.target.value)}
                                style={{background:C.darkGray,border:`1px solid ${C.borderLight}`,borderRadius:2,color:C.white,fontSize:10,padding:"2px 4px",width:68}}/>
                              <span style={{color:C.midGray,fontSize:10}}>–</span>
                              <input type="time" value={av?.end_time||"17:00"} onChange={e=>onSave(day,"end_time",e.target.value)}
                                style={{background:C.darkGray,border:`1px solid ${C.borderLight}`,borderRadius:2,color:C.white,fontSize:10,padding:"2px 4px",width:68}}/>
                            </div>
                          )}
                        </div>
                      ):(
                        isAvailable?(
                          <div style={{background:C.successDim,border:`1px solid ${C.success}44`,borderRadius:4,padding:"6px 8px",fontSize:11,color:C.success}}>
                            <div style={{fontWeight:700}}>Available</div>
                            <div>{av.start_time} – {av.end_time}</div>
                          </div>
                        ):(
                          <div style={{color:C.midGray,fontSize:11}}>—</div>
                        )
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── WEEKLY SCHEDULE GRID (Homebase style) ───────────────────────────────────
function WeekGrid({shifts,employees,sessions,isAdmin,authUserId,onAddShift,onDeleteShift}){
  const [weekStart,setWeekStart]=useState(()=>{
    const d=new Date(); d.setHours(0,0,0,0);
    const day=d.getDay();
    d.setDate(d.getDate()-day); // back to Sunday
    return d;
  });

  const days=[];
  for(let i=0;i<7;i++){
    const d=new Date(weekStart); d.setDate(weekStart.getDate()+i);
    days.push(d);
  }
  const fmtKey=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const fmtRange=()=>{
    const end=new Date(weekStart); end.setDate(weekStart.getDate()+6);
    const opts={month:"short",day:"numeric"};
    const yr = weekStart.getFullYear()!==end.getFullYear()?{year:"numeric"}:{};
    return `${weekStart.toLocaleDateString("en-US",{...opts})} – ${end.toLocaleDateString("en-US",{...opts,year:"numeric"})}`;
  };
  const isToday=(d)=>{
    const t=new Date(); t.setHours(0,0,0,0);
    return d.getTime()===t.getTime();
  };

  const visibleEmployees=employees.filter(e=>e.role!=="Terminated"&&(isAdmin||e.auth_id===authUserId));

  // shift lookup
  const shiftsFor=(empId,dateKey)=>shifts.filter(s=>(s.emp_id===empId)&&s.shift_date===dateKey);

  // wage/hours per employee for the week
  const empWeekTotals=(emp)=>{
    const eid=emp.auth_id||emp.id;
    let hrs=0;
    days.forEach(d=>{
      const dk=fmtKey(d);
      shiftsFor(eid,dk).forEach(s=>{
        const [sh,sm]=s.start_time.split(":").map(Number);
        let [eh,em]=s.end_time.split(":").map(Number);
        let mins=(eh*60+em)-(sh*60+sm);
        if(mins<=0) mins+=24*60; // overnight shift
        hrs+=mins/60;
      });
    });
    return {hrs, wage: hrs*(emp.wage||0)};
  };

  // day column totals
  const dayTotals=(dateKey)=>{
    let hrs=0, wage=0, count=0;
    visibleEmployees.forEach(emp=>{
      const eid=emp.auth_id||emp.id;
      const sh=shiftsFor(eid,dateKey);
      if(sh.length>0) count++;
      sh.forEach(s=>{
        const [sh1,sm]=s.start_time.split(":").map(Number);
        let [eh,em]=s.end_time.split(":").map(Number);
        let mins=(eh*60+em)-(sh1*60+sm);
        if(mins<=0) mins+=24*60;
        hrs+=mins/60;
        wage+=(mins/60)*(emp.wage||0);
      });
    });
    return {hrs,wage,count};
  };

  const weekTotals=()=>{
    let hrs=0,wage=0;
    visibleEmployees.forEach(emp=>{
      const t=empWeekTotals(emp);
      hrs+=t.hrs; wage+=t.wage;
    });
    return {hrs,wage};
  };
  const wt=weekTotals();

  const DAY_LABELS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  return (
    <div>
      {/* Week navigation */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Btn variant="ghost" size="sm" onClick={()=>{const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay()); setWeekStart(d);}}>Today</Btn>
          <Btn variant="ghost" size="sm" onClick={()=>setWeekStart(w=>{const d=new Date(w); d.setDate(d.getDate()-7); return d;})}>←</Btn>
          <Btn variant="ghost" size="sm" onClick={()=>setWeekStart(w=>{const d=new Date(w); d.setDate(d.getDate()+7); return d;})}>→</Btn>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:2}}>{fmtRange()}</div>
        </div>
        {isAdmin&&<div style={{fontSize:12,color:C.midGray}}>Click any cell to add a shift</div>}
      </div>

      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:760}}>
          <thead>
            <tr>
              <th style={{textAlign:"left",padding:"10px 12px",borderBottom:`2px solid ${C.border}`,minWidth:160,position:"sticky",left:0,background:C.charcoal,zIndex:2}}>
                <span style={{fontSize:11,color:C.midGray,letterSpacing:1,textTransform:"uppercase"}}>Team Members ({visibleEmployees.length})</span>
              </th>
              {days.map((d,i)=>(
                <th key={i} style={{textAlign:"center",padding:"10px 8px",borderBottom:`2px solid ${C.border}`,minWidth:96,background:isToday(d)?C.redDim:"transparent"}}>
                  <div style={{fontSize:11,color:C.midGray,letterSpacing:1,textTransform:"uppercase"}}>{DAY_LABELS[d.getDay()]}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:isToday(d)?C.red:C.white,letterSpacing:1}}>{d.getDate()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleEmployees.length===0&&(
              <tr><td colSpan={8} style={{textAlign:"center",padding:32,color:C.midGray}}>No employees to display.</td></tr>
            )}
            {visibleEmployees.map(emp=>{
              const eid=emp.auth_id||emp.id;
              const totals=empWeekTotals(emp);
              const isOnline=sessions?.some(s=>s.emp_id===eid&&!s.clock_out);
              return (
                <tr key={emp.id} className="row-hover" style={{borderBottom:`1px solid ${C.border}22`}}>
                  <td style={{padding:"10px 12px",position:"sticky",left:0,background:C.charcoal,zIndex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Avatar initials={emp.initials||"?"} size={32} active={isOnline}/>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>{emp.name}</div>
                        <div style={{fontSize:11,color:C.midGray}}>{totals.hrs.toFixed(2)} hrs / ${totals.wage.toFixed(2)}</div>
                      </div>
                    </div>
                  </td>
                  {days.map((d,i)=>{
                    const dk=fmtKey(d);
                    const cellShifts=shiftsFor(eid,dk);
                    const past=d<new Date(new Date().setHours(0,0,0,0));
                    return (
                      <td key={i} className={isAdmin&&!past?"shift-cell":""} onClick={()=>isAdmin&&!past&&onAddShift(d.getFullYear(),d.getMonth(),d.getDate(),eid)}
                        style={{padding:6,verticalAlign:"top",background:isToday(d)?`${C.redDeep}1A`:"transparent",minWidth:96,opacity:past?.6:1}}>
                        {cellShifts.map(sh=>{
                          const sc=SHIFT_COLORS[sh.shift_type]||SHIFT_COLORS.Custom;
                          return (
                            <div key={sh.id} style={{position:"relative",background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:4,padding:"4px 6px",marginBottom:4,fontSize:11,color:sc.text,lineHeight:1.4}}>
                              <div style={{fontWeight:700}}>{sh.start_time}–{sh.end_time}</div>
                              <div>{sh.shift_type}</div>
                              {isAdmin&&(
                                <button onClick={e=>{e.stopPropagation();onDeleteShift(sh.id);}} style={{position:"absolute",top:2,right:2,background:"none",border:"none",color:C.midGray,cursor:"pointer",fontSize:12,lineHeight:1,padding:0}}>×</button>
                              )}
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          {isAdmin&&(
            <tfoot>
              <tr style={{borderTop:`2px solid ${C.border}`}}>
                <td style={{padding:"10px 12px",position:"sticky",left:0,background:C.charcoal}}>
                  <div style={{fontSize:11,color:C.midGray,textTransform:"uppercase",letterSpacing:1}}>Wages</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:C.red}}>${wt.wage.toFixed(2)}</div>
                  <div style={{fontSize:11,color:C.midGray,textTransform:"uppercase",letterSpacing:1,marginTop:4}}>Hours</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16}}>{wt.hrs.toFixed(2)}</div>
                </td>
                {days.map((d,i)=>{
                  const dk=fmtKey(d);
                  const dt=dayTotals(dk);
                  return (
                    <td key={i} style={{padding:"10px 8px",textAlign:"center",verticalAlign:"top"}}>
                      <div style={{fontSize:11,color:C.midGray}}><span style={{color:C.white}}>{dt.count}</span> staff</div>
                      <div style={{fontSize:12,color:C.red,fontWeight:700,marginTop:2}}>${dt.wage.toFixed(2)}</div>
                      <div style={{fontSize:11,color:C.midGray}}>{dt.hrs.toFixed(2)} hrs</div>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ─── ADD SHIFT MODAL ──────────────────────────────────────────────────────────
function AddShiftModal({date,employees,defaultEmpId,onSave,onClose}){
  const [empId,setEmpId]=useState(defaultEmpId||employees[0]?.auth_id||employees[0]?.id||"");
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

  const [tab,setTab]=useState("dashboard");
  const [sidebarOpen,setSidebarOpen]=useState(false);
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
  const [shiftModal,setShiftModal]=useState(null); // {date, empId}
  const [scheduleView,setScheduleView]=useState("week");
  const [scheduleSubTab,setScheduleSubTab]=useState("schedule"); // "schedule" | "availability"
  const [availability,setAvailability]=useState([]); // [{id, emp_id, day, available, start_time, end_time}]

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
    const [e,s,t,sh,av]=await Promise.all([
      supabase.from("employees").select("*").order("name"),
      supabase.from("sessions").select("*").order("clock_in",{ascending:false}),
      supabase.from("time_off").select("*").order("submitted_at",{ascending:false}),
      supabase.from("shifts").select("*").order("shift_date"),
      supabase.from("availability").select("*"),
    ]);
    if(e.data) setEmployees(e.data);
    if(s.data) setSessions(s.data);
    if(t.data) setTimeOff(t.data);
    if(sh.data) setShifts(sh.data);
    if(av.data) setAvailability(av.data);
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
    // Check for duplicate name or email
    const dupName=employees.find(e=>e.name.toLowerCase()===newEmp.name.trim().toLowerCase()&&e.role!=="Terminated");
    if(dupName){showToast(`${newEmp.name} already exists as an active employee`,"error");return;}
    if(newEmp.email){
      const dupEmail=employees.find(e=>e.email&&e.email.toLowerCase()===newEmp.email.trim().toLowerCase()&&e.role!=="Terminated");
      if(dupEmail){showToast("An active employee with that email already exists","error");return;}
    }
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
    if(!emp||!emp.email){showToast("No email on file for this employee","error");return;}
    setInviteLoading(true);
    const appUrl="https://puff-puff-timesheet.vercel.app";
    const emailHtml=`
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#1C1C1C;color:#fff;padding:40px;border-radius:8px;">
        <div style="margin-bottom:24px;">
          <div style="background:#fff;display:inline-block;padding:4px 16px;margin-bottom:4px;">
            <span style="font-size:24px;font-weight:900;letter-spacing:4px;color:#000;">PUFF PUFF</span>
          </div><br/>
          <div style="background:#D32F2F;display:inline-block;padding:2px 16px;">
            <span style="font-size:13px;font-weight:700;letter-spacing:5px;color:#fff;">SMOKE &amp; VAPE</span>
          </div>
        </div>
        <h1 style="color:#fff;font-size:22px;margin-bottom:8px;">Welcome, ${emp.name}! 👋</h1>
        <p style="color:#9E9E9E;font-size:15px;line-height:1.6;">
          You have been added to the <strong style="color:#fff">Puff Puff Smoke &amp; Vape</strong> employee portal.
          Click the button below to create your account and get started.
        </p>
        <a href="${appUrl}" style="display:inline-block;margin-top:28px;background:#D32F2F;color:#fff;text-decoration:none;padding:14px 32px;border-radius:4px;font-weight:700;font-size:15px;letter-spacing:1px;">
          Set Up My Account →
        </a>
        <div style="margin-top:28px;background:#111;border:1px solid #2a2a2a;border-radius:6px;padding:16px;">
          <p style="color:#9E9E9E;font-size:13px;margin:0 0 8px;">To register:</p>
          <ol style="color:#9E9E9E;font-size:13px;margin:0;padding-left:18px;line-height:1.8;">
            <li>Click the button above</li>
            <li>Click <strong style="color:#fff">Register</strong></li>
            <li>Fill in your details and create a password</li>
            <li>Your manager will activate your account shortly</li>
          </ol>
        </div>
        <p style="color:#616161;font-size:12px;margin-top:32px;line-height:1.6;">
          If you did not expect this email you can safely ignore it.<br/>
          📍 625 S 8th St, West Dundee, IL 60118
        </p>
      </div>
    `;
    return new Promise((resolve)=>{
      const xhr=new XMLHttpRequest();
      xhr.open("POST","https://api.resend.com/emails",true);
      xhr.setRequestHeader("Authorization","Bearer re_UuhWLpNG_HbyHXFPfJL9GA4ePRpHMdSTM");
      xhr.setRequestHeader("Content-Type","application/json");
      xhr.onload=()=>{
        setInviteLoading(false);
        if(xhr.status>=200&&xhr.status<300){
          setInviteSent(s=>({...s,[emp.id]:true}));
          showToast(`Invite sent to ${emp.email} ✓`);
        } else {
          showToast("Failed to send invite — check Resend API","error");
        }
        resolve();
      };
      xhr.onerror=()=>{
        setInviteLoading(false);
        showToast("Network error sending invite","error");
        resolve();
      };
      xhr.send(JSON.stringify({
        from:"Puff Puff Smoke & Vape <onboarding@resend.dev>",
        to:[emp.email],
        subject:"You are invited to join Puff Puff Smoke & Vape",
        html:emailHtml,
      }));
    });
  };


  // ── DELETE EMPLOYEE ───────────────────────────────────────────────────────
  const deleteEmployee=async(emp)=>{
    // Mark employee as terminated (keeps all history for payroll records)
    const { data: updatedEmp, error } = await supabase
      .from("employees")
      .update({ role:"Terminated", terminated_at: new Date().toISOString() })
      .eq("id", emp.id)
      .select()
      .single();
    if(error){
      showToast("Failed to terminate employee. Try again.","error");
      setDeleteConfirm(null);
      return;
    }
    // Revoke their login access only
    if(emp.auth_id){
      await fetch(`https://eejgscizdswwgwwrlczm.supabase.co/functions/v1/delete-employee`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamdzY2l6ZHN3d2d3d3JsY3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDI4NzAsImV4cCI6MjA5NjQxODg3MH0.0_KEY6jdyORXYcnYEh7EOf4sX__0QemA0b2qPSO8Onw`,
        },
        body:JSON.stringify({userId:emp.auth_id}),
      });
    }
    // Update local state with the confirmed DB value
    setEmployees(e=>e.map(x=>x.id===emp.id?(updatedEmp||{...x,role:"Terminated"}):x));
    setDeleteConfirm(null);
    showToast(`${emp.name} has been terminated. All records kept for payroll history.`);
  };

  // ── AVAILABILITY ──────────────────────────────────────────────────────────
  const saveAvailability=async(day,field,value)=>{
    const empId=authUser.id;
    const existing=availability.find(a=>a.emp_id===empId&&a.day===day);
    if(existing){
      const updates={[field]:value};
      const {data}=await supabase.from("availability").update(updates).eq("id",existing.id).select().single();
      if(data) setAvailability(a=>a.map(x=>x.id===existing.id?data:x));
    }else{
      const defaults={emp_id:empId,day,available:true,start_time:"09:00",end_time:"17:00",[field]:value};
      const {data}=await supabase.from("availability").insert(defaults).select().single();
      if(data) setAvailability(a=>[...a,data]);
    }
  };

  // ── SHIFTS ────────────────────────────────────────────────────────────────────
  const handleAddShift=async(shiftData)=>{
    const {data}=await supabase.from("shifts").insert(shiftData).select().single();
    if(data){
      setShifts(s=>[...s,data]);
      setShiftModal(null);
      showToast("Shift added");
      // Notify employee by email
      const emp=employees.find(e=>e.auth_id===shiftData.emp_id||e.id===shiftData.emp_id);
      if(emp?.email){
        fetch(`https://eejgscizdswwgwwrlczm.supabase.co/functions/v1/notify-schedule`,{
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            "Authorization":`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamdzY2l6ZHN3d2d3d3JsY3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDI4NzAsImV4cCI6MjA5NjQxODg3MH0.0_KEY6jdyORXYcnYEh7EOf4sX__0QemA0b2qPSO8Onw`,
          },
          body:JSON.stringify({
            employeeName:emp.name,
            email:emp.email,
            action:"new",
            shiftDate:shiftData.shift_date,
            shiftType:shiftData.shift_type,
            startTime:shiftData.start_time,
            endTime:shiftData.end_time,
            note:shiftData.note||"",
          }),
        });
      }
    }
  };

  const handleDeleteShift=async(id)=>{
    // Find shift before deleting so we can notify employee
    const sh=shifts.find(s=>s.id===id);
    await supabase.from("shifts").delete().eq("id",id);
    setShifts(s=>s.filter(x=>x.id!==id));
    showToast("Shift removed");
    if(sh){
      const emp=employees.find(e=>e.auth_id===sh.emp_id||e.id===sh.emp_id);
      if(emp?.email){
        fetch(`https://eejgscizdswwgwwrlczm.supabase.co/functions/v1/notify-schedule`,{
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            "Authorization":`Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamdzY2l6ZHN3d2d3d3JsY3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDI4NzAsImV4cCI6MjA5NjQxODg3MH0.0_KEY6jdyORXYcnYEh7EOf4sX__0QemA0b2qPSO8Onw`,
          },
          body:JSON.stringify({
            employeeName:emp.name,
            email:emp.email,
            action:"removed",
            shiftDate:sh.shift_date,
            shiftType:sh.shift_type,
            startTime:sh.start_time,
            endTime:sh.end_time,
            note:"",
          }),
        });
      }
    }
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
    {id:"dashboard",label:"Dashboard",icon:"⬚"},
    {id:"clock",label:"Time Clock",icon:"⏱"},
    {id:"schedule",label:"Schedule",icon:"📅"},
    {id:"team",label:"Team",icon:"👥"},
    {id:"logs",label:"Timesheets",icon:"🕐"},
    {id:"timeoff",label:"Time Off",icon:"🗓"},
    ...(isAdmin?[{id:"admin",label:"Admin",icon:"⚙"}]:[]),
  ];

  // Today's stats for dashboard
  const todayStr=new Date().toISOString().split("T")[0];
  const todaySessions=sessions.filter(s=>s.clock_in&&s.clock_in.startsWith(todayStr));
  const activeNow=employees.filter(e=>sessions.some(s=>s.emp_id===(e.auth_id||e.id)&&!s.clock_out)&&e.role!=="Terminated");
  const todayPaidHours=todaySessions.filter(s=>s.clock_out).reduce((a,s)=>a+parseFloat(hoursWorked(new Date(s.clock_in).getTime(),new Date(s.clock_out).getTime())),0);
  const todayWages=todaySessions.filter(s=>s.clock_out).reduce((a,s)=>{
    const emp=employees.find(e=>e.auth_id===s.emp_id);
    return a+(emp?parseFloat(hoursWorked(new Date(s.clock_in).getTime(),new Date(s.clock_out).getTime()))*emp.wage:0);
  },0);
  const pendingTOCount=timeOff.filter(r=>r.status==="pending").length;
  const pendingEmpCount=employees.filter(e=>e.role==="Pending"&&e.auth_id!==authUser?.id).length;
  const today=new Date(); today.setHours(0,0,0,0);
  const upcomingShifts=shifts.filter(s=>{
    const d=new Date(s.shift_date+"T00:00:00");
    const limit=new Date(today); limit.setDate(limit.getDate()+7);
    return d>=today&&d<=limit&&(isAdmin||s.emp_id===authUser?.id);
  }).sort((a,b)=>a.shift_date.localeCompare(b.shift_date));

  return (
    <><style>{STYLES}</style>
    <div style={{minHeight:"100vh",background:C.smoke,display:"flex"}}>

      {/* SIDEBAR */}
      <div className={"app-sidebar"+(sidebarOpen?" sidebar-open":"")}>
        <div style={{padding:"20px 16px",borderBottom:`1px solid ${C.border}`}}>
          <Logo size="sm"/>
        </div>

        <div style={{flex:1,padding:"12px 8px",overflowY:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} className="sidebar-btn" onClick={()=>{setTab(t.id);setSidebarOpen(false);}} style={{
              width:"100%",display:"flex",alignItems:"center",gap:12,
              background: tab===t.id?C.redDim:"none",
              border:"none",borderLeft:`3px solid ${tab===t.id?C.red:"transparent"}`,
              padding:"12px 14px",cursor:"pointer",borderRadius:2,marginBottom:2,
              fontFamily:"'Barlow',sans-serif",fontWeight:600,fontSize:13.5,
              color: tab===t.id?C.white:C.midGray,
              transition:"all .15s",textAlign:"left",
            }}>
              <span style={{fontSize:16,width:20,textAlign:"center"}}>{t.icon}</span>
              {t.label}
              {t.id==="timeoff"&&pendingTOCount>0&&isAdmin&&<span style={{marginLeft:"auto",background:C.red,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:10}}>{pendingTOCount}</span>}
              {t.id==="admin"&&pendingEmpCount>0&&<span style={{marginLeft:"auto",background:C.warning,color:"#000",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:10}}>{pendingEmpCount}</span>}
            </button>
          ))}
        </div>

        {/* User card at bottom */}
        <div style={{padding:14,borderTop:`1px solid ${C.border}`}}>
          {myRecord&&(
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <Avatar initials={myRecord.initials||"?"} size={36} active={!!activeSess}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{myRecord.name}</div>
                <div style={{fontSize:11,color:myRecord.role==="Pending"?C.warning:C.midGray}}>{myRecord.role==="Pending"?"Pending":myRecord.role}</div>
              </div>
              {activeSess&&<Badge color="green">●</Badge>}
            </div>
          )}
          <Btn variant="ghost" size="sm" full onClick={handleLogout}>Sign Out</Btn>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"#000000aa",zIndex:150,display:"none"}} className="sidebar-overlay"/>}

      {/* MAIN AREA */}
      <div style={{flex:1,marginLeft:220,minWidth:0}} className="main-area">

        {/* MOBILE TOP BAR */}
        <div className="mobile-topbar" style={{display:"none",background:C.black,borderBottom:`2px solid ${C.red}`,padding:"0 16px",alignItems:"center",justifyContent:"space-between",height:56,position:"sticky",top:0,zIndex:100}}>
          <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",color:C.white,fontSize:22,cursor:"pointer",padding:4}}>☰</button>
          <Logo size="sm"/>
          <div style={{width:30}}/>
        </div>

        {/* CONTENT */}
        <div style={{maxWidth:1100,margin:"0 auto",padding:28,animation:"fadeUp .3s ease"}}>

          {/* Page title */}
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:3,color:C.white}}>{TABS.find(t=>t.id===tab)?.label?.toUpperCase()}</div>
            <div style={{height:2,width:48,background:C.red,marginTop:6}}/>
          </div>

          {/* ══ DASHBOARD TAB ══ */}
          {tab==="dashboard"&&(
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {/* Stat cards row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16}}>
                {[
                  {label:"Active Now",value:activeNow.length,sub:`of ${employees.filter(e=>e.role!=="Terminated").length} employees`,color:C.success},
                  {label:"Today's Hours",value:`${todayPaidHours.toFixed(1)}h`,sub:"paid hours logged",color:C.red},
                  {label:"Today's Wages",value:`$${todayWages.toFixed(2)}`,sub:"earned so far",color:C.red},
                  {label:"Pending Requests",value:pendingTOCount,sub:"time off awaiting review",color:C.warning},
                ].map(stat=>(
                  <Card key={stat.label} style={{padding:20}}>
                    <div style={{fontSize:11,color:C.midGray,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>{stat.label}</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:stat.color,letterSpacing:1,lineHeight:1}}>{stat.value}</div>
                    <div style={{fontSize:12,color:C.midGray,marginTop:6}}>{stat.sub}</div>
                  </Card>
                ))}
              </div>

              <div style={{display:"grid",gridTemplateColumns:isAdmin?"1.3fr 1fr":"1fr",gap:20}}>
                {/* Who's clocked in */}
                <Card>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:2,marginBottom:16}}>WHO'S WORKING NOW</div>
                  {activeNow.length===0?(
                    <div style={{textAlign:"center",color:C.midGray,padding:24}}>No one is currently clocked in.</div>
                  ):(
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {activeNow.map(emp=>{
                        const sess=sessions.find(s=>s.emp_id===(emp.auth_id||emp.id)&&!s.clock_out);
                        return (
                          <div key={emp.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:C.darkGray,borderRadius:4,border:`1px solid ${C.border}`}}>
                            <Avatar initials={emp.initials||"?"} size={36} active/>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:700,fontSize:14}}>{emp.name}</div>
                              <div style={{fontSize:12,color:C.midGray}}>{emp.role} · since {fmt12(sess.clock_in)}</div>
                            </div>
                            <Badge color="green">ON SHIFT</Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* Upcoming shifts */}
                <Card>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:2,marginBottom:16}}>UPCOMING SHIFTS</div>
                  {upcomingShifts.length===0?(
                    <div style={{textAlign:"center",color:C.midGray,padding:24}}>Nothing scheduled this week.</div>
                  ):(
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {upcomingShifts.slice(0,6).map(s=>{
                        const emp=employees.find(e=>e.auth_id===s.emp_id||e.id===s.emp_id);
                        const sc=SHIFT_COLORS[s.shift_type]||SHIFT_COLORS.Custom;
                        return (
                          <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:C.darkGray,borderRadius:4,border:`1px solid ${sc.border}33`}}>
                            <div style={{width:4,alignSelf:"stretch",background:sc.border,borderRadius:2}}/>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:13,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{isAdmin?emp?.name:s.shift_type}</div>
                              <div style={{fontSize:11,color:C.midGray}}>{fmtDate(s.shift_date+"T12:00:00")} · {s.start_time}-{s.end_time}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

              {/* Quick actions */}
              <Card>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:2,marginBottom:16}}>QUICK ACTIONS</div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <Btn onClick={()=>setTab("clock")}>{activeSess?"■ Clock Out":"▶ Clock In / Out"}</Btn>
                  <Btn variant="ghost" onClick={()=>setTab("schedule")}>📅 View Schedule</Btn>
                  <Btn variant="ghost" onClick={()=>setTab("timeoff")}>🗓 Request Time Off</Btn>
                  {isAdmin&&<Btn variant="ghost" onClick={()=>setTab("admin")}>⚙ Admin Panel</Btn>}
                </div>
              </Card>
            </div>
          )}

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
                      <div style={{fontSize:13,color:C.midGray,marginTop:2}}>{myRecord?.role}{myRecord?.wage&&myRecord.wage>0?` · $${myRecord.wage}/hr`:""}</div>
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

            {/* Sub-tabs */}
            <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.border}`}}>
              {[{id:"schedule",label:"Schedule"},{id:"availability",label:"Team Availability"}].map(st=>(
                <button key={st.id} onClick={()=>setScheduleSubTab(st.id)} style={{
                  background:"none",border:"none",padding:"10px 18px",cursor:"pointer",
                  fontFamily:"'Barlow',sans-serif",fontWeight:700,fontSize:13,letterSpacing:.5,
                  color:scheduleSubTab===st.id?C.white:C.midGray,
                  borderBottom:`2px solid ${scheduleSubTab===st.id?C.red:"transparent"}`,
                  marginBottom:-1,transition:"all .2s",
                }}>{st.label}</button>
              ))}
            </div>

            {scheduleSubTab==="schedule"&&(<>
            {isAdmin&&(
              <div style={{padding:"10px 16px",background:C.redDim,border:`1px solid ${C.red}44`,borderRadius:4,fontSize:13,color:C.lightGray,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                <span>📅 <strong>Admin:</strong> Click any cell to add a shift for an employee.</span>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setScheduleView("week")} style={{background:scheduleView==="week"?C.red:"transparent",color:scheduleView==="week"?C.white:C.midGray,border:`1px solid ${C.red}55`,borderRadius:2,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Week</button>
                  <button onClick={()=>setScheduleView("month")} style={{background:scheduleView==="month"?C.red:"transparent",color:scheduleView==="month"?C.white:C.midGray,border:`1px solid ${C.red}55`,borderRadius:2,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Month</button>
                </div>
              </div>
            )}
            <Card>
              {scheduleView==="week"||!isAdmin?(
                <WeekGrid
                  shifts={shifts}
                  employees={employees}
                  sessions={sessions}
                  isAdmin={isAdmin}
                  authUserId={authUser?.id}
                  onAddShift={(y,m,d,empId)=>setShiftModal({date:new Date(y,m,d),empId})}
                  onDeleteShift={handleDeleteShift}
                />
              ):(
                <ScheduleCalendar
                  shifts={shifts}
                  employees={employees}
                  isAdmin={isAdmin}
                  myEmpId={authUser?.id}
                  onAddShift={(y,m,d)=>setShiftModal({date:new Date(y,m,d)})}
                  onDeleteShift={handleDeleteShift}
                />
              )}
            </Card>
            </>)}

            {scheduleSubTab==="availability"&&(<>
              {!isAdmin&&(
                <div style={{padding:"10px 16px",background:C.redDim,border:`1px solid ${C.red}44`,borderRadius:4,fontSize:13,color:C.lightGray}}>
                  ✓ Check the days you're available to work and set your preferred hours. Your manager will see this when building the schedule.
                </div>
              )}
              <Card>
                <AvailabilityGrid
                  employees={employees}
                  availability={availability}
                  isAdmin={isAdmin}
                  authUserId={authUser?.id}
                  onSave={saveAvailability}
                />
              </Card>
            </>)}

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
          <div style={{display:"flex",flexDirection:"column",gap:24}}>
          {employees.filter(e=>e.role!=="Terminated").length===0&&<div style={{textAlign:"center",color:"#9E9E9E",padding:32}}>No active employees.</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(268px,1fr))",gap:16}}>
            {employees.filter(e=>e.role!=="Terminated").map(emp=>{
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
                    {[["Hourly Rate", emp.wage&&emp.wage>0?`$${emp.wage}/hr`:"TBD"],["This Week",`$${weeklyEarnings(emp.auth_id)}`],["Total Hrs",`${totalHrs}h`],["Sessions",totalSess.length]].map(([l,v])=>(
                      <div key={l} style={{background:C.darkGray,borderRadius:2,padding:"10px 12px",border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:10,color:C.midGray,textTransform:"uppercase",letterSpacing:1}}>{l}</div>
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:C.white,marginTop:3,letterSpacing:1}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {isAdmin&&emp.auth_id!==authUser?.id&&(
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
          {/* Terminated employees section - admin only */}
          {isAdmin&&employees.filter(e=>e.role==="Terminated").length>0&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#ef5350",letterSpacing:2,textTransform:"uppercase",marginBottom:12,borderTop:"1px solid #2a2a2a",paddingTop:20}}>TERMINATED EMPLOYEES — RECORDS KEPT FOR PAYROLL</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(268px,1fr))",gap:16}}>
                {employees.filter(e=>e.role==="Terminated").map(emp=>{
                  const totalSess=sessions.filter(s=>s.emp_id===emp.auth_id&&s.clock_out);
                  const totalHrs=totalSess.reduce((a,s)=>a+parseFloat(hoursWorked(new Date(s.clock_in).getTime(),new Date(s.clock_out).getTime())),0).toFixed(1);
                  return(
                    <div key={emp.id} style={{background:"#1A1A1A",border:"1px solid #ef535033",borderRadius:4,padding:20,opacity:.7}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                        <div style={{width:46,height:46,borderRadius:"50%",background:"#2a2a2a",border:"2px solid #ef535044",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:17,color:"#ef5350"}}>{emp.initials||"?"}</div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:14,color:"#9E9E9E"}}>{emp.name}</div>
                          <div style={{fontSize:11,color:"#ef5350",marginTop:2,letterSpacing:1,textTransform:"uppercase"}}>Terminated</div>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {[["Total Hrs",`${totalHrs}h`],["Sessions",totalSess.length]].map(([l,v])=>(
                          <div key={l} style={{background:"#111",borderRadius:2,padding:"8px 10px",border:"1px solid #2a2a2a"}}>
                            <div style={{fontSize:10,color:"#616161",textTransform:"uppercase",letterSpacing:1}}>{l}</div>
                            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"#9E9E9E",marginTop:2}}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
            {employees.filter(e=>e.role==="Pending"&&e.auth_id!==authUser?.id).length>0&&(
              <div style={{padding:"14px 18px",background:C.warningDim,border:`1px solid ${C.warning}44`,borderRadius:4,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:20}}>⚠</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:C.warning}}>{employees.filter(e=>e.role==="Pending"&&e.auth_id!==authUser?.id).length} employee(s) awaiting role assignment</div>
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
            <span style={{color:"#ef5350"}}>This will revoke their app access immediately. All shifts, sessions, and time off records are kept for payroll history.</span>
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
        date={shiftModal.date}
        defaultEmpId={shiftModal.empId}
        employees={employees.filter(e=>e.role!=="Pending"&&e.role!=="Terminated")}
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