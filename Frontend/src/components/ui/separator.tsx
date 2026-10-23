import { cn } from "@/lib/utils";
import { mergeProps, useRender } from "@/lib/render"

function Separator({
  className,
  orientation = "horizontal",
  render,
  ...props
}: useRender.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical"
}) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        role: "separator",
        "aria-orientation": orientation,
        "data-slot": "separator",
        className: cn(
          "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
          className
        ),
      },
      props
    ),
    state: { orientation },
  })
}

export { Separator }
