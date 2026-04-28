"use client"

import * as React from "react"
import {
  LayoutDashboardIcon,
  ShipIcon,
  BarChart2Icon,
  MapPinIcon,
  UserIcon,
  ArrowUpCircleIcon,
  SettingsIcon,
  HelpCircleIcon,
  ActivityIcon,
  CpuIcon,
  TruckIcon,
  ShieldIcon,
} from "lucide-react"

import { NavFlota } from "./nav-flota"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, hasPermission, hasRole } = useAuth()

  const userInfo = {
    name: user?.name ?? "Invitado",
    email: user?.email ?? "",
    avatar: user?.photoUrl ?? "/avatars/default.png"
  }

  // ── Items de navegación filtrados por rol/permiso ──────────────────────────
  const navItems = [
    {
      name: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
      show: true,
    },
    {
      name: "Unidades",
      url: "/vessels",
      icon: ShipIcon,
      show: hasPermission('view_vessels') || hasPermission('manage_vessels'),
    },
    {
      name: "Flotas",
      url: "/fleets",
      icon: TruckIcon,
      show: hasPermission('manage_fleets') || hasRole('Administrator') || hasRole('Manager'),
    },
    {
      name: "Gráficos",
      url: "/vessels/charts",
      icon: BarChart2Icon,
      show: hasPermission('view_reports') || hasPermission('view_vessels'),
    },
    {
      name: "Mapa de Tracking",
      url: "/tracking/map",
      icon: MapPinIcon,
      show: hasPermission('view_trackings') || hasPermission('manage_trackings'),
    },
    {
      name: "Telemetría en Vivo",
      url: "/telemetry",
      icon: ActivityIcon,
      show: hasPermission('view_trackings') || hasPermission('manage_trackings'),
    },
    {
      name: "Logs Dispositivo",
      url: "/device/logs",
      icon: CpuIcon,
      show: hasPermission('manage_trackings') || hasRole('Administrator') || hasRole('Manager'),
    },
    {
      name: "Roles y Permisos",
      url: "/roles",
      icon: ShieldIcon,
      show: hasPermission('manage_roles'),
    },
    {
      name: "Mi perfil",
      url: "/profile",
      icon: UserIcon,
      show: true,
    },
  ].filter(item => item.show)

  const navSecondary = [
    {
      title: "Configuración",
      url: "/settings",
      icon: SettingsIcon,
    },
    {
      title: "Ayuda",
      url: "#",
      icon: HelpCircleIcon,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/#/dashboard">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">TrackFleet</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavFlota items={navItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userInfo} />
      </SidebarFooter>
    </Sidebar>
  )
}
