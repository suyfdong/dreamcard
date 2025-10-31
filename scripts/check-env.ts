#!/usr/bin/env tsx

/**
 * Environment Variables Checker
 *
 * This script checks if all required environment variables are set.
 * Run: npx tsx scripts/check-env.ts
 */

const requiredEnvVars = [
  'OPENROUTER_API_KEY',
  'REPLICATE_API_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'DATABASE_URL',
];

interface CheckResult {
  name: string;
  exists: boolean;
  value?: string;
}

function checkEnvironmentVariables(): CheckResult[] {
  return requiredEnvVars.map((name) => {
    const value = process.env[name];
    const exists = !!value;

    return {
      name,
      exists,
      value: exists ? maskValue(value!) : undefined,
    };
  });
}

function maskValue(value: string): string {
  if (value.length <= 8) {
    return '***';
  }

  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}

function printResults(results: CheckResult[]): void {
  console.log('\n📋 Environment Variables Check\n');
  console.log('━'.repeat(60));

  results.forEach(({ name, exists, value }) => {
    const status = exists ? '✅' : '❌';
    const displayValue = exists ? value : 'NOT SET';

    console.log(`${status} ${name.padEnd(30)} ${displayValue}`);
  });

  console.log('━'.repeat(60));

  const missing = results.filter((r) => !r.exists);

  if (missing.length > 0) {
    console.log(`\n⚠️  Missing ${missing.length} environment variable(s):\n`);
    missing.forEach((r) => console.log(`   - ${r.name}`));
    console.log('\n💡 Copy .env.example to .env and fill in the values.');
    process.exit(1);
  } else {
    console.log('\n✨ All environment variables are set!\n');
    process.exit(0);
  }
}

// Run check
const results = checkEnvironmentVariables();
printResults(results);
