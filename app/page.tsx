export const dynamic = "force-dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  id: string;
  full_name: string | null;
  position: string | null;
  institution: string | null;
  bio: string | null;
  profile_image: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  year: string | null;
  cover_image: string | null;
  file_url: string | null;
  external_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  category_id: string | null;
  created_at: string;
};

export default async function HomePage() {
  const supabase = await createClient();

  // =====================================================
  // 1. โหลดข้อมูลทั้งหมดพร้อมกัน
  // =====================================================

  const [
    { data: profile },
    { data: categories },
    { data: projects },
  ] = await Promise.all([
    supabase
      .from("public_profile")
      .select(
        "id, full_name, position, institution, bio, profile_image"
      )
      .limit(1)
      .maybeSingle(),

    supabase
      .from("categories")
      .select(
        "id, name, slug, description, sort_order"
      )
      .eq("is_active", true)
      .order("sort_order", {
        ascending: true,
      }),

    supabase
      .from("projects")
      .select(
        `
          id,
          title,
          slug,
          description,
          year,
          cover_image,
          file_url,
          external_url,
          is_featured,
          is_published,
          category_id,
          created_at
        `
      )
      .eq("is_published", true)
      .order("is_featured", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      }),
  ]);

  const profileData = profile as Profile | null;
  const categoryList = (categories ?? []) as Category[];
  const projectList = (projects ?? []) as Project[];

  // =====================================================
  // 2. Map Category
  // =====================================================

  const categoryMap = new Map(
    categoryList.map((category) => [
      category.id,
      category.name,
    ])
  );

  // =====================================================
  // 3. Profile fallback
  // =====================================================

  const fullName =
    profileData?.full_name ||
    "นายชาตรี โยธาธรรม";

  const position =
    profileData?.position ||
    "ครู คศ.2 วิทยฐานะ ชำนาญการ";

  const institution =
    profileData?.institution ||
    "วิทยาลัยเทคนิคชุมแพ";

  const bio =
    profileData?.bio ||
    "Portfolio ผลงานทางวิชาชีพ การจัดการเรียนรู้ งานวิจัย นวัตกรรม และเทคโนโลยีดิจิทัล";

  // =====================================================
  // 4. Featured Projects
  // =====================================================

  const featuredProjects = projectList.filter(
    (project) => project.is_featured
  );

  // =====================================================
  // 5. Normal Projects
  // =====================================================

  const normalProjects = projectList.filter(
    (project) => !project.is_featured
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* ================================================= */}
      {/* Navigation */}
      {/* ================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-blue-700"
          >
            {fullName}
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">

            <a
              href="#about"
              className="text-slate-600 transition hover:text-blue-600"
            >
              เกี่ยวกับ
            </a>

            <a
              href="#categories"
              className="text-slate-600 transition hover:text-blue-600"
            >
              หมวดหมู่
            </a>

            <a
              href="#projects"
              className="text-slate-600 transition hover:text-blue-600"
            >
              ผลงาน
            </a>

            <a
              href="#contact"
              className="text-slate-600 transition hover:text-blue-600"
            >
              ติดต่อ
            </a>

          </nav>

          <Link
            href="/auth/login"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Admin
          </Link>

        </div>

      </header>

      {/* ================================================= */}
      {/* Hero */}
      {/* ================================================= */}

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700">

        {/* Decorative shapes */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-[1.4fr_0.6fr] md:items-center md:py-32">

          {/* Hero text */}
          <div>

            <p className="mb-5 inline-flex rounded-full border border-blue-300/30 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100">
              PROFESSIONAL PORTFOLIO
            </p>

            <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">

              {fullName}

            </h1>

            <p className="mt-5 text-xl font-medium text-blue-100 md:text-2xl">
              {position}
            </p>

            <p className="mt-2 text-lg text-blue-200">
              {institution}
            </p>

            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
              {bio}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">

              <a
                href="#projects"
                className="rounded-xl bg-white px-6 py-3 font-semibold text-blue-800 shadow-lg transition hover:bg-blue-50"
              >
                ดูผลงาน
              </a>

              <a
                href="#about"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
              >
                เกี่ยวกับฉัน
              </a>

            </div>

          </div>

          {/* Profile image */}
          <div className="flex justify-center md:justify-end">

            <div className="relative">

              <div className="absolute inset-0 rounded-3xl bg-cyan-300/20 blur-2xl" />

              <div className="relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur md:h-80 md:w-80">

                {profileData?.profile_image ? (
                  <img
                    src={profileData.profile_image}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-white">

                    <div className="text-7xl">
                      👨‍🏫
                    </div>

                    <p className="mt-4 text-sm text-blue-100">
                      Professional Portfolio
                    </p>

                  </div>
                )}

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* About */}
      {/* ================================================= */}

      <section
        id="about"
        className="mx-auto max-w-7xl px-6 py-20"
      >

        <div className="grid gap-8 md:grid-cols-2">

          <div>

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              About
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              เกี่ยวกับฉัน
            </h2>

          </div>

          <div>

            <p className="leading-8 text-slate-600">
              {bio}
            </p>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">

              <p className="text-sm text-slate-500">
                ตำแหน่ง
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {position}
              </p>

              <p className="mt-4 text-sm text-slate-500">
                สถานศึกษา
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {institution}
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* Categories */}
      {/* ================================================= */}

      <section
        id="categories"
        className="border-y border-slate-200 bg-white"
      >

        <div className="mx-auto max-w-7xl px-6 py-20">

          <div className="text-center">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Categories
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              หมวดหมู่ผลงาน
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-500">
              รวบรวมผลงานทางวิชาชีพ งานวิจัย นวัตกรรม
              การจัดการเรียนรู้ และเทคโนโลยี
            </p>

          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {categoryList.map((category) => (

              <a
                key={category.id}
                href={`#category-${category.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-700">
                  {category.sort_order === 1
                    ? "🔬"
                    : category.sort_order === 2
                    ? "💡"
                    : category.sort_order === 3
                    ? "🤖"
                    : category.sort_order === 4
                    ? "📚"
                    : category.sort_order === 5
                    ? "🎓"
                    : category.sort_order === 6
                    ? "🏆"
                    : category.sort_order === 7
                    ? "📜"
                    : "🎯"}
                </div>

                <h3 className="mt-5 font-bold text-slate-900 group-hover:text-blue-700">
                  {category.name}
                </h3>

                {category.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {category.description}
                  </p>
                )}

              </a>

            ))}

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* Featured Projects */}
      {/* ================================================= */}

      {featuredProjects.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-20">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Featured Projects
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                ผลงานเด่น
              </h2>

            </div>

          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2">

            {featuredProjects.map((project) => (

              <article
                key={project.id}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >

                {/* Image */}
                <div className="relative aspect-video overflow-hidden bg-slate-100">

                  {project.cover_image ? (
                    <img
                      src={project.cover_image}
                      alt={project.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">
                      🤖
                    </div>
                  )}

                  <div className="absolute left-4 top-4 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-yellow-950 shadow">
                    ⭐ FEATURED
                  </div>

                </div>

                {/* Content */}
                <div className="p-7">

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">

                    {project.year && (
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {project.year}
                      </span>
                    )}

                    {project.category_id && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                        {categoryMap.get(project.category_id) ||
                          "ผลงาน"}
                      </span>
                    )}

                  </div>

                  <h3 className="mt-4 text-2xl font-bold text-slate-900">
                    {project.title}
                  </h3>

                  {project.description && (
                    <p className="mt-3 line-clamp-3 leading-7 text-slate-600">
                      {project.description}
                    </p>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">

                    <Link
                      href={`/projects/${project.slug}`}
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      ดูรายละเอียด
                    </Link>

                    {project.external_url && (
                      <a
                        href={project.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        🔗 External
                      </a>
                    )}

                  </div>

                </div>

              </article>

            ))}

          </div>

        </section>
      )}

      {/* ================================================= */}
      {/* All Projects */}
      {/* ================================================= */}

      <section
        id="projects"
        className="bg-slate-100"
      >

        <div className="mx-auto max-w-7xl px-6 py-20">

          <div className="text-center">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Portfolio
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              ผลงานทั้งหมด
            </h2>

            <p className="mt-4 text-slate-500">
              ผลงานที่เผยแพร่สู่สาธารณะ
            </p>

          </div>

          {projectList.length === 0 ? (

            <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center">

              <div className="text-5xl">
                📂
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-800">
                ยังไม่มีผลงานที่เผยแพร่
              </h3>

              <p className="mt-2 text-slate-500">
                ผลงานจะแสดงที่นี่เมื่อ Admin เปิดการเผยแพร่
              </p>

            </div>

          ) : (

            <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">

              {projectList.map((project) => (

                <article
                  key={project.id}
                  id={
                    project.category_id
                      ? `category-${
                          categoryList.find(
                            (category) =>
                              category.id === project.category_id
                          )?.slug || project.id
                        }`
                      : undefined
                  }
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* Cover */}
                  <div className="aspect-video overflow-hidden bg-slate-100">

                    {project.cover_image ? (
                      <img
                        src={project.cover_image}
                        alt={project.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">
                        📁
                      </div>
                    )}

                  </div>

                  {/* Content */}
                  <div className="p-6">

                    <div className="flex flex-wrap gap-2">

                      {project.year && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {project.year}
                        </span>
                      )}

                      {project.category_id && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          {categoryMap.get(project.category_id) ||
                            "ผลงาน"}
                        </span>
                      )}

                    </div>

                    <h3 className="mt-4 text-xl font-bold text-slate-900">
                      {project.title}
                    </h3>

                    {project.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                        {project.description}
                      </p>
                    )}

                    <div className="mt-5">

                      <Link
                        href={`/projects/${project.slug}`}
                        className="inline-flex items-center font-semibold text-blue-700 transition hover:text-blue-900"
                      >
                        ดูรายละเอียด
                        <span className="ml-2 transition group-hover:translate-x-1">
                          →
                        </span>
                      </Link>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </div>

      </section>

      {/* ================================================= */}
      {/* Contact */}
      {/* ================================================= */}

      <section
        id="contact"
        className="mx-auto max-w-7xl px-6 py-20"
      >

        <div className="rounded-3xl bg-gradient-to-r from-blue-950 to-blue-700 p-8 text-white md:p-12">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">
            Contact
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            ติดต่อ
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-blue-100">
            หากต้องการติดต่อเกี่ยวกับผลงาน งานวิจัย
            การจัดการเรียนรู้ หรือนวัตกรรมทางเทคโนโลยี
            สามารถติดต่อได้ผ่านช่องทางของสถานศึกษา
          </p>

          <div className="mt-7">

            <p className="text-sm text-blue-200">
              สถานศึกษา
            </p>

            <p className="mt-1 text-lg font-semibold">
              {institution}
            </p>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* Footer */}
      {/* ================================================= */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">

          <p>
            © {new Date().getFullYear()} {fullName}
          </p>

          <p>
            Professional Portfolio
          </p>

        </div>

      </footer>

    </main>
  );
}