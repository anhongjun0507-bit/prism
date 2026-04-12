import { SCHOOLS } from './school';

export interface School {
  n: string; rk: number; r: number; sat: number[]; gpa: number;
  c: string; d: string; ea?: string; rd: string; tg: string[];
  toefl: number; tp: string; reqs: string[]; prompts: string[];
  mr: Record<string,number>; tuition?: number; size?: number;
  loc?: string; setting?: string;
  // Computed
  prob?: number; lo?: number; hi?: number; cat?: string;
  netCost?: number | null; ecPts?: number; academicIdx?: number;
}

export interface Specs {
  gpaUW: string; gpaW: string; sat: string; act: string;
  toefl: string; ielts: string; apCount: string; apAvg: string;
  satSubj: string; classRank: string; ecTier: number;
  awardTier: number; essayQ: number; recQ: number;
  interviewQ: number; legacy: boolean; firstGen: boolean;
  earlyApp: string; needAid: boolean; gender: string;
  intl: boolean; major: string;
}

export interface AP { subject: string; score: number; }
export interface EC { title: string; role: string; desc: string; hours: string; tier?: number; }

export { MAJOR_LIST, COMP_MAJORS };

const MAJOR_LIST=["Computer Science","Economics","Business","Engineering","Biology","Pre-Med","Mechanical Eng","Electrical Eng","Data Science","Mathematics","Physics","Chemistry","Psychology","Political Science","International Relations","Neuroscience","Architecture","Communications","Film","Philosophy","History","English"];
const COMP_MAJORS: Record<string,number>={"Computer Science":0.85,"Engineering":0.8,"Data Science":0.82,"Business":0.75,"Pre-Med":0.78,"Electrical Eng":0.8,"Mechanical Eng":0.78,"Neuroscience":0.7,"Economics":0.65,"Biology":0.6,"Architecture":0.6,"Film":0.7};

export function matchSchools(sp: Specs, aps: AP[] = [], ecs: EC[] = []): School[] {
  const g=parseFloat(sp.gpaUW)||parseFloat(sp.gpaW)||0;
  const st=parseInt(sp.sat)||(parseInt(sp.act)?Math.round(parseInt(sp.act)*36):0)||0;
  const tf=parseInt(sp.toefl)||0;
  const apCount=aps.length||(parseInt(sp.apCount)||0);
  const apAvg=aps.length?aps.reduce((a,x)=>a+(x.score||0),0)/aps.length:0;
  const ap5s=aps.filter(a=>a.score===5).length;
  const ap4s=aps.filter(a=>a.score===4).length;
  // EC individual tier scoring (Tier1=15,Tier2=10,Tier3=5,Tier4=2)
  const ecScore=ecs.length>0?ecs.reduce((a,e)=>{const t=e.tier||4;return a+({1:15,2:10,3:5,4:2}[t]||2)},0):((sp.ecTier||1)-1)*8;
  const ecMax=Math.min(ecScore,60);
  // Filter out schools with no usable academic data (SAT 0-0 & GPA 0)
  const validSchools = (SCHOOLS as School[]).filter(u => !(u.sat[0] === 0 && u.sat[1] === 0 && u.gpa === 0));
  return validSchools.map(u=>{
    // Base: start from school's acceptance rate
    let base=u.r;
    // Academic Index (0-40 points)
    const gDiff=g-u.gpa;
    const satMid=(u.sat[0]+u.sat[1])/2;
    const sDiff=st-satMid;
    let academic=0;
    academic+=gDiff*20; // GPA diff
    academic+=(sDiff/100)*7; // SAT diff per 100 points
    academic+=Math.min(apCount*0.6,8); // AP count (max 8)
    academic+=apAvg>0?(apAvg-3)*1.5:0; // AP avg quality
    academic+=ap5s*1.2+ap4s*0.5; // AP 5s and 4s bonus
    if(sp.classRank){const r=parseInt(sp.classRank);if(r<=1)academic+=8;else if(r<=5)academic+=5;else if(r<=10)academic+=3;else if(r<=25)academic+=1;}
    academic=Math.max(-30,Math.min(30,academic));
    // EC Score (0-15 points)
    let ecPts=Math.min(ecMax/4,15);
    // Awards (0-8)
    let awards=(sp.awardTier||0)*2;
    // Essay/Rec/Interview (0-12)
    let qual=((sp.essayQ||3)-3)*2.5+((sp.recQ||3)-3)*1.5+((sp.interviewQ||3)-3)*1;
    // TOEFL gate
    let toeflPts=0;
    if(u.toefl){if(tf>=u.toefl+15)toeflPts=3;else if(tf>=u.toefl)toeflPts=0;else if(tf>0)toeflPts=-10;}
    // Hooks
    let hooks=0;
    if(sp.legacy)hooks+=5;if(sp.firstGen)hooks+=2;
    if(sp.earlyApp==="ED")hooks+=7;else if(sp.earlyApp==="EA")hooks+=2;
    // Gender adjustment (slight for STEM schools)
    if(sp.gender==="F"&&u.tg?.some(t=>["STEM","CS","Eng"].includes(t)))hooks+=2;
    // International student penalty (Asian international is most competitive)
    if(sp.intl)hooks-=3;
    // Major competitiveness
    const majorFactor=COMP_MAJORS[sp.major]||0.5;
    const majorAdj=(majorFactor-0.5)*-10;
    // Total probability
    let prob=base+academic+ecPts+awards+qual+toeflPts+hooks+majorAdj;
    prob=Math.max(1,Math.min(95,Math.round(prob)));
    // Range (±margin based on school selectivity)
    const margin=u.r<10?5:u.r<30?7:u.r<60?9:6;
    const lo=Math.max(1,prob-margin);
    const hi=Math.min(95,prob+margin);
    // 4-tier classification (CollegeVine style)
    const cat=prob>=80?"Safety":prob>=40?"Target":prob>=15?"Hard Target":"Reach";
    // Net cost estimate
    const netCost=u.tuition?Math.round(u.tuition*(sp.needAid?(prob>60?0.3:prob>30?0.55:0.75):1)):null;
    return{...u,prob,lo,hi,cat,netCost,ecPts:Math.round(ecPts),academicIdx:Math.round(academic)};
  }).sort((a,b)=>a.rk-b.rk);
}