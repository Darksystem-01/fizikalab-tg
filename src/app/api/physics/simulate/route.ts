import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { simulateDynamics, type DynamicsInput } from "@/lib/physics/dynamics";
import {
  simulateElectromagnetism,
  type EmInput,
} from "@/lib/physics/electromagnetism";
import { simulateKinematics, type KinematicsInput } from "@/lib/physics/kinematics";
import { simulateMetrology, type VernierInput } from "@/lib/physics/metrology";
import { simulateOptics, type OpticsInput } from "@/lib/physics/optics";
import { simulateStatics, type StaticsInput } from "@/lib/physics/statics";
import {
  simulateThermodynamics,
  type ThermodynamicsInput,
} from "@/lib/physics/thermodynamics";
import { simulateAtomic, type AtomicInput } from "@/lib/physics/atomic";

export type LabKey =
  | "metrology"
  | "kinematics"
  | "dynamics"
  | "statics"
  | "electromagnetism"
  | "optics"
  | "thermodynamics"
  | "atomic";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Tajribani hisoblash uchun tizimga kiring." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      labKey: LabKey;
      params: Record<string, unknown>;
      saveRun?: boolean;
      measurements?: unknown[];
    };

    let result: unknown;
    switch (body.labKey) {
      case "metrology":
        result = simulateMetrology(body.params as unknown as VernierInput);
        break;
      case "kinematics":
        result = simulateKinematics(body.params as unknown as KinematicsInput);
        break;
      case "dynamics":
        result = simulateDynamics(body.params as unknown as DynamicsInput);
        break;
      case "statics":
        result = simulateStatics(body.params as unknown as StaticsInput);
        break;
      case "electromagnetism":
        result = simulateElectromagnetism(body.params as unknown as EmInput);
        break;
      case "optics":
        result = simulateOptics(body.params as unknown as OpticsInput);
        break;
      case "thermodynamics":
        result = simulateThermodynamics(
          body.params as unknown as ThermodynamicsInput
        );
        break;
      case "atomic":
        result = simulateAtomic(body.params as unknown as AtomicInput);
        break;
      default:
        return NextResponse.json(
          { error: `Noma'lum laboratoriya kaliti: ${String(body.labKey)}` },
          { status: 400 }
        );
    }

    let runId: number | null = null;
    if (body.saveRun) {
      const db = await getDb();
      const inserted = await db.execute(
        `INSERT INTO experiment_runs (user_id, lab_key, params_json, results_json, measurements_json, created_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          user.userId,
          body.labKey,
          JSON.stringify(body.params),
          JSON.stringify(result),
          JSON.stringify(body.measurements ?? []),
          new Date().toISOString(),
        ]
      );
      runId = inserted.lastInsertId ?? null;
    }

    return NextResponse.json({
      labKey: body.labKey,
      computedAt: new Date().toISOString(),
      runId,
      result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Hisoblash xatosi" },
      { status: 500 }
    );
  }
}
