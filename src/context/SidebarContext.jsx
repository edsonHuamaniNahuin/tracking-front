import { createContext, useContext, useState, useEffect } from "react";
import { getUserMenu } from "@/services/menuService";

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [menuItems, setMenuItems] = useState(null);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleResize = () => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (!mobile) {
      setIsMobileOpen(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const response = await getUserMenu();
      if (response.success) {
        setMenuItems(response.data);
      } else {
        setMenuItems([]);
      }
    } catch (err) {
      setMenuItems([]);
    }
  };

  const toggleSidebar = () => {
    setIsExpanded((prev) => !prev);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const toggleSubmenu = (item) => {
    setOpenSubmenu((prev) => (prev === item ? null : item));
  };

  return (
    <SidebarContext.Provider
      value={{
        isExpanded: isMobile ? false : isExpanded,
        isMobileOpen,
        activeItem,
        openSubmenu,
        toggleSidebar,
        toggleMobileSidebar,
        setActiveItem,
        toggleSubmenu,
        menuItems,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
