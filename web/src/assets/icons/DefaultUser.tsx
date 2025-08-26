import React from "react";

interface LogoProps {
    height: number;
    width: number;
    src: string;
}

const DefaultUserIcon: React.FC<LogoProps> = ({ height, width, src }) => {
    return <img src={src} alt="Logo" width={width} height={height} />;
};

export default DefaultUserIcon;
