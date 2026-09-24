"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
};

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState("");

  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // โหลดหมวดหมู่
  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true);

      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        setErrorMessage(
          `ไม่สามารถโหลดหมวดหมู่ได้: ${error.message}`
        );
      } else {
        setCategories(data ?? []);
      }

      setLoadingCategories(false);
    }

    loadCategories();
  }, []);

  // สร้าง Slug จากชื่อผลงาน
  function createSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9ก-๙-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slug) {
      setSlug(createSlug(value));
    }
  }

  // เลือกรูปปก
  function handleCoverImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setCoverImage(null);
      setImagePreview("");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        "รูปปกต้องเป็น JPG, JPEG, PNG หรือ WEBP เท่านั้น"
      );

      event.target.value = "";
      setCoverImage(null);
      setImagePreview("");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage(
        "รูปปกมีขนาดเกิน 50 MB"
      );

      event.target.value = "";
      setCoverImage(null);
      setImagePreview("");
      return;
    }

    setErrorMessage("");
    setCoverImage(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  // เลือก PDF
  function handlePdfChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      setPdfFile(null);
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setErrorMessage(
        "ไฟล์ผลงานต้องเป็น PDF เท่านั้น"
      );

      event.target.value = "";
      setPdfFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage(
        "ไฟล์ PDF มีขนาดเกิน 50 MB"
      );

      event.target.value = "";
      setPdfFile(null);
      return;
    }

    setErrorMessage("");
    setPdfFile(file);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    // ตรวจข้อมูล
    if (!title.trim()) {
      setErrorMessage("กรุณากรอกชื่อผลงาน");
      return;
    }

    if (!slug.trim()) {
      setErrorMessage("กรุณากรอก Slug");
      return;
    }

    if (!categoryId) {
      setErrorMessage("กรุณาเลือกหมวดหมู่");
      return;
    }

    setSaving(true);

    let uploadedImagePath: string | null = null;
    let uploadedPdfPath: string | null = null;

    try {
      // =====================================================
      // 1. ตรวจสอบ Login
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "ไม่พบผู้ใช้ กรุณา Login ใหม่"
        );
      }

      // =====================================================
      // 2. ตรวจสอบ Admin
      // =====================================================

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
        throw new Error(
          "บัญชีนี้ไม่มีสิทธิ์เพิ่มผลงาน"
        );
      }

      // =====================================================
      // 3. ตรวจสอบ Slug ซ้ำ
      // =====================================================

      const { data: existingProject, error: slugCheckError } =
        await supabase
          .from("projects")
          .select("id")
          .eq("slug", slug.trim())
          .maybeSingle();

      if (slugCheckError) {
        throw new Error(
          `ตรวจสอบ Slug ไม่สำเร็จ: ${slugCheckError.message}`
        );
      }

      if (existingProject) {
        throw new Error(
          "Slug นี้มีอยู่แล้ว กรุณาใช้ Slug อื่น"
        );
      }

      // =====================================================
      // 4. Upload รูปปก
      // =====================================================

      let coverImageUrl: string | null = null;

      if (coverImage) {
        const fileExtension =
          coverImage.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const fileName =
          `${crypto.randomUUID()}.${fileExtension}`;

        const imagePath =
          `${user.id}/${fileName}`;

        const { error: imageUploadError } =
          await supabase.storage
            .from("portfolio-images")
            .upload(
              imagePath,
              coverImage,
              {
                cacheControl: "3600",
                contentType: coverImage.type,
                upsert: false,
              }
            );

        if (imageUploadError) {
          throw new Error(
            `อัปโหลดรูปปกไม่สำเร็จ: ${imageUploadError.message}`
          );
        }

        uploadedImagePath = imagePath;

        const {
          data: publicImageData,
        } = supabase.storage
          .from("portfolio-images")
          .getPublicUrl(imagePath);

        coverImageUrl =
          publicImageData.publicUrl;
      }

      // =====================================================
      // 5. Upload PDF
      // =====================================================

      if (pdfFile) {
        const fileName =
          `${crypto.randomUUID()}.pdf`;

        const pdfPath =
          `${user.id}/${fileName}`;

        const { error: pdfUploadError } =
          await supabase.storage
            .from("portfolio-files")
            .upload(
              pdfPath,
              pdfFile,
              {
                cacheControl: "3600",
                contentType: "application/pdf",
                upsert: false,
              }
            );

        if (pdfUploadError) {
          throw new Error(
            `อัปโหลด PDF ไม่สำเร็จ: ${pdfUploadError.message}`
          );
        }

        uploadedPdfPath = pdfPath;
      }

      // =====================================================
      // 6. บันทึกข้อมูลลง projects
      // =====================================================

      const { data: insertedProject, error: insertError } =
        await supabase
          .from("projects")
          .insert({
            title: title.trim(),
            slug: slug.trim(),
            description:
              description.trim() || null,
            year: year.trim() || null,
            category_id:
              categoryId || null,
            cover_image:
              coverImageUrl,
            file_url:
              uploadedPdfPath,
            external_url:
              externalUrl.trim() || null,
            is_featured:
              isFeatured,
            is_published:
              isPublished,
          })
          .select("id")
          .single();

      if (insertError || !insertedProject) {
        throw new Error(
          `ไม่สามารถบันทึกข้อมูลผลงานได้: ${
            insertError?.message || "Unknown error"
          }`
        );
      }

      // =====================================================
      // 7. สำเร็จ
      // =====================================================

      setMessage(
        "บันทึกผลงาน พร้อมรูปภาพและ PDF สำเร็จแล้ว"
      );

      // กลับไปหน้ารายการหลังจาก 1.2 วินาที
      setTimeout(() => {
        router.push("/admin/projects");
        router.refresh();
      }, 1200);

    } catch (error) {
      // =====================================================
      // ถ้า Database Insert ไม่สำเร็จ
      // ลบไฟล์ที่ Upload ไปแล้วออก
      // =====================================================

      if (uploadedImagePath) {
        await supabase.storage
          .from("portfolio-images")
          .remove([uploadedImagePath]);
      }

      if (uploadedPdfPath) {
        await supabase.storage
          .from("portfolio-files")
          .remove([uploadedPdfPath]);
      }

      const errorText =
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";

      setErrorMessage(errorText);
    } finally {
      setSaving(false);
    }
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
              เพิ่มผลงาน
            </h1>

            <p className="mt-2 text-gray-600">
              เพิ่มผลงานพร้อมรูปภาพและ PDF ลงใน Portfolio
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

          {/* ชื่อผลงาน */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              ชื่อผลงาน *
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) =>
                handleTitleChange(e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              placeholder="เช่น ระบบจำแนกประเภทขยะด้วย AI"
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
              onChange={(e) =>
                setSlug(e.target.value)
              }
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              placeholder="waste-ai"
              required
            />

            <p className="mt-1 text-xs text-gray-500">
              ใช้เป็นชื่อสำหรับ URL ของผลงาน
            </p>
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              รายละเอียด
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows={7}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              placeholder="รายละเอียดเกี่ยวกับผลงาน..."
            />
          </div>

          {/* ปี + หมวดหมู่ */}
          <div className="grid gap-6 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                ปี
              </label>

              <input
                type="text"
                value={year}
                onChange={(e) =>
                  setYear(e.target.value)
                }
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                placeholder="2569"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                หมวดหมู่ *
              </label>

              <select
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(e.target.value)
                }
                disabled={loadingCategories}
                className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:border-blue-500"
                required
              >
                <option value="">
                  {loadingCategories
                    ? "กำลังโหลด..."
                    : "เลือกหมวดหมู่"}
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

          {/* ================================================= */}
          {/* Cover Image */}
          {/* ================================================= */}

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">

            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                📷 รูปปกผลงาน
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                รองรับ JPG, JPEG, PNG และ WEBP ขนาดไม่เกิน 50 MB
              </p>
            </div>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleCoverImageChange}
              className="block w-full rounded-lg border bg-white p-3 text-sm"
            />

            {coverImage && (
              <p className="mt-3 text-sm text-gray-600">
                ไฟล์ที่เลือก:{" "}
                <span className="font-medium">
                  {coverImage.name}
                </span>
              </p>
            )}

            {imagePreview && (
              <div className="mt-5">

                <p className="mb-2 text-sm font-medium text-gray-700">
                  ตัวอย่างรูปปก
                </p>

                <img
                  src={imagePreview}
                  alt="ตัวอย่างรูปปก"
                  className="max-h-80 rounded-lg border object-contain"
                />

              </div>
            )}

          </div>

          {/* ================================================= */}
          {/* PDF */}
          {/* ================================================= */}

          <div className="rounded-xl border border-red-100 bg-red-50 p-6">

            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                📄 ไฟล์ PDF ผลงาน
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                รองรับเฉพาะ PDF ขนาดไม่เกิน 50 MB
              </p>
            </div>

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handlePdfChange}
              className="block w-full rounded-lg border bg-white p-3 text-sm"
            />

            {pdfFile && (
              <div className="mt-3 rounded-lg bg-white p-4 text-sm">
                <p className="font-medium text-gray-800">
                  📄 {pdfFile.name}
                </p>

                <p className="mt-1 text-gray-500">
                  ขนาด{" "}
                  {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

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

            <p className="mt-1 text-xs text-gray-500">
              เช่น GitHub, YouTube หรือเว็บไซต์ของโครงงาน
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4 rounded-lg bg-gray-50 p-5">

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) =>
                  setIsFeatured(e.target.checked)
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-medium text-gray-700">
                ⭐ แสดงเป็นผลงานเด่น (Featured)
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) =>
                  setIsPublished(e.target.checked)
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-medium text-gray-700">
                🌐 เผยแพร่บนเว็บไซต์
              </span>
            </label>

          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">

            <Link
              href="/admin/projects"
              className="rounded-lg border px-5 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </Link>

            <button
              type="submit"
              disabled={saving || loadingCategories}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "กำลังอัปโหลดและบันทึก..."
                : "บันทึกผลงาน"}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}