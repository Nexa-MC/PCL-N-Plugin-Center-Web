import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePublicDomains } from './repair-public-domains.mjs';

test('public domain repair accepts missing DNS and existing website bindings', () => {
  validatePublicDomains([], [{ name: 'pcln.top', type: 'TXT' }], [{ pattern: 'pcln.top/*', script: 'nexa-web' }]);
  validatePublicDomains([{ hostname: 'pcln.top', service: 'nexa-web', environment: 'production' }], [{ name: 'pcln.top', type: 'AAAA' }], []);
});
test('public domain repair refuses conflicting DNS, Workers or routes', () => {
  assert.throws(() => validatePublicDomains([], [{ name: 'pcln.top', type: 'A' }], []), /existing_dns_requires_review/);
  assert.throws(() => validatePublicDomains([{ hostname: 'www.pcln.top', service: 'other', environment: 'production' }], [], []), /domain_conflict/);
  assert.throws(() => validatePublicDomains([], [], [{ pattern: 'pcln.top/*', script: 'other' }]), /route_conflict/);
});
