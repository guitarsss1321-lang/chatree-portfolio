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
        .select(`
          id,
          full_name,
          position,
          institution,
          bio,
          profile_image,
          email,
          phone
        `)
        .limit(1)
        .maybeSingle(),

      supabase
        .from("categories")
        .select(`
          id,
          name,
          slug,
          description,
          sort_order
        `)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("projects")
        .select(`
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
        `)
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  const profileData = profile as Profile | null;
  const categoryList = (categories ?? []) as Category[];
  const projectList = (projects ?? []) as Project[];

  const featuredProjects = projectList.filter(
    (project) => project.is_featured
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
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
                  className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-yellow-950 shadow-lg transition hover:bg-yellow-300"
                >
                  ดูผลงาน
                </a>

                <a
                  href="#about"
                  className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20"
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
      <section className="bg-white py-20">
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
                  href={`/projects?category=${encodeURIComponent(
                    category.slug
                  )}`}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-50 hover:shadow-lg"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl transition group-hover:bg-blue-600 group-hover:text-white">
                    📁
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-slate-900">
                    {category.name}
                  </h3>

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
            className="inline-flex w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
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
                  <div className="aspect-video bg-slate-100">
                    {project.cover_image ? (
                      <img
                        src={project.cover_image}
                        alt={project.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-950 to-blue-600">
                        <div className="text-center text-white">
                          <div className="text-6xl">🤖</div>
                          <p className="mt-3 font-medium">
                            Project Portfolio
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {project.year && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {project.year}
                        </span>
                      )}

                      {category && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          {category.name}
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

                    <Link
                      href={`/projects/${encodeURIComponent(project.slug)}`}
                      className="mt-5 inline-flex font-semibold text-blue-700 hover:text-blue-900"
                    >
                      รายละเอียดผลงาน →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">📂</div>

            <h3 className="mt-4 text-xl font-bold">
              ยังไม่มีผลงานเด่น
            </h3>

            <p className="mt-2 text-slate-500">
              สามารถเลือกผลงานเด่นได้จากระบบผู้ดูแล
            </p>
          </div>
        )}
      </section>

      {/* ALL PROJECTS */}
      <section className="bg-slate-100 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
                All Projects
              </p>

              <h2 className="mt-3 text-3xl font-black md:text-4xl">
                ผลงานทั้งหมด
              </h2>

              <p className="mt-4 text-slate-500">
                ผลงานทั้งหมดที่เผยแพร่บนเว็บไซต์
              </p>
            </div>

            <Link
              href="/projects"
              className="inline-flex w-fit rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              เปิดหน้าผลงานทั้งหมด →
            </Link>
          </div>

          {projectList.length > 0 ? (
            <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {projectList.map((project) => {
                const category = categoryList.find(
                  (item) => item.id === project.category_id
                );

                return (
                  <article
                    key={project.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="aspect-video bg-slate-100">
                      {project.cover_image ? (
                        <img
                          src={project.cover_image}
                          alt={project.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl">
                          📁
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex flex-wrap gap-2">
                        {project.year && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {project.year}
                          </span>
                        )}

                        {category && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            {category.name}
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

                      <Link
                        href={`/projects/${encodeURIComponent(
                          project.slug
                        )}`}
                        className="mt-5 inline-flex font-semibold text-blue-700 hover:text-blue-900"
                      >
                        รายละเอียดผลงาน →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl bg-white p-12 text-center shadow-sm">
              <div className="text-5xl">📂</div>

              <h3 className="mt-4 text-xl font-bold">
                ยังไม่มีผลงาน
              </h3>

              <p className="mt-2 text-slate-500">
                ยังไม่มีผลงานที่เผยแพร่บนเว็บไซต์
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-r from-blue-950 to-blue-700 p-8 text-white shadow-xl md:p-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-blue-200">
                Contact
              </p>

              <h2 className="mt-3 text-3xl font-black md:text-4xl">
                ติดต่อ
              </h2>

              <p className="mt-4 max-w-xl leading-8 text-blue-100">
                สามารถติดต่อเพื่อสอบถามข้อมูลเกี่ยวกับผลงาน
                งานวิจัย นวัตกรรม และการจัดการเรียนรู้ได้
              </p>
            </div>

            <div className="space-y-4 md:text-right">
              {profileData?.email && (
                <div>
                  <p className="text-sm text-blue-200">Email</p>

                  <a
                    href={`mailto:${profileData.email}`}
                    className="font-semibold text-white hover:text-yellow-300"
                  >
                    {profileData.email}
                  </a>
                </div>
              )}

              {profileData?.phone && (
                <div>
                  <p className="text-sm text-blue-200">โทรศัพท์</p>

                  <a
                    href={`tel:${profileData.phone}`}
                    className="font-semibold text-white hover:text-yellow-300"
                  >
                    {profileData.phone}
                  </a>
                </div>
              )}

              <div>
                <p className="text-sm text-blue-200">
                  สถานศึกษา
                </p>

                <p className="font-semibold text-white">
                  {profileData?.institution ||
                    "วิทยาลัยเทคนิคชุมแพ"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()}{" "}
            {profileData?.full_name || "นายชาตรี โยธาธรรม"}
          </p>

          <p>Professional Portfolio</p>
        </div>
      </footer>
    </main>
  );
}