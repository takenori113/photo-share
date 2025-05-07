"use client";

import { CldImage } from "next-cloudinary";

type Props = {
  src: string;
};

export default function CImage({ src }: Props) {
  return (
    <CldImage
      alt="Sample Image"
      width={500}
      height={500}
      src={src} // Use this sample image or upload your own via the Media Explorer
      crop={{
        type: "auto",
        source: true,
      }}
    />
  );
}
