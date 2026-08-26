import { Sun } from "lucide-react";

export function Brand() {
  return (
    <a className="brand" href="/" aria-label="သုရိယ ပင်မစာမျက်နှာ">
      <span className="brand-mark" aria-hidden="true"><Sun size={20} strokeWidth={1.6} /></span>
      <span>သုရိယ</span>
    </a>
  );
}
