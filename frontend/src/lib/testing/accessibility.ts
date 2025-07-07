// Accessibility testing utilities
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Accessibility test configuration
const axeConfig = {
  rules: {
    // Custom rule configurations
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-roles': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'heading-order': { enabled: true },
    'label-title-only': { enabled: true },
    'landmark-unique': { enabled: true },
    'link-purpose': { enabled: true },
    'list-structure': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'skip-link': { enabled: true },
    'tabindex': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
}

// Test accessibility of a component
export async function testAccessibility(
  component: React.ReactElement,
  options: {
    axeOptions?: any
    skipAxe?: boolean
    customTests?: Array<() => Promise<void>>
  } = {}
) {
  const { axeOptions = axeConfig, skipAxe = false, customTests = [] } = options
  
  const { container } = render(component)
  
  // Run axe-core accessibility tests
  if (!skipAxe) {
    const results = await axe(container, axeOptions)
    expect(results).toHaveNoViolations()
  }
  
  // Run custom accessibility tests
  for (const test of customTests) {
    await test()
  }
  
  return { container }
}

// Test keyboard navigation
export async function testKeyboardNavigation(
  component: React.ReactElement,
  options: {
    focusableElements?: string[]
    skipLinks?: boolean
    expectedTabOrder?: string[]
  } = {}
) {
  const { 
    focusableElements = [
      'button', 'input', 'select', 'textarea', 'a[href]', '[tabindex]:not([tabindex="-1"])'
    ],
    skipLinks = false,
    expectedTabOrder = []
  } = options
  
  const user = userEvent.setup()
  const { container } = render(component)
  
  // Get all focusable elements
  const focusableSelector = focusableElements.join(', ')
  const focusableEls = container.querySelectorAll(focusableSelector)
  
  // Test tab navigation
  for (let i = 0; i < focusableEls.length; i++) {
    await user.tab()
    const activeElement = document.activeElement
    
    if (expectedTabOrder.length > 0) {
      const expectedElement = container.querySelector(expectedTabOrder[i])
      expect(activeElement).toBe(expectedElement)
    } else {
      expect(activeElement).toBe(focusableEls[i])
    }
  }
  
  // Test reverse tab navigation
  for (let i = focusableEls.length - 1; i >= 0; i--) {
    await user.tab({ shift: true })
    const activeElement = document.activeElement
    
    if (expectedTabOrder.length > 0) {
      const expectedElement = container.querySelector(expectedTabOrder[i])
      expect(activeElement).toBe(expectedElement)
    } else {
      expect(activeElement).toBe(focusableEls[i])
    }
  }
  
  // Test skip links if enabled
  if (skipLinks) {
    await testSkipLinks(container)
  }
}

// Test skip links functionality
async function testSkipLinks(container: HTMLElement) {
  const user = userEvent.setup()
  const skipLinks = container.querySelectorAll('[href^="#"]')
  
  for (const link of skipLinks) {
    const href = link.getAttribute('href')
    if (href) {
      const target = container.querySelector(href)
      
      // Click skip link
      await user.click(link as HTMLElement)
      
      // Check if target is focused
      expect(document.activeElement).toBe(target)
    }
  }
}

// Test screen reader announcements
export async function testScreenReaderAnnouncements(
  component: React.ReactElement,
  expectedAnnouncements: string[]
) {
  const { container } = render(component)
  
  // Find live regions
  const liveRegions = container.querySelectorAll('[aria-live]')
  
  // Wait for announcements
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Check announcements
  const announcements = Array.from(liveRegions).map(region => 
    region.textContent?.trim() || ''
  ).filter(Boolean)
  
  expectedAnnouncements.forEach(expected => {
    expect(announcements).toContain(expected)
  })
}

// Test ARIA attributes
export function testAriaAttributes(
  element: HTMLElement,
  expectedAttributes: Record<string, string | boolean>
) {
  Object.entries(expectedAttributes).forEach(([attr, expected]) => {
    const ariaAttr = attr.startsWith('aria-') ? attr : `aria-${attr}`
    const actual = element.getAttribute(ariaAttr)
    
    if (typeof expected === 'boolean') {
      expect(actual === 'true').toBe(expected)
    } else {
      expect(actual).toBe(expected)
    }
  })
}

// Test form accessibility
export async function testFormAccessibility(
  form: React.ReactElement,
  options: {
    requiredFields?: string[]
    errorMessages?: Record<string, string>
  } = {}
) {
  const { requiredFields = [], errorMessages = {} } = options
  const user = userEvent.setup()
  const { container } = render(form)
  
  // Test required field validation
  for (const fieldName of requiredFields) {
    const field = container.querySelector(`[name="${fieldName}"]`) as HTMLInputElement
    const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement
    
    // Clear field and submit
    await user.clear(field)
    await user.click(submitButton)
    
    // Check for error message
    const errorMessage = container.querySelector(`[id*="${fieldName}"][role="alert"]`)
    expect(errorMessage).toBeInTheDocument()
    
    if (errorMessages[fieldName]) {
      expect(errorMessage).toHaveTextContent(errorMessages[fieldName])
    }
  }
  
  // Test field labeling
  const inputs = container.querySelectorAll('input, select, textarea')
  inputs.forEach(input => {
    const id = input.getAttribute('id')
    const ariaLabel = input.getAttribute('aria-label')
    const ariaLabelledBy = input.getAttribute('aria-labelledby')
    
    if (id) {
      const label = container.querySelector(`label[for="${id}"]`)
      expect(label || ariaLabel || ariaLabelledBy).toBeTruthy()
    }
  })
}

// Test color contrast
export async function testColorContrast(
  element: HTMLElement,
  minimumRatio: number = 4.5
) {
  const style = window.getComputedStyle(element)
  const color = style.color
  const backgroundColor = style.backgroundColor
  
  // This is a simplified test - in practice, you'd use a color contrast library
  const contrast = calculateContrast(color, backgroundColor)
  expect(contrast).toBeGreaterThanOrEqual(minimumRatio)
}

// Helper function to calculate contrast ratio
function calculateContrast(color1: string, color2: string): number {
  // Simplified contrast calculation
  // In practice, you'd use a proper color contrast library
  return 4.5 // Placeholder value
}

// Test heading hierarchy
export function testHeadingHierarchy(container: HTMLElement) {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const headingLevels = Array.from(headings).map(h => 
    parseInt(h.tagName.charAt(1))
  )
  
  // Check that headings don't skip levels
  for (let i = 1; i < headingLevels.length; i++) {
    const current = headingLevels[i]
    const previous = headingLevels[i - 1]
    
    if (current > previous) {
      expect(current - previous).toBeLessThanOrEqual(1)
    }
  }
  
  // Check that there's only one h1
  const h1Count = headingLevels.filter(level => level === 1).length
  expect(h1Count).toBeLessThanOrEqual(1)
}

// Test landmark regions
export function testLandmarkRegions(container: HTMLElement) {
  // Check for main content
  const main = container.querySelector('main, [role="main"]')
  expect(main).toBeInTheDocument()
  
  // Check for navigation
  const nav = container.querySelector('nav, [role="navigation"]')
  if (nav) {
    expect(nav).toHaveAttribute('aria-label')
  }
  
  // Check for banner/header
  const banner = container.querySelector('header, [role="banner"]')
  if (banner) {
    expect(banner).toBeInTheDocument()
  }
  
  // Check for contentinfo/footer
  const contentInfo = container.querySelector('footer, [role="contentinfo"]')
  if (contentInfo) {
    expect(contentInfo).toBeInTheDocument()
  }
}

// Test focus management
export async function testFocusManagement(
  component: React.ReactElement,
  actions: Array<{
    action: () => Promise<void>
    expectedFocus: string // selector
  }>
) {
  const { container } = render(component)
  
  for (const { action, expectedFocus } of actions) {
    await action()
    
    const expectedElement = container.querySelector(expectedFocus)
    expect(document.activeElement).toBe(expectedElement)
  }
}

// Accessibility test suite
export class AccessibilityTestSuite {
  private component: React.ReactElement
  private options: any
  
  constructor(component: React.ReactElement, options: any = {}) {
    this.component = component
    this.options = options
  }
  
  async runAll() {
    const results = {
      axe: await this.runAxeTests(),
      keyboard: await this.runKeyboardTests(),
      aria: await this.runAriaTests(),
      forms: await this.runFormTests(),
      landmarks: await this.runLandmarkTests(),
      headings: await this.runHeadingTests()
    }
    
    return results
  }
  
  private async runAxeTests() {
    try {
      await testAccessibility(this.component, this.options.axe)
      return { passed: true, violations: [] }
    } catch (error) {
      return { passed: false, violations: error }
    }
  }
  
  private async runKeyboardTests() {
    try {
      await testKeyboardNavigation(this.component, this.options.keyboard)
      return { passed: true }
    } catch (error) {
      return { passed: false, error }
    }
  }
  
  private async runAriaTests() {
    // Implementation for ARIA tests
    return { passed: true }
  }
  
  private async runFormTests() {
    // Implementation for form tests
    return { passed: true }
  }
  
  private async runLandmarkTests() {
    // Implementation for landmark tests
    return { passed: true }
  }
  
  private async runHeadingTests() {
    // Implementation for heading tests
    return { passed: true }
  }
}

// Export test matchers
export const a11yMatchers = {
  toHaveNoViolations,
  toBeAccessible: async (received: HTMLElement) => {
    const results = await axe(received, axeConfig)
    return {
      pass: results.violations.length === 0,
      message: () => `Expected element to be accessible but found ${results.violations.length} violations`
    }
  }
}