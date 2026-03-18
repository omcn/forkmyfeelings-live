"use client";
import { useState, useRef, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { supabase } from "../../lib/supabaseClient";
import { mergeImages } from "../../lib/mergeImages";
import toast from "react-hot-toast";

const COMPRESS_OPTIONS = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true };

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
  const [uploadFailed, setUploadFailed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

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
        // Fallback without exact facingMode (some devices don't support it)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        } catch (err2) {
          console.error("Camera error:", err2);
          toast.error("Camera not available — check your permissions");
        }
      }
    };

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode, step, initialUser]);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
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

  const retakePhoto = (which) => {
    setUploadFailed(false);
    if (which === "selfie") {
      setSelfie(null);
      setFacingMode("user");
      setStep("selfie");
    } else {
      setMeal(null);
      if (isMobile) setFacingMode("environment");
      setStep("meal");
    }
  };

  const submitPost = async () => {
    if (!user?.id) { toast.error("Sign in to post"); return; }
    if (!recipe?.id) { toast.error("No recipe selected"); return; }

    setPosting(true);
    setUploadFailed(false);
    setUploadProgress("Preparing image…");
    try {
      const rawBlob = await mergeImages(selfie, meal);
      setUploadProgress("Compressing…");
      let blob;
      try {
        const file = new File([rawBlob], "post.jpg", { type: "image/jpeg" });
        blob = await imageCompression(file, COMPRESS_OPTIONS);
      } catch {
        blob = rawBlob;
      }
      const fileName = `recipe-post-${Date.now()}.jpg`;

      setUploadProgress("Uploading…");
      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });

      if (uploadError) throw uploadError;

      setUploadProgress("Saving post…");
      const publicURL = supabase.storage.from("posts").getPublicUrl(fileName).data.publicUrl;

      const { error: dbError } = await supabase.from("recipe_posts").insert({
        user_id: user.id,
        recipe_id: recipe.id,
        photo_url: publicURL,
        moods,
        rating,
      });

      if (dbError) throw dbError;

      toast.success("Post shared!");
      onComplete?.();
    } catch (err) {
      console.error("Post error:", err);
      setUploadFailed(true);
      setUploadProgress("");
      toast.error("Upload failed — tap Retry");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-lg max-w-md mx-auto text-center">
      <h3 className="text-lg font-bold text-gray-900 mb-3">
        {step === "selfie" ? "📸 Take a Selfie" : step === "meal" ? "🍽️ Snap Your Meal" : "Preview Your Post"}
      </h3>

      {step !== "preview" && (
        <>
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>

          {isMobile && (
            <button
              onClick={() => setFacingMode((p) => p === "user" ? "environment" : "user")}
              className="mt-2 text-sm text-pink-600 font-medium"
            >
              🔄 Flip Camera
            </button>
          )}

          <div className="mt-3 flex gap-2 justify-center">
            <button
              onClick={capture}
              className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm transition"
            >
              Capture {step === "selfie" ? "Selfie" : "Meal"}
            </button>
            {step === "meal" && (
              <button
                onClick={() => retakePhoto("selfie")}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2.5 transition"
              >
                ← Retake Selfie
              </button>
            )}
          </div>
        </>
      )}

      {step === "preview" && (
        <>
          <div className="relative w-full rounded-xl overflow-hidden">
            <img src={meal} alt="Meal" className="w-full rounded-xl" />
            <img src={selfie} alt="Selfie" className="w-20 h-20 object-cover rounded-full border-2 border-white shadow-lg absolute top-3 left-3" />
          </div>

          {/* Upload progress */}
          {posting && uploadProgress && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
              {uploadProgress}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {uploadFailed ? (
              <>
                <button
                  onClick={submitPost}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm transition"
                >
                  🔄 Retry Upload
                </button>
                <p className="text-xs text-gray-400">Upload failed. Check your connection and try again.</p>
              </>
            ) : (
              <button
                onClick={submitPost}
                disabled={posting}
                className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white px-6 py-2.5 rounded-full font-semibold text-sm transition"
              >
                {posting ? "Posting…" : "Post It!"}
              </button>
            )}

            {!posting && (
              <div className="flex gap-3 justify-center mt-1">
                <button
                  onClick={() => retakePhoto("selfie")}
                  className="text-xs text-gray-500 hover:text-gray-700 transition"
                >
                  Retake selfie
                </button>
                <button
                  onClick={() => retakePhoto("meal")}
                  className="text-xs text-gray-500 hover:text-gray-700 transition"
                >
                  Retake meal
                </button>
                <button
                  onClick={() => onComplete?.()}
                  className="text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  Skip
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
