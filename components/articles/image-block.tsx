// ============================================================
// Siam Heritage - Single Image Block (ปรับขนาดได้ + Caption กลาง)
// ============================================================
// ใช้ render ภาพเดี่ยวในบทความ ทั้ง 3 จุด:
//   - editor preview (renderPreview)
//   - markdown-preview (ใน modal ของ editor)
//   - หน้า article สาธารณะ (article-detail)
//
// จัดการ alignment (center/left/right) + ความกว้าง (full/75/50/25)
// - บนมือถือ (mobile) → ภาพแสดงเต็มความกว้างเสมอ (100%)
// - บนจอใหญ่ → ลดขนาดตาม width ที่ตั้งไว้
// - Caption อยู่กลางเสมอ
// ============================================================

export interface SingleImageBlock {
  src: string;
  alt?: string;
  caption?: string;
  align?: "center" | "left" | "right";
  width?: "full" | "75" | "50" | "25";
}

// width class: บนจอ desktop ใช้สัดส่วน (เริ่ม md+), บน mobile บังคับ 100%
function widthClass(width: "full" | "75" | "50" | "25"): string {
  switch (width) {
    case "75":
      return "w-full md:w-[75%]";
    case "50":
      return "w-full md:w-[50%]";
    case "25":
      return "w-full md:w-[25%]";
    default:
      return "w-full";
  }
}

export function renderImageBlock({
  src,
  alt,
  caption,
  align = "center",
  width = "full",
}: SingleImageBlock) {
  const widthCls = widthClass(width);

  // left/right → float (ชิดตามขอบ) บนจอใหญ่, บน mobile ลอยกลางแบบเต็มกว้าง
  if (align === "left" || align === "right") {
    return (
      <div
        className={
          `my-5 ${align === "left" ? "xl:float-left xl:mr-6" : "xl:float-right xl:ml-6"} ` +
          `xl:max-w-[40%] w-full`
        }
      >
        <div className={`mx-auto ${widthCls}`}>
          <img
            src={src}
            alt={alt || ""}
            loading="lazy"
            className="block rounded-xl max-w-full h-auto mx-auto"
          />
          {caption && (
            <p className="text-white/50 text-sm mt-1.5 text-center italic leading-snug">
              {caption}
            </p>
          )}
        </div>
      </div>
    );
  }

  // center
  return (
    <div className="my-5 w-full">
      <div className={`mx-auto ${widthCls}`}>
        <img
          src={src}
          alt={alt || ""}
          loading="lazy"
          className="block rounded-xl max-w-full h-auto mx-auto"
        />
        {caption && (
          <p className="text-white/50 text-sm mt-1.5 text-center italic leading-snug">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}
