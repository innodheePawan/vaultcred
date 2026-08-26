'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Loader2, Send } from "lucide-react";
import { sendContactUsEmails } from "@/lib/email";

const SUBJECT_TOPICS = [
    "General Customer Support",
    "Enterprise Sales & Licensing",
    "Technical Architecture Inquiry",
    "Implementation & Integration",
    "Security & Compliance Audit",
    "Partnership Inquiry",
    "Other",
];

export function ContactUsForm() {
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        subject: SUBJECT_TOPICS[0],
        message: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await sendContactUsEmails(form);
            if (res.success) {
                setSubmitted(true);
            } else {
                setError(res.error || "Failed to send message. Please try again.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="border border-slate-200 dark:border-white/[0.06] rounded-xl bg-white dark:bg-white/[0.02] p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Message Received</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Thank you for reaching out. Our team has received your message and will get back to you within 2 business hours.
                </p>
                <Button
                    onClick={() => {
                        setSubmitted(false);
                        setForm({
                            name: "",
                            email: "",
                            phone: "",
                            company: "",
                            subject: SUBJECT_TOPICS[0],
                            message: "",
                        });
                    }}
                    variant="outline"
                    className="mt-4 text-xs h-9"
                >
                    Send Another Message
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="border border-slate-200 dark:border-white/[0.06] rounded-xl bg-white dark:bg-white/[0.02] p-6 sm:p-8 space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                Send Us a Message
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Full Name *</label>
                    <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500/40 transition-colors"
                        placeholder="Your full name"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Work Email *</label>
                    <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500/40 transition-colors"
                        placeholder="you@company.com"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Phone Number</label>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500/40 transition-colors"
                        placeholder="+91-7406663433"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Company / Organization</label>
                    <input
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500/40 transition-colors"
                        placeholder="Organization name"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Topic / Subject *</label>
                <select
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500/40 transition-colors appearance-none"
                >
                    {SUBJECT_TOPICS.map((topic) => (
                        <option key={topic} value={topic} className="bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-white">
                            {topic}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">How can we help? *</label>
                <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500/40 transition-colors resize-none"
                    placeholder="Describe your inquiry, project scope, or questions..."
                />
            </div>

            {error && (
                <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-center font-medium">
                    {error}
                </div>
            )}

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
                {isSubmitting ? (
                    <>
                        Submitting...
                        <Loader2 className="w-4 h-4 animate-spin" />
                    </>
                ) : (
                    <>
                        Submit Inquiry
                        <Send className="w-4 h-4" />
                    </>
                )}
            </Button>

            <p className="text-[10px] text-slate-500 dark:text-slate-600 text-center pt-1">
                We respect your privacy. Submissions are processed securely according to our privacy governance standard.
            </p>
        </form>
    );
}
