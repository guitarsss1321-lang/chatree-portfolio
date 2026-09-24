import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteProjectButton from "./delete-project-button";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: adminUser, error: adminError } = await supabase
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
    redirect("/");
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(
      "id, title, slug, description, year, category_id, cover_image, file_url, external_url, is_featured, is_published, created_at"
    )
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  const categoryMap = new Map(
    (categories ?? []).map((category) => [category.id, category.name])
  );

  const projectList = projects ?? [];

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-sm font-medium text-blue-600">
              ADMIN PANEL
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              จัดการผลงาน
            </h1>

            <p className="mt-2 text-gray-600">
              รายการผลงานทั้งหมดใน Portfolio
            </p>
          </div>

          <div className="flex items-center gap-3">

            <Link
              href="/admin"
              className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              ← กลับ Dashboard
            </Link>

            <Link
              href="/admin/projects/new"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              + เพิ่มผลงาน
            </Link>

          </div>
        </div>

        {/* Error */}
        {projectsError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-medium">
              ไม่สามารถโหลดข้อมูลผลงานได้
            </p>

            <p className="mt-1 text-sm">
              {projectsError.message}
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                ผลงานทั้งหมด
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                จำนวน {projectList.length} รายการ
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              Admin: {user.email}
            </div>

          </div>
        </div>

        {/* Project List */}
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

          {projectList.length === 0 ? (
            <div className="p-12 text-center">

              <h2 className="text-xl font-semibold text-gray-800">
                ยังไม่มีผลงาน
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                เริ่มต้นโดยกดปุ่ม
                <span className="mx-1 font-medium text-blue-600">
                  + เพิ่มผลงาน
                </span>
                ด้านบน
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">
                  <tr>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      ชื่อผลงาน
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      หมวดหมู่
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      ปี
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      สถานะ
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Featured
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      จัดการ
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">

                  {projectList.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-gray-50"
                    >

                      {/* ชื่อผลงาน */}
                      <td className="px-6 py-4">

                        <div className="font-medium text-gray-900">
                          {project.title}
                        </div>

                        {project.slug && (
                          <div className="mt-1 text-xs text-gray-400">
                            /{project.slug}
                          </div>
                        )}

                      </td>

                      {/* หมวดหมู่ */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {project.category_id
                          ? categoryMap.get(project.category_id) ??
                            "ไม่ระบุหมวดหมู่"
                          : "ไม่ระบุหมวดหมู่"}
                      </td>

                      {/* ปี */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {project.year || "-"}
                      </td>

                      {/* สถานะ */}
                      <td className="px-6 py-4">

                        {project.is_published ? (
                          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            เผยแพร่
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            แบบร่าง
                          </span>
                        )}

                      </td>

                      {/* Featured */}
                      <td className="px-6 py-4">

                        {project.is_featured ? (
                          <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                            ★ Featured
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            -
                          </span>
                        )}

                      </td>

                      {/* จัดการ */}
                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          <Link
                            href={`/admin/projects/${project.id}/edit`}
                            className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                          >
                            ✏️ แก้ไข
                          </Link>

                          <DeleteProjectButton
                            projectId={project.id}
                            projectTitle={project.title}
                          />

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </main>
  );
}