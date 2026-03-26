import backgroundImage from "@/assets/icon/home-dialog.png";

export default function DialogWithText({
  text,
  className = "",
  style = {},
  textStyle = {},
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  textStyle?: React.CSSProperties;
}) {
  return (
    <div
      className={`flex items-center justify-center absolute ${className}`}
      style={{
        backgroundImage: `url(${backgroundImage.src})`,
        backgroundSize: "100% auto",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        ...style,
      }}
    >
      <span className="font-semibold text-xs text-slate-950" style={textStyle}>
        {text}
      </span>
    </div>
  );
}
