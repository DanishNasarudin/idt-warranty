import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  FileText,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const navigationCards = [
    {
      title: "Dashboard",
      description: "View warranty cases and manage your workflow",
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Warranty Cases",
      description: "Create and manage warranty cases",
      icon: FileText,
      href: "/dashboard",
      color: "text-green-600 dark:text-green-400",
    },
    // {
    //   title: "Branch Management",
    //   description: "View and manage branch information",
    //   icon: Building2,
    //   href: "/branch",
    //   color: "text-purple-600 dark:text-purple-400",
    // },
    {
      title: "Settings",
      description: "Configure branches, staff, and system settings",
      icon: Settings,
      href: "/settings",
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Warranty Management System
        </h1>
        <p className="text-muted-foreground">
          Welcome to Ideal Tech PC Warranty Management.
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {navigationCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg bg-muted ${card.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <CardTitle className="mt-4">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Guide Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle>Onboarding New Branch Guide</CardTitle>
          </div>
          <CardDescription>
            Follow these steps to successfully onboard a new branch to the
            system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                1
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold">Create Branch</h3>
                <p className="text-sm text-muted-foreground">
                  Navigate to{" "}
                  <Link
                    href="/settings"
                    className="text-blue-600 hover:underline"
                  >
                    Settings
                  </Link>{" "}
                  → Branches tab. Click "Add Branch" and provide:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                  <li>
                    <strong>Branch Code:</strong> Unique identifier (max 16
                    chars, e.g., "AP", "JB", "S2")
                  </li>
                  <li>
                    <strong>Branch Name:</strong> Full name (max 64 chars)
                  </li>
                  <li>
                    <strong>Address:</strong> Physical location (optional)
                  </li>
                  <li>
                    <strong>Office Phone:</strong> Contact number (optional)
                  </li>
                  <li>
                    <strong>WhatsApp Phone:</strong> WhatsApp contact (optional)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                2
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold">Configure Scope</h3>
                <p className="text-sm text-muted-foreground">
                  Ensure case scopes are configured in the database. Default
                  scopes:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                  <li>
                    <strong>LOCAL:</strong> For cases handled within the branch
                  </li>
                  <li>
                    <strong>OTHER:</strong> For cases from other branches
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <em>
                    Note: Scopes are typically pre-configured during initial
                    setup.
                  </em>
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                3
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold">Add Staff Members</h3>
                <p className="text-sm text-muted-foreground">
                  Go to{" "}
                  <Link
                    href="/settings"
                    className="text-blue-600 hover:underline"
                  >
                    Settings
                  </Link>{" "}
                  → Staff tab. Click "Add Staff" and provide:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                  <li>
                    <strong>Staff Name:</strong> Full name of the staff member
                  </li>
                  <li>
                    <strong>Color Badge:</strong> Select a color for visual
                    identification (20 colors available)
                  </li>
                  <li>
                    <strong>Branch Assignment:</strong> Check the boxes for all
                    branches this staff member will work with
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <em>
                    Tip: Staff can be assigned to multiple branches for
                    flexibility.
                  </em>
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                4
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold">Assign Staff Roles</h3>
                <p className="text-sm text-muted-foreground">
                  Staff can be assigned to different roles in warranty cases:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                  <li>
                    <strong>Received By:</strong> Staff who receives/registers
                    the warranty case
                  </li>
                  <li>
                    <strong>Serviced By:</strong> Staff who performs the service
                    work
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <em>
                    Note: These roles are assigned when creating/editing
                    warranty cases.
                  </em>
                </p>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                5
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold">Verify Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm the branch is ready:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                  <li>Branch appears in the sidebar navigation</li>
                  <li>
                    Staff members are visible in staff selection dropdowns
                  </li>
                  <li>
                    Branch can be selected when creating new warranty cases
                  </li>
                  <li>
                    Test creating a warranty case to ensure proper service
                    number generation
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
              Additional Information
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • <strong>Service Numbers:</strong> Auto-generated based on
                branch code, year, month, and sequence
              </li>
              <li>
                • <strong>Case Transfer:</strong> Cases can be transferred
                between branches if needed
              </li>
              <li>
                • <strong>Branch Deletion:</strong> Branches with existing cases
                or staff cannot be deleted
              </li>
              <li>
                • <strong>Real-time Updates:</strong> All changes sync
                automatically across users
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="flex gap-3 pt-4">
            <Button asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Go to Settings
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                View Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
