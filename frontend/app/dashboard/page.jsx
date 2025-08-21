"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";

export default function Dashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/"); 
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (!user) return null;

  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#22223b', opacity: 0.25, letterSpacing: '0.1em' }}>
        Cognizant Hackathon (Dashboard)
      </span>
    </main>
  );
}
