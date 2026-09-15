import fs from 'fs';
import path from 'path';

const source = (relativePath) => fs.readFileSync(path.join(process.cwd(), 'src', relativePath), 'utf8');

test('normal authentication and invitation entry share the canonical OTP component', () => {
  const authPage = source('features/auth/pages/AuthPage.jsx');
  const invitationPage = source('pages/InvitationPage.jsx');
  expect(authPage).toMatch(/import OtpStep from ['"]\.\.\/components\/OtpStep['"]/);
  expect(invitationPage).toMatch(/import OtpStep from ['"]\.\.\/features\/auth\/components\/OtpStep['"]/);
  expect(invitationPage).not.toMatch(/className=["']otp-cells/);
});

test('the canonical OTP surface owns its styling and keeps codes LTR and one-time-code compatible', () => {
  const otpStep = source('features/auth/components/OtpStep.jsx');
  const otpInput = source('features/auth/components/OtpInput.jsx');
  expect(otpStep).toMatch(/import ['"]\.\.\/styles\/otp\.css['"]/);
  expect(otpInput).toMatch(/dir="ltr"/);
  expect(otpInput).toMatch(/one-time-code/);
  expect(otpInput).toMatch(/aria-invalid/);
});

test('approval waiting surface has no legacy shell, whole-page loader, or Bootstrap icon dependency', () => {
  const waitingPage = source('pages/JoinRequestPage.jsx');
  expect(waitingPage).not.toMatch(/legacy-shell|CardStyles|NeoLoading|className=["'][^"']*\bbi\b/);
  expect(waitingPage).toMatch(/join-request-card/);
  expect(waitingPage).toMatch(/aria-live="polite"/);
});

test('entry-flow styles use logical direction and a mobile containment breakpoint', () => {
  const otpCss = source('features/auth/styles/otp.css');
  const waitingCss = source('features/join/styles/joinRequest.css');
  expect(otpCss).toMatch(/inset-inline-start/);
  expect(waitingCss).toMatch(/margin-inline/);
  expect(waitingCss).toMatch(/@media \(max-width: 430px\)/);
  expect(waitingCss).not.toMatch(/margin-left|margin-right|padding-left|padding-right/);
});
