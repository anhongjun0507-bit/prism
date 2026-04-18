import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PRISM — AI 기반 미국 대학 입시 매니저';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1714 0%, #2d1f10 50%, #1a1714 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorative orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-60px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)',
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            width: '88px',
            height: '88px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899, #F97316)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '28px',
            boxShadow: '0 8px 32px rgba(139,92,246,0.4)',
          }}
        >
          <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L28 26H4L16 4Z" fill="white" fillOpacity="0.95" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.02em',
            marginBottom: '16px',
          }}
        >
          PRISM
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          내 스펙으로 갈 수 있는 대학, 3초면 알 수 있어요
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '20px',
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
          }}
        >
          1,001개 미국 대학 합격 확률 AI 분석 | 에세이 첨삭 | 입시 플래너
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '32px',
          }}
        >
          {[
            { label: '합격 예측', bg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.4)', color: '#93C5FD' },
            { label: 'AI 에세이 첨삭', bg: 'rgba(139,92,246,0.2)', border: 'rgba(139,92,246,0.4)', color: '#C4B5FD' },
            { label: '입시 플래너', bg: 'rgba(249,115,22,0.2)', border: 'rgba(249,115,22,0.4)', color: '#FDBA74' },
          ].map((tag) => (
            <div
              key={tag.label}
              style={{
                padding: '8px 20px',
                borderRadius: '999px',
                background: tag.bg,
                border: `1px solid ${tag.border}`,
                color: tag.color,
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              {tag.label}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            fontSize: '16px',
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 500,
          }}
        >
          prismedu.kr
        </div>
      </div>
    ),
    { ...size }
  );
}
