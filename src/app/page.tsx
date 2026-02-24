import Link from "next/link";
import { ArrowRight, Shield, User } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900 p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter text-red-600">R&B Grill</h1>
          <p className="text-gray-500">Reservation Management System</p>
        </div>

        <div className="grid gap-4">
          <Link href="/receptionist/dashboard" className="group flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-red-500/50 transition-all shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                <User size={20} className="text-gray-600 group-hover:text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900">Receptionist</h3>
                <p className="text-xs text-gray-500">Mobile Interface</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-red-600 transition-colors" />
          </Link>

          <Link href="/admin/dashboard" className="group flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-red-500/50 transition-all shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                <Shield size={20} className="text-gray-600 group-hover:text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900">Admin Portal</h3>
                <p className="text-xs text-gray-500">Desktop Dashboard</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-red-600 transition-colors" />
          </Link>
        </div>

        <p className="text-xs text-gray-400 pt-8">
          System v1.0 • Built with Next.js 16
        </p>
      </div>
    </div>
  );
}
