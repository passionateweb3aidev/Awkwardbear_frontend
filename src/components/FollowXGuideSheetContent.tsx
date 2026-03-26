"use client";

import Image from "next/image";
import { SheetContent, SheetTitle } from "./ui/sheet";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { colors } from "@/assets/color";
import { useCallback, useState } from "react";
import commonInfoIcon from "@/assets/icon/common-info.png";

export default function FollowXGuideSheetContent({
  handleSubmit,
}: {
  handleSubmit: (link: string) => void;
}) {
  const [link, setLink] = useState("");
  const handleClickSubmit = useCallback(() => {
    handleSubmit(link);
  }, [handleSubmit, link]);

  return (
    <SheetContent side="bottom" className="z-50 rounded-t-2xl bg-cyan-50 px-8 pb-[160px]">
      <SheetTitle className="sr-only">Feed Task Guide</SheetTitle>

      <div className="font-quicksand" style={{ fontFamily: "var(--font-quicksand)" }}>
        <div>
          <p className="text-xs font-bold text-cyan-700">Verify</p>
          <p className="text-base font-bold text-cyan-900">Follow us on X</p>

          <div className="mt-4 relative">
            <Input
              placeholder="Paste your X link here…"
              className="bg-white border-1 border-cyan-600 rounded-lg h-[40px]"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <div className="flex items-center mt-2">
              <Image
                src={commonInfoIcon}
                alt="common info"
                width={14}
                height={14}
                className="mr-1"
              />
              <span className="font-medium text-cyan-800 text-[10px]">
                Make sure the link is valid. Review will finish within 24 hours.
              </span>
            </div>
          </div>
          <Button
            className="mt-4 w-full h-[40px] rounded-2xl font-bold leading-[normal] font-baloo bg-cyan-300 text-cyan-950 disabled:bg-slate-200"
            style={{
              fontFamily: "var(--font-baloo)",
              border: `1px solid ${colors.cyan950}`,
              boxShadow: "2px 2px 0px 0px #082F49",
            }}
            onClick={handleClickSubmit}
            disabled={!link}
          >
            Submit
          </Button>
        </div>
      </div>
    </SheetContent>
  );
}
