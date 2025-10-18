import { getBranchesForSidebar } from "@/lib/actions/sidebar-actions";
import SidebarClient from "./sidebar";

export default async function Sidebar() {
  const branches = await getBranchesForSidebar();

  return <SidebarClient branches={branches} />;
}
