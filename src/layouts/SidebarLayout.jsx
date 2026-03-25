import { Link, useLocation } from "react-router";

import { useSidebar } from "@/context/SidebarContext";
import { MetricsIcon, UsersIcon, RoadmapIcon, ModuleIcon, ClipboardIcon, FileIcon, BookIcon, LayoutIcon, StudentIcon, SchoolIcon, VideoIcon } from "@/components/icons";
import Alert from "@/components/ui/alert/Alert";

const iconMap = {
  MetricsIcon: <MetricsIcon />,
  RoadmapIcon: <RoadmapIcon />,
  ModuleIcon: <ModuleIcon />,
  UsersIcon: <UsersIcon />,
  ClipboardIcon: <ClipboardIcon />,
  FileIcon: <FileIcon />,
  BookIcon: <BookIcon />,
  LayoutIcon: <LayoutIcon />,
  StudentIcon: <StudentIcon />,
  SchoolIcon: <SchoolIcon />,
  VideoIcon: <VideoIcon />,
};

const SidebarLayout = () => {
  const { isExpanded, isMobileOpen, menuItems } = useSidebar();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const renderMenuItems = (items) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav) => (
        <li key={nav.id}>
          {(nav.url && (
            <Link
              to={nav.url}
              className={`menu-item group ${isActive(nav.url) ? "menu-item-active" : "menu-item-inactive"
                }`}
            >
              <span
                className={`menu-item-icon-size ${isActive(nav.url)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                  }`}
              >
                {iconMap[nav.icon] || ""}
              </span>
              {(isExpanded || isMobileOpen) && (
                <span className="menu-item-text">{nav.description}</span>
              )}
            </Link>
          )
          )}
        </li>
      ))}
    </ul>
  );

  if (!menuItems) return null;

  return (
    <>
      {menuItems.length === 0 && <Alert variant="warning" message="Sin opciones de menú." />}
      <aside
        className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
            ? "w-[290px]"
            : "w-[90px]"
          }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
        onMouseEnter={() => !isExpanded}
      >
        <div
          className={`py-8 flex ${!isExpanded ? "lg:justify-center" : "justify-start"
            }`}
        >
          <Link to="/" className="hidden lg:block">
            {isExpanded ? (
              <>
                <img
                  className="dark:hidden"
                  src="/images/logo/logo-light.svg"
                  alt="Logo"
                  width={150}
                  height={40}
                />
                <img
                  className="hidden dark:block"
                  src="/images/logo/logo-dark.svg"
                  alt="Logo"
                  width={150}
                  height={40}
                />
              </>
            ) : (
              <img
                src="/favicon.png"
                alt="Logo"
                width={32}
                height={32}
              />
            )}
          </Link>
        </div>
        <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
          <nav className="mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded
                      ? "lg:justify-center"
                      : "justify-start"
                    }`}
                >
                  Menu
                </h2>
                {renderMenuItems(menuItems)}
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default SidebarLayout;