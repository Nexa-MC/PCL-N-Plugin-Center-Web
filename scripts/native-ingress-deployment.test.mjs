import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNativeIngress } from './deploy-native-ingress.mjs';
const settings = { bindings: [{ type: 'service', name: 'API', service: 'nexa-api' }] };
test('native deployment accepts only the existing API binding and does not take another service domain', () => {
  validateNativeIngress(settings, []);
  validateNativeIngress(settings, [{ hostname: 'botonly.pcln.top', service: 'nexa-telemetry' }, { hostname: 'pcln.top', service: 'nexa-web' }]);
  for (const bindings of [[], [{ type: 'service', name: 'API', service: 'other-api' }], [...settings.bindings, { type: 'secret_text', name: 'unrelated-key' }]]) assert.throws(() => validateNativeIngress({ bindings }, []), { message: 'existing_ingress_binding_drift' });
  assert.throws(() => validateNativeIngress(settings, [{ hostname: 'botonly.pcln.top', service: 'other-worker' }]), { message: 'botonly_existing_domain_conflict' });
  assert.throws(() => validateNativeIngress(settings, [{ hostname: 'another.pcln.top', service: 'nexa-telemetry' }]), { message: 'existing_ingress_domain_drift' });
});
