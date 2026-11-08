import { ImageResponse } from 'next/og';

export const alt = 'AutoCare · Visibility, engineered';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'radial-gradient(70% 90% at 75% 20%, #0e2445 0%, #050608 70%)',
          color: '#f2f6fa',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 8, color: '#8fd0ff', textTransform: 'uppercase' }}>AutoCare</div>
        <div style={{ fontSize: 92, lineHeight: 1.02, marginTop: 28, letterSpacing: -3 }}>Visibility,</div>
        <div style={{ fontSize: 92, lineHeight: 1.02, letterSpacing: -3, color: '#2f8cff' }}>engineered.</div>
        <div style={{ fontSize: 28, marginTop: 36, color: '#a3acb9' }}>Wiper blades · Rain repellent · Washer fluid · Microfiber care</div>
      </div>
    ),
    size
  );
}
