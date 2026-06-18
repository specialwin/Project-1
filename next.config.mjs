/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Server Actions ทำงานแบบ same-origin โดยอัตโนมัติ จึงไม่ผูกกับ localhost
  // (รองรับทั้ง dev และโดเมนจริงบน Vercel โดยไม่ต้องตั้งค่าเพิ่ม)
};

export default nextConfig;
