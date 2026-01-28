"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/AuthContext";
import Link from "next/link";

// --- Custom Hook to detect clicks outside an element ---
export const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement>,
  callback: () => void,
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      callback();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};

// --- Main Upcoming Events Component ---
export default function UpcomingEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<any | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  const id = useId();

  const { user, token } = useAuth();
  const [rsvpStatus, setRsvpStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  // This is the backend's root URL, without the "/api" part.
  const API_ROOT = process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "");

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/events?upcoming=true`;

        // Debug: Log the API URL being used
        console.log("🔍 Events API URL:", apiUrl);
        console.log(
          "🔍 API Base URL env var:",
          process.env.NEXT_PUBLIC_API_BASE_URL,
        );

        // Check if API URL is configured
        if (
          !process.env.NEXT_PUBLIC_API_BASE_URL ||
          process.env.NEXT_PUBLIC_API_BASE_URL === "undefined"
        ) {
          throw new Error(
            "❌ API URL not configured! Set NEXT_PUBLIC_API_BASE_URL in your .env.local file or Vercel environment variables.",
          );
        }

        const response = await fetch(apiUrl);

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(
            `Server returned non-JSON response. Status: ${response.status}. Check if API_BASE_URL is correct: ${process.env.NEXT_PUBLIC_API_BASE_URL}`,
          );
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`);
        }
        const apiResponse = await response.json();

        if (
          apiResponse.success &&
          apiResponse.data &&
          Array.isArray(apiResponse.data.data)
        ) {
          setEvents(apiResponse.data.data);
        } else {
          console.warn(
            "API response was successful but did not contain an events array:",
            apiResponse,
          );
          setEvents([]);
        }
      } catch (e: any) {
        // Enhanced error message for network errors
        if (e.message?.includes("fetch") || e.name === "TypeError") {
          const detailedError = `Cannot connect to API server at ${process.env.NEXT_PUBLIC_API_BASE_URL}. Check if:\n1. NEXT_PUBLIC_API_BASE_URL is set correctly\n2. Backend is running\n3. CORS is configured`;
          setError(detailedError);
          console.error("❌ Events Network Error:", e);
          console.error(
            "❌ Attempted URL:",
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/events?upcoming=true`,
          );
        } else {
          setError(e.message);
          console.error("Error fetching events:", e);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    if (active) {
      document.body.style.overflow = "hidden";
      setRsvpStatus("idle");
      setRsvpError(null);
    } else {
      document.body.style.overflow = "auto";
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  const handleRsvp = async (eventId: string) => {
    setRsvpStatus("submitting");
    setRsvpError(null);

    if (!token || !user) {
      setRsvpError(
        "You must be logged in to RSVP. Please log in or register first.",
      );
      setRsvpStatus("error");
      return;
    }

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/rsvp`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: eventId,
          contactInfo: { email: user.email },
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.message || "Failed to RSVP. You may already be registered.",
        );
      }
      setRsvpStatus("success");
    } catch (e: any) {
      setRsvpError(e.message);
      setRsvpStatus("error");
    }
  };

  return (
    <motion.section
      id="rsvp"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
      className="border border-white/[0.1] bg-black max-w-7xl mx-auto my-24 p-8 rounded-2xl"
    >
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <motion.button
              onClick={() => setActive(null)}
              className="absolute top-4 right-4 bg-black/50 border border-neutral-700 rounded-full w-8 h-8 flex items-center justify-center text-white hover:border-green-500 hover:text-green-500 transition-colors z-50"
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="w-full max-w-4xl max-h-[90vh] flex flex-col lg:flex-row bg-neutral-900 text-white rounded-2xl overflow-hidden border border-green-500/50"
            >
              <motion.div
                layoutId={`image-${active.title}-${id}`}
                className="lg:w-1/2"
              >
                {/* ✅ FIX: Prepend the backend URL to the image path */}
                <img
                  src={
                    active.poster
                      ? `${API_ROOT}${active.poster}`
                      : "https://assets.aceternity.com/demos/tech-summit.jpeg"
                  }
                  alt={active.title}
                  className="w-full h-64 lg:h-full object-cover"
                />
              </motion.div>
              <div className="flex-1 overflow-y-auto p-8 lg:w-1/2">
                <div className="space-y-6">
                  <div>
                    <motion.h2
                      layoutId={`title-${active.title}-${id}`}
                      className="text-3xl font-bold text-white"
                    >
                      {active.title}
                    </motion.h2>
                    <motion.p
                      layoutId={`date-${active.title}-${id}`}
                      className="text-green-400 mt-1"
                    >
                      {new Date(active.startDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </motion.p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="text-neutral-300 leading-relaxed"
                  >
                    {active.description}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="pt-4"
                  >
                    <button
                      onClick={() => handleRsvp(active._id)}
                      disabled={
                        rsvpStatus === "submitting" || rsvpStatus === "success"
                      }
                      className="w-full text-center px-6 py-3 bg-green-600 text-black font-bold rounded-lg transition-colors text-md disabled:bg-neutral-600 disabled:cursor-not-allowed enabled:hover:bg-green-500"
                    >
                      {rsvpStatus === "submitting"
                        ? "Submitting..."
                        : rsvpStatus === "success"
                          ? "✓ RSVP'd Successfully"
                          : "RSVP Now"}
                    </button>
                    {rsvpStatus === "error" && (
                      <p className="text-red-400 text-sm mt-2 text-center">
                        {rsvpError}
                      </p>
                    )}
                    {rsvpStatus === "success" && (
                      <p className="text-green-400 text-sm mt-2 text-center">
                        You're registered!
                      </p>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left mb-8">
          <h2 className="text-3xl font-bold text-white">Upcoming Events</h2>
          {user && user.role === "admin" && (
            <Link href="/admin">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 sm:mt-0 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Manage Events
              </motion.button>
            </Link>
          )}
        </div>

        {isLoading && (
          <p className="text-center text-green-400">
            Loading upcoming events...
          </p>
        )}
        {error && <p className="text-center text-red-500">Error: {error}</p>}
        {!isLoading && !error && (
          <>
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {events.map((event) => (
                  <motion.div
                    layoutId={`card-${event.title}-${id}`}
                    key={event._id}
                    onClick={() => setActive(event)}
                    className="cursor-pointer bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden group hover:border-green-500/50 transition-colors"
                  >
                    <motion.div layoutId={`image-${event.title}-${id}`}>
                      {/* ✅ FIX: Prepend the backend URL to the image path */}
                      <img
                        src={
                          event.poster
                            ? `${API_ROOT}${event.poster}`
                            : "https://assets.aceternity.com/demos/tech-summit.jpeg"
                        }
                        alt={event.title}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </motion.div>
                    <div className="p-4">
                      <motion.h3
                        layoutId={`title-${event.title}-${id}`}
                        className="font-semibold text-white text-lg truncate"
                      >
                        {event.title}
                      </motion.h3>
                      <motion.p
                        layoutId={`date-${event.title}-${id}`}
                        className="text-green-400 text-sm mt-1"
                      >
                        {new Date(event.startDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                        })}
                      </motion.p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-neutral-400">
                No upcoming events at the moment. Stay tuned!
              </p>
            )}
          </>
        )}
      </div>
    </motion.section>
  );
}

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);
