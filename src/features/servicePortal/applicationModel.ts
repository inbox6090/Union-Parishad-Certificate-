export type ApplicationStatus='draft'|'submitted'|'under_review'|'needs_information'|'approved'|'rejected'|'issued';
export type ApplicationDraft={id:string;serviceId:string;citizenId:string;ownerUid:string;status:ApplicationStatus;schemaVersion:string;fieldValues:Record<string,string>;createdAt:string;updatedAt:string;submittedAt?:string};
export function validateApplication(a:ApplicationDraft):string[]{
 const errors:string[]=[];
 if(!a.citizenId.trim())errors.push('নাগরিক নির্বাচন করুন');
 if(!/^service_\d+$/.test(a.serviceId))errors.push('সঠিক সেবা নির্বাচন করুন');
 if(!a.ownerUid.trim())errors.push('অনুমোদিত ব্যবহারকারী প্রয়োজন');
 return errors;
}
export function canSubmitApplication(approved:boolean,status:ApplicationStatus){return approved&&status==='draft';}
export const STATUS_LABELS:Record<ApplicationStatus,string>={draft:'খসড়া',submitted:'জমাকৃত',under_review:'যাচাইাধীন',needs_information:'তথ্য প্রয়োজন',approved:'অনুমোদিত',rejected:'প্রত্যাখ্যাত',issued:'ইস্যুকৃত'};
