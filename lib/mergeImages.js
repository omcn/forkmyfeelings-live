



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

  // Draw main meal image
  ctx.drawImage(mealImg, 0, 0);

  // Positioning for selfie
  const selfieSize = mealImg.width * 0.25;
  const selfieX = 20;
  const selfieY = 20;

  // Clip circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(
    selfieX + selfieSize / 2,
    selfieY + selfieSize / 2,
    selfieSize / 2,
    0,
    Math.PI * 2
  );
  ctx.closePath();
  ctx.clip();

  // Draw selfie inside clipped circle
  ctx.drawImage(selfieImg, selfieX, selfieY, selfieSize, selfieSize);
  ctx.restore();

  // ✅ Draw white border around selfie
  ctx.beginPath();
  ctx.arc(
    selfieX + selfieSize / 2,
    selfieY + selfieSize / 2,
    selfieSize / 2 + 2, // radius slightly bigger than selfie circle
    0,
    Math.PI * 2
  );
  ctx.strokeStyle = "white";
  ctx.lineWidth = 4;
  ctx.stroke();

  return await new Promise((res) =>
    canvas.toBlob((blob) => res(blob), "image/jpeg")
  );
}

  