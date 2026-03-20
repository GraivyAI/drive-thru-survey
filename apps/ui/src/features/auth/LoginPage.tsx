import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ByGraivyLogo } from '@/components/ByGraivyLogo';
import { GuestMarkLogo } from '@/components/GuestMarkLogo';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleInput = useCallback(
    (index: number, value: string) => {
      const char = value.slice(-1).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const next = [...code];
      next[index] = char;
      setCode(next);

      if (char && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code],
  );

  const handleSubmit = async () => {
    const shortCode = code.join('');
    if (shortCode.length !== 4) return;

    setLoading(true);
    try {
      const { data } = await api.post('/auth/short-code', { shortCode });
      login(data.token, data.location, data.lane);
      navigate('/orders', { replace: true });
    } catch {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error('Invalid code — check and try again');
      setCode(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'Enter' && code.every((c) => c.length === 1) && !loading) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [code, loading, handleSubmit],
  );

  const filled = code.every((c) => c.length === 1);

  return (
    <div
      className="flex flex-col px-6"
      style={{ backgroundColor: 'var(--bg-page)', minHeight: '100dvh' }}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-[min(300px,92vw)] text-center -mt-8">
        <div className="mb-8 flex flex-col items-center gap-3 px-1">
          <GuestMarkLogo className="h-11 w-auto max-w-full" />
          <ByGraivyLogo className="h-5 w-auto max-w-[min(152px,78vw)]" />
        </div>
        <div className="mb-12 text-[10px] font-semibold tracking-[0.2em] text-txt-muted uppercase">
          Drive thru guest survey
        </div>

        <div
          className={cn(
            'flex justify-center gap-3 mb-4 transition-transform',
            shake && 'animate-[shake_0.4s_ease-in-out]',
          )}
        >
          {code.map((char, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              maxLength={1}
              value={char}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--text-primary)';
                e.target.style.boxShadow = '0 0 0 1px var(--text-primary)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
              className="w-14 h-16 min-w-0 text-center text-xl font-semibold border rounded-2xl transition-all"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border)',
              }}
            />
          ))}
        </div>

        <p className="text-[11px] text-txt-muted mb-9 tracking-wide">
          Enter your lane code
        </p>

        <button
          onClick={handleSubmit}
          disabled={!filled || loading}
          className="w-full py-3.5 font-medium rounded-2xl text-[15px] tracking-tight
                     disabled:opacity-30 disabled:cursor-not-allowed
                     hover:opacity-90 active:scale-[0.98] transition-all"
          style={{ backgroundColor: 'var(--graivy-btn-bg)', color: 'var(--graivy-btn-text)' }}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-current/20 border-t-current rounded-full animate-spin" />
              Verifying
            </span>
          ) : (
            'Continue'
          )}
        </button>
        </div>
      </div>
    </div>
  );
}
