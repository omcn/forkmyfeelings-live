



"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { mergeImages } from "../../lib/mergeImages";

export default function RecipePostCapture({ user: initialUser, recipe, moods, rating, onComplete }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [user, setUser] = useState(initialUser);
  const [step, setStep] = useState("selfie");
  const [selfie, setSelfie] = useState(null);
  const [meal, setMeal] = useState(null);

  // Re-fetch user if not passed in
  useEffect(() => {
    if (!initialUser) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          // alert("Fetched user from Supabase");
          setUser(data.user);
        } else {
          alert("No user from Supabase");
        }
      });
    }
  }, [initialUser]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");

    if (step === "selfie") {
      setSelfie(dataUrl);
      setStep("meal");
    } else {
      setMeal(dataUrl);
      setStep("preview");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const submitPost = async () => {
    
    // alert("Post button clicked!");
    // alert("User ID: " + user?.id);
    // alert("Recipe object: " + JSON.stringify(recipe));
    // alert("Recipe ID: " + recipe?.id);
    
    if (!user || !user.id) {
      alert("User ID is missing!");
      return;
    }
  
    if (!recipe || !recipe.id) {
      alert("Recipe ID is missing!");
      return;
    }
  
    // alert("User ID: " + user.id);
    // alert("Recipe ID: " + recipe.id);
  
    try {
      const combined = await mergeImages(selfie, meal);
      const blob = combined;
      const fileName = `recipe-post-${Date.now()}.jpg`;
  
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });
  
      if (uploadError) {
        console.error("❌ Upload error:", uploadError);
        alert("Upload failed!");
        return;
      }
  
      const publicURL = supabase.storage
        .from("posts")
        .getPublicUrl(fileName).data.publicUrl;
  
      const { error: dbError } = await supabase
        .from("recipe_posts")
        .insert({
          user_id: user.id,
          recipe_id: recipe.id,
          photo_url: publicURL,
          moods: moods,
          rating,
        });
  
        if (dbError) {
          alert("Database error: " + dbError.message);
          console.error("❌ DB Insert Error:", dbError);
          return;
        }
        
  
      // alert("📸 Post uploaded!");
      onComplete?.();
    } catch (err) {
      console.error("💥 Unexpected error:", err);
      alert("Something went wrong!");
    }
  };
  

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-md mx-auto text-center">
      {step !== "preview" && (
        <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
      )}

      <div className="mt-4">
        {step !== "preview" ? (
          <button
            onClick={capture}
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg"
          >
            Capture {step === "selfie" ? "Selfie" : "Meal"}
          </button>
        ) : (
          <>
            <div className="relative w-full">
              <img src={meal} alt="Meal" className="w-full rounded-lg" />
              <img
                src={selfie}
                alt="Selfie"
                className="w-24 h-24 object-cover rounded-full border-2 border-white shadow-lg absolute top-4 left-4"
              />
            </div>

            <button
              onClick={submitPost}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Post It!
            </button>
          </>
        )}
      </div>
    </div>
  );
}
