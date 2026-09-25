import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  category_id: string | null;
  created_at: string;
};

type PageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function ProjectsPage({
  searchParams,
}: PageProps) {
  const supabase = await createClient();

  const params = await searchParams;
  const categorySlug = params.category?.trim() || "";

  // ==================================================
  // 1. โหลดหมวดหมู่จาก Database
  // ==================================================

  const { data: categories, error: categoryError } =
    await supabase
      .from("categories")
      .select(
        "id, name, slug, description, sort_order"
      )
      .eq("is_active", true)
      .order("sort_order", {
        ascending: true,
      });

  if (categoryError) {
    console.error(
      "Category loading error:",
      categoryError
    );
  }

  const categoryList = (categories ?? []) as Category[];

  // ==================================================
  // 2. หาหมวดที่เลือก
  // ==================================================

  const selectedCategory =
    categoryList.find(
      (category) => category.slug === categorySlug
    ) ?? null;

  // ==================================================
  // 3. โหลดผลงาน
  // ==================================================

  let projectQuery = supabase
    .from("projects")
    .select(
      `
        id,
        title,
        slug,
        description,
        year,
        cover_image,
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
    });

  // ถ้ามีหมวดที่เลือก ให้กรองด้วย category_id
  if (selectedCategory) {
    projectQuery = projectQuery.eq(
      "category_id",
      selectedCategory.id
    );
  }

  const { data: projects, error: projectError } =
    await projectQuery;

  if (projectError) {
    console.error(
      "Project loading error:",
      projectError
    );
  }

  const projectList = (projects ?? []) as Project[];

  // ==================================================
  // 4. Map ชื่อหมวด
  // ==================================================

  const categoryMap = new Map(
    categoryList.map((category) => [
      category.id,
      category.name,
    ])
  );

  // ==================================================
  // 5. หน้าเว็บ
  // ==================================================

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* ================================================= */}
      {/* Header */}
      {/* ================================================= */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            href="/"
            className="text-lg font-bold text-blue-700"
          >
            นายชาตรี โยธาธรรม
          </Link>

          <Link
            href="/"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← หน้าแรก
          </Link>

        </div>
      </header>

      {/* ================================================= */}
      {/* Main */}
      {/* ================================================= */}

      <section className="mx-auto max-w-7xl px-6 py-16">

        {/* Heading */}
        <div className="text-center">

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Portfolio
          </p>

          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            {selectedCategory
              ? selectedCategory.name
              : "ผลงานทั้งหมด"}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-500">
            {selectedCategory?.description ||
              "รวมผลงานทางวิชาชีพ งานวิจัย นวัตกรรม การจัดการเรียนรู้ และเทคโนโลยี"}
          </p>

        </div>

        {/* ================================================= */}
        {/* Category Filter */}
        {/* ================================================= */}

        <div className="mt-10 flex flex-wrap justify-center gap-3">

          {/* ทั้งหมด */}
          <Link
            href="/projects"
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              !selectedCategory
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
            }`}
          >
            ทั้งหมด
          </Link>

          {/* หมวดทั้งหมดจาก Database */}
          {categoryList.map((category) => (

            <Link
              key={category.id}
              href={`/projects?category=${encodeURIComponent(
                category.slug
              )}`}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                selectedCategory?.id === category.id
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              {category.name}
            </Link>

          ))}

        </div>

        {/* ================================================= */}
        {/* Projects */}
        {/* ================================================= */}

        {projectList.length === 0 ? (

          <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center">

            <div className="text-5xl">
              📂
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-800">
              ยังไม่มีผลงานในหมวดนี้
            </h2>

            <p className="mt-2 text-slate-500">
              ผลงานจะแสดงที่นี่เมื่อมีการเผยแพร่
            </p>

          </div>

        ) : (

          <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">

            {projectList.map((project) => (

              <article
                key={project.id}
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
                        {categoryMap.get(
                          project.category_id
                        ) || "ผลงาน"}
                      </span>
                    )}

                  </div>

                  <h2 className="mt-4 text-xl font-bold text-slate-900">
                    {project.title}
                  </h2>

                  {project.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                      {project.description}
                    </p>
                  )}

                  <div className="mt-5">

                    <Link
                      href={`/projects/${encodeURIComponent(
                        project.slug
                      )}`}
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

      </section>

    </main>
  );
}