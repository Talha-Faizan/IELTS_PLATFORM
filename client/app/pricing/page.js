"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "@/components/layout/Sidebar";
import DashboardNav from "@/components/layout/DashboardNav";
import Icon from "@/components/ui/Icon";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  cancelSubscription,
  createSubscriptionOrder,
  fetchSubscriptionStatus,
} from "@/lib/slices/subscriptionSlice";
import { formatDate } from "@/lib/dataTransforms";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "Rs 0",
    period: "forever",
    desc: "Core tools to get started.",
    features: ["Daily limited practice", "Basic auto scoring", "Progress dashboard", "One mock-test allowance"],
  },
  {
    id: "monthly",
    name: "Scholar Monthly",
    price: "Rs 999",
    period: "per month",
    desc: "Full access for serious exam preparation.",
    badge: "Most Popular",
    features: ["Unlimited practice", "AI feedback", "Full mock-test simulations", "Performance analytics"],
    primary: true,
  },
  {
    id: "annual",
    name: "Scholar Annual",
    price: "Rs 9,999",
    period: "per year",
    desc: "Best value for a longer preparation timeline.",
    features: ["Everything in Scholar Monthly", "Annual billing", "Premium mock-test access", "Expert review eligibility"],
  },
];

export default function PricingPage() {
  const dispatch = useDispatch();
  const { subscription, userStatus, order, loading, error, successMessage } = useSelector((state) => state.subscription);

  useEffect(() => {
    dispatch(fetchSubscriptionStatus());
  }, [dispatch]);

  const handlePlanClick = (planId) => {
    if (planId === "free") return;
    dispatch(createSubscriptionOrder(planId));
  };

  const handleCancel = () => {
    dispatch(cancelSubscription());
  };

  return (
    <ProtectedRoute>
      <div className=" flex min-h-screen" style={{ fontFamily: "Montserrat, sans-serif" }}>
        <Sidebar />
        <div className="flex-1 md:ml-sidebar-width flex flex-col">
          <DashboardNav title="Plans & Pricing" breadcrumbs={["Account"]} />

          <main className="flex-1 p-6 md:p-8 flex flex-col gap-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-montserrat font-bold text-headline-lg text-on-surface">
                Plans connected to your subscription
              </h2>
              <p className="font-montserrat text-body-lg text-on-surface-variant mt-3">
                Current status: <span className="font-semibold text-primary">{userStatus}</span>
                {subscription?.currentPeriodEnd ? ` until ${formatDate(subscription.currentPeriodEnd)}` : ""}
              </p>
              {error && <p className="font-montserrat text-body-md text-error mt-3">{error}</p>}
              {successMessage && <p className="font-montserrat text-body-md text-green-700 mt-3">{successMessage}</p>}
              {order?.subscriptionId && (
                <p className="font-montserrat text-body-md text-primary mt-3">
                  Razorpay subscription created: {order.subscriptionId}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter items-start max-w-5xl mx-auto w-full">
              {PLANS.map((plan) => {
                const active =
                  plan.id === "free"
                    ? userStatus !== "premium"
                    : userStatus === "premium" && subscription?.plan === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`bento-card flex flex-col ${plan.primary ? "ring-2 ring-primary-container md:scale-[1.02] shadow-md" : ""}`}
                  >
                    {plan.badge && (
                      <span className="inline-flex self-start items-center gap-1 px-3 py-1 rounded-full bg-primary-container text-on-primary font-montserrat text-label-sm mb-4">
                        <Icon name="star" size={14} />
                        {plan.badge}
                      </span>
                    )}
                    {active && (
                      <span className="inline-flex self-start items-center gap-1 px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant/30 text-on-surface-variant font-montserrat text-label-sm mb-4">
                        Current Plan
                      </span>
                    )}

                    <h3 className="font-montserrat text-headline-md text-on-surface">{plan.name}</h3>
                    <div className="flex items-end gap-1 mt-3 mb-1">
                      <span className="font-montserrat font-bold text-on-surface" style={{ fontSize: "40px", lineHeight: "1" }}>{plan.price}</span>
                      <span className="font-montserrat text-label-lg text-on-surface-variant mb-1">/ {plan.period}</span>
                    </div>
                    <p className="font-montserrat text-body-md text-on-surface-variant mb-6 pb-6 border-b border-outline-variant/20">{plan.desc}</p>

                    <ul className="flex flex-col gap-3 mb-8 flex-grow">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <Icon name="check_circle" size={18} className="text-primary flex-shrink-0" />
                          <span className="font-montserrat text-body-md text-on-surface">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      disabled={loading || active}
                      onClick={() => handlePlanClick(plan.id)}
                      className={`w-full font-montserrat text-label-lg rounded-xl px-6 py-3.5 transition-all ${active
                          ? "border border-outline-variant/40 text-on-surface-variant cursor-default"
                          : plan.primary
                            ? "bg-primary-container text-on-primary hover:opacity-90"
                            : "border border-primary text-primary hover:bg-surface-variant/30"
                        } disabled:opacity-60`}
                    >
                      {active ? "Current Plan" : loading ? "Processing..." : plan.id === "free" ? "Included" : `Upgrade to ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>

            {userStatus === "premium" && (
              <div className="bento-card max-w-5xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-montserrat text-headline-md text-on-surface">Manage Subscription</h3>
                  <p className="font-montserrat text-body-md text-on-surface-variant mt-1">
                    Cancel sends the request to the backend Razorpay cancellation endpoint.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="font-montserrat text-label-lg border border-error text-error rounded-xl px-6 py-3 hover:bg-error/5 disabled:opacity-60 transition-colors"
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
