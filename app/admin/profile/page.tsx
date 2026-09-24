"use client";

import { useEffect, useState, ChangeEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name: string;
  position: string;
  institution: string;
  bio: string;
  profile_image: string;
  email: string;
  phone: string;
};

const emptyProfile: Profile = {
  id: "",
  full_name: "",
  position: "",
  institution: "",
  bio: "",
  profile_image: "",
  email: "",
  phone: "",
};

export default function ProfilePage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        position,
        institution,
        bio,
        profile_image,
        email,
        phone
        `
      )
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Load profile error:", error);
      setErrorMessage(
        "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้: " + error.message
      );
      setLoading(false);
      return;
    }

    if (data) {
      setProfile({
        id: data.id ?? "",
        full_name: data.full_name ?? "",
        position: data.position ?? "",
        institution: data.institution ?? "",
        bio: data.bio ?? "",
        profile_image: data.profile_image ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
      });
    }

    setLoading(false);
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleImageUpload(
    e: ChangeEvent<HTMLInputElement>
  ) {
    try {
      setErrorMessage("");
      setMessage("");

      const file = e.target.files?.[0];

      if (!file) {
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        setErrorMessage(
          "รองรับเฉพาะ JPG, PNG และ WEBP เท่านั้น"
        );
        e.target.value = "";
        return;
      }

      const maxSize = 50 * 1024 * 1024;

      if (file.size > maxSize) {
        setErrorMessage(
          "ขนาดไฟล์ต้องไม่เกิน 50 MB"
        );
        e.target.value = "";
        return;
      }

      setUploading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่"
        );
      }

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const filePath = `${user.id}/profile-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("portfolio-images")
        .getPublicUrl(filePath);

      setProfile((current) => ({
        ...current,
        profile_image: publicUrl,
      }));

      setMessage(
        "อัปโหลดรูปเรียบร้อยแล้ว กดบันทึกข้อมูลเพื่อบันทึกโปรไฟล์"
      );
    } catch (error) {
      console.error("Upload profile image error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "ไม่สามารถอัปโหลดรูปได้"
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (!profile.full_name.trim()) {
        throw new Error("กรุณากรอกชื่อ-นามสกุล");
      }

      const payload = {
        full_name: profile.full_name.trim(),
        position: profile.position.trim(),
        institution: profile.institution.trim(),
        bio: profile.bio.trim(),
        profile_image: profile.profile_image.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        updated_at: new Date().toISOString(),
      };

      if (profile.id) {
        const { error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", profile.id);

        if (error) {
          throw error;
        }
      } else {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error(
            "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่"
          );
        }

        const { data, error } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            ...payload,
          })
          .select(
            `
            id,
            full_name,
            position,
            institution,
            bio,
            profile_image,
            email,
            phone
            `
          )
          .single();

        if (error) {
          throw error;
        }

        setProfile({
          id: data.id,
          full_name: data.full_name ?? "",
          position: data.position ?? "",
          institution: data.institution ?? "",
          bio: data.bio ?? "",
          profile_image: data.profile_image ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
        });
      }

      setMessage("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว");
    } catch (error) {
      console.error("Save profile error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-600">
              กำลังโหลดข้อมูลโปรไฟล์...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              ← กลับ Dashboard
            </Link>

            <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-blue-600">
              ADMIN PANEL
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              จัดการโปรไฟล์
            </h1>

            <p className="mt-2 text-slate-600">
              แก้ไขข้อมูลส่วนตัวและข้อมูลที่แสดงบน Portfolio
            </p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
            ✅ {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            ❌ {errorMessage}
          </div>
        )}

        <div className="space-y-6">

          {/* Profile Image */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-slate-900">
              รูปโปรไฟล์
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              รูปนี้สามารถนำไปใช้แสดงในหน้า Portfolio
            </p>

            <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">

              <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {profile.profile_image ? (
                  <img
                    src={profile.profile_image}
                    alt={profile.full_name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <div className="text-5xl">
                      👤
                    </div>
                    <p className="mt-2 text-xs">
                      ยังไม่มีรูป
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="inline-flex cursor-pointer items-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                  {uploading
                    ? "กำลังอัปโหลด..."
                    : "📷 เลือกรูปโปรไฟล์"}

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>

                <p className="mt-3 text-sm text-slate-500">
                  รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 50 MB
                </p>
              </div>

            </div>
          </section>

          {/* Personal Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-slate-900">
              ข้อมูลส่วนตัว
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              {/* Full Name */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  ชื่อ-นามสกุล *
                </label>

                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  placeholder="เช่น นายชาตรี โยธาธรรม"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Position */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  ตำแหน่ง
                </label>

                <input
                  type="text"
                  name="position"
                  value={profile.position}
                  onChange={handleChange}
                  placeholder="เช่น ครู คศ.2 วิทยฐานะ ชำนาญการ"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Institution */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  สถานศึกษา
                </label>

                <input
                  type="text"
                  name="institution"
                  value={profile.institution}
                  onChange={handleChange}
                  placeholder="เช่น วิทยาลัยเทคนิคชุมแพ"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  อีเมล
                </label>

                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  ข้อมูลนี้ใช้สำหรับผู้ดูแลระบบและจะไม่แสดงผ่าน public profile
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  โทรศัพท์
                </label>

                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="08x-xxx-xxxx"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  ข้อมูลนี้จะไม่แสดงผ่าน public profile
                </p>
              </div>

            </div>
          </section>

          {/* Bio */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-slate-900">
              ประวัติ / แนะนำตัว
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              ข้อมูลนี้สามารถนำไปใช้ในส่วน "เกี่ยวกับฉัน"
            </p>

            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              rows={8}
              placeholder="เขียนประวัติ ประสบการณ์ ความเชี่ยวชาญ หรือข้อมูลแนะนำตัว..."
              className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-3 leading-7 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </section>

          {/* Image URL */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-slate-900">
              URL รูปโปรไฟล์
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              ระบบจะกรอกให้อัตโนมัติเมื่ออัปโหลดรูป
            </p>

            <input
              type="text"
              name="profile_image"
              value={profile.profile_image}
              onChange={handleChange}
              placeholder="https://..."
              className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </section>

          {/* Save */}
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">

            <div>
              <p className="font-semibold text-slate-900">
                บันทึกข้อมูลโปรไฟล์
              </p>

              <p className="mt-1 text-sm text-slate-500">
                ตรวจสอบข้อมูลก่อนกดบันทึก
              </p>
            </div>

            <div className="flex gap-3">

              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ยกเลิก
              </Link>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "กำลังบันทึก..."
                  : "💾 บันทึกโปรไฟล์"}
              </button>

            </div>
          </section>

        </div>

      </div>
    </main>
  );
}