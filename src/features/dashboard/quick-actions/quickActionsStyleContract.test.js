import fs from 'fs';
import path from 'path';

const dashboardCss = fs.readFileSync(path.join(__dirname, '..', 'styles', 'dashboard.css'), 'utf8');
const quickActionsSource = fs.readFileSync(path.join(__dirname, 'QuickActionsMenu.jsx'), 'utf8');
const quickActionDialogsSource = fs.readFileSync(path.join(__dirname, 'QuickActionDialogs.jsx'), 'utf8');
const mobileHeaderSource = fs.readFileSync(path.join(__dirname, '..', 'layout', 'MobileDashboardHeader.jsx'), 'utf8');

test('popover uses the shared layer token and logical viewport-safe positioning', () => {
  const menuRule = dashboardCss.match(/\.dash-quick-actions__menu\s*\{[\s\S]*?\}/)?.[0] || '';
  expect(menuRule).toContain('z-index: var(--z-popover)');
  expect(menuRule).toContain('inset-inline-end: 0');
  expect(menuRule).toContain('100vw');
  expect(menuRule).not.toMatch(/(?:^|[;\s])(left|right|margin-left|margin-right)\s*:/);
});

test('launcher reuses the canonical inward-press dash button contract', () => {
  expect(quickActionsSource).toContain('dash-btn dash-btn--primary dash-quick-actions__trigger');
  expect(dashboardCss).toContain('.dash-btn:hover');
  expect(dashboardCss).toContain('transform: var(--press-sm-hover)');
  expect(dashboardCss).toContain('.dash-btn:active');
  expect(dashboardCss).toContain('transform: var(--press-sm-active)');
});

test('uses Material Symbols and keeps one direction-neutral menu markup path', () => {
  expect(quickActionsSource).toContain('material-symbols-outlined');
  expect(quickActionsSource).not.toContain('bi bi-');
  expect(quickActionsSource).not.toMatch(/dir\s*===|isRtl/);
});

test('mobile header contains neither AccountMenu nor a duplicate Add Member shortcut', () => {
  expect(mobileHeaderSource).not.toContain('AccountMenu');
  expect(mobileHeaderSource).not.toContain('dashboard.addMember');
  expect(mobileHeaderSource).toContain('<QuickActionsMenu');
});

test('quick actions reuse the canonical portaled dialogs and modal layer tokens', () => {
  expect(quickActionDialogsSource).toContain("import('../../expenses/components/NewExpenseDialog')");
  expect(quickActionDialogsSource).toContain("import('../../governance/components/InviteMemberDialog')");
  expect(quickActionDialogsSource).toContain("import('../../funds/components/FundingRoundComposer')");
  expect(quickActionDialogsSource).toContain("import('../../settlements/components/SettlementActionDialog')");
  expect(quickActionDialogsSource).toContain("import('../../support/components/SupportTicketDialog')");
  expect(quickActionDialogsSource).toContain('<ModalPortal>');
  expect(dashboardCss).toContain('z-index: var(--z-modal-backdrop)');
});

test('complete launcher is grouped and mobile popover remains viewport-contained', () => {
  expect(quickActionsSource).toContain("id: 'create'");
  expect(quickActionsSource).toContain("id: 'help'");
  expect(quickActionsSource).toContain("id: 'account'");
  expect(quickActionsSource).toContain("type: 'settlement'");
  expect(quickActionsSource).toContain("type: 'support'");
  expect(quickActionsSource).toContain("type: 'account'");
  expect(dashboardCss).toContain('inset-inline: var(--page-margin-mobile)');
  expect(dashboardCss).toContain('max-block-size: calc(100dvh');
});
