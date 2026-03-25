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

const data = {
  flota: [
    {
      name: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      name: "Embarcaciones",
      url: "/vessels",
      icon: ShipIcon,
    },
    {
      name: "Gráficos de flota",
      url: "/vessels/charts",
      icon: BarChart2Icon,
    },
    {
      name: "Mapa de Tracking",
      url: "/tracking/map",
      icon: MapPinIcon,
    },
    {
      name: "Telemetría en Vivo",
      url: "/telemetry",
      icon: ActivityIcon,
    },
    {
      name: "Logs Dispositivo",
      url: "/device/logs",
      icon: CpuIcon,
    },
    {
      name: "Mi perfil",
      url: "/profile",
      icon: UserIcon,
    },
  ],
  navSecondary: [
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const userInfo = {
    name: user?.name ?? "Invitado",
    email: user?.email ?? "",
    avatar: user?.photoUrl ?? "/avatars/default.png"
  }
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
                <span className="text-base font-semibold">Tracking Marítimo</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavFlota items={data.flota} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userInfo} />
      </SidebarFooter>
    </Sidebar>
  )
}
