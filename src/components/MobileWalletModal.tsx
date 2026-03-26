"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";

export const MobileWalletModal = ({
  open,
  onOpenChange,
  uri,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uri: string;
}) => {
  const handleConnect = (prefix: string) => {
    if (!uri) return;
    const encoded = encodeURIComponent(uri);
    let href = uri;
    if (prefix === "metamask") {
      href = `https://metamask.app.link/wc?uri=${encoded}`;
    } else if (prefix === "okx") {
      href = `okex://main/wc?uri=${encoded}`;
    } else if (prefix === "binance") {
      href = `bnc://app.binance.com/cedefi/wc?uri=${encoded}`;
    } else if (prefix === "abpay") {
      href = `abpay://walletconnect?uri=${encoded}`;
    }

    // 直接操作 href 进行跳转，避免 setTimeout 导致 Safari 阻止深度链接的唤起
    window.location.href = href;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[80vw] rounded-[24px] bg-white text-black p-6">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold mb-4">Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleConnect("abpay")}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full"
          >
            <Image
              src="/abpay_square.svg"
              alt="AB Pay"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-semibold text-[17px]">AB Pay</span>
          </button>
          <button
            onClick={() => handleConnect("okx")}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full"
          >
            <Image
              src="/okx_black.svg"
              alt="OKX Wallet"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-semibold text-[17px]">OKX Wallet</span>
          </button>
          <button
            onClick={() => handleConnect("binance")}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full"
          >
            <Image
              src="/binance.svg"
              alt="Binance Wallet"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-semibold text-[17px]">Binance Wallet</span>
          </button>
          <button
            onClick={() => handleConnect("metamask")}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full"
          >
            <Image
              src="/metamask.svg"
              alt="MetaMask"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-semibold text-[17px]">MetaMask</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
