import { ApiError, isTestSession, request, requestBlob, type Page } from './platform';
import { ntokenWallet } from './wallet';
export type StoreKind = 'plugin' | 'theme';
export interface ProjectMedia {id:string;kind:'cover'|'gallery'|'video';filename:string;mime:string;byte_size:number}
export interface ProjectInfoStatus {id:string;state:'pending'|'approved'|'rejected'|'superseded';note:string|null}
export interface ProjectInfoCase {id:string;item_id:string;author_id:string;publisher_name:string;kind:StoreKind;revision:number;created_at:string;payload:{name:string;summary:string;description:string;media:ProjectMedia[]}}
export interface StoreContent { info_approved?:number;cover_id?:string|null;
  id: string; kind: StoreKind; project_type?: DeveloperProjectType; name: string; summary: string; description: string; publisher_name: string;
  state: 'draft' | 'pending_review' | 'published' | 'quarantined'; revision: number; version: string | null;
  base_product_id: string; token_price: number; product_revision: number; sha256: string | null;
  owner_count: number; rating_count: number; average_score: number | null; reporter_count: number;
  regular_token_price?: number; security_status?: 'unflagged' | 'suspected' | 'confirmed_malicious'; security_revision?: number;
}
export interface StoreProduct { id: string; kind: 'content' | 'in_app'; sku: string; name: string; token_price: number; regular_token_price?: number; active: number; revision: number; owned: number }
export interface PublicProfileSummary {id:string;uid:string;name:string}
export interface CommentMention {start:number;end:number;profileId:string;uid:string}
export const profileUrl=(uid:string)=>'https://accounts.pcln.top/@'+encodeURIComponent(uid);
export interface StoreComment { reply_to_uid?:string|null; reply_to_profile_id?:string|null; author_profile_id?:string;author_uid?:string;mentions?:CommentMention[]; id:string; author_name:string; root_id:string|null; reply_to_id:string|null; reply_to_name:string; body:string; deleted:number; revision:number; created_at:string; updated_at:string; mine:number; reply_count:number }
export interface PublisherReviewReply { review_revision:number;author_name:string;body:string;created_at:string }
export interface StoreReview { id:string;revision:number;can_reply?:number;replies?:PublisherReviewReply[]; author_name: string; score: number; body: string; created_at: string; updated_at: string }
export interface StoreDetail { media?:ProjectMedia[]; item: StoreContent; products: StoreProduct[]; owned: boolean; isPublisher?:boolean; myReview: { score: number; body: string } | null; scan: { verdict: string; code: string; engine_count: number; checked_at: string } | null; paidCheckoutEnabled: false }
export interface PublisherSummary { totals: { contents: number; published: number | null; pending: number | null; quarantined: number | null }; items: StoreContent[]; activity: { day: string; downloads: number }[]; generatedAt: string; paidCheckoutEnabled: false; preview?: boolean }
export interface StoreCase { id: string; item_id: string; name: string; kind: StoreKind; reason: string; state: string; revision: number; publisher_name: string; verdict: string | null; code: string | null; engine_count: number | null }
export interface StoreCaseDetail extends StoreCase { sha256: string; response_json: string | null; report_total: number; report_offset: number; reports: { id: string; body: string; message_at: string }[] }
const preventTestWrite = () => { if (isTestSession()) throw new ApiError('前端测试账户不提交商店操作', 403); };
export type DeveloperProjectType = 'plugin' | 'sidecar';
export const store = {
  catalog: (kind: StoreKind, search = '', offset = 0) => isTestSession() ? Promise.resolve({ data: [], pagination: { limit: 50, offset: 0, total: 0 } } as Page<StoreContent>) : request<Page<StoreContent>>('/store/items?' + new URLSearchParams({ kind, search, offset: String(offset), limit: '50' })),
  detail: (id: string) => { preventTestWrite(); return request<StoreDetail>('/store/items/' + encodeURIComponent(id)); },
  mentionTargets:(id:string,q:string)=>request<{data:PublicProfileSummary[]}>('/store/items/'+encodeURIComponent(id)+'/mention-targets?q='+encodeURIComponent(q)),
  publicProfile:(uid:string)=>request<{profile:PublicProfileSummary;projects:{id:string;kind:StoreKind;name:string;summary:string}[];comments:{id:string;item_id:string;kind:StoreKind;body:string;created_at:string;project_name:string}[]}>('/store/profiles/'+encodeURIComponent(uid)),
  comments: (id:string, offset=0, rootId?:string, limit=20) => request<Page<StoreComment>>('/store/items/'+encodeURIComponent(id)+'/comments'+(rootId?'/'+encodeURIComponent(rootId)+'/replies':'')+'?limit='+limit+'&offset='+offset),
  comment: (id:string, value:{body:string;rootId?:string;replyToId?:string}, key:string) => { preventTestWrite(); return request('/store/items/'+encodeURIComponent(id)+'/comments',{method:'POST',headers:{'Idempotency-Key':key},body:JSON.stringify(value)}); },
  editComment: (id:string, comment:StoreComment, body:string) => {preventTestWrite();return request('/store/items/'+encodeURIComponent(id)+'/comments/'+comment.id,{method:'PATCH',headers:{'If-Match':`"${comment.revision}"`},body:JSON.stringify({body})});},
  deleteComment: (id:string, comment:StoreComment) => {preventTestWrite();return request('/store/items/'+encodeURIComponent(id)+'/comments/'+comment.id,{method:'DELETE',headers:{'If-Match':`"${comment.revision}"`}});},
  reviews: (id: string) => { preventTestWrite(); return request<Page<StoreReview>>('/store/items/' + encodeURIComponent(id) + '/reviews?limit=20'); },
  wallet: ntokenWallet.read,
  purchase: (product: StoreProduct, key: string) => { preventTestWrite(); return request('/store/products/' + product.id + '/purchase', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify({ productRevision: product.revision }) }); },
  review: (id: string, score: number, body: string) => { preventTestWrite(); return request('/store/items/' + id + '/review', { method: 'PUT', body: JSON.stringify({ score, body }) }); },
  report: (id: string, message: string) => { preventTestWrite(); return request<{ message_count: number; item_state: string }>('/store/items/' + id + '/report', { method: 'POST', body: JSON.stringify({ message }) }); },
  summary: (kind: StoreKind, projectType?: DeveloperProjectType) => isTestSession() ? Promise.resolve({ totals: { contents: 0, published: 0, pending: 0, quarantined: 0 }, items: [], activity: [], generatedAt: new Date().toISOString(), paidCheckoutEnabled: false, preview: true } as PublisherSummary) : request<PublisherSummary>('/publisher/summary?kind=' + kind + (projectType ? '&projectType=' + projectType : '')),
  create: (value: { kind: StoreKind; projectType?: DeveloperProjectType; name: string; summary: string; description: string; tokenPrice: number }) => { preventTestWrite(); return request<{ id: string; productId: string; revision: number }>('/publisher/items', { method: 'POST', body: JSON.stringify(value) }); },
  publisherReviews: (id:string,offset=0) => request<Page<StoreReview>>('/publisher/items/'+encodeURIComponent(id)+'/reviews?limit=20&offset='+offset),
  replyReview: (id:string,review:StoreReview,body:string) => {preventTestWrite();return request('/publisher/items/'+encodeURIComponent(id)+'/reviews/'+review.id+'/reply',{method:'POST',body:JSON.stringify({body,reviewRevision:review.revision})});},
  mediaUrl:(id:string)=>'/api/v1/store/media/'+encodeURIComponent(id),
  mediaBlob:(id:string)=>requestBlob('/store/media/'+encodeURIComponent(id)),
  uploadMedia:(item:StoreContent,kind:ProjectMedia['kind'],file:File)=>{preventTestWrite();return request('/publisher/items/'+encodeURIComponent(item.id)+'/media?kind='+kind,{method:'POST',headers:{'If-Match':`"${item.revision}"`,'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(file.name),'X-File-Size':String(file.size)},body:file,signal:AbortSignal.timeout(180000)});},
  removeMedia:(item:StoreContent,id:string)=>{preventTestWrite();return request('/publisher/items/'+encodeURIComponent(item.id)+'/media/'+encodeURIComponent(id),{method:'DELETE',headers:{'If-Match':`"${item.revision}"`}});},
  infoCases:(offset=0)=>request<Page<ProjectInfoCase>>('/manage/store/project-info?limit=20&offset='+offset),
  decideInfo:(info:ProjectInfoCase,decision:'approve'|'reject',note:string)=>request('/manage/store/project-info/'+info.id,{method:'POST',headers:{'If-Match':`"${info.revision}"`},body:JSON.stringify({decision,note})}),
  project: (id: string) => { preventTestWrite(); return request<{item: StoreContent; info:ProjectInfoStatus|null;media:ProjectMedia[];releases: {id:string;version:string;review_state:string;created_at:string}[]}>('/publisher/items/' + encodeURIComponent(id)); },
  update: (item: StoreContent, value: {name:string;summary:string;description:string}) => { preventTestWrite(); return request<{item:StoreContent}>('/publisher/items/' + encodeURIComponent(item.id), {method:'PATCH',headers:{'If-Match': `"${item.revision}"`},body:JSON.stringify(value)}); },
  upload: (kind: StoreKind, file: File, projectType?: DeveloperProjectType) => { preventTestWrite(); return request<{ id: string; sha256: string }>('/publisher/artifacts?kind=' + kind + (projectType ? '&projectType=' + projectType : ''), { method: 'POST', body: file, headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name) }, signal: AbortSignal.timeout(60000) }); },
  release: (item: StoreContent, artifactId: string, version: string, analysisId?: string) => { preventTestWrite(); return request('/publisher/items/' + item.id + '/releases', { method: 'POST', headers: { 'If-Match': `"${item.revision}"` }, body: JSON.stringify({ artifactId, version, ...(analysisId ? { analysisId } : {}) }), signal: AbortSignal.timeout(35000) }); },
  createProduct: (id: string, sku: string, name: string, tokenPrice: number) => { preventTestWrite(); return request<{ id: string }>('/publisher/items/' + id + '/products', { method: 'POST', body: JSON.stringify({ sku, name, tokenPrice }) }); },
  cases: () => { preventTestWrite(); return request<Page<StoreCase>>('/manage/store/cases?limit=100'); },
  case: (id: string, reportOffset = 0) => { preventTestWrite(); return request<StoreCaseDetail>('/manage/store/cases/' + id + '?reportOffset=' + reportOffset); },
  decide: (item: StoreCase, decision: 'approve' | 'keep_offline', note: string) => { preventTestWrite(); return request('/manage/store/cases/' + item.id, { method: 'POST', headers: { 'If-Match': `"${item.revision}"` }, body: JSON.stringify({ decision, note }) }); }
};
export const storePath = (kind: StoreKind, id?: string) => '/store/' + (kind === 'plugin' ? 'plugins' : 'themes') + (id ? '/' + encodeURIComponent(id) : '');
export const consoleOrigin = (kind: StoreKind) => kind === 'plugin' ? 'https://dev.consol.pcln.top' : 'https://creator.consol.pcln.top';
export const storeState = (state: string) => ({ draft: '草稿', pending_review: '待审核', approved: '已通过', published: '已上架', quarantined: '已下架待复核' }[state] || state);

export function themeInstallLink(id: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return '';
  return 'nexacl://extension/NexaMcMarketPage?argument=' + encodeURIComponent(id);
}
