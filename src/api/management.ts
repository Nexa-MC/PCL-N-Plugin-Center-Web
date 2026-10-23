import { managementAuthRequest, request, type Page, type Ticket, type StoreItem, type DeveloperEligibility } from './platform';

export interface ManagedUser {
  id: string; name: string; handle: string | null; email: string | null;
  staff: number; creator?: number; developer: number; trustedDeveloper: number; disabled: number; createdAt: string | null;
}
export interface ManagedResource extends StoreItem { published: number; revision: number }
export interface AuditEntry { id: number; actor: string; action: string; created_at: string; detail?: string | null; object_id?: string }
export interface Application { id: string; kind: string; createdAt: string; level: number; coreContributorClaimed?:boolean; eligibility?:DeveloperEligibility|null; user: { id: string; name: string; handle: string | null } }
export interface PlatformSummary { resources: number; publishedResources: number; openTickets: number; resolvedTickets: number }
export interface IdentitySummary { users: number; disabledUsers: number; pendingApplications: number }
export type ResourceInput = Omit<StoreItem, 'id'> & { published: boolean };
const pageQuery = (offset: number, search = '') => `limit=25&offset=${offset}&search=${encodeURIComponent(search)}`;

export const management = {
  platformSummary: () => request<PlatformSummary>('/manage/summary'),
  identitySummary: () => managementAuthRequest<IdentitySummary>('/manage/summary'),
  users: (offset = 0, search = '') => managementAuthRequest<Page<ManagedUser>>('/manage/users?' + pageQuery(offset, search)),
  setDisabled: (user: ManagedUser, disabled: boolean) => managementAuthRequest('/manage/users/' + encodeURIComponent(user.id), { method: 'PATCH', body: JSON.stringify({ disabled, expectedDisabled: Boolean(user.disabled) }) }),
  resources: (offset = 0, search = '') => request<Page<ManagedResource>>('/manage/resources?' + pageQuery(offset, search)),
  saveResource: (value: ResourceInput, resource?: ManagedResource) => request('/manage/resources' + (resource ? '/' + encodeURIComponent(resource.id) : ''), { method: resource ? 'PUT' : 'POST', ...(resource ? { headers: { 'If-Match': `"${resource.revision}"` } } : {}), body: JSON.stringify(value) }),
  tickets: (offset = 0, status = 'open') => request<Page<Ticket & { user_id: string }>>(`/manage/tickets?${pageQuery(offset)}&status=${encodeURIComponent(status)}`),
  resolve: (ticket: Ticket) => request('/tickets/' + encodeURIComponent(ticket.id), { method: 'PATCH', headers: { 'If-Match': `"${ticket.version}"` }, body: JSON.stringify({ status: 'resolved' }) }),
  applications: () => managementAuthRequest<{ applications: Application[] }>('/applications/pending'),
  review: (application: Application, decision: 'approved' | 'rejected', note: string, coreContributorConfirmed=false) => managementAuthRequest('/applications/' + encodeURIComponent(application.id) + '/review', { method: 'POST', body: JSON.stringify({ decision, note, coreContributorConfirmed }) }),
  audit: (source: string, offset = 0) => source === 'identity' ? managementAuthRequest<Page<AuditEntry>>('/manage/audit?' + pageQuery(offset)) : request<Page<AuditEntry>>('/manage/audit?' + pageQuery(offset))
};
