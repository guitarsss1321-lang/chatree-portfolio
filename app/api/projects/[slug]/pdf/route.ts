import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        {
          error: "ไม่พบ slug ของผลงาน",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // 1. ตรวจสอบผลงานผ่าน Public Supabase Client
    // =====================================================

    const supabase = await createClient();

    const { data: project, error: projectError } =
      await supabase
        .from("projects")
        .select(
          `
            id,
            title,
            slug,
            file_url,
            is_published
          `
        )
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

    if (projectError) {
      console.error(
        "Project query error:",
        projectError
      );

      return NextResponse.json(
        {
          error: "ไม่สามารถอ่านข้อมูลผลงานได้",
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // 2. ป้องกันการเปิด PDF ของ Draft
    // =====================================================

    if (!project) {
      return NextResponse.json(
        {
          error: "ไม่พบผลงานหรือผลงานนี้ยังไม่ได้เผยแพร่",
        },
        {
          status: 404,
        }
      );
    }

    if (!project.file_url) {
      return NextResponse.json(
        {
          error: "ผลงานนี้ไม่มีไฟล์ PDF",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // 3. ตรวจ Service Role Key ฝั่ง Server
    // =====================================================

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error(
        "Missing SUPABASE_SERVICE_ROLE_KEY"
      );

      return NextResponse.json(
        {
          error:
            "ระบบยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY",
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // 4. สร้าง Supabase Admin Client
    //
    // สำคัญ:
    // Service Role Key ใช้เฉพาะ Server เท่านั้น
    // ห้ามใช้ NEXT_PUBLIC_ และห้ามส่งให้ Browser
    // =====================================================

    const supabaseAdmin =
      createSupabaseAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

    // =====================================================
    // 5. file_url ของเราจะเก็บ Storage Path
    //
    // ตัวอย่าง:
    // 699ecbdd-5f03-465b-960a-3c63c6680e9b/xxxxx.pdf
    //
    // ถ้าระบบเก็บ URL เต็มมาแล้ว
    // ให้พยายามดึง path หลัง /portfolio-files/
    // =====================================================

    let filePath = project.file_url;

    if (
      filePath.startsWith("http://") ||
      filePath.startsWith("https://")
    ) {
      const marker = "/portfolio-files/";

      const markerIndex =
        filePath.indexOf(marker);

      if (markerIndex === -1) {
        return NextResponse.json(
          {
            error:
              "รูปแบบ URL ของไฟล์ PDF ไม่ถูกต้อง",
          },
          {
            status: 500,
          }
        );
      }

      filePath = filePath.substring(
        markerIndex + marker.length
      );
    }

    // =====================================================
    // 6. สร้าง Signed URL อายุ 10 นาที
    // =====================================================

    const { data: signedUrlData, error: signedUrlError } =
      await supabaseAdmin.storage
        .from("portfolio-files")
        .createSignedUrl(
          filePath,
          60 * 10
        );

    if (signedUrlError) {
      console.error(
        "Signed URL error:",
        signedUrlError
      );

      return NextResponse.json(
        {
          error:
            "ไม่สามารถสร้างลิงก์ PDF ได้",
          detail: signedUrlError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!signedUrlData?.signedUrl) {
      return NextResponse.json(
        {
          error:
            "ไม่พบ Signed URL ของไฟล์ PDF",
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // 7. Redirect ไปยัง PDF
    // =====================================================

    return NextResponse.redirect(
      signedUrlData.signedUrl
    );

  } catch (error) {
    console.error(
      "PDF API unexpected error:",
      error
    );

    return NextResponse.json(
      {
        error: "เกิดข้อผิดพลาดในการเปิด PDF",
      },
      {
        status: 500,
      }
    );
  }
}