import React from 'react';
import { Link } from 'react-router-dom';

type FanPhoto = { src: string; alt: string };

/**
 * Phone/tablet hero photos: the cards start stacked behind the middle one
 * and fan out to the sides when the page opens (desktop keeps the scattered
 * layout). Inner cards sit in front of the outer ones.
 */
const FAN = [
  { x: '-78%', r: -12, z: 1, delay: 650 },
  { x: '-27%', r: -4, z: 3, delay: 500 },
  { x: '27%', r: 5, z: 2, delay: 560 },
  { x: '78%', r: 12, z: 1, delay: 700 },
];

export const MobilePhotoFan: React.FC<{ photos: FanPhoto[] }> = ({ photos }) => (
  <div className="lg:hidden relative mx-auto mt-6 w-full max-w-md">
    <p className="hand-note text-center text-lg -rotate-2 animate-fade-in [animation-delay:900ms]">
      your people are here 👀
    </p>
    <div className="relative mt-3 h-[12.5rem] sm:h-[16rem]">
      {photos.slice(0, 4).map((photo, i) => {
        const f = FAN[i];
        return (
          <Link
            key={photo.src}
            to="/explore"
            aria-label={`Explore the community: ${photo.alt}`}
            className="fan-card absolute left-1/2 top-2 w-[34%] sm:w-[30%]"
            style={
              {
                '--fan-x': f.x,
                '--fan-r': `${f.r}deg`,
                zIndex: f.z,
                animationDelay: `${f.delay}ms`,
              } as React.CSSProperties
            }
          >
            <span className="block rounded-[16px] bg-white p-1.5 shadow-elevated ring-1 ring-black/5">
              <img
                src={photo.src}
                alt={photo.alt}
                decoding="async"
                className="block w-full aspect-[3/4] object-cover rounded-[11px]"
              />
            </span>
          </Link>
        );
      })}
    </div>
  </div>
);
