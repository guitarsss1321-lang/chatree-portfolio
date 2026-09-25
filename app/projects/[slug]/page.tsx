import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  categories:
    | {
        id: string;
        name: string;
        slug: string;
        description: string | null;
      }[]
    | null;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProjectDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;

  // รองรับ Slug ภาษาไทยและอักขระที่ถูก encode มากับ URL
  const decodedSlug = decodeURIComponent(slug).trim();

  const supabase = await createClient();

  const { data: projectData, error } = await supabase
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
        created_at,
        categories (
          id,
          name,
          slug,
          description
        )
      `
    )
    .eq("slug", decodedSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Project detail error:", error);
    notFound();
  }

  if (!projectData) {
    notFound();
  }

  const project = projectData as Project;

  const category = project.categories?.[0] ?? null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <Link
            href="/"
            className="text-lg font-bold text-blue-700"
          >
            นายชาตรี โยธาธรรม
          </Link>

          <Link
            href="/#projects"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← กลับผลงาน
          </Link>

        </div>
      </header>

      {/* Main */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">

        {/* Breadcrumb */}
        <div className="mb-8 text-sm text-slate-500">

          <Link
            href="/"
            className="hover:text-blue-600"
          >
            Portfolio
          </Link>

          <span className="mx-2">
            /
          </span>

          <span className="text-slate-700">
            {project.title}
          </span>

        </div>

        {/* Project */}
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* Cover */}
          <div className="relative aspect-video w-full overflow-hidden bg-slate-100">

            {project.cover_image ? (
              <img
                src={project.cover_image}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-950 to-blue-600">

                <div className="text-center text-white">

                  <div className="text-7xl">
                    🤖
                  </div>

                  <p className="mt-4 text-lg font-medium">
                    Project Portfolio
                  </p>

                </div>

              </div>
            )}

            {project.is_featured && (
              <div className="absolute left-5 top-5 rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-yellow-950 shadow-lg">
                ⭐ ผลงานเด่น
              </div>
            )}

          </div>

          {/* Content */}
          <div className="p-7 md:p-10">

            {/* Information */}
            <div className="flex flex-wrap gap-3">

              {project.year && (
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  📅 {project.year}
                </span>
              )}

              {category && (
                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  🗂️ {category.name}
                </span>
              )}

            </div>

            {/* Title */}
            <h1 className="mt-6 text-3xl font-black leading-tight text-slate-900 md:text-5xl">
              {project.title}
            </h1>

            {/* Description */}
            {project.description && (
              <div className="mt-8">

                <h2 className="text-xl font-bold text-slate-900">
                  รายละเอียดผลงาน
                </h2>

                <div className="mt-4 whitespace-pre-line text-base leading-8 text-slate-600 md:text-lg">
                  {project.description}
                </div>

              </div>
            )}

            {/* Category description */}
            {category?.description && (
              <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">

                <p className="text-sm font-semibold text-blue-700">
                  หมวดหมู่
                </p>

                <p className="mt-2 text-slate-700">
                  {category.description}
                </p>

              </div>
            )}

            {/* Buttons */}
            <div className="mt-10 flex flex-wrap gap-4 border-t border-slate-200 pt-8">

              {project.file_url && (
                <a
                  href={`/api/projects/${encodeURIComponent(
                    project.slug
                  )}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-red-700"
                >
                  📄 เปิดเอกสาร PDF
                </a>
              )}

              {project.external_url && (
                <a
                  href={project.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  🔗 เปิดเว็บไซต์ภายนอก
                </a>
              )}

              <Link
                href="/#projects"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ← กลับรายการผลงาน
              </Link>

            </div>

          </div>

        </article>

      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">

          <p>
            © {new Date().getFullYear()} นายชาตรี โยธาธรรม
          </p>

          <p>
            Professional Portfolio
          </p>

        </div>

      </footer>

    </main>
  );
}