import assert from "node:assert/strict";
import test from "node:test";
import { createPasswordResetToken, getLocalDevelopmentOrigin, hashPasswordResetToken, isPasswordResetTokenExpired, isValidPasswordResetToken, passwordResetEmailConfig } from "./password-reset";

test("password reset tokens are random, fixed-length, and stored as hashes", () => {
  const first = createPasswordResetToken();
  const second = createPasswordResetToken();

  assert.match(first.token, /^[a-f0-9]{64}$/);
  assert.notEqual(first.token, second.token);
  assert.notEqual(first.token, first.tokenHash);
  assert.equal(first.tokenHash, hashPasswordResetToken(first.token));
  assert.equal(isValidPasswordResetToken(first.token), true);
  assert.equal(isValidPasswordResetToken("short-token"), false);
});

test("password reset tokens expire at their exact expiry time", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");

  assert.equal(isPasswordResetTokenExpired(new Date(now.getTime() - 1), now), true);
  assert.equal(isPasswordResetTokenExpired(now, now), true);
  assert.equal(isPasswordResetTokenExpired(new Date(now.getTime() + 1), now), false);
});

test("password reset email requires a provider and a secure production app URL", () => {
  assert.equal(passwordResetEmailConfig({ NODE_ENV: "development" }), null);
  assert.equal(passwordResetEmailConfig({ NODE_ENV: "production", RESEND_API_KEY: "key", EMAIL_FROM: "Socia <noreply@example.com>", APP_URL: "http://socia.example.com" }), null);
  assert.deepEqual(passwordResetEmailConfig({ NODE_ENV: "production", RESEND_API_KEY: "key", EMAIL_FROM: "Socia <noreply@example.com>", APP_URL: "https://socia.example.com/" }), {
    apiKey: "key",
    from: "Socia <noreply@example.com>",
    appUrl: "https://socia.example.com",
  });
});

test("local reset links are limited to non-production loopback requests", () => {
  assert.equal(getLocalDevelopmentOrigin("http://localhost:3000/api/auth/forgot-password", "development"), "http://localhost:3000");
  assert.equal(getLocalDevelopmentOrigin("http://127.0.0.1:3000/api/auth/forgot-password", "test"), "http://127.0.0.1:3000");
  assert.equal(getLocalDevelopmentOrigin("http://localhost:3000/api/auth/forgot-password", "production"), null);
  assert.equal(getLocalDevelopmentOrigin("https://socia.example.com/api/auth/forgot-password", "development"), null);
});
