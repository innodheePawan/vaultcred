'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { sendDemoRequestEmails } from "@/lib/email";

const ROLES = [
    "IT Security / CISO",
    "SAP Basis / Administration",
    "DevOps / Platform Engineering",
    "Infrastructure / Operations",
    "Compliance / Audit",
    "Engineering / Development",
    "Management / Executive",
    "Other",
];

const USE_CASES = [
    "SAP Integration Credentials",
    "Production Support Access",
    "Vendor Access Governance",
    "Service Account Management",
    "API Security & Governance",
    "Compliance & Audit Readiness",
    "General Evaluation",
];

export function RequestDemoForm() {
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "",
        email: "",
        company: "",
        role: "",
        useCase: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await sendDemoRequestEmails(form);
            if (res.success) {
                setSubmitted(true);
            } else {
                setError(res.error || "Failed to submit demo request.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Request Received</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Thank you for your interest. Our team will review your request and reach out within 2 business days to schedule your personalized demo.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-6 sm:p-8 space-y-5">
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                    placeholder="Your full name"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Work Email</label>
                <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                    placeholder="you@company.com"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Company</label>
                <input
                    type="text"
                    required
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                    placeholder="Your organization"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
                <select
                    required
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/40 transition-colors appearance-none"
                >
                    <option value="" className="bg-[#0f172a] text-slate-400">Select your role</option>
                    {ROLES.map((role) => (
                        <option key={role} value={role} className="bg-[#0f172a] text-white">{role}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Primary Use Case</label>
                <select
                    required
                    value={form.useCase}
                    onChange={(e) => setForm({ ...form, useCase: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/40 transition-colors appearance-none"
                >
                    <option value="" className="bg-[#0f172a] text-slate-400">Select primary use case</option>
                    {USE_CASES.map((uc) => (
                        <option key={uc} value={uc} className="bg-[#0f172a] text-white">{uc}</option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-center font-medium">
                    {error}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-11 bg-white hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            Sending...
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </>
                    ) : (
                        <>
                            Request Demo
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11 bg-transparent border-white/10 text-slate-300 text-sm font-medium rounded-lg hover:bg-white/[0.04] transition-colors"
                    onClick={() => {
                        window.location.href = `mailto:sales@credsecure.io?subject=Schedule Discussion - ${form.company || 'Enterprise Inquiry'}`;
                    }}
                >
                    Schedule Discussion
                </Button>
            </div>

            <p className="text-[10px] text-slate-600 text-center pt-1">
                By submitting, you agree to be contacted regarding CredSecure platform capabilities.
            </p>
        </form>
    );
}
