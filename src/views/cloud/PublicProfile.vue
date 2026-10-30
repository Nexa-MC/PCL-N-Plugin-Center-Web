<template>
  <div class="public-profile-shell">
    <header class="cloud-header">
      <a class="cloud-brand" href="https://pcln.top/"><BrandIcon /><strong>NexaMC</strong></a>
      <a class="profile-home-link" href="https://pcln.top/">{{ $ui('返回网站 ↗') }}</a>
      <LanguageControl /><ThemeControl />
    </header>
    <main class="cloud-content public-profile">
      <section v-if="!route.params.uid" class="work-panel"><h1>{{ $ui('用户主页') }}</h1><p class="store-muted">{{ $ui('点击评论中的用户名可查看公开主页。') }}</p></section>
      <p v-if="loading" role="status">{{ $ui('正在读取…') }}</p>
      <p v-else-if="error" class="form-error" role="alert">{{ $ui(error) }}</p>
      <template v-if="data">
        <section class="work-panel profile-hero">
          <div class="profile-heading">
            <span class="profile-avatar" aria-hidden="true">{{ Array.from(data.profile.name)[0]?.toUpperCase() }}</span>
            <div class="profile-heading-content">
              <p class="eyebrow">{{ $ui('用户主页') }}</p><h1>{{ data.profile.name }}</h1>
              <div v-if="roleLabels.length || data.profile.membership" class="profile-labels">
                <span v-for="label in roleLabels" :key="label" class="profile-label">{{ $ui(label) }}</span>
                <span v-if="data.profile.membership" class="profile-label profile-subscription" :aria-label="$ui('订阅等级')">
                  {{ data.profile.membership.name }}<small v-if="data.profile.membership.trial"> · {{ $ui('试用') }}</small>
                </span>
              </div>
            </div>
          </div>
          <dl v-if="data.profile.uid !== 'ghost'" class="profile-facts">
            <div><dt>{{ $ui('用户 ID') }}</dt><dd>@{{ data.profile.uid }}</dd></div>
            <div><dt>{{ $ui('账户 ID') }}</dt><dd><code>{{ data.profile.accountId || '—' }}</code></dd></div>
            <div><dt>{{ $ui('等级') }}</dt><dd>{{ data.profile.level === undefined ? '—' : 'Lv'+data.profile.level }}</dd></div>
          </dl>
          <p v-else class="store-muted">@ghost</p>
        </section>
        <section v-if="data.profile.uid !== 'ghost'" class="work-panel">
          <h2>{{ $ui('铭牌') }}</h2>
          <div v-if="data.profile.badges?.length" class="profile-labels profile-badges">
            <span v-for="badge in data.profile.badges" :key="badge.id" class="profile-label" :class="{'profile-selected-badge':data.profile.display?.badgeId===badge.id}">{{ $ui(badge.name) }}</span>
          </div>
          <p v-else class="store-muted">{{ $ui('暂无铭牌。') }}</p>
        </section>
        <section v-for="group in projectGroups" :key="group.title" class="work-panel">
          <h2>{{ $ui(group.title) }}</h2>
          <p v-if="!group.projects.length" class="store-muted">{{ $ui('暂无公开作品。') }}</p>
          <a v-for="project in group.projects" :key="project.id" class="store-content-row" :href="'https://pcln.top'+storePath(project.kind,project.id)">
            <div><strong>{{ project.name }}</strong><p>{{ project.summary }}</p></div><span aria-hidden="true">→</span>
          </a>
        </section>
        <section class="work-panel">
          <h2>{{ $ui('最近的公开评论') }}</h2>
          <p v-if="!data.comments.length" class="store-muted">{{ $ui('暂无评论。') }}</p>
          <article v-for="comment in data.comments" :key="comment.id" class="profile-comment">
            <a :href="'https://pcln.top'+storePath(comment.kind,comment.item_id)">{{ comment.project_name }}</a>
            <p>{{ Array.from(comment.body).slice(0,200).join('') }}{{ Array.from(comment.body).length>200?'…':'' }}</p>
            <small>{{ new Date(comment.created_at).toLocaleDateString($locale) }}</small>
          </article>
        </section>
      </template>
    </main>
  </div>
</template>
<script setup lang="ts">
import {computed,ref,watch,onBeforeUnmount} from 'vue';
import {useRoute,useRouter} from 'vue-router';
import {store,storePath} from '@/api/store';
import BrandIcon from '@/components/BrandIcon.vue';
import LanguageControl from '@/components/LanguageControl.vue';
import ThemeControl from '@/components/ThemeControl.vue';
import '@/styles/store.css';
const route=useRoute(),router=useRouter(),loading=ref(false),error=ref('');
const data=ref<Awaited<ReturnType<typeof store.publicProfile>>>();let generation=0;
const roleLabels=computed(()=>{const roles=data.value?.profile.roles;if(!roles)return[];return[...(roles.siteOwner?['站长']:roles.admin?['管理']:[]),...(roles.trustedDeveloper?['受信任开发者']:roles.developer?['开发者']:[]),...(roles.creator?['创作者']:[])];});
const projectGroups=computed(()=>{if(!data.value)return[];const{profile,projects}=data.value,groups:{title:string;projects:typeof projects}[]=[];if(profile.roles?.developer||profile.roles?.trustedDeveloper)groups.push({title:'开发者作品',projects:projects.filter(p=>p.kind==='plugin')});if(profile.roles?.creator)groups.push({title:'创作者作品',projects:projects.filter(p=>p.kind==='theme')});if(!groups.length)groups.push({title:'公开作品',projects});return groups;});
watch(()=>[route.params.uid,route.query.identity],async([value,identity])=>{
  const step=++generation;data.value=undefined;error.value='';if(typeof value!=='string'||!value)return;
  loading.value=true;
  try{
    const profile=await store.publicProfile(value);
    if(step!==generation)return;
    if(profile.profile.uid!==value.toLowerCase()||(identity!==undefined&&(typeof identity!=='string'||identity!==profile.profile.id)))throw new Error('用户主页不存在或暂不可用');
    data.value=profile;
    const canonicalPath='/@'+encodeURIComponent(profile.profile.uid);
    if(route.path!==canonicalPath)void router.replace({path:canonicalPath,query:route.query,hash:route.hash,force:true});
  }catch(e){if(step===generation)error.value=e instanceof Error?e.message:'用户主页暂不可用';}
  finally{if(step===generation)loading.value=false;}
},{immediate:true});
onBeforeUnmount(()=>generation++);
</script>
<style scoped>
.public-profile{max-width:1000px}.profile-home-link{margin-left:auto}.profile-heading{display:flex;align-items:center;gap:24px}.profile-heading-content{min-width:0}.profile-avatar{display:grid;place-items:center;width:72px;height:72px;border-radius:50%;background:var(--market-accent-soft);color:var(--nc-accent);font-size:28px;flex-shrink:0}.profile-hero h1{overflow-wrap:anywhere;margin-bottom:12px}.profile-facts{display:grid;grid-template-columns:1fr 2fr auto;gap:24px;margin:24px 0 0;padding-top:24px;border-top:1px solid var(--market-border)}.profile-facts dt{font-size:12px;color:var(--market-muted);margin-bottom:8px}.profile-facts dd{margin:0;overflow-wrap:anywhere;font-size:14px}.profile-facts code{font-size:12px}.profile-labels{display:flex;flex-wrap:wrap;gap:8px}.profile-label{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border:1px solid var(--market-border);border-radius:6px;font-size:12px;background:var(--market-accent-soft);color:var(--nc-accent)}.profile-subscription,.profile-selected-badge{border-color:var(--nc-accent)}.profile-badges{margin-top:16px}.profile-comment{padding:20px 0;border-bottom:1px solid var(--market-border)}.profile-comment p{white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0}.profile-comment small{color:var(--market-muted)}@media(max-width:600px){.profile-heading{gap:12px;align-items:flex-start}.profile-avatar{width:44px;height:44px;font-size:20px}.profile-home-link{font-size:12px}.profile-facts{grid-template-columns:1fr;gap:16px}.profile-hero h1{font-size:26px}}
</style>
