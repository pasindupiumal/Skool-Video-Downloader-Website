'use client';

import React, { useRef, useState } from 'react';

const SRC = '/assets/videos/demo.mp4';

export default function DemoVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  const start = () => {
    setStarted(true);
    const v = ref.current;
    if (v) {
      v.controls = true;
      v.play().catch(() => {});
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        borderRadius: 16,
        background: '#000',
        border: '1px solid #ebecedcc',
        boxShadow: '0 20px 60px #00000026',
      }}
    >
      <video
        ref={ref}
        playsInline
        preload="none"
        poster="/assets/videos/demo-poster.webp"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        style={{ display: 'block', width: '100%', height: 'auto', background: '#000' }}
      >
        <source src={`${SRC}#t=0.001`} type="video/mp4" />
      </video>
      {!started && (
        <div
          onClick={start}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#00000040',
            cursor: 'pointer',
          }}
        >
          <button
            type="button"
            aria-label="Play video"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
          >
            <span
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#0952cc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px #0952cc66',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
              </svg>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
