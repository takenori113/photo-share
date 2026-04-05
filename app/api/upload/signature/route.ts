import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/app/lib/cloudinary";

export const runtime = "nodejs";
export const preferredRegion = "iad1";
export const maxDuration = 10;

type SignatureRequestBody = {
  publicId?: string;
  folder?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request
      .json()
      .catch(() => ({}))) as SignatureRequestBody;
    const publicId = body.publicId;
    const folder = body.folder || "photo-share";

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json(
        { error: "publicId is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    if (!apiKey || !apiSecret || !cloudName) {
      return NextResponse.json(
        { error: "Cloudinary credentials are not configured" },
        { status: 500 },
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = {
      folder,
      public_id: publicId,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    return NextResponse.json(
      {
        signature,
        timestamp,
        folder,
        publicId,
        apiKey,
        cloudName,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Signature generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 },
    );
  }
}
