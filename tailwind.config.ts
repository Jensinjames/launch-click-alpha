import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				surface: {
					DEFAULT: 'hsl(var(--surface))',
					elevated: 'hsl(var(--surface-elevated))',
					'elevated-2': 'hsl(var(--surface-elevated-2))',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))',
					active: 'hsl(var(--primary-active))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))',
					active: 'hsl(var(--secondary-active))',
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
					hover: 'hsl(var(--success-hover))',
					light: 'hsl(var(--success-light))',
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
					hover: 'hsl(var(--warning-hover))',
					light: 'hsl(var(--warning-light))',
				},
				error: {
					DEFAULT: 'hsl(var(--error))',
					foreground: 'hsl(var(--error-foreground))',
					hover: 'hsl(var(--error-hover))',
					light: 'hsl(var(--error-light))',
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))',
					hover: 'hsl(var(--info-hover))',
					light: 'hsl(var(--info-light))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
					hover: 'hsl(var(--muted-hover))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
				},
				brand: {
					primary: 'hsl(var(--brand-primary))', /* LaunchClick Blue */
					secondary: 'hsl(var(--brand-secondary))', /* Rocket Purple */
					accent: 'hsl(var(--brand-accent))', /* Tagline Blue */
					navy: 'hsl(var(--brand-navy))', /* Dark Navy */
				},
				// Enhanced semantic text colors
				text: {
					primary: 'hsl(var(--text-primary))',
					secondary: 'hsl(var(--text-secondary))',
					tertiary: 'hsl(var(--text-tertiary))',
					muted: 'hsl(var(--text-muted))',
					inverse: 'hsl(var(--text-inverse))',
				},
			},
			fontFamily: {
				sans: ['var(--font-family-sans)'],
				display: ['var(--font-family-display)'],
				mono: ['var(--font-family-mono)'],
			},
			fontSize: {
				'xs': ['var(--text-xs)', { lineHeight: 'var(--leading-normal)' }],
				'sm': ['var(--text-sm)', { lineHeight: 'var(--leading-normal)' }],
				'base': ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
				'lg': ['var(--text-lg)', { lineHeight: 'var(--leading-normal)' }],
				'xl': ['var(--text-xl)', { lineHeight: 'var(--leading-snug)' }],
				'2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-snug)' }],
				'3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
				'4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-tight)' }],
				'5xl': ['var(--text-5xl)', { lineHeight: 'var(--leading-tight)' }],
				'6xl': ['var(--text-6xl)', { lineHeight: 'var(--leading-tight)' }],
			},
			spacing: {
				'0.5': 'var(--space-0_5)',
				'1.5': 'var(--space-1_5)',
				'2.5': 'var(--space-2_5)',
				'3.5': 'var(--space-3_5)',
				'128': 'var(--space-128)',
				'160': 'var(--space-160)',
			},
			borderRadius: {
				'sm': 'var(--radius-sm)',
				'md': 'var(--radius-md)',
				'lg': 'var(--radius-lg)',
				'xl': 'var(--radius-xl)',
				DEFAULT: 'var(--radius)',
			},
			boxShadow: {
				'sm': 'var(--shadow-sm)',
				DEFAULT: 'var(--shadow)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'xl': 'var(--shadow-xl)',
				'2xl': 'var(--shadow-2xl)',
			},
			transitionDuration: {
				'fast': 'var(--duration-fast)',
				'normal': 'var(--duration-normal)',
				'slow': 'var(--duration-slow)',
				'slower': 'var(--duration-slower)',
			},
			transitionTimingFunction: {
				'linear': 'var(--easing-linear)',
				'in': 'var(--easing-in)',
				'out': 'var(--easing-out)',
				'in-out': 'var(--easing-in-out)',
				'spring': 'var(--easing-spring)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0',
						opacity: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)',
						opacity: '1'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)',
						opacity: '1'
					},
					to: {
						height: '0',
						opacity: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-out': {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(10px)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'scale-out': {
					from: { transform: 'scale(1)', opacity: '1' },
					to: { transform: 'scale(0.95)', opacity: '0' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-out-right': {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(100%)' }
				},
				'pulse-subtle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				},
				'bounce-subtle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-2px)' }
				},
				'card-hover': {
					'0%': { transform: 'translateY(0) scale(1)' },
					'100%': { transform: 'translateY(-2px) scale(1.02)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down var(--duration-normal) var(--easing-out)',
				'accordion-up': 'accordion-up var(--duration-normal) var(--easing-out)',
				'fade-in': 'fade-in var(--duration-slow) var(--easing-out)',
				'fade-out': 'fade-out var(--duration-slow) var(--easing-out)',
				'scale-in': 'scale-in var(--duration-normal) var(--easing-out)',
				'scale-out': 'scale-out var(--duration-normal) var(--easing-out)',
				'slide-in-right': 'slide-in-right var(--duration-slow) var(--easing-out)',
				'slide-out-right': 'slide-out-right var(--duration-slow) var(--easing-out)',
				'pulse-subtle': 'pulse-subtle 2s var(--easing-in-out) infinite',
				'bounce-subtle': 'bounce-subtle 1s var(--easing-in-out) infinite',
				'card-hover': 'card-hover var(--duration-normal) var(--easing-out)',
				'enter': 'fade-in var(--duration-slow) var(--easing-out), scale-in var(--duration-normal) var(--easing-out)',
				'exit': 'fade-out var(--duration-slow) var(--easing-out), scale-out var(--duration-normal) var(--easing-out)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
