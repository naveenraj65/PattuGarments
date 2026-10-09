import React, { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';

export function useCountdown(seconds = 30) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return { left, start: () => setLeft(seconds) };
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

const OtpField: React.FC<Props> = ({ value, onChange, placeholder = '6-digit OTP' }) => (
  <div className="relative">
    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      required
      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl tracking-[0.4em] focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
    />
  </div>
);

export default OtpField;
