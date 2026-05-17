"use client";
import React, { useEffect, useRef, useState,useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  PlusIcon,
  FileIcon,
  AlertIcon,
  EnvelopeIcon,
  BoxIconLine,
  InfoIcon,
} from "../icons/index";

import { useAuth } from "../context/AuthContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  permission?: string;
  roles?: string[];
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; permission?: string; roles?: string[] }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Panel",
    path: "/",
  },
  {
    icon: <ListIcon />,
    name: "Elanlar",
    path: "/ads",
    permission: "Ads_View",
  },
  {
    icon: <UserCircleIcon />,
    name: "İstifadəçilər",
    path: "/users",
    permission: "Users_View",
  },
  {
    icon: <AlertIcon />,
    name: "Şikayətlər",
    path: "/reports",
    permission: "Reports_View",
  },
  {
    icon: <FileIcon />,
    name: "Bannerlər",
    path: "/banners",
    permission: "Banners_Manage",
  },
  {
    icon: <EnvelopeIcon />,
    name: "Reklam Müraciətləri",
    path: "/ad-applications",
    permission: "Banners_Manage",
  },
  {
    icon: <BoxCubeIcon />,
    name: "Mağaza Sorğuları",
    path: "/store-requests",
    permission: "Stores_Manage",
  },
  {
    icon: <PieChartIcon />,
    name: "Balans Sorğuları",
    path: "/balance-requests",
    permission: "Users_Balance_Increase",
  },
  {
    icon: <BoxIconLine />,
    name: "Kateqoriyalar",
    path: "/categories",
    permission: "Categories_Manage",
  },
];

const othersItems: NavItem[] = [
  {
    icon: <BoxIconLine />,
    name: "Biznes Paketləri",
    path: "/business-packages",
    roles: ["SuperAdmin", "Admin"],
  },
  {
    icon: <InfoIcon />,
    name: "Yardım / Səhifələr",
    path: "/help",
    roles: ["SuperAdmin", "Admin"],
  },
  {
    icon: <PlugInIcon />,
    name: "Tənzimləmələr",
    roles: ["SuperAdmin", "Admin"],
    subItems: [
      { name: "Marka / Modellər", path: "/seed-data" },
      { name: "Ödəniş Rekvizitləri", path: "/payment-details" },
      { name: "Şirkət Məlumatları", path: "/company-settings" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const { hasPermission, hasRole } = useAuth();
  const pathname = usePathname();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => {
    const filteredItems = navItems.filter((nav) => {
      if (nav.permission && !hasPermission(nav.permission)) return false;
      if (nav.roles && !nav.roles.some((role) => hasRole(role))) return false;
      return true;
    });

    return (
      <ul className="flex flex-col gap-4">
        {filteredItems.map((nav, index) => {
          const filteredSubItems = nav.subItems?.filter((sub) => {
            if (sub.permission && !hasPermission(sub.permission)) return false;
            if (sub.roles && !sub.roles.some((role) => hasRole(role))) return false;
            return true;
          });

          return (
            <li key={nav.name}>
              {filteredSubItems && filteredSubItems.length > 0 ? (
                <button
                  onClick={() => handleSubmenuToggle(index, menuType)}
                  className={`menu-item group  ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  } cursor-pointer ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "lg:justify-start"
                  }`}
                >
                  <span
                    className={` ${
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className={`menu-item-text`}>{nav.name}</span>
                  )}
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                        openSubmenu?.type === menuType &&
                        openSubmenu?.index === index
                          ? "rotate-180 text-brand-500"
                          : ""
                      }`}
                    />
                  )}
                </button>
              ) : (
                nav.path && (
                  <Link
                    href={nav.path}
                    className={`menu-item group ${
                      isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                    }`}
                  >
                    <span
                      className={`${
                        isActive(nav.path)
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                      }`}
                    >
                      {nav.icon}
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className={`menu-item-text`}>{nav.name}</span>
                    )}
                  </Link>
                )
              )}
              {filteredSubItems && filteredSubItems.length > 0 && (isExpanded || isHovered || isMobileOpen) && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[`${menuType}-${index}`] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height:
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                        ? `${subMenuHeight[`${menuType}-${index}`]}px`
                        : "0px",
                  }}
                >
                  <ul className="mt-2 space-y-1 ml-9">
                    {filteredSubItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          href={subItem.path}
                          className={`menu-dropdown-item ${
                            isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge `}
                              >
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge `}
                              >
                                pro
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
   const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname,isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed flex flex-col top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-999999 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex items-center justify-between ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">
                2el<span className="text-brand-500">.az</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 uppercase tracking-widest mt-1">
                Admin
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span className="text-2xl font-black tracking-tighter text-brand-500 uppercase">
                2EL
              </span>
            </div>
          )}
        </Link>

        {isMobileOpen && (
          <button
            onClick={toggleMobileSidebar}
            className="p-2 text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menyu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Digər"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>

      </div>
    </aside>
  );
};

export default AppSidebar;
