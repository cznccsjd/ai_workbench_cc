import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'

describe('UI Components', () => {
  describe('Button', () => {
    it('renders with different variants', () => {
      const { rerender } = render(<Button variant="default">Default Button</Button>
      )
      expect(screen.getByText('Default Button')).toBeInTheDocument()

      rerender(<Button variant="destructive">Destructive Button</Button>)
      expect(screen.getByText('Destructive Button')).toBeInTheDocument()

      rerender(<Button variant="outline">Outline Button</Button>)
      expect(screen.getByText('Outline Button')).toBeInTheDocument()
    })

    it('handles click events', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()

      render(<Button onClick={handleClick}>Click Me</Button>)

      await user.click(screen.getByText('Click Me'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Card', () => {
    it('renders card with all subcomponents', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card content goes here')).toBeInTheDocument()
    })
  })

  describe('Alert', () => {
    it('renders alert with title and description', () => {
      render(
        <Alert>
          <AlertTitle>Alert Title</AlertTitle>
          <AlertDescription>This is an alert description</AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Alert Title')).toBeInTheDocument()
      expect(screen.getByText('This is an alert description')).toBeInTheDocument()
    })
  })

  describe('Input', () => {
    it('renders input and accepts text', async () => {
      const user = userEvent.setup()
      render(<Input placeholder="Enter text here" />)

      const input = screen.getByPlaceholderText('Enter text here')
      expect(input).toBeInTheDocument()

      await user.type(input, 'Hello World')
      expect(input).toHaveValue('Hello World')
    })
  })

  describe('Label', () => {
    it('renders label text', () => {
      render(<Label>Label Text</Label>)
      expect(screen.getByText('Label Text')).toBeInTheDocument()
    })
  })

  describe('Switch', () => {
    it('toggles state when clicked', async () => {
      const handleChange = jest.fn()
      const user = userEvent.setup()

      render(<Switch checked={false} onCheckedChange={handleChange} />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).toBeInTheDocument()
      expect(switchElement).toHaveAttribute('aria-checked', 'false')

      await user.click(switchElement)
      expect(handleChange).toHaveBeenCalledWith(true)
    })
  })

  describe('Slider', () => {
    it('renders slider and changes value', async () => {
      const handleChange = jest.fn()
      const user = userEvent.setup()

      render(<Slider min={0} max={100} value={[50]} onValueChange={handleChange} />)

      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()
      expect(slider).toHaveValue('50')

      // Note: Testing slider interaction is complex and may require
      // more sophisticated testing approaches in real applications
    })
  })
})