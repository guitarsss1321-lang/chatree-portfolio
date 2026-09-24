"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  sort_order: "0",
  is_active: true,
};

export default function CategoriesPage() {
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadCategories() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("role, is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      adminError ||
      !adminUser ||
      adminUser.role !== "admin" ||
      adminUser.is_active !== true
    ) {
      setError("คุณไม่มีสิทธิ์จัดการหมวดหมู่");
      setLoading(false);
      return;
    }

    const { data, error: categoryError } = await supabase
      .from("categories")
      .select(
        `
          id,
          name,
          slug,
          description,
          sort_order,
          is_active
        `
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (categoryError) {
      console.error(categoryError);
      setError(categoryError.message);
      setLoading(false);
      return;
    }

    setCategories(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  }

  function startEdit(category: Category) {
    setEditingId(category.id);

    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      sort_order: String(category.sort_order),
      is_active: category.is_active,
    });

    setError(null);
    setSuccess(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      ...(editingId
        ? {}
        : {
            slug: value
              .trim()
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w\u0E00-\u0E7F-]/g, ""),
          }),
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const name = form.name.trim();
    const slug = form.slug.trim();
    const description = form.description.trim();

    if (!name) {
      setError("กรุณากรอกชื่อหมวดหมู่");
      return;
    }

    if (!slug) {
      setError("กรุณากรอก Slug");
      return;
    }

    const sortOrder = Number.parseInt(form.sort_order, 10);

    if (Number.isNaN(sortOrder)) {
      setError("ลำดับการแสดงผลต้องเป็นตัวเลข");
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error: updateError } = await supabase
        .from("categories")
        .update({
          name,
          slug,
          description: description || null,
          sort_order: sortOrder,
          is_active: form.is_active,
        })
        .eq("id", editingId);

      if (updateError) {
        console.error(updateError);
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setSuccess("แก้ไขหมวดหมู่เรียบร้อยแล้ว");
    } else {
      const { error: insertError } = await supabase
        .from("categories")
        .insert({
          name,
          slug,
          description: description || null,
          sort_order: sortOrder,
          is_active: form.is_active,
        });

      if (insertError) {
        console.error(insertError);
        setError(insertError.message);
        setSaving(false);
        return;
      }

      setSuccess("เพิ่มหมวดหมู่เรียบร้อยแล้ว");
    }

    resetForm();
    await loadCategories();
    setSaving(false);
  }

  async function handleDelete(category: Category) {
    const confirmed = window.confirm(
      `ต้องการลบหมวดหมู่ "${category.name}" ใช่หรือไม่?\n\nผลงานที่อยู่ในหมวดหมู่นี้จะไม่ถูกลบ แต่จะไม่มีหมวดหมู่`
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);

    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (deleteError) {
      console.error(deleteError);
      setError(deleteError.message);
      return;
    }

    if (editingId === category.id) {
      resetForm();
    }

    setSuccess("ลบหมวดหมู่เรียบร้อยแล้ว");
    await loadCategories();
  }

  async function toggleActive(category: Category) {
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase
      .from("categories")
      .update({
        is_active: !category.is_active,
      })
      .eq("id", category.id);

    if (updateError) {
      console.error(updateError);
      setError(updateError.message);
      return;
    }

    setSuccess(
      category.is_active
        ? "ปิดการใช้งานหมวดหมู่แล้ว"
        : "เปิดการใช้งานหมวดหมู่แล้ว"
    );

    await loadCategories();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Portfolio Dashboard
            </Link>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              จัดการหมวดหมู่
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              เพิ่ม แก้ไข ลบ และจัดการหมวดหมู่ผลงาน
            </p>
          </div>

          <Link
            href="/admin/projects"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            📁 ไปที่ผลงาน
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {editingId ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                กำหนดข้อมูลหมวดหมู่สำหรับใช้กับผลงาน
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                ยกเลิกแก้ไข
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                ชื่อหมวดหมู่
              </label>

              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(event) =>
                  handleNameChange(event.target.value)
                }
                placeholder="เช่น งานวิจัย"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Slug */}
            <div>
              <label
                htmlFor="slug"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Slug
              </label>

              <input
                id="slug"
                type="text"
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    slug: event.target.value,
                  }))
                }
                placeholder="research"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs text-slate-400">
                ใช้สำหรับ URL และการอ้างอิงหมวดหมู่
              </p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                คำอธิบาย
              </label>

              <textarea
                id="description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                placeholder="คำอธิบายสั้น ๆ ของหมวดหมู่"
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label
                htmlFor="sort_order"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                ลำดับการแสดงผล
              </label>

              <input
                id="sort_order"
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sort_order: event.target.value,
                  }))
                }
                min="0"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Active */}
            <div className="flex items-center">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 rounded border-slate-300 text-blue-600"
                />

                <span className="text-sm font-semibold text-slate-700">
                  เปิดใช้งานหมวดหมู่นี้
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "กำลังบันทึก..."
                  : editingId
                    ? "บันทึกการแก้ไข"
                    : "เพิ่มหมวดหมู่"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Category List */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-7 py-5">
            <h2 className="text-xl font-black text-slate-900">
              รายการหมวดหมู่
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              มีทั้งหมด {categories.length} หมวดหมู่
            </p>
          </div>

          {loading ? (
            <div className="px-7 py-12 text-center text-sm text-slate-500">
              กำลังโหลดข้อมูล...
            </div>
          ) : categories.length === 0 ? (
            <div className="px-7 py-12 text-center">
              <p className="text-lg font-semibold text-slate-700">
                ยังไม่มีหมวดหมู่
              </p>

              <p className="mt-2 text-sm text-slate-500">
                ใช้แบบฟอร์มด้านบนเพื่อเพิ่มหมวดหมู่แรก
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="px-7 py-5 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">
                          {category.name}
                        </h3>

                        {category.is_active ? (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            เปิดใช้งาน
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                            ปิดใช้งาน
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-400">
                        slug: {category.slug}
                      </p>

                      {category.description && (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {category.description}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-slate-400">
                        ลำดับ: {category.sort_order}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                      >
                        ✏️ แก้ไข
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleActive(category)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        {category.is_active
                          ? "ปิดใช้งาน"
                          : "เปิดใช้งาน"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                      >
                        🗑️ ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}