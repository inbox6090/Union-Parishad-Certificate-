export type CitizenProfile = {
 id: string; name: string; father: string; mother: string; gender: 'পুরুষ'|'মহিলা'|'হিজরা';
 nid?: string; birthNo?: string; mobile?: string; spouseName?: string;
 village: string; wardNo: string; postOffice: string; postCode?: string; holdingNo?: string;
 dateOfBirth?: string; nameEn?: string; occupation?: string;
 permanentAddress?: string; currentAddress?: string; education?: string;
 emergencyContact?: string; createdAt: string; updatedAt: string; createdBy: string;
};
export type CitizenInput = Pick<CitizenProfile,'name'|'father'|'mother'|'gender'|'village'|'wardNo'|'postOffice'> & Partial<Pick<CitizenProfile,'nid'|'birthNo'|'mobile'|'spouseName'|'holdingNo'|'postCode'|'dateOfBirth'|'nameEn'|'occupation'|'permanentAddress'|'currentAddress'|'education'|'emergencyContact'>>;
export function validateCitizen(input: CitizenInput): string[] {
 const errors: string[] = [];
 for (const key of ['name','father','mother','village','wardNo','postOffice'] as const) {
   if (!input[key]?.trim()) errors.push(key + ' আবশ্যক');
 }
 const digits = (v:string) => v.replace(/[০-৯]/g,c=>String('০১২৩৪৫৬৭৮৯'.indexOf(c)));
 if (input.nid && !/^(\d{10}|\d{13}|\d{17})$/.test(digits(input.nid))) errors.push('NID ১০/১৩/১৭ অঙ্কের হতে হবে');
 if (input.birthNo && !/^\d{17}$/.test(digits(input.birthNo))) errors.push('জন্মনিবন্ধন ১৭ অঙ্কের হতে হবে');
 if (input.mobile && !/^01[3-9]\d{8}$/.test(digits(input.mobile))) errors.push('মোবাইল নম্বর সঠিক নয়');
 if (!/^(০?[১-৯]|0?[1-9])$/.test(input.wardNo)) errors.push('ওয়ার্ড ১–৯ হতে হবে');
 return errors;
}
export function toCertificateCitizen(c:CitizenProfile) {
 return {id:c.id,name:c.name,father:c.father,mother:c.mother,gender:c.gender,
 nid:c.nid||'',birthNo:c.birthNo||'',mobile:c.mobile||'',spouseName:c.spouseName||'',
 holdingNo:c.holdingNo||'',village:c.village,wardNo:c.wardNo,postOffice:c.postOffice,
 postCode:c.postCode||'',totalCertificates:0,registeredAt:c.createdAt};
}
