import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function logout() {
  "use server";

  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/auth/login");
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !adminUser ||
    adminUser.role !== "admin" ||
    adminUser.is_active !== true
  ) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Admin Panel
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Portfolio Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              ระบบจัดการ Portfolio
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← หน้า Portfolio
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            ยินดีต้อนรับ
          </p>

          <h2 className="mt-1 text-3xl font-black text-slate-900">
            จัดการเว็บไซต์ของคุณ
          </h2>

          <p className="mt-2 text-slate-600">
            เพิ่ม แก้ไข และจัดการข้อมูล Portfolio ได้จากหน้านี้
          </p>
        </div>

        {/* Management Cards */}
        <div className="grid gap-6 md:grid-cols-3">

          {/* Projects */}
          <Link
            href="/admin/projects"
            className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              📁
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-900 group-hover:text-blue-700">
              ผลงาน
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              เพิ่ม แก้ไข ลบ และจัดการผลงาน Portfolio
            </p>

            <div className="mt-5 text-sm font-bold text-blue-600">
              จัดการผลงาน →
            </div>
          </Link>

          {/* Categories */}
          <Link
            href="/admin/categories"
            className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              🗂️
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-900 group-hover:text-blue-700">
              หมวดหมู่
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              จัดการหมวดหมู่สำหรับจัดกลุ่มผลงาน
            </p>

            <div className="mt-5 text-sm font-bold text-blue-600">
              จัดการหมวดหมู่ →
            </div>
          </Link>

          {/* Profile */}
          <Link
            href="/admin/profile"
            className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              👤
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-900 group-hover:text-blue-700">
              โปรไฟล์
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              จัดการข้อมูลส่วนตัวและข้อมูลที่แสดงบน Portfolio
            </p>

            <div className="mt-5 text-sm font-bold text-blue-600">
              แก้ไขโปรไฟล์ →
            </div>
          </Link>

        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">
            การดำเนินการด่วน
          </h2>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin/projects/new"
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              + เพิ่มผลงานใหม่
            </Link>

            <Link
              href="/admin/projects"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              ดูผลงานทั้งหมด
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              เปิดเว็บไซต์
            </Link>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">
            สถานะระบบ
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                บัญชี
              </p>

              <p className="mt-1 break-all font-semibold text-slate-900">
                {user.email}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                สิทธิ์
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {adminUser.role}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                สถานะ
              </p>

              <p className="mt-1 font-semibold text-green-600">
                ● เปิดใช้งาน
              </p>
            </div>

          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-slate-500">
          Portfolio Management System
        </div>
      </footer>
    </main>
  );
}