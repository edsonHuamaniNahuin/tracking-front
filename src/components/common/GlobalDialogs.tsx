// src/components/common/GlobalDialogs.tsx
import React from "react";
import { useUI } from "@/context/UIContext";
import useAuth     from "@/hooks/useAuth";
import { LogoutConfirmDialog } from "./LogoutConfirmDialog";

export function GlobalDialogs() {
  const { activeDialog, closeDialog } = useUI();
  const { logout }                    = useAuth();

  return (
    <>
      {activeDialog === "logoutConfirm" && (
        <LogoutConfirmDialog
          open={true} 
          onClose={closeDialog}
          onConfirm={() => {
            logout();
          }}
        />
      )}
    </>
  );
}
