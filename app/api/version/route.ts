/**
 * Version API Route
 *
 * Returns the current application version information.
 * Used by clients to check if a new version is available.
 */

import {
  getAppVersion,
  getBuildTimestamp,
  getCommitHash,
} from "@/lib/utils/app-version";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const versionInfo = {
      version: getAppVersion(),
      buildTimestamp: getBuildTimestamp(),
      commitHash: getCommitHash(),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(versionInfo, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("[Version API] Error fetching version:", error);
    return NextResponse.json(
      { error: "Failed to fetch version" },
      { status: 500 }
    );
  }
}
