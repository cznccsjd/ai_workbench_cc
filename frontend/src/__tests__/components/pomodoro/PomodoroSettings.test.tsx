/**
 * Pomodoro Settings Component Tests
 * Tests for the enhanced PomodoroSettings component with backend integration
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PomodoroSettings from '../../../components/pomodoro/PomodoroSettings'
import usePomodoroStore from '../../../stores/pomodoroStore'

// Mock the store
jest.mock('../../../stores/pomodoroStore', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Mock UI components - use relative paths to avoid jest module mapping issues
jest.mock('../../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('../../../components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock('../../../components/ui/slider', () => ({
  Slider: ({ value, onValueChange, min, max, step, disabled, ...props }: any) => (
    <input
      type="range"
      value={value[0]}
      onChange={(e) => onValueChange([parseInt(e.target.value)])}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      data-testid="slider"
      {...props}
    />
  ),
}))

jest.mock('../../../components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, disabled, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      disabled={disabled}
      data-testid="switch"
      {...props}
    />
  ),
}))

jest.mock('../../../components/ui/label', () => ({
  Label: ({ children, htmlFor, ...props }: any) => (
    <label htmlFor={htmlFor} {...props}>{children}</label>
  ),
}))

jest.mock('../../../components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Settings: () => <span>SettingsIcon</span>,
  Save: () => <span>SaveIcon</span>,
  RotateCcw: () => <span>ResetIcon</span>,
  Loader2: () => <span>LoadingIcon</span>,
  AlertCircle: () => <span>AlertIcon</span>,
}))

describe('PomodoroSettings', () => {
  const mockSettings = {
    id: 'settings-123',
    user_id: 'user-456',
    work_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    long_break_interval: 4,
    auto_start_breaks: false,
    auto_start_work: false,
    sound_enabled: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockStore = {
    settings: mockSettings,
    updateSettings: jest.fn(),
    resetSettings: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue(mockStore)
  })

  it('renders without crashing', () => {
    render(<PomodoroSettings />)

    expect(screen.getByText('SettingsIcon')).toBeInTheDocument()
    expect(screen.getByText('番茄钟设置')).toBeInTheDocument()
  })

  it('displays all time settings sliders', () => {
    render(<PomodoroSettings />)

    expect(screen.getByLabelText('专注时间 (分钟)')).toBeInTheDocument()
    expect(screen.getByLabelText('短休息 (分钟)')).toBeInTheDocument()
    expect(screen.getByLabelText('长休息 (分钟)')).toBeInTheDocument()
    expect(screen.getByLabelText('长休息间隔 (个)')).toBeInTheDocument()
  })

  it('displays all switch controls', () => {
    render(<PomodoroSettings />)

    expect(screen.getByLabelText('专注结束后自动开始休息')).toBeInTheDocument()
    expect(screen.getByLabelText('休息结束后自动开始专注')).toBeInTheDocument()
    expect(screen.getByLabelText('声音提醒')).toBeInTheDocument()
  })

  it('shows current settings values', () => {
    render(<PomodoroSettings />)

    // Check slider values (using data-testid for sliders)
    const sliders = screen.getAllByTestId('slider')
    expect(sliders[0]).toHaveValue('25') // work_duration
    expect(sliders[1]).toHaveValue('5')  // short_break_duration
    expect(sliders[2]).toHaveValue('15') // long_break_duration
    expect(sliders[3]).toHaveValue('4')  // long_break_interval

    // Check switch states
    const switches = screen.getAllByTestId('switch')
    expect(switches[0]).not.toBeChecked() // auto_start_breaks
    expect(switches[1]).not.toBeChecked() // auto_start_work
    expect(switches[2]).toBeChecked()     // sound_enabled
  })

  it('updates local settings when sliders change', async () => {
    const user = userEvent.setup()
    render(<PomodoroSettings />)

    const workDurationSlider = screen.getByLabelText('专注时间 (分钟)')
    await user.type(workDurationSlider, '30')

    // Should not show save button initially (no changes detected)
    expect(screen.queryByText('保存设置')).not.toBeInTheDocument()
  })

  it('shows save button when settings are changed', async () => {
    const user = userEvent.setup()
    render(<PomodoroSettings />)

    // Change a setting
    const workDurationSlider = screen.getAllByTestId('slider')[0]
    fireEvent.change(workDurationSlider, { target: { value: '30' } })

    // Force re-render to trigger useEffect
    const { rerender } = render(<PomodoroSettings />)
    rerender(<PomodoroSettings />)

    // Save button should appear
    await waitFor(() => {
      expect(screen.getByText('保存设置')).toBeInTheDocument()
    })
  })

  it('calls updateSettings when save button is clicked', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<PomodoroSettings />)

    // Change a setting to enable save button
    const workDurationSlider = screen.getAllByTestId('slider')[0]
    fireEvent.change(workDurationSlider, { target: { value: '30' } })

    // Force re-render to show save button
    rerender(<PomodoroSettings />)

    const saveButton = await screen.findByText('保存设置')
    await user.click(saveButton)

    expect(mockStore.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        work_duration: 30,
      })
    )
  })

  it('calls resetSettings when reset button is clicked', async () => {
    const user = userEvent.setup()
    render(<PomodoroSettings />)

    const resetButton = screen.getByText('重置为默认')
    await user.click(resetButton)

    expect(mockStore.resetSettings).toHaveBeenCalledTimes(1)
  })

  it('shows cancel button when there are changes', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<PomodoroSettings />)

    // Change a setting
    const workDurationSlider = screen.getAllByTestId('slider')[0]
    fireEvent.change(workDurationSlider, { target: { value: '30' } })

    // Force re-render to show buttons
    rerender(<PomodoroSettings />)

    await waitFor(() => {
      expect(screen.getByText('取消更改')).toBeInTheDocument()
    })
  })

  it('cancels changes when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<PomodoroSettings />)

    // Change a setting
    const workDurationSlider = screen.getAllByTestId('slider')[0]
    fireEvent.change(workDurationSlider, { target: { value: '30' } })

    // Force re-render to show buttons
    rerender(<PomodoroSettings />)

    const cancelButton = await screen.findByText('取消更改')
    await user.click(cancelButton)

    expect(mockStore.clearError).toHaveBeenCalled()
    // Settings should be reverted to original values
  })

  it('displays error message when there is an error', () => {
    const errorMessage = 'Failed to update settings'
    ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      error: errorMessage,
    })

    render(<PomodoroSettings />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByText('AlertIcon')).toBeInTheDocument()
  })

  it('disables controls when loading', () => {
    ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      isLoading: true,
    })

    render(<PomodoroSettings />)

    const sliders = screen.getAllByTestId('slider')
    const switches = screen.getAllByTestId('switch')
    const buttons = screen.getAllByRole('button')

    sliders.forEach(slider => {
      expect(slider).toBeDisabled()
    })

    switches.forEach(switch_ => {
      expect(switch_).toBeDisabled()
    })

    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  it('shows loading state on save button when saving', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<PomodoroSettings />)

    // Change a setting to enable save button
    const workDurationSlider = screen.getAllByTestId('slider')[0]
    fireEvent.change(workDurationSlider, { target: { value: '30' } })

    // Force re-render to show save button
    rerender(<PomodoroSettings />)

    // Mock loading state during save
    mockStore.updateSettings.mockImplementationOnce(() => {
      // Simulate loading state
      ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        isLoading: true,
      })
      return Promise.resolve()
    })

    const saveButton = await screen.findByText('保存设置')
    await user.click(saveButton)

    // Should show loading icon during save
    await waitFor(() => {
      expect(screen.getByText('LoadingIcon')).toBeInTheDocument()
    })
  })

  it('handles updateSettings errors gracefully', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<PomodoroSettings />)

    // Change a setting to enable save button
    const workDurationSlider = screen.getAllByTestId('slider')[0]
    fireEvent.change(workDurationSlider, { target: { value: '30' } })

    // Force re-render to show save button
    rerender(<PomodoroSettings />)

    // Mock error during update
    mockStore.updateSettings.mockRejectedValueOnce(new Error('Network error'))

    const saveButton = await screen.findByText('保存设置')
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockStore.updateSettings).toHaveBeenCalled()
    })
  })

  it('handles resetSettings errors gracefully', async () => {
    const user = userEvent.setup()

    // Mock error during reset
    mockStore.resetSettings.mockRejectedValueOnce(new Error('Network error'))

    render(<PomodoroSettings />)

    const resetButton = screen.getByText('重置为默认')
    await user.click(resetButton)

    await waitFor(() => {
      expect(mockStore.resetSettings).toHaveBeenCalled()
    })
  })

  describe('Settings Validation', () => {
    it('respects slider min/max values', () => {
      render(<PomodoroSettings />)

      const sliders = screen.getAllByTestId('slider')

      // Work duration slider
      expect(sliders[0]).toHaveAttribute('min', '15')
      expect(sliders[0]).toHaveAttribute('max', '60')

      // Short break slider
      expect(sliders[1]).toHaveAttribute('min', '1')
      expect(sliders[1]).toHaveAttribute('max', '15')

      // Long break slider
      expect(sliders[2]).toHaveAttribute('min', '10')
      expect(sliders[2]).toHaveAttribute('max', '45')

      // Long break interval slider
      expect(sliders[3]).toHaveAttribute('min', '2')
      expect(sliders[3]).toHaveAttribute('max', '8')
    })

    it('shows helpful text descriptions', () => {
      render(<PomodoroSettings />)

      expect(screen.getByText('建议: 25-30分钟为最佳专注时长')).toBeInTheDocument()
      expect(screen.getByText('建议: 5分钟短休息可以让大脑放松')).toBeInTheDocument()
      expect(screen.getByText('建议: 15-30分钟长休息可以充分恢复精力')).toBeInTheDocument()
      expect(screen.getByText('每完成多少个番茄钟后进入长休息')).toBeInTheDocument()
    })
  })

  describe('Auto-start Settings', () => {
    it('toggles auto-start breaks setting', async () => {
      const user = userEvent.setup()
      render(<PomodoroSettings />)

      const autoStartBreaksSwitch = screen.getByLabelText('专注结束后自动开始休息')
      await user.click(autoStartBreaksSwitch)

      // Should trigger save button appearance
      await waitFor(() => {
        expect(screen.getByText('保存设置')).toBeInTheDocument()
      })
    })

    it('toggles auto-start work setting', async () => {
      const user = userEvent.setup()
      render(<PomodoroSettings />)

      const autoStartWorkSwitch = screen.getByLabelText('休息结束后自动开始专注')
      await user.click(autoStartWorkSwitch)

      // Should trigger save button appearance
      await waitFor(() => {
        expect(screen.getByText('保存设置')).toBeInTheDocument()
      })
    })
  })

  describe('Notification Settings', () => {
    it('toggles sound enabled setting', async () => {
      const user = userEvent.setup()
      render(<PomodoroSettings />)

      const soundSwitch = screen.getByLabelText('声音提醒')
      await user.click(soundSwitch)

      // Should trigger save button appearance
      await waitFor(() => {
        expect(screen.getByText('保存设置')).toBeInTheDocument()
      })
    })
  })

  it('syncs local settings with store settings on mount', () => {
    const { rerender } = render(<PomodoroSettings />)

    // Change store settings
    const newSettings = { ...mockSettings, work_duration: 35 }
    ;(usePomodoroStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      settings: newSettings,
    })

    // Force re-render to trigger useEffect
    rerender(<PomodoroSettings />)

    // Local settings should be updated
    const sliders = screen.getAllByTestId('slider')
    expect(sliders[0]).toHaveValue('35')
  })
})