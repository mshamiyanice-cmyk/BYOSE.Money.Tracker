
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: CalendarProps) {
  const defaultClassNames = {
    months: "relative flex flex-col sm:flex-row gap-4",
    month: "w-full",
    month_caption: "relative mx-10 mb-4 flex h-9 items-center justify-center z-20",
    caption_label: "text-sm font-bold text-slate-800",
    nav: "absolute top-0 flex w-full justify-between z-10",
    button_previous: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-slate-500 hover:text-slate-900 p-0",
    ),
    button_next: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-slate-500 hover:text-slate-900 p-0",
    ),
    month_grid: "w-full border-collapse space-y-1",
    weekdays: "flex justify-between",
    weekday: "text-slate-400 w-9 font-bold text-[10px] uppercase text-center py-2",
    week: "flex w-full mt-2 justify-between",
    day: cn(
      "relative flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#165b4c] focus:ring-offset-2",
      "hover:bg-slate-100 text-slate-700",
      "data-[selected]:bg-[#165b4c] data-[selected]:text-white data-[selected]:font-bold data-[selected]:shadow-md",
      "data-[disabled]:text-slate-300 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
      "data-[outside]:text-slate-300"
    ),
    cell: "size-9 p-0 text-center relative",
    today: "text-[#165b4c] font-bold after:content-[''] after:absolute after:bottom-1 after:w-1 after:h-1 after:bg-[#165b4c] after:rounded-full",
    range_start: "rounded-l-lg",
    range_end: "rounded-r-lg",
    range_middle: "rounded-none bg-slate-100",
    hidden: "invisible",
  };

  const mergedClassNames: any = Object.keys(defaultClassNames).reduce(
    (acc, key) => ({
      ...acc,
      [key]: classNames?.[key as keyof typeof classNames]
        ? cn(
          defaultClassNames[key as keyof typeof defaultClassNames],
          classNames[key as keyof typeof classNames],
        )
        : defaultClassNames[key as keyof typeof defaultClassNames],
    }),
    {} as any,
  );

  const defaultComponents = {
    Chevron: (props: any) => {
      if (props.orientation === "left") {
        return <ChevronLeft size={18} strokeWidth={2.5} {...props} aria-hidden="true" />;
      }
      return <ChevronRight size={18} strokeWidth={2.5} {...props} aria-hidden="true" />;
    },
  };

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white", className)}
      classNames={mergedClassNames}
      components={mergedComponents}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
