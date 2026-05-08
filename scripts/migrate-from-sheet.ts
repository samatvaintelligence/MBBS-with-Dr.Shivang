/**
 * One-time migration: Google Sheet CSV → Postgres (Supabase) database.
 *
 * Usage:
 *   1. Export the "Leads" sheet as CSV
 *   2. Place it at scripts/leads-export.csv
 *   3. Run: npx tsx scripts/migrate-from-sheet.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import * as schema from "../lib/schema";
import { recomputeLead } from "../lib/lead-engine";

const CSV_PATH = path.join(__dirname, "leads-export.csv");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client, { schema });
  const now = new Date();

  // Read and parse CSV
  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(csvContent);

  if (rows.length === 0) {
    console.log("No data rows found in CSV.");
    await client.end();
    return;
  }

  console.log(`Found ${rows.length} leads to migrate.`);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    const fullName = row["Full Name"]?.trim();
    const phone = row["Phone"]?.trim();

    if (!fullName || !phone) {
      console.log(`  Skipping row: missing name or phone`);
      skipped++;
      continue;
    }

    const createdAtStr = row["Submitted At"]?.trim() || now.toISOString();
    const createdAt = new Date(createdAtStr);

    // Recompute all derived fields
    const leadData = {
      fullName,
      phone,
      leadStatus: row["Lead Status"] || "new",
      neetScore: row["NEET Score"] || null,
      dropYears: row["Drop Years"] || null,
      budget: row["Budget"] || null,
      targetIntake: row["Target Intake"] || null,
      parentCallTime: row["Parent Call Time"] || null,
      notes: row["Notes"] || null,
      finalOutcome: row["Final Outcome"] || null,
      createdAt: createdAtStr,
    };

    const computed = recomputeLead(leadData, now);

    try {
      // Insert lead — Postgres generates UUID automatically
      const [newLead] = await db.insert(schema.leads).values({
        createdAt,
        updatedAt: now,
        fullName,
        phone,
        consentToContact: row["Consent To Contact"]?.toLowerCase() !== "no",
        leadStatus: row["Lead Status"] || "new",
        qualifierScore: computed.qualifierScore,
        qualifierTier: computed.qualifierTier,
        mainObjection: computed.mainObjection,
        recommendedNextAction: computed.recommendedNextAction,
        followUpStage: computed.followUpStage,
        nextFollowUpDue: computed.nextFollowUpDue ? new Date(computed.nextFollowUpDue) : null,
        followUpMessage: computed.followUpMessage,
        whatsappFollowUpLink: computed.whatsappFollowUpLink,
        lastContactedAt: row["Last Contacted At"] ? new Date(row["Last Contacted At"]) : null,
        followUpAttempts: parseInt(row["Follow-up Attempts"] || "0", 10) || 0,
        parentCallTime: row["Parent Call Time"] || null,
        neetScore: row["NEET Score"] || null,
        dropYears: row["Drop Years"] || null,
        budget: row["Budget"] || null,
        targetIntake: row["Target Intake"] || null,
        notes: row["Notes"] || null,
        aiSummary: row["AI Summary"] || null,
        finalOutcome: row["Final Outcome"] || null,
        lostReason: row["Lost Reason"] || null,
        optimizationEvent: computed.optimizationEvent,
        outcomeUpdatedAt: computed.outcomeUpdatedAt ? new Date(computed.outcomeUpdatedAt) : null,
      }).returning({ id: schema.leads.id });

      const leadId = newLead.id;

      // Insert attribution — Postgres generates UUID automatically
      await db.insert(schema.leadAttribution).values({
        leadId,
        landingPage: row["Landing Page"] || null,
        referrer: row["Referrer"] || null,
        utmSource: row["UTM Source"] || null,
        utmMedium: row["UTM Medium"] || null,
        utmCampaign: row["UTM Campaign"] || null,
        utmContent: row["UTM Content"] || null,
        utmTerm: row["UTM Term"] || null,
        campaignId: row["Campaign ID"] || null,
        adsetId: row["Adset ID"] || null,
        adId: row["Ad ID"] || null,
        placement: row["Placement"] || null,
        fbClickId: row["FB Click ID"] || null,
      });

      // Log migration — Postgres generates UUID and timestamp automatically
      await db.insert(schema.leadActivityLog).values({
        leadId,
        fieldChanged: "lead_migrated",
        oldValue: null,
        newValue: `Migrated from Google Sheet: ${fullName}`,
        changedBy: "migration",
      });

      migrated++;
      console.log(`  ✓ ${fullName} (${phone}) — score: ${computed.qualifierScore}, tier: ${computed.qualifierTier}`);
    } catch (err) {
      console.error(`  ✗ Failed to migrate ${fullName}:`, err);
      skipped++;
    }
  }

  console.log(`\nDone! Migrated: ${migrated}, Skipped: ${skipped}`);
  await client.end();
}

/** Simple CSV parser that handles quoted fields */
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = (values[index] || "").trim();
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

main().catch(console.error);
