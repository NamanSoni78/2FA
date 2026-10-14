/**
 * RFC 4226 (HOTP) + RFC 6238 (TOTP) conformance tests.
 * Run: bun scripts/test-totp.ts
 */
import {
  base32Decode,
  generateCode,
  normalizeSecret,
  parseOtpauthUri,
  buildOtpauthUri,
  splitCodeForDisplay,
} from "../src/lib/totp";

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function ascii(s: string): Uint8Array {
  return new Uint8Array([...s].map((c) => c.charCodeAt(0)));
}

let failures = 0;
function check(name: string, actual: string, expected: string) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  got=${actual} want=${expected}`);
}

async function main() {
  // --- base32 decode sanity: RFC secret "12345678901234567890" ---
  const secret20 = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  const decoded = base32Decode(secret20);
  check(
    "base32 decode roundtrip",
    new TextDecoder().decode(decoded),
    "12345678901234567890",
  );
  check("base32 encode roundtrip", base32Encode(ascii("12345678901234567890")), secret20);
  check("normalize strips spaces/dash/lower", normalizeSecret(" gezd gnbv-gy3t qojq gezdgnbvgy3tqojq "), secret20);

  const sha256Secret = base32Encode(ascii("12345678901234567890123456789012"));
  const sha512Secret = base32Encode(
    ascii("1234567890123456789012345678901234567890123456789012345678901234"),
  );

  // --- RFC 4226 HOTP vectors ---
  const hotpExpected = ["755224", "287082", "359152", "969429", "338314", "254676", "287922", "162583", "399871", "520489"];
  for (let i = 0; i < 10; i++) {
    const { code } = await generateCode(
      { secret: secret20, type: "hotp", counter: i, digits: 6 },
      0,
    );
    check(`RFC4226 HOTP counter=${i}`, code, hotpExpected[i]);
  }

  // --- RFC 6238 TOTP vectors (8 digits) ---
  const vectors: Array<[number, string, string, string]> = [
    [59, "94287082", "46119246", "90693936"],
    [1111111109, "07081804", "68084774", "25091201"],
    [1111111111, "14050471", "67062674", "99943326"],
    [1234567890, "89005924", "91819424", "93441116"],
    [2000000000, "69279037", "90698825", "38618901"],
  ];
  for (const [t, sha1, sha256, sha512] of vectors) {
    const ms = t * 1000;
    check(
      `RFC6238 SHA-1   T=${t}`,
      (await generateCode({ secret: secret20, algorithm: "SHA-1", digits: 8 }, ms)).code,
      sha1,
    );
    check(
      `RFC6238 SHA-256 T=${t}`,
      (await generateCode({ secret: sha256Secret, algorithm: "SHA-256", digits: 8 }, ms)).code,
      sha256,
    );
    check(
      `RFC6238 SHA-512 T=${t}`,
      (await generateCode({ secret: sha512Secret, algorithm: "SHA-512", digits: 8 }, ms)).code,
      sha512,
    );
  }

  // --- 6-digit TOTP at T=59 (SHA-1): 287082 ---
  check(
    "TOTP 6-digit T=59",
    (await generateCode({ secret: secret20 }, 59_000)).code,
    "287082",
  );

  // --- period=60: counter = floor(t/60). At t=119 -> counter 1 -> same as HOTP counter 1 (287082) ---
  check(
    "TOTP period=60 boundary",
    (await generateCode({ secret: secret20, period: 60 }, 119_000)).code,
    "287082",
  );

  // --- Steam encoding: deterministic output, 5 chars from alphabet ---
  const steam = await generateCode({ secret: secret20, encoding: "steam" }, 59_000);
  check(
    "Steam code shape",
    /^[23456789BCDFGHJKMNPQRTVWXY]{5}$/.test(steam.code) ? "ok" : "bad",
    "ok",
  );
  check(
    "Steam code deterministic",
    (await generateCode({ secret: secret20, encoding: "steam" }, 59_000)).code,
    steam.code,
  );

  // --- otpauth URI parse / build ---
  const parsed = parseOtpauthUri(
    "otpauth://totp/Cloud%20corp:alice@cloud?secret=gezd%20gnbvgy3tqojqgezdgnbvgy3tqojq&issuer=Cloud%20corp&algorithm=SHA256&digits=8&period=60",
  );
  check("parse label", parsed?.label ?? "null", "alice@cloud");
  check("parse issuer", parsed?.issuer ?? "null", "Cloud corp");
  check("parse secret", parsed?.secret ?? "null", secret20);
  check("parse algorithm", parsed?.algorithm ?? "null", "SHA-256");
  check("parse digits", String(parsed?.digits ?? -1), "8");
  check("parse period", String(parsed?.period ?? -1), "60");
  const hotpParsed = parseOtpauthUri("otpauth://hotp/example:bob?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&counter=5&digits=6");
  check("parse hotp type", hotpParsed?.type ?? "null", "hotp");
  check("parse hotp counter", String(hotpParsed?.counter ?? -1), "5");
  const steamParsed = parseOtpauthUri("otpauth://totp/Steam:bob?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=Steam");
  check("parse steam encoding", steamParsed?.encoding ?? "null", "steam");
  check("parse garbage", String(parseOtpauthUri("https://example.com")), "null");

  const built = buildOtpauthUri({
    label: "alice@cloud",
    issuer: "Cloud corp",
    secret: secret20,
    type: "totp",
    algorithm: "SHA-256",
    digits: 8,
    period: 60,
    counter: 0,
    encoding: "base32",
  });
  check(
    "build uri",
    built,
    "otpauth://totp/Cloud%20corp%3Aalice%40cloud?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=Cloud+corp&algorithm=SHA256&digits=8&period=60",
  );
  const roundTrip = parseOtpauthUri(built);
  check("uri roundtrip label", roundTrip?.label ?? "null", "alice@cloud");
  check("uri roundtrip algorithm", roundTrip?.algorithm ?? "null", "SHA-256");

  // --- display split ---
  check("split 6", splitCodeForDisplay("123456"), "123 456");
  check("split 8", splitCodeForDisplay("12345678"), "1234 5678");
  check("split 5", splitCodeForDisplay("K2WQZ"), "K2WQZ");

  console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
