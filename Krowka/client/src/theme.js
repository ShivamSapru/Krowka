import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: `'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial`,
    body: `'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial`,
  },
  colors: {
    brand: {
      50: '#f0e6ff',
      100: '#d4b8ff',
      200: '#b88aff',
      300: '#9c5cff',
      400: '#802eff',
      500: '#6600ff',
      600: '#5200cc',
      700: '#3d0099',
      800: '#290066',
      900: '#140033',
    },
    accent: {
      50: '#fff5e6',
      100: '#ffe0b8',
      200: '#ffcb8a',
      300: '#ffb65c',
      400: '#ffa12e',
      500: '#ff8c00',
      600: '#cc7000',
      700: '#995400',
      800: '#663800',
      900: '#331c00',
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bgGradient: props.colorMode === 'dark' 
          ? 'linear(to-br, gray.900, purple.900, brand.900)'
          : 'linear(to-br, purple.50, blue.50, pink.50)',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
        WebkitFontSmoothing: 'antialiased',
        minHeight: '100vh',
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'xl',
        fontWeight: '600',
        transition: 'all 0.3s ease',
      },
      variants: {
        solid: (props) => ({
          bg: props.colorMode === 'dark' ? 'brand.500' : 'brand.500',
          color: 'white',
          _hover: { 
            bg: props.colorMode === 'dark' ? 'brand.400' : 'brand.600',
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          },
          _active: {
            transform: 'translateY(0)',
          },
        }),
        outline: (props) => ({
          borderColor: props.colorMode === 'dark' ? 'brand.300' : 'brand.500',
          borderWidth: '2px',
          color: props.colorMode === 'dark' ? 'brand.300' : 'brand.600',
          _hover: { 
            bg: props.colorMode === 'dark' ? 'brand.900' : 'brand.50',
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          },
        }),
        ghost: (props) => ({
          color: props.colorMode === 'dark' ? 'brand.300' : 'brand.600',
          _hover: {
            bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'brand.50',
          },
        }),
      },
    },
    Heading: {
      baseStyle: {
        letterSpacing: '-0.5px',
        fontWeight: '700',
      },
    },
    Card: {
      baseStyle: (props) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'whiteAlpha.100' : 'white',
          backdropFilter: 'blur(10px)',
          borderRadius: '2xl',
          boxShadow: props.colorMode === 'dark' ? 'dark-lg' : 'xl',
        },
      }),
    },
  },
});

export default theme;
