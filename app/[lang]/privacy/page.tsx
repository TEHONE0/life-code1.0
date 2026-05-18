"use client";
import { useParams, useRouter } from "next/navigation";
import { Lang } from "@/lib/i18n";

export default function PrivacyPage() {
  const params = useParams();
  const lang = (params.lang as Lang) ?? "en";
  const router = useRouter();

  const isZh = lang === "zh";
  const isKo = lang === "ko";

  return (
    <main className="min-h-screen px-5 py-12" style={{ background: "#050a05", color: "#94a3b8", fontFamily: "Courier New, monospace" }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-xs" style={{ color: "#2d5a2d" }}>// PRIVACY POLICY</div>
        <h1 className="text-2xl font-bold" style={{ color: "#00ff88" }}>
          {isZh ? "隐私政策" : isKo ? "개인정보 처리방침" : "Privacy Policy"}
        </h1>
        <p className="text-xs" style={{ color: "#4a7a4a" }}>
          {isZh ? "最后更新：2026年5月" : isKo ? "최종 업데이트: 2026년 5월" : "Last updated: May 2026"}
        </p>

        {isZh ? (
          <div className="space-y-5 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>1. 我们收集的信息</h2>
              <p>我们收集您在填写问卷时主动提供的信息，包括：基本信息、家庭背景、心理状态等问卷答案，以及用于账号创建的电子邮件地址。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>2. 信息使用方式</h2>
              <p>您的问卷数据仅用于生成您的个人生命代码报告。我们不会将您的个人信息出售、租借或共享给任何第三方，除非法律要求。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>3. 数据存储与安全</h2>
              <p>您的数据存储在安全的云端数据库中（Supabase），采用行级安全策略，只有您本人可以访问自己的报告和问卷记录。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>4. 数据删除</h2>
              <p>您可随时通过发送邮件至我们的客服邮箱申请删除您的账号及所有相关数据。我们将在30天内处理您的请求。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>5. Cookie</h2>
              <p>我们仅使用必要的功能性 Cookie 用于维持登录状态，不使用追踪或广告 Cookie。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>6. 联系我们</h2>
              <p>如有隐私相关问题，请联系：support@lifecode.app</p>
            </section>
          </div>
        ) : isKo ? (
          <div className="space-y-5 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>1. 수집하는 정보</h2>
              <p>설문 작성 시 제공하신 정보(기본 정보, 가정 배경, 심리 상태 등)와 계정 생성을 위한 이메일 주소를 수집합니다.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>2. 정보 사용 방법</h2>
              <p>설문 데이터는 개인 생명 코드 보고서 생성에만 사용됩니다. 법적 요구가 없는 한 제3자에게 판매, 대여 또는 공유하지 않습니다.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>3. 데이터 삭제</h2>
              <p>언제든지 support@lifecode.app으로 이메일을 보내 계정 및 모든 관련 데이터 삭제를 요청할 수 있습니다.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>4. 문의</h2>
              <p>개인정보 관련 문의: support@lifecode.app</p>
            </section>
          </div>
        ) : (
          <div className="space-y-5 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>1. Information We Collect</h2>
              <p>We collect information you provide when completing the questionnaire, including survey answers (basic info, family background, psychological state, etc.) and your email address for account creation.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>2. How We Use Your Information</h2>
              <p>Your questionnaire data is used solely to generate your personal Life Code report. We do not sell, rent, or share your personal information with any third parties, unless required by law.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>3. Data Storage & Security</h2>
              <p>Your data is stored in a secure cloud database (Supabase) with row-level security. Only you can access your own reports and questionnaire records.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>4. Data Deletion</h2>
              <p>You may request deletion of your account and all associated data at any time by emailing support@lifecode.app. We will process your request within 30 days.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>5. Cookies</h2>
              <p>We only use essential functional cookies to maintain login sessions. We do not use tracking or advertising cookies.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>6. Contact</h2>
              <p>For privacy-related questions: support@lifecode.app</p>
            </section>
          </div>
        )}

        <button
          onClick={() => router.back()}
          className="text-xs mt-8"
          style={{ color: "#4a8a4a", background: "transparent", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff88")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#4a8a4a")}
        >
          ← {isZh ? "返回" : isKo ? "뒤로" : "Back"}
        </button>
      </div>
    </main>
  );
}
