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
          {isZh ? "最后更新：2026年6月" : isKo ? "최종 업데이트: 2026년 6월" : "Last updated: June 2026"}
        </p>

        {isZh ? (
          <div className="space-y-5 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>1. 我们收集的信息</h2>
              <p>我们收集您在填写问卷时主动提供的信息，包括：基本信息、出生信息、家庭背景、心理状态等问卷答案，以及用于账号创建的电子邮件地址。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>2. 敏感个人信息与单独同意</h2>
              <p>其中出生信息、家庭背景、过往经历及心理状态，属于《个人信息保护法》定义的敏感个人信息。我们收集这些信息，是生成您个人解析报告所必需的——没有它们，报告无法生成。在您提交问卷前，我们将就敏感个人信息的处理单独征得您的同意；您可以拒绝，但这将导致无法使用本服务。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>3. 信息使用方式与第三方处理</h2>
              <p>您的问卷数据仅用于生成您的个人生命代码报告。为完成这项服务，您的数据会经过以下必要的第三方处理方：</p>
              <p>· <strong style={{ color: "#4a8a4a" }}>DeepSeek</strong>：用于生成解析报告，处理过程中会接收您的问卷内容（含出生信息、经历等）。</p>
              <p>· <strong style={{ color: "#4a8a4a" }}>ZPay / 支付宝</strong>：用于处理支付，接收完成交易所必需的支付信息。</p>
              <p>除上述为完成服务所必需的处理方、以及法律要求的情形外，我们不会将您的个人信息出售、租借或共享给任何其他第三方。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>4. 数据存储、安全与跨境传输</h2>
              <p>您的数据存储在安全的云端数据库（Supabase）中，采用行级安全策略（RLS），传输层使用 HTTPS/TLS 加密，数据库静态采用 AES-256 加密，未经授权人员无法访问您的报告和问卷记录。</p>
              <p>请知悉：我们的数据库（Supabase）及服务器（阿里云香港）位于中国境外，您的个人信息将被传输至境外存储和处理，构成跨境传输。提交问卷即表示您理解并同意这一跨境处理。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>5. 数据保留与删除</h2>
              <p>我们会长期保留您的数据，直至您申请删除。您可随时通过发送邮件至我们的客服邮箱，申请删除您的账号及所有相关数据，我们将在收到请求后 15 个工作日内处理。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>6. Cookie</h2>
              <p>我们仅使用必要的功能性 Cookie 用于维持登录状态，不使用追踪或广告 Cookie。</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>7. 联系我们</h2>
              <p>如有隐私相关问题，请联系：theone208899@gmail.com</p>
            </section>
          </div>
        ) : isKo ? (
          <div className="space-y-5 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>1. 수집하는 정보</h2>
              <p>설문 작성 시 제공하신 정보(기본 정보, 출생 정보, 가정 배경, 심리 상태 등)와 계정 생성을 위한 이메일 주소를 수집합니다.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>2. 민감 정보 및 별도 동의</h2>
              <p>출생 정보, 가정 배경, 과거 경험 및 심리 상태는 민감 정보에 해당합니다. 이러한 정보는 개인 분석 보고서 생성에 반드시 필요하며, 제출 전 별도로 동의를 받습니다. 동의를 거부할 수 있으나, 이 경우 서비스를 이용할 수 없습니다.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>3. 정보 사용 및 제3자 처리</h2>
              <p>설문 데이터는 개인 생명 코드 보고서 생성에만 사용됩니다. 이를 위해 데이터는 다음 필수 제3자를 거칩니다:</p>
              <p>· <strong style={{ color: "#4a8a4a" }}>DeepSeek</strong>: 보고서 생성을 위해 설문 내용을 수신합니다.</p>
              <p>· <strong style={{ color: "#4a8a4a" }}>ZPay / Alipay</strong>: 결제 처리를 위해 필요한 결제 정보를 수신합니다.</p>
              <p>서비스 제공에 필수적인 위 처리자 및 법적 요구 사항을 제외하고, 제3자에게 판매, 대여 또는 공유하지 않습니다.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>4. 데이터 저장, 보안 및 국외 이전</h2>
              <p>데이터는 행 수준 보안(RLS), HTTPS/TLS 전송 암호화, AES-256 저장 암호화가 적용된 클라우드 데이터베이스(Supabase)에 저장되며, 권한 없는 사용자는 접근할 수 없습니다. 데이터베이스(Supabase) 및 서버(Alibaba Cloud 홍콩)는 해외에 위치하므로, 귀하의 정보는 국외로 이전되어 처리됩니다.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>5. 데이터 보관 및 삭제</h2>
              <p>데이터는 삭제 요청 시까지 보관됩니다. 언제든지 theone208899@gmail.com으로 계정 및 모든 관련 데이터 삭제를 요청할 수 있으며, 요청 후 15 영업일 이내에 처리됩니다.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>6. 문의</h2>
              <p>개인정보 관련 문의: theone208899@gmail.com</p>
            </section>
          </div>
        ) : (
          <div className="space-y-5 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>1. Information We Collect</h2>
              <p>We collect information you provide when completing the questionnaire, including survey answers (basic info, birth information, family background, psychological state, etc.) and your email address for account creation.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>2. Sensitive Information & Separate Consent</h2>
              <p>Birth information, family background, past experiences, and psychological state are sensitive personal information. We collect them because they are necessary to generate your personal report — without them, no report can be produced. We obtain your separate consent before you submit the questionnaire. You may decline, but you will then be unable to use the service.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>3. How We Use Your Information & Third-Party Processing</h2>
              <p>Your questionnaire data is used solely to generate your personal Life Code report. To deliver this service, your data passes through the following necessary third-party processors:</p>
              <p>· <strong style={{ color: "#4a8a4a" }}>DeepSeek</strong>: generates the report and receives your questionnaire content (including birth information and experiences).</p>
              <p>· <strong style={{ color: "#4a8a4a" }}>ZPay / Alipay</strong>: processes payment and receives the payment information needed to complete the transaction.</p>
              <p>Other than the processors necessary to deliver the service and cases required by law, we do not sell, rent, or share your personal information with any other third parties.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>4. Data Storage, Security & Cross-Border Transfer</h2>
              <p>Your data is stored in a secure cloud database (Supabase) with row-level security (RLS), HTTPS/TLS encryption in transit, and AES-256 encryption at rest. Unauthorized personnel cannot access your reports or questionnaire records.</p>
              <p>Please note: our database (Supabase) and server (Alibaba Cloud Hong Kong) are located outside mainland China. Your personal information will be transferred abroad for storage and processing, constituting a cross-border transfer. By submitting the questionnaire, you understand and agree to this cross-border processing.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>5. Data Retention & Deletion</h2>
              <p>We retain your data until you request its deletion. You may request deletion of your account and all associated data at any time by emailing our support address; we will process your request within 15 business days of receipt.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>6. Cookies</h2>
              <p>We only use essential functional cookies to maintain login sessions. We do not use tracking or advertising cookies.</p>
            </section>
            <section className="space-y-2">
              <h2 className="font-bold" style={{ color: "#00ff88" }}>7. Contact</h2>
              <p>For privacy-related questions: theone208899@gmail.com</p>
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
