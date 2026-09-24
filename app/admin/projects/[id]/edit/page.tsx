"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  year: string | null;
  category_id: string | null;
  external_url: string | null;
  is_featured: boolean;
  is_published: boolean;
};

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setErrorMessage("");

      // ตรวจสอบ Login
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // ตรวจสอบ Admin
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
        router.push("/");
        return;
      }

      // โหลดข้อมูลผลงาน
      const { data: projectData, error: projectError } =
        await supabase
          .from("projects")
          .select(
            "id, title, slug, description, year, category_id, external_url, is_featured, is_published"
          )
          .eq("id", projectId)
          .maybeSingle();

      if (projectError) {
        setErrorMessage(
          `ไม่สามารถโหลดข้อมูลผลงานได้: ${projectError.message}`
        );
        setLoading(false);
        return;
      }

      if (!projectData) {
        setErrorMessage("ไม่พบผลงานรายการนี้");
        setLoading(false);
        return;
      }

      const loadedProject = projectData as Project;

      setProject(loadedProject);

      setTitle(loadedProject.title ?? "");
      setSlug(loadedProject.slug ?? "");
      setDescription(loadedProject.description ?? "");
      setYear(loadedProject.year ?? "");
      setCategoryId(loadedProject.category_id ?? "");
      setExternalUrl(loadedProject.external_url ?? "");
      setIsFeatured(loadedProject.is_featured);
      setIsPublished(loadedProject.is_published);

      // โหลดหมวดหมู่
      const { data: categoryData, error: categoryError } =
        await supabase
          .from("categories")
          .select("id, name")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

      if (categoryError) {
        setErrorMessage(
          `ไม่สามารถโหลดหมวดหมู่ได้: ${categoryError.message}`
        );
      } else {
        setCategories(categoryData ?? []);
      }

      setLoading(false);
    }

    loadData();
  }, [projectId]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("กรุณากรอกชื่อผลงาน");
      return;
    }

    if (!slug.trim()) {
      setErrorMessage("กรุณากรอก Slug");
      return;
    }

    setSaving(true);

    // ตรวจสอบ Login
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage("ไม่พบผู้ใช้ กรุณา Login ใหม่");
      setSaving(false);
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
      setErrorMessage("บัญชีนี้ไม่มีสิทธิ์แก้ไขผลงาน");
      setSaving(false);
      return;
    }

    // UPDATE
    const { error } = await supabase
      .from("projects")
      .update({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        year: year.trim() || null,
        category_id: categoryId || null,
        external_url: externalUrl.trim() || null,
        is_featured: isFeatured,
        is_published: isPublished,
      })
      .eq("id", projectId);

    if (error) {
      if (error.code === "23505") {
        setErrorMessage(
          "Slug นี้มีอยู่แล้ว กรุณาใช้ Slug อื่น"
        );
      } else {
        setErrorMessage(
          `ไม่สามารถบันทึกการแก้ไขได้: ${error.message}`
        );
      }

      setSaving(false);
      return;
    }

    setMessage("แก้ไขผลงานสำเร็จแล้ว");

    setProject({
      id: projectId,
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      year: year.trim() || null,
      category_id: categoryId || null,
      external_url: externalUrl.trim() || null,
      is_featured: isFeatured,
      is_published: isPublished,
    });

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border bg-white p-8 shadow-sm">
            <p className="text-gray-600">
              กำลังโหลดข้อมูลผลงาน...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-sm font-medium text-blue-600">
              ADMIN PANEL
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              แก้ไขผลงาน
            </h1>

            <p className="mt-2 text-gray-600">
              แก้ไขข้อมูลผลงานใน Portfolio
            </p>
          </div>

          <Link
            href="/admin/projects"
            className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            ← รายการผลงาน
          </Link>

        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border bg-white p-8 shadow-sm"
        >

          {/* Success */}
          {message && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
              {message}
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              ชื่อผลงาน *
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Slug *
            </label>

            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              required
            />

            <p className="mt-1 text-xs text-gray-500">
              ชื่อสำหรับ URL ของผลงาน
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              รายละเอียด
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows={6}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Year + Category */}
          <div className="grid gap-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                ปี
              </label>

              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                หมวดหมู่
              </label>

              <select
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(e.target.value)
                }
                className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  ไม่ระบุหมวดหมู่
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* External URL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              External URL
            </label>

            <input
              type="url"
              value={externalUrl}
              onChange={(e) =>
                setExternalUrl(e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              placeholder="https://..."
            />
          </div>

          {/* Options */}
          <div className="space-y-4 rounded-lg bg-gray-50 p-5">

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) =>
                  setIsFeatured(e.target.checked)
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-medium text-gray-700">
                แสดงเป็นผลงานเด่น (Featured)
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) =>
                  setIsPublished(e.target.checked)
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-medium text-gray-700">
                เผยแพร่บนเว็บไซต์
              </span>
            </label>

          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 border-t pt-6">

            <Link
              href="/admin/projects"
              className="rounded-lg border px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </Link>

            <button
              type="submit"
              disabled={saving || !project}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}