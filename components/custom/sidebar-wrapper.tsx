import { getBranchesForSidebar } from "@/lib/actions/sidebar-actions";
import MobileTopBar from "./mobile-top-bar";
import SidebarClient from "./sidebar";
import SidebarMobile from "./sidebar-mobile";

export default async function Sidebar() {
  const branches = await getBranchesForSidebar();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SidebarClient branches={branches} />
      </div>

      {/* Mobile Navigation */}
      <div className="block md:hidden">
        <MobileTopBar />
        <SidebarMobile branches={branches} />
      </div>
    </>
  );
}
