import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  // ตรวจสอบผู้ใช้ที่ Login อยู่
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ถ้ายังไม่ได้ Login
  if (!user) {
    redirect("/auth/login");
  }

  // ตรวจสอบสิทธิ์จาก admin_users
  const { data: adminUser, error } = await supabase
    .from("admin_users")
    .select("user_id, role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  // ไม่มีข้อมูล Admin หรือเกิดข้อผิดพลาด
  if (
    error ||
    !adminUser ||
    adminUser.role !== "admin" ||
    adminUser.is_active !== true
  ) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            ADMIN PANEL
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Portfolio Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            ยินดีต้อนรับเข้าสู่ระบบจัดการ Portfolio
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              ผลงาน
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              เพิ่ม แก้ไข และจัดการผลงาน
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              หมวดหมู่
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              จัดการหมวดหมู่ผลงาน
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              โปรไฟล์
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              จัดการข้อมูลส่วนตัว
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            สถานะระบบ
          </h2>

          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="font-medium">บัญชี:</span>{" "}
              {user.email}
            </p>

            <p>
              <span className="font-medium">สิทธิ์:</span>{" "}
              {adminUser.role}
            </p>

            <p>
              <span className="font-medium">สถานะ:</span>{" "}
              เปิดใช้งาน
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}