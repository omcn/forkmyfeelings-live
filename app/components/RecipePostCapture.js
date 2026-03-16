"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { mergeImages } from "../../lib/mergeImages";
import toast from "react-hot-toast";

export default function RecipePostCapture({ user: initialUser, recipe, moods, rating, onComplete }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [user, setUser] = useState(initialUser);
  const [step, setStep] = useState("selfie");
  const [selfie, setSelfie] = useState(null);
  const [meal, setMeal] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!initialUser) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) setUser(data.user);
        else toast.error("Session expired — please sign in again");
      });
    }

    if (step === "preview") return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        toast.error("Camera not available");
      }
    };

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode, step, initialUser]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");

    if (step === "selfie") {
      setSelfie(dataUrl);
      if (isMobile) setFacingMode("environment");
      setStep("meal");
    } else if (step === "meal") {
      setMeal(dataUrl);
      setStep("preview");
      setTimeout(() => streamRef.current?.getTracks().forEach((t) => t.stop()), 200);
    }
  };

  const submitPost = async () => {
    if (!user?.id) { toast.error("Sign in to post"); return; }
    if (!recipe?.id) { toast.error("No recipe selected"); return; }

    setPosting(true);
    try {
      const blob = await mergeImages(selfie, meal);
      const fileName = `recipe-post-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });

      if (uploadError) { toast.error("Upload failed — try again"); return; }

      const publicURL = supabase.storage.from("posts").getPublicUrl(fileName).data.publicUrl;

      const { error: dbError } = await supabase.from("recipe_posts").insert({
        user_id: user.id,
        recipe_id: recipe.id,
        photo_url: publicURL,
        moods,
        rating,
      });

      if (dbError) { toast.error("Could not save post: " + dbError.message); return; }

      toast.success("📸 Post shared!");
      onComplete?.();
    } catch (err) {
      console.error("Post error:", err);
      toast.error("Something went wrong");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-md mx-auto text-center">
      {step !== "preview" && (
        <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg" />
      )}

      {isMobile && step !== "preview" && (
        <button
          onClick={() => setFacingMode((p) => p === "user" ? "environment" : "user")}
          className="mt-2 text-sm text-pink-600 underline"
        >
          🔄 Flip Camera
        </button>
      )}

      <div className="mt-4">
        {step !== "preview" ? (
          <button onClick={capture} className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg">
            Capture {step === "selfie" ? "Selfie" : "Meal"}
          </button>
        ) : (
          <>
            <div className="relative w-full">
              <img src={meal} alt="Meal" className="w-full rounded-lg" />
              <img src={selfie} alt="Selfie" className="w-24 h-24 object-cover rounded-full border-2 border-white shadow-lg absolute top-4 left-4" />
            </div>
            <button
              onClick={submitPost}
              disabled={posting}
              className="mt-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
            >
              {posting ? "Posting…" : "Post It!"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
