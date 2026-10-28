import {describe,it,expect} from 'vitest';
import {validateCitizen,toCertificateCitizen,CitizenInput,CitizenProfile} from './model';
const base:CitizenInput={name:'পরীক্ষা',father:'পিতা',mother:'মাতা',gender:'পুরুষ',village:'গ্রাম',wardNo:'০১',postOffice:'ডাকঘর'};
describe('citizen master model',()=>{
 it('rejects missing required fields',()=>expect(validateCitizen({...base,name:''})).toContain('name আবশ্যক'));
 it('rejects invalid identity and mobile numbers',()=>expect(validateCitizen({...base,nid:'123',birthNo:'12',mobile:'123'})).toHaveLength(3));
 it('accepts valid Bangla-digit NID and ward',()=>expect(validateCitizen({...base,nid:'১২৩৪৫৬৭৮৯০'})).toEqual([]));
 it('links certificate form by stable citizen ID',()=>{
 const profile:CitizenProfile={...base,id:'uuid-1',createdAt:'2026-01-01',updatedAt:'2026-01-01',createdBy:'staff'};
 expect(toCertificateCitizen(profile).id).toBe('uuid-1');
 });
});
