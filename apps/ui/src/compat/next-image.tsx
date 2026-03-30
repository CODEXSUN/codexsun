import * as React from "react"

type NextImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt"
> & {
  src: string
  alt: string
  fill?: boolean
}

const Image = React.forwardRef<HTMLImageElement, NextImageProps>(
  ({ fill = false, className, style, ...props }, ref) => (
    <img
      ref={ref}
      className={className}
      style={
        fill
          ? {
              inset: 0,
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              width: "100%",
              ...style,
            }
          : style
      }
      {...props}
    />
  ),
)

Image.displayName = "NextImageCompat"

export default Image
