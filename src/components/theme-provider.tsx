'use client'

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// The props for our ThemeProvider are the same as the props for the NextThemesProvider.
// We can use React.ComponentProps to get them.
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
