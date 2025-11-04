import React, { useState } from 'react';
import { Image, usePrefersReducedMotion } from '@chakra-ui/react';

// Main app logo component. Uses the public asset /Krowka_Final.png
// Keeps motion subtle and disabled for users who prefer reduced motion.
export const Logo = props => {
  const prefersReducedMotion = usePrefersReducedMotion();
  // Final brand logo should be Face_K.PNG; keep fallbacks for robustness
  const sources = [
    process.env.PUBLIC_URL + '/Face_K.PNG',
    process.env.PUBLIC_URL + '/Logo.png',
    process.env.PUBLIC_URL + '/Krowka_Final.png',
  ];
  const [idx, setIdx] = useState(0);

  return (
    <Image
      src={sources[idx]}
      alt="Krowka logo"
      loading="lazy"
      draggable={false}
      onError={() => setIdx(i => (i < sources.length - 1 ? i + 1 : i))}
      // Gentle hover scale if motion is allowed
      transition={prefersReducedMotion ? undefined : 'transform 0.3s ease'}
      _hover={prefersReducedMotion ? undefined : { transform: 'scale(1.04)' }}
      {...props}
    />
  );
};
