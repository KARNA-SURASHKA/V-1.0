import {
  useEffect,
  useState,
} from "react";

import {
  getDiseaseVisual,
  getPreventionVisual,
} from "../data/diseaseVisuals";


export default function DiseaseVisual({
  disease,
  category,
  type = "update",
  alt,
  className = "",
}) {

  const visual =
    type === "prevention"
      ? getPreventionVisual(
          disease,
          category
        )
      : getDiseaseVisual(
          disease,
          category
        );


  const source =
    type === "prevention"
      ? visual.preventionImage
      : visual.updateImage;


  const fallback =
    visual.fallbackImage ||
    visual.diseaseImage;


  const [
    src,
    setSrc,
  ] = useState(
    source ||
    fallback
  );


  /*
   * ==========================================================
   * IMPORTANT:
   *
   * When the user changes locality and the highest-risk
   * disease changes, update the image immediately.
   * ==========================================================
   */

  useEffect(() => {

    setSrc(
      source ||
      fallback
    );

  }, [
    source,
    fallback,
    disease,
    category,
    type,
  ]);


  return (
    <img
      src={
        src ||
        fallback
      }
      alt={
        alt ||
        `${visual.name} health illustration`
      }
      onError={() => {

        if (
          src !==
          fallback
        ) {
          setSrc(
            fallback
          );
        }

      }}
      draggable="false"
      className={
        className
      }
    />
  );
}