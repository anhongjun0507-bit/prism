import schoolsData from "@/data/schools.json";

export const SCHOOLS = schoolsData as any[];

export const DOMS: Record<string,string> = {};
SCHOOLS.forEach((s: any) => { if(s.d) DOMS[s.n] = s.d; });
