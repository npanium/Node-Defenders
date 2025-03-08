import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
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
  			neon: {
  				blue: '#00FFFF',
  				purple: '#FF00FF',
  				green: '#00FF00',
  				yellow: '#FFFF00',
  				pink: '#FF6EFF'
  			},
  			cyber: {
  				black: '#0D0221',
  				darkblue: '#0F1F3D',
  				blue: '#2A26A8',
  				purple: '#42275A'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			}
  		},
  		textShadow: {
  			sm: '0 1px 2px var(--tw-shadow-color)',
  			DEFAULT: '0 2px 4px var(--tw-shadow-color)',
  			lg: '0 8px 16px var(--tw-shadow-color)',
  			glow: '0 0 5px var(--tw-shadow-color), 0 0 20px var(--tw-shadow-color)',
  			neon: '0 0 5px var(--tw-shadow-color), 0 0 10px var(--tw-shadow-color), 0 0 20px var(--tw-shadow-color), 0 0 40px var(--tw-shadow-color)'
  		},
  		backgroundImage: {
  			'cyber-gradient': 'linear-gradient(45deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  			'neon-gradient': 'linear-gradient(90deg, #ff00ff 0%, #00ffff 100%)',
  			'grid-pattern': 'radial-gradient(#00ffff 1px, transparent 1px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			glow: {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.6'
  				}
  			},
  			pulse: {
  				'0%, 100%': {
  					transform: 'scale(1)'
  				},
  				'50%': {
  					transform: 'scale(1.05)'
  				}
  			},
  			'text-flicker': {
  				'0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': {
  					opacity: '1'
  				},
  				'20%, 21.999%, 63%, 63.999%, 65%, 69.999%': {
  					opacity: '0.33'
  				}
  			},
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			glow: 'glow 2s ease-in-out infinite',
  			pulse: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'text-flicker': 'text-flicker 3s linear infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		boxShadow: {
  			'neon-blue': '0 0 5px #00FFFF, 0 0 10px #00FFFF',
  			'neon-purple': '0 0 5px #FF00FF, 0 0 10px #FF00FF',
  			'neon-green': '0 0 5px #00FF00, 0 0 10px #00FF00',
  			'neon-yellow': '0 0 5px #FFFF00, 0 0 10px #FFFF00',
  			'inner-glow': 'inset 0 0 20px 5px rgba(0, 255, 255, 0.5)'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          "text-shadow": (value) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") }
      );
    }),
  ],
};

export default config;
