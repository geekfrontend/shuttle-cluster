"use client";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { useLogout } from "@/features/auth/hooks/use-logout";

/** Aksi UI "Log out": panggil API lalu kembali ke halaman login. Dipakai di menu akun dan sidebar. */
export function useSignOut() {
  const router = useRouter();
  const logout = useLogout();

  function signOut() {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.replace("/login");
        router.refresh();
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return { signOut, pending: logout.isPending };
}
