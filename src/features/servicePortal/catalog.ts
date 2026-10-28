import catalog from '../../../docs/prottoyon-public-service-catalog-2026-10-28.json';
export type PublicService = {id:string;name_bn:string;category:string;source_status:string;form_status:string;extra_fields_proposed:string[];enabled:boolean};
export const SERVICES:PublicService[] = catalog.services;
export const CATEGORY_LABELS:Record<string,string>={identity:'পরিচয় ও নাগরিকত্ব',family:'পারিবারিক',inheritance:'ওয়ারিশ ও মৃত্যু',income:'আয় ও অর্থনীতি',voter:'ভোটার ও পরিচয় সংশোধন',business:'ব্যবসা ও পেশা',special:'বিশেষ প্রত্যয়ন',other:'অন্যান্য'};
export function filterServices(items:PublicService[],text:string,category:string){
 const q=text.trim().toLocaleLowerCase('bn');
 return items.filter(s=>(category==='all'||s.category===category)&&(!q||s.name_bn.toLocaleLowerCase('bn').includes(q)));
}
export function canStartService(s:PublicService){return s.enabled && s.form_status==='verified';}
