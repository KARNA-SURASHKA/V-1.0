import { useState } from "react";
import { getDiseaseVisual, getPreventionVisual } from "../data/diseaseVisuals";

export default function DiseaseVisual({
  disease,
  category,
  type = "update",
  alt,
  className = "",
}) {
  const visual =
    type === "prevention"
      ? getPreventionVisual(disease, category)
      : getDiseaseVisual(disease, category);

  const [src, setSrc] = useState(
    type === "prevention"
      ? visual.preventionImage
      : visual.updateImage
  );

  const fallback =
    visual.fallbackImage || visual.diseaseImage;

  return (
    <img
      src={src || fallback}
      alt={alt || `${visual.name} health illustration`}
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
      draggable="false"
      className={className}
    />
  );
}
