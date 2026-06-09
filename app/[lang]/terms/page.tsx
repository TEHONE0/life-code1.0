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
          {isZh ? "最后更新：2026年6月" : isKo ? "최종 업데이트: 2026년 6월" : "Last updated: June 2026"}
        </p>

        {isZh ? (
          <div className="space-y-5 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>1. 服务说明</h2>
              <p>生命代码（Life Code）提供基于 AI 的心理分析报告服务，旨在帮助您进行自我觉察。报告内容仅供参考，属于心理分析与自我探索，并非命运预测、占卜或算命，也不构成专业心理咨询、医疗诊断或法律建议。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>2. 年龄限制</h2>
              <p>本服务仅面向 14 周岁以上的用户。不满 14 周岁者不得使用本服务；14 至 18 周岁的未成年人，须在监护人知情并同意后方可使用。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>3. 心理健康与危机声明</h2>
              <p>本服务是自我觉察工具，不能替代心理咨询、心理治疗或医疗诊断。如果您正处于心理危机、有自我伤害或伤害他人的念头，请立即寻求专业帮助，拨打全国 24 小时心理援助热线 <strong style={{ color: "#4a8a4a" }}>12356</strong>，或北京心理危机研究与干预中心热线 <strong style={{ color: "#4a8a4a" }}>010-82951332</strong>。如遇紧急情况请拨打 120。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>4. 付款与退款</h2>
              <p>报告为一次性数字商品，付款后即时生成。由于数字内容的特殊性，报告生成后不支持退款。您完成支付并使用本服务，即视为已阅读并同意本退款条款。如遇技术故障导致报告未能正常生成，请联系客服，我们将重新为您生成或退款。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>5. 用户责任</h2>
              <p>您须保证填写的信息真实，并对您账号下的所有活动负责。禁止使用本服务进行任何违法活动。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>6. 免责声明</h2>
              <p>AI 生成的报告基于您提供的信息，结果因人而异。我们不对报告内容的准确性或适用性作任何保证，您应自行判断并对依据报告作出的任何决定负责。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>7. 运营主体与联系方式</h2>
              <p>本服务由 Life Code 运营。如有疑问，请联系：theone@lifecode9.com</p>
            </section>
          </div>
        ) : isKo ? (
          <div className="space-y-5 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>1. 서비스 설명</h2>
              <p>Life Code는 자기 인식을 돕기 위한 AI 기반 심리 분석 보고서 서비스입니다. 보고서는 참고용이며 심리 분석 및 자기 탐색을 목적으로 합니다. 운명 예측, 점술 또는 사주가 아니며, 전문 심리 상담, 의료 진단 또는 법적 조언을 대체하지 않습니다.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>2. 연령 제한</h2>
              <p>본 서비스는 만 14세 이상 사용자를 대상으로 합니다. 만 14세 미만은 이용할 수 없으며, 만 14~18세 미성년자는 보호자의 동의 후 이용할 수 있습니다.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>3. 정신 건강 및 위기 안내</h2>
              <p>본 서비스는 자기 인식 도구이며 심리 상담, 치료 또는 의료 진단을 대체할 수 없습니다. 위기 상황이거나 자해 또는 타인을 해칠 생각이 든다면 즉시 전문가의 도움을 받으십시오. 한국 자살예방 상담전화 <strong style={{ color: "#4a8a4a" }}>109</strong>, 또는 긴급 시 119로 연락하십시오.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>4. 결제 및 환불</h2>
              <p>보고서는 일회성 디지털 상품으로 결제 후 즉시 생성됩니다. 디지털 콘텐츠 특성상 생성 후 환불이 불가하며, 결제 시 본 약관에 동의하신 것으로 간주됩니다. 기술적 오류로 보고서가 생성되지 않은 경우 고객 지원에 문의해 주시면 재생성 또는 환불해 드립니다.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>5. 운영 주체 및 문의</h2>
              <p>본 서비스는 Life Code가 운영합니다. 문의: theone@lifecode9.com</p>
            </section>
          </div>
        ) : (
          <div className="space-y-5 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>1. Service Description</h2>
              <p>Life Code provides an AI-based psychological analysis report service intended to support self-reflection. Report content is for reference only and is a form of psychological analysis and self-exploration. It is not fortune-telling, divination, or fate prediction, and does not constitute professional psychological counseling, medical diagnosis, or legal advice.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>2. Age Restriction</h2>
              <p>This service is intended for users aged 14 and above. Persons under 14 may not use the service; minors aged 14 to 18 may use it only with the knowledge and consent of a guardian.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>3. Mental Health & Crisis Notice</h2>
              <p>This service is a self-awareness tool and cannot replace psychological counseling, therapy, or medical diagnosis. If you are in crisis or have thoughts of harming yourself or others, please seek professional help immediately. Contact your local crisis line, or in an emergency call your local emergency number.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>4. Payment & Refunds</h2>
              <p>Reports are one-time digital products generated immediately after payment. Due to the nature of digital content, refunds are not available once the report is generated. By completing payment and using the service, you are deemed to have read and agreed to this refund clause. If a technical failure prevents your report from generating, please contact support for a re-generation or refund.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>5. User Responsibilities</h2>
              <p>You agree to provide accurate information and are responsible for all activities under your account. You may not use this service for any unlawful purposes.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>6. Disclaimer</h2>
              <p>AI-generated reports are based on the information you provide. Results may vary. We make no guarantees regarding the accuracy or applicability of report content, and you are responsible for any decisions you make based on it.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>7. Operator & Contact</h2>
              <p>This service is operated by Life Code. For questions, contact: theone@lifecode9.com</p>
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
