import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SliderProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  min?: number
  max?: number
  step?: number
  value?: number[]
  onValueChange?: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, min = 0, max = 100, step = 1, value, onValueChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value?.[0] || 0)

    const currentValue = value?.[0] ?? internalValue

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value)
      setInternalValue(newValue)
      onValueChange?.([newValue])
    }

    const percentage = ((currentValue - min) / (max - min)) * 100

    return (
      <div className={cn('relative flex w-full touch-none select-none items-center', className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          className="absolute inset-0 w-full h-2 bg-transparent appearance-none cursor-pointer z-10"
          {...props}
        />
        <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-primary rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div
          className="absolute w-5 h-5 bg-primary rounded-full border-2 border-primary-foreground shadow-sm transition-all -translate-x-1/2 -translate-y-1/2 top-1/2"
          style={{ left: `${percentage}%` }}
        />
      </div>
    )
  }
)
Slider.displayName = 'Slider'

export { Slider }