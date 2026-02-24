"use client";

import { useState } from "react";
import { login } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");
        const result = await login(formData);
        if (result?.error) {
            setError(result.error);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-[100dvh] -mt-4 flex items-center justify-center  text-gray-900 p-4 overflow-hidden">
            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-2 text-center">
                    <div className="mx-auto h-20 w-20 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                        <span className="text-3xl font-bold text-red-600 ">R&B</span>
                    </div>
                    <p className="text-gray-500">Sign in to your account</p>
                </div>

                <form action={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    {error && (
                        <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-4 py-2 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Username</label>
                        <Input
                            name="username"
                            placeholder="Enter username"
                            className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white transition-colors"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <Input
                            name="password"
                            type="password"
                            placeholder="Enter password"
                            className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white transition-colors"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </Button>

                    {/* <div className="text-xs text-center text-gray-500 mt-4 space-y-1">
                        <p className="font-medium text-gray-400">Demo Credentials</p>
                        <p>Admin: admin / admin</p>
                        <p>Receptionist: receptionist / receptionist</p>
                    </div> */}
                </form>
            </div>
        </div>
    );
}
