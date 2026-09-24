"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DeleteProjectButtonProps = {
  projectId: string;
  projectTitle: string;
};

export default function DeleteProjectButton({
  projectId,
  projectTitle,
}: DeleteProjectButtonProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `ต้องการลบผลงาน "${projectTitle}" ใช่หรือไม่?\n\nการลบนี้ไม่สามารถย้อนกลับได้`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    const supabase = createClient();

    // ตรวจสอบ Login
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("ไม่พบผู้ใช้ กรุณา Login ใหม่");
      setDeleting(false);
      return;
    }

    // ตรวจสอบ Admin
    const { data: adminUser, error: adminError } =
      await supabase
        .from("admin_users")
        .select("user_id, role, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

    if (
      adminError ||
      !adminUser ||
      adminUser.role !== "admin" ||
      adminUser.is_active !== true
    ) {
      alert("บัญชีนี้ไม่มีสิทธิ์ลบผลงาน");
      setDeleting(false);
      return;
    }

    // ลบผลงาน
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      alert(`ไม่สามารถลบผลงานได้: ${error.message}`);
      setDeleting(false);
      return;
    }

    // โหลดรายการใหม่
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {deleting ? "กำลังลบ..." : "🗑️ ลบ"}
    </button>
  );
}