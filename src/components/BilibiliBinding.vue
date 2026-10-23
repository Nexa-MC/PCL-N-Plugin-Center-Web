<template>
  <FormDialog :model-value="modelValue" :title="$ui('绑定B站账户')" :busy="busy" :error="error" :confirm-label="primaryLabel" :busy-label="busyLabel" :can-confirm="canContinue" @update:model-value="emit('update:modelValue', $event)" @confirm="submit">
    <template v-if="!profile">
      <p class="binding-intro">{{ $ui('通过临时修改个性签名，证明你控制这个B站账户。') }}</p>
      <label for="bilibili-binding-uid">{{ $ui('B站UID') }}</label>
      <input id="bilibili-binding-uid" v-model="uid" class="binding-input" type="text" inputmode="numeric" autocomplete="off" maxlength="20" :disabled="busy" :placeholder="$ui('请输入数字UID')" />
      <p class="binding-target">{{ $ui('将关联到当前Nexa账户：{0}', [accountLabel]) }}</p>
      <p class="binding-note">{{ $ui('无需提供B站密码、Cookie或登录凭据。') }}</p>
    </template>
    <template v-else>
      <div class="binding-profile">
        <img v-if="profile.avatar" :src="profile.avatar" :alt="$ui('B站头像')" width="48" height="48" referrerpolicy="no-referrer" />
        <span v-else class="binding-avatar" aria-hidden="true">{{ profile.name[0] || 'B' }}</span>
        <div><strong>{{ profile.name }}</strong><p>UID {{ profile.uid }}</p><p><span v-if="profile.level !== null">Lv{{ profile.level }}</span><span v-if="profile.followers !== null"> · {{ $ui('{0} 位粉丝', [profile.followers.toLocaleString($locale)]) }}</span></p></div>
      </div>
      <p class="binding-target">{{ $ui('将B站UID {0} 关联到Nexa @{1}', [profile.uid, challenge?.accountLabel || accountLabel]) }}</p>
      <template v-if="!challenge">
        <p class="binding-intro">{{ $ui('这是你的B站账户吗？确认资料后继续生成临时签名。') }}</p>
        <button class="secondary-button binding-restart" type="button" :disabled="busy" @click="restart">{{ $ui('更换UID') }}</button>
      </template>
      <template v-else>
        <template v-if="!activated">
          <p class="binding-intro">{{ $ui('选择一句临时个性签名：两句中文、两句英文，只有选中的一句会生效。') }}</p>
          <div class="binding-candidates" role="radiogroup" :aria-label="$ui('候选签名')">
            <label v-for="candidate in challenge.candidates" :key="candidate.index" class="binding-candidate" :class="{ selected: selectedIndex === candidate.index }">
              <input v-model="selectedIndex" type="radio" name="bilibili-signature" :value="candidate.index" :disabled="busy" />
              <span :lang="candidate.language"><small>{{ candidate.language === 'zh' ? $ui('中文签名') : $ui('英文签名') }}</small>{{ candidate.text }}</span>
            </label>
          </div>
        </template>
        <template v-else>
          <p class="binding-intro">{{ $ui('请将该B站账户的个性签名完整替换为以下内容：') }}</p>
          <code class="binding-signature">{{ signature }}</code>
          <div class="binding-actions">
            <button class="secondary-button" type="button" :disabled="busy" @click="copySignature">{{ copied ? $ui('已复制签名') : $ui('复制签名') }}</button>
            <a :href="`https://space.bilibili.com/${profile.uid}`" target="_blank" rel="noopener noreferrer">{{ $ui('打开B站个人空间') }}</a>
          </div>
          <label class="binding-confirm"><input v-model="confirmed" type="checkbox" :disabled="busy" />{{ $ui('我确认将此B站账户绑定到当前Nexa账户，并已修改签名。') }}</label>
          <p class="binding-note">{{ $ui('验证成功后可以恢复原来的签名。签名更新可能需要一段时间才会生效。') }}</p>
        </template>
        <p v-if="remaining > 0" class="binding-note" role="status">{{ $ui('有效期剩余 {0}:{1}，最多核验 {2} 次。', [Math.floor(remaining / 60), String(remaining % 60).padStart(2, '0'), challenge.maxAttempts]) }}</p>
        <p v-else class="form-error" role="status">{{ $ui('签名挑战已过期，请重新开始。') }}</p>
        <p class="binding-note">{{ $ui('只为当前Nexa账户操作，请勿替他人发布验证签名。') }}</p>
        <button class="secondary-button binding-restart" type="button" :disabled="busy" @click="restart">{{ $ui('重新开始') }}</button>
      </template>
    </template>
  </FormDialog>
</template>
<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { platform, ApiError, type BilibiliChallenge, type BilibiliProfile } from '@/api/platform';
import FormDialog from '@/components/FormDialog.vue';
const props = defineProps<{ modelValue: boolean; accountLabel: string }>();
const emit = defineEmits<{ 'update:modelValue': [boolean]; linked: [] }>();
const uid = ref(''), busy = ref(false), error = ref(''), copied = ref(false), confirmed = ref(false), challenge = ref<BilibiliChallenge>(), profile = ref<BilibiliProfile>();
const selectedIndex = ref<number>(), activated = ref(false);
const signature = computed(() => challenge.value?.candidates.find(candidate => candidate.index === selectedIndex.value)?.text ?? '');
const clock = ref(Date.now()), remaining = computed(() => Math.max(0, Math.ceil(((challenge.value?.expiresAt ?? 0) - clock.value) / 1000)));
const validUid = computed(() => /^[1-9]\d{0,19}$/.test(uid.value.trim()));
const primaryLabel = computed(() => !profile.value ? '查找账号' : !challenge.value ? '是，继续验证' : !activated.value ? '使用所选签名' : '验证并绑定');
const busyLabel = computed(() => !profile.value ? '正在查找账号…' : !challenge.value ? '正在生成签名…' : !activated.value ? '正在确认签名…' : '正在核验当前签名…');
const canContinue = computed(() => !profile.value ? validUid.value : !challenge.value ? true : remaining.value > 0 && (activated.value ? confirmed.value : selectedIndex.value !== undefined));
let interval: ReturnType<typeof setInterval> | undefined, controller: AbortController | undefined;
function cancelPending() {
  const id = challenge.value?.id;
  challenge.value = undefined; selectedIndex.value = undefined; activated.value = false;
  if (id) void platform.cancelBilibiliChallenge(id).catch(() => {});
}
watch(() => props.modelValue, open => {
  clearInterval(interval);
  if (open) {
    uid.value = ''; profile.value = undefined; error.value = ''; copied.value = false; confirmed.value = false; clock.value = Date.now();
    interval = setInterval(() => { clock.value = Date.now(); }, 1000);
  } else { controller?.abort(); cancelPending(); }
});
async function copySignature() {
  try { await navigator.clipboard.writeText(signature.value); copied.value = true; }
  catch { error.value = '无法复制，请手动选择签名。'; }
}
function restart() { cancelPending(); profile.value = undefined; error.value = ''; confirmed.value = false; copied.value = false; }
async function submit() {
  if (busy.value || !canContinue.value) return;
  busy.value = true; error.value = ''; controller = new AbortController();
  const timeout = setTimeout(() => controller?.abort(), 35000);
  try {
    if (!profile.value) profile.value = await platform.bilibiliProfile(uid.value.trim(), controller.signal);
    else if (!challenge.value) { challenge.value = await platform.createBilibiliChallenge(profile.value.uid, controller.signal); clock.value = Date.now(); }
    else if (!activated.value) {
      const result = await platform.selectBilibiliCandidate(challenge.value.id, selectedIndex.value!, controller.signal);
      if (result.selectedIndex !== selectedIndex.value) throw new Error('候选签名确认失败');
      activated.value = true;
    } else {
      const result = await platform.verifyBilibiliChallenge(challenge.value.id, controller.signal);
      if (!result.verified || result.uid !== challenge.value.uid) throw new Error('B站核验服务返回了无效资料');
      challenge.value = undefined;
      emit('linked'); emit('update:modelValue', false);
    }
  } catch (failure) {
    error.value = failure instanceof ApiError ? failure.message : failure instanceof Error && failure.name === 'AbortError' ? '核验超时，请稍后重试。' : '暂时无法核验B站签名，请稍后重试';
  } finally { clearTimeout(timeout); busy.value = false; controller = undefined; }
}
onUnmounted(() => { clearInterval(interval); controller?.abort(); cancelPending(); });
</script>
<style scoped>
.binding-intro,.binding-target{font-size:13px;line-height:1.7;margin:0}.binding-target{font-weight:600;color:var(--market-text)}.binding-note{font-size:12px;line-height:1.7;color:var(--market-muted);margin:0}.binding-input{box-sizing:border-box;width:100%;padding:11px 12px;border:1px solid var(--market-border);border-radius:8px;background:var(--market-surface);color:var(--market-text);font:inherit}.binding-signature{display:block;padding:16px;border:1px solid var(--market-border);border-radius:10px;background:var(--market-surface-soft);line-height:1.8;overflow-wrap:anywhere;user-select:all}.binding-actions{display:flex;align-items:center;flex-wrap:wrap;gap:16px}.binding-actions a{font-size:13px;color:var(--nc-accent)}.binding-confirm{display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.7}.binding-confirm input{margin-top:5px;flex-shrink:0}.binding-restart{justify-self:start}label{font-size:13px}.binding-profile{display:flex;align-items:center;gap:12px}.binding-profile img,.binding-avatar{width:48px;height:48px;flex-shrink:0;border-radius:50%;object-fit:cover}.binding-avatar{display:grid;place-items:center;background:var(--market-surface-soft);font-size:20px}.binding-profile>div{min-width:0;overflow-wrap:anywhere}.binding-profile p{font-size:12px;line-height:1.7;color:var(--market-muted);margin:2px 0 0}.binding-candidates{display:grid;gap:8px}.binding-candidate{display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid var(--market-border);border-radius:10px;line-height:1.7;cursor:pointer}.binding-candidate.selected{border-color:var(--nc-accent);background:var(--market-surface-soft)}.binding-candidate input{flex-shrink:0;margin-top:6px}.binding-candidate span{min-width:0;overflow-wrap:anywhere}.binding-candidate small{display:block;color:var(--market-muted);font-size:11px;margin-bottom:3px}
</style>
