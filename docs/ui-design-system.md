# NexaMC interface refresh — 2026-10-28

## Source and scope

Requested skill: `@user_865e3592/ui-new` version `1.0.0`, installed using SkillHub CLI 2026.8.5 from the user-specified https://skillhub.cn/install/skillhub.md procedure into `.agents/skills/@user_865e3592/ui-new`. The package identifies itself as `ui-design-system`; its audit protocol informed this work. Only that skill was installed; no default skill bundle, source-priority policy, external font service or runtime UI dependency was added.

The redesign uses the existing Vue application, route permissions and component contracts. Payment, account acceptance, publishing eligibility and financial actions retain their existing behaviour.

## Audit and hierarchy

The previous interface mixed small utility text, pills and varying card styles, used saturated navigation as the dominant focus, and flattened administrative links. Shared `src/styles/design-system.css` now owns the visual tokens and cross-page treatments, imported after existing compatibility styles. Page-specific components still own functional layouts.

| Area | Information and visual hierarchy |
| --- | --- |
| Public navigation | Neutral header; selected destination carries the brand colour. Compact accessible account icon on mobile. Footer groups exploration, help/community and policies. |
| Home/download | Product promise and download action first, supporting features and release details second. Responsive display headings and restrained surfaces. |
| Plugin/theme stores | Existing separate destinations; title/search, category controls, resource cards and ownership/detail actions retain their order. |
| Pricing/results | Clear plan name, price/cycle and primary action; aligned card actions. Existing current-plan rules, payment state and actual-currency reporting remain intact. |
| Account/publishing | Existing grouped account navigation; consistent surface, avatar, profile rows, summaries and readable control sizes. |
| Login/register/device | One semantic page h1; existing sign-in/consent states; readable form controls and a constrained device-code input. |
| Documentation/legal/contact | Clear title, content groups and readable article measure. No legal document content or hashes changed. |
| Administration | Operations/support; accounts/eligibility; content/transactions; diagnostics/audit. Mobile optgroups expose all destinations without horizontal scrolling. Overview statistics, work queue, tables and forms share the same visual system. |

## Colour and interaction

Light: white surfaces on cool blue neutrals, dark blue-grey text and `#007b9e` accent. Dark: layered blue-grey surfaces, cool off-white text and `#39c9ec` accent. Semantic error/warning/success tokens remain distinct. The design uses 4/8px spacing increments, 16px cards, 10px controls, restrained shadows and visible keyboard focus. Motion honours reduced-motion preferences.

Automated tests verify AA 4.5:1 minimum for primary/muted text, primary actions and error/warning text against their semantic backgrounds. This is a token-level check, not a claim of a complete accessibility certification.

## Validation

- 96 repository tests, Vue type checking and production build passed.
- Public and management Worker dry-runs passed.
- Local Playwright checked 47 routes/account sections across four profiles: 1440px/light/Chinese, 1440px/dark/English, 375px/light/English, 375px/dark/Chinese (188 visits). Final sweep found no viewport overflow or page script errors. It uses local fixtures and unavailable-service states, not real production administrative data.
- Separately checked anonymous login/register forms in both themes, default unchecked consent, single primary heading, and annual/monthly plan toggles.
- Visual review of home, pricing, account, management, login and mobile screenshots corrected a dark avatar contrast clash, mobile header wrapping, device-input overflow and an English management heading overflow.
- Shared design/main-entry changes now target both public and management deployments; a regression test protects that routing.

Publication still requires the normal CI/deployment outcome and public version readback; local verification alone does not establish a production deployment.

## NexaMC brand asset — 2026-10-28

The user-supplied source is preserved verbatim as `public/icons/nexamc-source.png` from https://avatars.githubusercontent.com/u/304438575?s=400&u=7754fb7a6a14a180d37817b013bd8f77804212b9&v=4. Browser, navigation and home-screen assets are format/size derivatives of this source, with no redraw or colour changes. Light and dark themes use the same artwork. New `nexamc-*` paths avoid stale browser caches; prior `nexacl-*` PNG paths and `pcln.png` retain compatible aliases containing the new artwork. Shared icon changes deploy both public and management Workers.

## Console dashboard rollback

Management and `/publisher/*` routes retain the dashboard geometry from before
`ba6f860`: compact headings/cards, original content width, and single-level
management navigation in its original order. New security and finance destinations
remain beside store review. `App.vue` scopes this exception with
`console-dashboard`; navigating back to public pages restores the public design.
The shared NexaMC logo and cyan tokens remain current. Publisher project categories,
trusted Sidecar permissions, and session restoration are not rolled back.
