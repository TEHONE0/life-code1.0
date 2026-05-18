"use client";
import { useParams, useRouter } from "next/navigation";
import { Lang } from "@/lib/i18n";

export default function TermsPage() {
  const params = useParams();
  const lang = (params.lang as Lang) ?? "en";
  const router = useRouter();

  const isZh = lang === "zh";
  const isKo = lang === "ko";

  return (
    <main className="min-h-screen px-5 py-12" style={{ background: "#050a05", color: "#94a3b8", fontFamily: "Courier New, monospace" }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-xs" style={{ color: "#2d5a2d" }}>// TERMS OF SERVICE</div>
        <h1 className="text-2xl font-bold" style={{ color: "#00ff88" }}>
          {isZh ? "服务条款" : isKo ? "서비스 이용약관" : "Terms of Service"}
        </h1>
        <p className="text-xs" style={{ color: "#4a7a4a" }}>
          {isZh ? "最后更新：2026年5月" : isKo ? "최종 업데이트: 2026년 5월" : "Last updated: May 2026"}
        </p>

        {isZh ? (
          <div className="space-y-5 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>1. 服务说明</h2>
              <p>生命代码（Life Code）提供基于 AI 的心理分析报告服务。报告内容仅供参考，不构成专业心理咨询、医疗诊断或法律建议。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>2. 付款与退款</h2>
              <p>报告为一次性数字商品，付款后即时生成。由于数字内容的特殊性，报告生成后不支持退款。如遇技术故障导致报告未能正常生成，请联系客服，我们将重新为您生成或退款。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>3. 用户责任</h2>
              <p>您须保证填写的信息真实，并对您账号下的所有活动负责。禁止使用本服务进行任何违法活动。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>4. 免责声明</h2>
              <p>AI 生成的报告基于您提供的信息，结果因人而异。我们不对报告内容的准确性或适用性作任何保证。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>5. 联系我们</h2>
              <p>service@lifecode.app</p>
            </section>
          </div>
        ) : isKo ? (
          <div className="space-y-5 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>1. 서비스 설명</h2>
              <p>Life Code는 AI 기반 심리 분석 보고서 서비스입니다. 보고서 내용은 참고용이며 전문 심리 상담, 의료 진단 또는 법적 조언을 대체하지 않습니다.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>2. 결제 및 환불</h2>
              <p>보고서는 일회성 디지털 상품으로 결제 후 즉시 생성됩니다. 기술적 오류로 보고서가 생성되지 않은 경우 고객 지원에 문의해 주시면 재생성 또는 환불해 드립니다.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>3. 문의</h2>
              <p>service@lifecode.app</p>
            </section>
          </div>
        ) : (
          <div className="space-y-5 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>1. Service Description</h2>
              <p>Life Code provides AI-based psychological analysis reports. Report content is for reference only and does not constitute professional psychological counseling, medical diagnosis, or legal advice.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>2. Payment & Refunds</h2>
              <p>Reports are one-time digital products generated immediately after payment. Due to the nature of digital content, refunds are not available once the report is generated. If a technical failure prevents your report from generating, please contact support for a re-generation or refund.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>3. User Responsibilities</h2>
              <p>You agree to provide accurate information and are responsible for all activities under your account. You may not use this service for any unlawful purposes.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>4. Disclaimer</h2>
              <p>AI-generated reports are based on the information you provide. Results may vary. We make no guarantees regarding the accuracy or applicability of report content.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>5. Contact</h2>
              <p>service@lifecode.app</p>
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
