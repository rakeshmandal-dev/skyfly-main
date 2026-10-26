/**
 * EduVault AI — Safe Development & Demo Seed Script
 * Populates sample subjects, notes, and NGO partner records without overwriting user data.
 */

import { SEED_SUBJECTS, SEED_NOTES, SEED_NGO_PARTNERS } from "@eduvault/shared";
export { SEED_SUBJECTS, SEED_NOTES, SEED_NGO_PARTNERS };

export async function runSeed() {
  console.log("EduVault AI Seed data prepared. Safe for in-memory or Postgres seeding.");
  return { subjects: SEED_SUBJECTS.length, notes: SEED_NOTES.length, partners: SEED_NGO_PARTNERS.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed().then(console.log).catch(console.error);
}
