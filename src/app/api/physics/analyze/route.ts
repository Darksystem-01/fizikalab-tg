import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  computeLinearRegression,
  computeStatistics,
  studentsTPrime,
} from "@/lib/physics/metrology";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Autentifikatsiya talab qilinadi" }, { status: 401 });
  }

  const body = (await req.json()) as {
    values?: number[];
    points?: { x: number; y: number }[];
    compareWith?: { mean: number; stdError: number };
  };

  const values = Array.isArray(body.values) ? body.values : [];
  const stats = computeStatistics(values);
  const regression =
    Array.isArray(body.points) && body.points.length >= 2
      ? computeLinearRegression(body.points)
      : null;

  const tTest = body.compareWith
    ? studentsTPrime(
        stats.mean,
        stats.stdError,
        body.compareWith.mean,
        body.compareWith.stdError
      )
    : null;

  return NextResponse.json({ stats, regression, tTest });
}
