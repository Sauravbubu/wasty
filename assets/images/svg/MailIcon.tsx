import React from 'react';
import Svg, { Path } from 'react-native-svg';

const MailIcon = ({ width = 17, height = 16, fill = 'black' }: { width?: number; height?: number; fill?: string }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Path
        d="M13.833 2.66699H3.16634C2.43301 2.66699 1.83967 3.26699 1.83967 4.00033L1.83301 12.0003C1.83301 12.7337 2.43301 13.3337 3.16634 13.3337H13.833C14.5663 13.3337 15.1663 12.7337 15.1663 12.0003V4.00033C15.1663 3.26699 14.5663 2.66699 13.833 2.66699ZM13.833 5.33366L8.49967 8.66699L3.16634 5.33366V4.00033L8.49967 7.33366L13.833 4.00033V5.33366Z"
        fill={fill}
      />
    </Svg>
  );
};

export default MailIcon;