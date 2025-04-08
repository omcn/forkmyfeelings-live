



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
  const [previewUrl, setPreviewUrl] = useState(null);
 
  const [facingMode, setFacingMode] = useState("user");
  const [isMobile, setIsMobile] = useState(false);


  // Re-fetch user if not passed in
  // useEffect(() => {
  //   if (!initialUser) {
  //     supabase.auth.getUser().then(({ data }) => {
  //       if (data?.user) {
  //         // alert("Fetched user from Supabase");
  //         setUser(data.user);
  //       } else {
  //         alert("No user from Supabase");
  //       }
  //     });
  //   }
  // }, [initialUser]);
  useEffect(() => {
    // Re-fetch user if not passed in
    if (!initialUser) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          alert("No user from Supabase");
        }
      });
    }
  
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
  
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };
  
    // Only start camera if we're not in the preview step
    if (step !== "preview") {
      startCamera();
    }
  
    // Clean up camera on unmount or step change
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, step, initialUser]);
  

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        
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

  
  // const capture = () => {
  //   const video = videoRef.current;
  //   const canvas = document.createElement("canvas");
  //   canvas.width = video.videoWidth;
  //   canvas.height = video.videoHeight;
  //   canvas.getContext("2d").drawImage(video, 0, 0);
  //   const dataUrl = canvas.toDataURL("image/jpeg");
  
  //   if (step === "selfie") {
  //     setSelfie(dataUrl);
  //     setStep("meal");
  //   } else if (step === "meal") {
  //     setMeal(dataUrl);
  //     setStep("preview");
  
  //     // 👇 Delayed stop to avoid capturing stale frame
  //     setTimeout(() => {
  //       if (streamRef.current) {
  //         streamRef.current.getTracks().forEach((track) => track.stop());
  //       }
  //     }, 200);
  //   }
  // };
  const capture = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
  
    if (step === "selfie") {
      setSelfie(dataUrl);
  
      // 🔁 Flip to back cam ONLY on mobile
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setFacingMode("environment");
      }
  
      setStep("meal");
    } else if (step === "meal") {
      setMeal(dataUrl);
      setStep("preview");
  
      // Slight delay before killing the camera
      setTimeout(() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      }, 200);
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

      const imageUrl = URL.createObjectURL(blob);
      setPreviewUrl(imageUrl);
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
              <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg"
            />
            )}
            {isMobile && step !== "preview" && (
        <button
          onClick={() =>
            setFacingMode((prev) =>
              prev === "user" ? "environment" : "user"
            )
          }
          className="mt-2 text-sm text-pink-600 underline"
        >
          🔄 Flip Camera
        </button>
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
              {/* {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full rounded-lg shadow-xl"
                />
              )} */}


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
