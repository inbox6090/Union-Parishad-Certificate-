import {describe,it,expect} from 'vitest';
import {validateApplication,canSubmitApplication,ApplicationDraft} from './applicationModel';
const draft:ApplicationDraft={id:'a1',serviceId:'service_01',citizenId:'c1',ownerUid:'u1',status:'draft',schemaVersion:'2026-10-28',fieldValues:{reason:'test'},createdAt:'2026-10-28',updatedAt:'2026-10-28'};
describe('secure application model',()=>{
 it('blocks unapproved service',()=>expect(canSubmitApplication(false,'draft')).toBe(false));
 it('blocks repeated submission',()=>expect(canSubmitApplication(true,'submitted')).toBe(false));
 it('requires citizen and service identifiers',()=>expect(validateApplication({...draft,citizenId:''})).toContain('নাগরিক নির্বাচন করুন'));
 it('accepts a valid draft',()=>expect(validateApplication(draft)).toEqual([]));
});