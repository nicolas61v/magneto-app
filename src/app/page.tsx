// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/Loader";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir al dashboard inmediatamente cuando se cargue la página
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader size="lg" color="primary" />
        <p className="mt-4 text-gray-600">Redirigiendo al Dashboard...</p>
      </div>
    </div>
  );
}