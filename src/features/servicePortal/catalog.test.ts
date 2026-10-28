import {describe,it,expect} from 'vitest';
import {SERVICES,filterServices,canStartService} from './catalog';
describe('public service catalog',()=>{
 it('loads all catalog entries',()=>expect(SERVICES.length).toBe(47));
 it('filters by name and category',()=>{const s=SERVICES[0];expect(filterServices(SERVICES,s.name_bn,s.category).some(x=>x.id===s.id)).toBe(true)});
 it('does not allow submission for unverified or disabled services',()=>{expect(SERVICES.every(s=>!canStartService(s))).toBe(true)});
});
