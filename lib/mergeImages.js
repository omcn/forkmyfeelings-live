export async function mergeImages(selfieDataURL, mealDataURL) {
    const mealImg = new Image();
    const selfieImg = new Image();
  
    mealImg.src = mealDataURL;
    selfieImg.src = selfieDataURL;
  
    await Promise.all([
      new Promise((res) => (mealImg.onload = res)),
      new Promise((res) => (selfieImg.onload = res)),
    ]);
  
    const canvas = document.createElement("canvas");
    canvas.width = mealImg.width;
    canvas.height = mealImg.height;
  
    const ctx = canvas.getContext("2d");
    ctx.drawImage(mealImg, 0, 0);
    ctx.drawImage(selfieImg, 20, 20, mealImg.width * 0.25, mealImg.width * 0.25);
  
    return await new Promise((res) =>
      canvas.toBlob((blob) => res(blob), "image/jpeg")
    );
  }
  