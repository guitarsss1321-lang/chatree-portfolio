import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  id: string;
  full_name: string | null;
  position: string | null;
  institution: string | null;
  bio: string | null;
  profile_image: string | null;
  email: string | null;
  phone: string | null;
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

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: profile }, { data: categories }, { data: projects }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, position, institution, bio, profile_image, email, phone"
        )
        .limit(1)
        .maybeSingle(),

      supabase
        .from("categories")
        .select("id, name, slug, description, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("projects")
        .select(
          "id, title, slug, description, year, cover_image, file_url, external_url, is_featured, is_published, category_id, created_at"
        )
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  const profileData = profile as Profile | null;
  const categoryList = (categories ?? []) as Category[];
  const projectList = (projects ?? []) as Project[];
  const featuredProjects = projectList.filter((project) => project.is_featured);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link
            href="/"
            className="text-lg font-bold text-blue-700 hover:text-blue-900"
          >
            {profileData?.full_name || "นายชาตรี โยธาธรรม"}
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#about" className="hover:text-blue-700">
              เกี่ยวกับฉัน
            </a>
            <a href="#categories" className="hover:text-blue-700">
              หมวดหมู่
            </a>
            <a href="#projects" className="hover:text-blue-700">
              ผลงาน
            </a>
            <a href="#contact" className="hover:text-blue-700">
              ติดต่อ
            </a>
          </nav>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            Admin
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-300 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-yellow-300 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
                Professional Portfolio
              </p>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                {profileData?.full_name || "นายชาตรี โยธาธรรม"}
              </h1>

              <p className="mt-5 text-xl font-medium text-blue-100 md:text-2xl">
                {profileData?.position || "ครู คศ.2 วิทยฐานะ ชำนาญการ"}
              </p>

              <p className="mt-3 text-lg text-blue-100">
                {profileData?.institution || "วิทยาลัยเทคนิคชุมแพ"}
              </p>

              {profileData?.bio && (
                <p className="mt-6 max-w-2xl text-base leading-8 text-blue-50 md:text-lg">
                  {profileData.bio}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#projects"
                  className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-yellow-950 shadow-lg hover:bg-yellow-300"
                >
                  ดูผลงาน
                </a>

                <a
                  href="#about"
                  className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/20"
                >
                  เกี่ยวกับฉัน
                </a>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="relative">
                <div className="absolute -inset-4 rounded-[2rem] bg-white/10 blur-xl" />

                <div className="relative h-64 w-64 overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl md:h-80 md:w-80">
                  {profileData?.profile_image ? (
                    <img
                      src={profileData.profile_image}
                      alt={profileData.full_name || "Profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-700 to-blue-500">
                      <div className="text-center">
                        <div className="text-7xl">👨‍🏫</div>
                        <p className="mt-4 font-semibold">Portfolio</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
            About Me
          </p>
          <h2 className="mt-3 text-3xl font-black md:text-4xl">
            เกี่ยวกับฉัน
          </h2>
          <div className="mt-6 text-lg leading-8 text-slate-600">
            {profileData?.bio ? (
              <p className="whitespace-pre-line">{profileData.bio}</p>
            ) : (
              <p>
                แหล่งรวบรวมประวัติ ผลงาน งานวิจัย นวัตกรรม
                และผลงานด้านการจัดการเรียนรู้
              </p>
            )}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Categories
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              หมวดหมู่ผลงาน
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-500">
              เลือกดูผลงานตามประเภทที่สนใจ
            </p>
          </div>

          {categoryList.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {categoryList.map((category) => (
                <Link
                  key={category.id}
                  href={`/projects?category=${encodeURIComponent(category.slug)}`}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-50 hover:shadow-lg"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl group-hover:bg-blue-600 group-hover:text-white">
                    📁
                  </div>

                  <h3 className="mt-5 text-xl font-bold">{category.name}</h3>

                  {category.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                      {category.description}
                    </p>
                  )}

                  <div className="mt-5 font-semibold text-blue-700">
                    ดูผลงาน →
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
              <div className="text-5xl">📂</div>
              <p className="mt-4 font-semibold text-slate-700">
                ยังไม่มีหมวดหมู่ผลงาน
              </p>
            </div>
          )}
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section id="projects" className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Featured Projects
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              ผลงานเด่น
            </h2>
            <p className="mt-4 text-slate-500">
              ผลงานที่คัดเลือกให้แสดงเป็นผลงานเด่น
            </p>
          </div>

          <Link
            href="/projects"
            className="inline-flex w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            ดูผลงานทั้งหมด →
          </Link>
        </div>

        {featuredProjects.length > 0 ? (
          <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((project) => {
              const category = categoryList.find(
                (item) => item.id === project.category_id
              );

              return (
                <article
                  key={project.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <Link href={`/projects/${project.slug}`}>
                    <div className="aspect-video bg-slate-100">
                      {project.cover_image ? (
                        <img
                          src={project.cover_image}
                          alt={project.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-950 to-blue-600">
                          <span className="text-5xl">📁</span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        {category && (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {category.name}
                          </span>
                        )}

                        {project.year && (
                          <span className="text-xs text-slate-500">
                            {project.year}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 text-xl font-bold hover:text-blue-700">
                        {project.title}
                      </h3>

                      {project.description && (
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                          {project.description}
                        </p>
                      )}

                      <div className="mt-5 font-semibold text-blue-700">
                        ดูรายละเอียด →
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="text-5xl">🏆</div>
            <p className="mt-4 font-semibold text-slate-700">
              ยังไม่มีผลงานเด่น
            </p>
          </div>
        )}
      </section>

      {/* ALL PROJECTS */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Portfolio
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              ผลงานทั้งหมด
            </h2>
          </div>

          {projectList.length > 0 ? (
            <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {projectList.slice(0, 6).map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                >
                  <div className="aspect-video overflow-hidden rounded-xl bg-slate-100">
                    {project.cover_image ? (
                      <img
                        src={project.cover_image}
                        alt={project.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-900 to-blue-500 text-5xl">
                        📁
                      </div>
                    )}
                  </div>

                  <h3 className="mt-5 text-lg font-bold group-hover:text-blue-700">
                    {project.title}
                  </h3>

                  {project.year && (
                    <p className="mt-2 text-sm text-slate-500">
                      ปี {project.year}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              ยังไม่มีผลงานที่เผยแพร่
            </div>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-r from-blue-950 to-blue-700 px-8 py-12 text-white md:px-12">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-200">
            Contact
          </p>

          <h2 className="mt-3 text-3xl font-black md:text-4xl">
            ติดต่อ
          </h2>

          <div className="mt-8 grid gap-4 text-blue-50 md:grid-cols-2">
            {profileData?.email && (
              <div>
                <span className="font-semibold text-white">อีเมล:</span>{" "}
                {profileData.email}
              </div>
            )}

            {profileData?.phone && (
              <div>
                <span className="font-semibold text-white">โทรศัพท์:</span>{" "}
                {profileData.phone}
              </div>
            )}

            <div>
              <span className="font-semibold text-white">หน่วยงาน:</span>{" "}
              {profileData?.institution || "วิทยาลัยเทคนิคชุมแพ"}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()}{" "}
            {profileData?.full_name || "นายชาตรี โยธาธรรม"}
          </p>

          <Link
            href="/admin"
            className="font-medium text-blue-700 hover:text-blue-900"
          >
            Admin
          </Link>
        </div>
      </footer>
    </main>
  );
}
