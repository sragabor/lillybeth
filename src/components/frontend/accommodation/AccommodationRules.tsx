'use client';

import { useFrontendLanguage } from '@/contexts/FrontendLanguageContext';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface HouseRule {
  id: string;
  rule: Record<string, string> | string;
}

interface AccommodationRulesProps {
  houseRules: HouseRule[];
  cancellationPolicy: string;
  paymentMethods: string;
  depositInfo: string;
  getLocalizedText: (field: Record<string, string> | string | null | undefined) => string;
}

export function AccommodationRules({
  houseRules,
  cancellationPolicy,
  paymentMethods,
  depositInfo,
  getLocalizedText,
}: AccommodationRulesProps) {
  const { t } = useFrontendLanguage();
  const { ref, isVisible } = useScrollAnimation();

  const hasRules = houseRules.length > 0;
  const hasConditions = cancellationPolicy || paymentMethods || depositInfo;

  if (!hasRules && !hasConditions) return null;

  return (
    <section className="py-16 md:py-24 px-4 bg-stone-50">
      <div className="max-w-6xl mx-auto">
        <div
          ref={ref}
          className={`
            grid grid-cols-1 lg:grid-cols-2 gap-8
            transition-all duration-700
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          {/* House Rules */}
          {hasRules && (
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-serif font-semibold text-stone-800 mb-6 flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-stone-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                  />
                </svg>
                {t.accommodation.houseRules}
              </h3>
              <ul className="space-y-3">
                {houseRules.map((rule) => (
                  <li
                    key={rule.id}
                    className="flex items-start gap-3 text-stone-600"
                  >
                    <svg
                      className="w-5 h-5 text-stone-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span>{getLocalizedText(rule.rule)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Booking Conditions */}
          {hasConditions && (
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-serif font-semibold text-stone-800 mb-6 flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-stone-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                  />
                </svg>
                {t.accommodation.bookingConditions}
              </h3>
              <div className="space-y-6">
                {/* Cancellation Policy */}
                {cancellationPolicy && (
                  <div>
                    <h4 className="font-medium text-stone-800 mb-2">
                      {t.footer.quickLinks.cancellation}
                    </h4>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      {cancellationPolicy}
                    </p>
                  </div>
                )}

                {/* Payment Methods */}
                {paymentMethods && (
                  <div>
                    <h4 className="font-medium text-stone-800 mb-2">
                      Payment Methods
                    </h4>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      {paymentMethods}
                    </p>
                  </div>
                )}

                {/* Deposit Info */}
                {depositInfo && (
                  <div>
                    <h4 className="font-medium text-stone-800 mb-2">
                      Deposit
                    </h4>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      {depositInfo}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
