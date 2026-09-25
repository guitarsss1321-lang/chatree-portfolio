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
  cover_image: string | null;
  file_url: string | null;
  external_url: string | null;
  is_featured: boolean;
  is_published: boolean;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function extractStoragePath(
  value: string | null,
  bucket: string
): string | null {
  if (!value) return null;

  // ถ้าเก็บเป็น path เช่น user-id/project.jpg
  if (!value.startsWith("http")) {
    return value.replace(/^\/+/, "");
  }

  // ถ้าเก็บเป็น URL ของ Supabase Storage
  const marker = `/storage/v1/object/public/${bucket}/`;
  const markerPrivate = `/storage/v1/object/sign/${bucket}/`;

  const publicIndex = value.indexOf(marker);

  if (publicIndex !== -1) {
    return decodeURIComponent(
      value.substring(publicIndex + marker.length)
    );
  }

  const privateIndex = value.indexOf(markerPrivate);

  if (privateIndex !== -1) {
    return decodeURIComponent(
      value.substring(privateIndex + markerPrivate.length).split("?")[0]
    );
  }

  return null;
}

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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(
          "id, title, slug, description, year, category_id, cover_image, file_url, external_url, is_featured, is_published"
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

      // แสดงรูปเดิม
      setImagePreview(loadedProject.cover_image ?? null);

      // โหลดหมวดหมู่
      const { data: categoryData, error: categoryError } = await supabase
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
  }, [projectId, router, supabase]);

  function handleImageChange(file: File | null) {
    setErrorMessage("");
    setMessage("");

    if (!file) {
      setImageFile(null);
      setImagePreview(project?.cover_image ?? null);
      return;
    }

    if (!IMAGE_EXTENSIONS.includes(getFileExtension(file.name))) {
      setErrorMessage(
        "ไฟล์รูปต้องเป็น JPG, JPEG, PNG หรือ WEBP เท่านั้น"
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("ไฟล์รูปมีขนาดเกิน 50 MB");
      return;
    }

    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  function handlePdfChange(file: File | null) {
    setErrorMessage("");
    setMessage("");

    if (!file) {
      setPdfFile(null);
      return;
    }

    if (getFileExtension(file.name) !== "pdf") {
      setErrorMessage("ไฟล์ผลงานต้องเป็น PDF เท่านั้น");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("ไฟล์ PDF มีขนาดเกิน 50 MB");
      return;
    }

    setPdfFile(file);
  }

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
      setErrorMessage("บัญชีนี้ไม่มีสิทธิ์แก้ไขผลงาน");
      setSaving(false);
      return;
    }

    if (!project) {
      setErrorMessage("ไม่พบข้อมูลผลงาน");
      setSaving(false);
      return;
    }

    let newImagePath: string | null = null;
    let newImageUrl: string | null = null;

    let newPdfPath: string | null = null;

    try {
      /*
       * ==========================================
       * 1. อัปโหลดรูปใหม่ ถ้ามีการเลือก
       * ==========================================
       */
      if (imageFile) {
        const extension = getFileExtension(imageFile.name);

        newImagePath = `${user.id}/${projectId}-${Date.now()}.${extension}`;

        const { error: imageUploadError } = await supabase.storage
          .from("portfolio-images")
          .upload(newImagePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type,
          });

        if (imageUploadError) {
          throw new Error(
            `ไม่สามารถอัปโหลดรูปภาพได้: ${imageUploadError.message}`
          );
        }

        const { data: imagePublicData } = supabase.storage
          .from("portfolio-images")
          .getPublicUrl(newImagePath);

        newImageUrl = imagePublicData.publicUrl;
      }

      /*
       * ==========================================
       * 2. อัปโหลด PDF ใหม่ ถ้ามีการเลือก
       * ==========================================
       */
      if (pdfFile) {
        newPdfPath = `${user.id}/${projectId}-${Date.now()}.pdf`;

        const { error: pdfUploadError } = await supabase.storage
          .from("portfolio-files")
          .upload(newPdfPath, pdfFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: "application/pdf",
          });

        if (pdfUploadError) {
          throw new Error(
            `ไม่สามารถอัปโหลดไฟล์ PDF ได้: ${pdfUploadError.message}`
          );
        }
      }

      /*
       * ==========================================
       * 3. เตรียมข้อมูลที่จะบันทึก
       * ==========================================
       */

      const updateData: {
        title: string;
        slug: string;
        description: string | null;
        year: string | null;
        category_id: string | null;
        external_url: string | null;
        is_featured: boolean;
        is_published: boolean;
        cover_image?: string | null;
        file_url?: string | null;
      } = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        year: year.trim() || null,
        category_id: categoryId || null,
        external_url: externalUrl.trim() || null,
        is_featured: isFeatured,
        is_published: isPublished,
      };

      // ถ้ามีรูปใหม่ ให้เปลี่ยน cover_image
      if (newImageUrl) {
        updateData.cover_image = newImageUrl;
      }

      // ถ้ามี PDF ใหม่ ให้เปลี่ยน file_url
      if (newPdfPath) {
        updateData.file_url = newPdfPath;
      }

      /*
       * ==========================================
       * 4. UPDATE Database
       * ==========================================
       */
      const { error: updateError } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId);

      if (updateError) {
        throw new Error(
          updateError.code === "23505"
            ? "Slug นี้มีอยู่แล้ว กรุณาใช้ Slug อื่น"
            : `ไม่สามารถบันทึกการแก้ไขได้: ${updateError.message}`
        );
      }

      /*
       * ==========================================
       * 5. ลบไฟล์เก่า หลังจาก Database สำเร็จแล้ว
       * ==========================================
       */

      // ลบรูปเก่า ถ้ามีรูปใหม่
      if (newImageUrl && project.cover_image) {
        const oldImagePath = extractStoragePath(
          project.cover_image,
          "portfolio-images"
        );

        if (oldImagePath && oldImagePath !== newImagePath) {
          await supabase.storage
            .from("portfolio-images")
            .remove([oldImagePath]);
        }
      }

      // ลบ PDF เก่า ถ้ามี PDF ใหม่
      if (newPdfPath && project.file_url) {
        const oldPdfPath = extractStoragePath(
          project.file_url,
          "portfolio-files"
        );

        if (oldPdfPath && oldPdfPath !== newPdfPath) {
          await supabase.storage
            .from("portfolio-files")
            .remove([oldPdfPath]);
        }
      }

      /*
       * ==========================================
       * 6. อัปเดตข้อมูลบนหน้าจอ
       * ==========================================
       */

      const updatedProject: Project = {
        id: projectId,
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        year: year.trim() || null,
        category_id: categoryId || null,
        cover_image: newImageUrl ?? project.cover_image,
        file_url: newPdfPath ?? project.file_url,
        external_url: externalUrl.trim() || null,
        is_featured: isFeatured,
        is_published: isPublished,
      };

      setProject(updatedProject);

      if (newImageUrl) {
        setImagePreview(newImageUrl);
        setImageFile(null);
      }

      if (newPdfPath) {
        setPdfFile(null);
      }

      setMessage("บันทึกการแก้ไขผลงานเรียบร้อยแล้ว");

      /*
       * เลื่อนกลับด้านบนเพื่อให้เห็นข้อความสำเร็จ
       */
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      /*
       * ==========================================
       * ถ้าเกิดข้อผิดพลาด ให้ลบไฟล์ใหม่ที่เพิ่งอัปโหลด
       * เพื่อไม่ให้เกิดไฟล์ค้างใน Storage
       * ==========================================
       */

      if (newImagePath) {
        await supabase.storage
          .from("portfolio-images")
          .remove([newImagePath]);
      }

      if (newPdfPath) {
        await supabase.storage
          .from("portfolio-files")
          .remove([newPdfPath]);
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
    } finally {
      setSaving(false);
    }
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
              แก้ไขข้อมูลผลงาน รูปภาพ และไฟล์ PDF ใน Portfolio
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
              ✅ {message}
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              ❌ {errorMessage}
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
              ชื่อสำหรับ URL ของผลงาน เช่น waste-ai
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              รายละเอียด
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                onChange={(e) => setCategoryId(e.target.value)}
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

          {/* =========================================
              รูปปกผลงาน
             ========================================= */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-6">

            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                🖼️ รูปปกผลงาน
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                เลือกรูปใหม่เฉพาะเมื่อต้องการเปลี่ยนรูปเดิม
              </p>
            </div>

            {imagePreview ? (
              <div className="mb-5">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  รูปปัจจุบัน / รูปที่จะบันทึก
                </p>

                <div className="overflow-hidden rounded-xl border bg-white p-3">
                  <img
                    src={imagePreview}
                    alt="รูปปกผลงาน"
                    className="max-h-72 w-auto rounded-lg object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="mb-5 rounded-xl border border-dashed bg-white p-8 text-center text-gray-500">
                ยังไม่มีรูปปกผลงาน
              </div>
            )}

            <label className="inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700">
              📷 {imageFile ? "เลือกรูปใหม่อีกครั้ง" : "เปลี่ยนรูปปก"}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) =>
                  handleImageChange(e.target.files?.[0] ?? null)
                }
              />
            </label>

            {imageFile && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-white p-3 text-sm">
                <p className="font-medium text-gray-800">
                  ไฟล์ใหม่:
                </p>

                <p className="text-gray-600">
                  {imageFile.name}
                </p>

                <p className="text-gray-500">
                  {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <p className="mt-3 text-xs text-gray-500">
              รองรับ JPG, JPEG, PNG, WEBP ขนาดไม่เกิน 50 MB
            </p>

          </div>

          {/* =========================================
              PDF
             ========================================= */}
          <div className="rounded-xl border border-red-100 bg-red-50/40 p-6">

            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                📄 ไฟล์ PDF ผลงาน
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                เลือกไฟล์ใหม่เฉพาะเมื่อต้องการเปลี่ยน PDF เดิม
              </p>
            </div>

            {project?.file_url ? (
              <div className="mb-5 rounded-xl border bg-white p-4">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <p className="font-medium text-gray-800">
                      📄 มีไฟล์ PDF ของผลงานอยู่แล้ว
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      สามารถเปิดดูไฟล์ PDF เดิมได้
                    </p>
                  </div>

                  {project.slug && (
                    <a
                      href={`/api/projects/${project.slug}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      👁️ เปิด PDF เดิม
                    </a>
                  )}

                </div>

              </div>
            ) : (
              <div className="mb-5 rounded-xl border border-dashed bg-white p-8 text-center text-gray-500">
                ยังไม่มีไฟล์ PDF
              </div>
            )}

            <label className="inline-flex cursor-pointer items-center rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-700">
              📄 {pdfFile ? "เลือก PDF ใหม่อีกครั้ง" : "เปลี่ยน / เพิ่ม PDF"}
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) =>
                  handlePdfChange(e.target.files?.[0] ?? null)
                }
              />
            </label>

            {pdfFile && (
              <div className="mt-3 rounded-lg border border-red-200 bg-white p-3 text-sm">
                <p className="font-medium text-gray-800">
                  ไฟล์ใหม่:
                </p>

                <p className="text-gray-600">
                  {pdfFile.name}
                </p>

                <p className="text-gray-500">
                  {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <p className="mt-3 text-xs text-gray-500">
              รองรับ PDF ขนาดไม่เกิน 50 MB
            </p>

          </div>

          {/* External URL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              External URL
            </label>

            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              placeholder="https://..."
            />

            <p className="mt-1 text-xs text-gray-500">
              ใส่ลิงก์ภายนอก เช่น GitHub, YouTube หรือเว็บไซต์โครงการ
            </p>
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
              {saving
                ? "กำลังอัปโหลดและบันทึก..."
                : "บันทึกการแก้ไข"}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}