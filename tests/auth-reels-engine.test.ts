import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Test Crypto & Password helpers
import {
  hashPhoneHmac,
  hashOtpHmac,
  encryptPii,
  decryptPii,
  safeCompare,
  maskPhoneNumber,
} from "../src/lib/crypto";
import {
  validatePasswordPolicy,
  hashPasswordArgon2,
  verifyPasswordArgon2,
} from "../src/lib/auth/password";
import { validateAndFormatPhone } from "../src/lib/auth/phone";

describe("Stage 2: FizikaLab Reels Auth & Security Engine", () => {
  test("Phone normalization strictly adheres to Uzbekistan E.164 (+998XXXXXXXXX)", () => {
    // Valid numbers
    const res1 = validateAndFormatPhone("+998 90 123 45 67");
    assert.equal(res1.valid, true);
    assert.equal(res1.e164, "+998901234567");

    const res2 = validateAndFormatPhone("998949876543");
    assert.equal(res2.valid, true);
    assert.equal(res2.e164, "+998949876543");

    // Invalid numbers
    const resInvalid = validateAndFormatPhone("12345");
    assert.equal(resInvalid.valid, false);

    // Foreign numbers should be rejected by default
    const resForeign = validateAndFormatPhone("+1 555 123 4567");
    assert.equal(resForeign.valid, false);
  });

  test("Password policy enforces OWASP complexity, length and blocks common passwords", () => {
    // Weak: too short
    const resShort = validatePasswordPolicy("Abc1!");
    assert.equal(resShort.valid, false);

    // Weak: missing special character
    const resNoSpecial = validatePasswordPolicy("Password123");
    assert.equal(resNoSpecial.valid, false);

    // Weak: common blacklisted password
    const resCommon = validatePasswordPolicy("qwerty123");
    assert.equal(resCommon.valid, false);

    // Weak: contains nickname
    const resNick = validatePasswordPolicy("StrongPass1!salim", { nickname: "salim" });
    assert.equal(resNick.valid, false);

    // Strong & Valid
    const resStrong = validatePasswordPolicy("FizikaLab#2026Secure!");
    assert.equal(resStrong.valid, true);
  });

  test("Argon2id password hashing and verification conforms to OWASP parameters", async () => {
    const rawPass = "Kvant#Fizika2026!";
    const hashed = await hashPasswordArgon2(rawPass);

    assert.ok(hashed.startsWith("$argon2id$"));

    // Correct verification
    const isValid = await verifyPasswordArgon2(rawPass, hashed);
    assert.equal(isValid, true);

    // Wrong password verification
    const isInvalid = await verifyPasswordArgon2("WrongPass123!", hashed);
    assert.equal(isInvalid, false);
  });

  test("PII Encryption with AES-256-GCM and HMAC blind indexing", () => {
    const rawPhone = "+998901234567";

    // 1. Blind HMAC indexing is deterministic
    const hmac1 = hashPhoneHmac(rawPhone);
    const hmac2 = hashPhoneHmac("+998 90 123 45 67");
    assert.equal(hmac1, hmac2);
    assert.ok(hmac1.length === 64);

    // 2. AES-256-GCM encryption has randomized IV
    const enc1 = encryptPii(rawPhone);
    const enc2 = encryptPii(rawPhone);
    assert.notEqual(enc1, enc2);

    // 3. Decryption recovers exact plaintext
    const dec1 = decryptPii(enc1);
    const dec2 = decryptPii(enc2);
    assert.equal(dec1, rawPhone);
    assert.equal(dec2, rawPhone);

    // 4. Masking for student profile
    const masked = maskPhoneNumber(rawPhone);
    assert.equal(masked, "+998 ** *** ** 67");
  });

  test("OTP code HMAC hashing and timing-safe comparison", () => {
    const otp = "849201";
    const otpHmac = hashOtpHmac(otp);

    assert.equal(safeCompare(otpHmac, hashOtpHmac("849201")), true);
    assert.equal(safeCompare(otpHmac, hashOtpHmac("123456")), false);
  });
});
