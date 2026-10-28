<template>
<div><div class="manage-page-heading"><div><span class="manage-eyebrow">NexaMC</span><h1>{{ $ui('公告与问卷') }}</h1></div><button class="primary-button" @click="edit()">{{ $ui('新建公告') }}</button></div>
<p v-if="error" class="form-error" role="alert">{{ error }}</p>
<section class="manage-panel"><h2>{{ $ui('启动器公告') }}</h2><p v-if="loading" class="manage-empty" role="status">{{ $ui('正在加载…') }}</p><template v-else><div v-for="item in announcements" :key="item.id" class="announcement"><div><strong>{{ item.title }}</strong><p>{{ item.enabled ? $ui('已启用') : $ui('未启用') }} · {{ formatDate(item.updated_at) }}</p></div><button class="secondary-button" @click="edit(item)">{{ $ui('编辑') }}</button></div><p v-if="!announcements.length" class="manage-empty">{{ $ui('尚无公告') }}</p><Pagination :offset="announcementOffset" :total="announcementTotal" :busy="loading" @change="pageAnnouncements" /></template></section>
<section class="manage-panel"><h2>{{ $ui('玩家问卷') }}</h2><p v-if="loading" class="manage-empty" role="status">{{ $ui('正在加载…') }}</p><template v-else><article v-for="item in surveys" :key="item.id" class="survey"><strong>{{ item.rating }} / 5 · {{ $ui(areaLabels[item.area] || item.area) }}</strong><p class="comment">{{ item.comment }}</p><small>{{ item.version }} · {{ formatDate(item.created_at) }}</small></article><p v-if="!surveys.length" class="manage-empty">{{ $ui('尚无问卷回复') }}</p><Pagination :offset="surveyOffset" :total="surveyTotal" :busy="loading" @change="pageSurveys" /></template></section>
<FormDialog v-model="dialog" :title="$ui(selected ? '编辑公告' : '新建公告')" :busy="busy" :error="error" :can-confirm="Boolean(form.title.trim() && form.body.trim())" :confirm-label="$ui('保存')" @confirm="save"><div class="manage-form"><label>{{ $ui('标题') }}<input v-model="form.title" maxlength="120" required /></label><label>{{ $ui('正文') }}<textarea v-model="form.body" maxlength="8000" rows="8" required /></label><label>{{ $ui('开始时间（可选，本地时间）') }}<input v-model="form.starts_at" type="datetime-local" /></label><label>{{ $ui('结束时间（可选，本地时间）') }}<input v-model="form.ends_at" type="datetime-local" /></label><label class="manage-checkbox"><input v-model="form.enabled" type="checkbox" />{{ $ui('向启动器发布') }}</label></div></FormDialog>
</div>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import FormDialog from '@/components/FormDialog.vue';
import Pagination from './Pagination.vue';
import { formatDate } from './useManagement';
const areaLabels:Record<string,string>={general:'整体体验',launch:'游戏启动',install:'安装与更新',resources:'资源浏览',accounts:'账户登录',performance:'性能与内存',interface:'界面与操作'};
import { request, type Page } from '@/api/platform';
interface Announcement {id:string;title:string;body:string;enabled:number;starts_at:string|null;ends_at:string|null;revision:number;updated_at:string}
interface Survey {id:string;rating:number;area:string;comment:string;version:string;created_at:string}
const announcements=ref<Announcement[]>([]),surveys=ref<Survey[]>([]),announcementOffset=ref(0),surveyOffset=ref(0),announcementTotal=ref(0),surveyTotal=ref(0),loading=ref(true),busy=ref(false),error=ref(''),dialog=ref(false),selected=ref<Announcement>();
const form=reactive({title:'',body:'',enabled:false,starts_at:'',ends_at:''});
const local=(value:string|null)=>{if(!value)return '';const date=new Date(value);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);};
function edit(item?:Announcement){selected.value=item;Object.assign(form,{title:item?.title||'',body:item?.body||'',enabled:Boolean(item?.enabled),starts_at:local(item?.starts_at??null),ends_at:local(item?.ends_at??null)});error.value='';dialog.value=true;}
async function load(){loading.value=true;error.value='';try{const[a,s]=await Promise.all([request<Page<Announcement>>('/manage/announcements?limit=25&offset='+announcementOffset.value),request<Page<Survey>>('/manage/surveys?limit=25&offset='+surveyOffset.value)]);announcements.value=a.data;surveys.value=s.data;announcementTotal.value=a.pagination.total;surveyTotal.value=s.pagination.total;}catch(e){error.value=e instanceof Error?e.message:'读取失败';}finally{loading.value=false;}}
function pageAnnouncements(offset:number){announcementOffset.value=offset;void load();}function pageSurveys(offset:number){surveyOffset.value=offset;void load();}
async function save(){if(busy.value)return;busy.value=true;error.value='';try{const item=selected.value;await request('/manage/announcements'+(item?'/'+item.id:''),{method:item?'PUT':'POST',headers:item?{'If-Match':`"${item.revision}"`}:{},body:JSON.stringify({...form,starts_at:form.starts_at?new Date(form.starts_at).toISOString():null,ends_at:form.ends_at?new Date(form.ends_at).toISOString():null})});dialog.value=false;await load();}catch(e){error.value=e instanceof Error?e.message:'保存失败';}finally{busy.value=false;}}onMounted(load);
</script>
<style scoped>
.manage-panel{margin-bottom:24px}.announcement{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:20px 0;border-bottom:1px solid var(--manage-border)}.announcement p,.survey small{color:var(--manage-muted)}.survey{padding:24px 0;border-bottom:1px solid var(--manage-border)}.comment{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7}
</style>
