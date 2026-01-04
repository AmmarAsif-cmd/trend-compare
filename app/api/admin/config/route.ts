import { NextResponse } from "next/server";
import { ADMIN_ROUTES } from "@/lib/admin-config";

/**
 * API endpoint to get admin configuration
 * This allows client components to access the admin path without exposing env vars
 */
export async function GET() {
  return NextResponse.json({
    adminPath: process.env.ADMIN_PATH || 'cp-9a4eef7',
    routes: {
      login: ADMIN_ROUTES.login,
      blog: ADMIN_ROUTES.blog,
      keywords: ADMIN_ROUTES.keywords,
      system: ADMIN_ROUTES.system,
      users: ADMIN_ROUTES.users,
      dashboard: ADMIN_ROUTES.dashboard,
      api: ADMIN_ROUTES.api,
    },
  });
}

